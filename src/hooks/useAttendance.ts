import { useState, useCallback } from 'react'
import { supabase } from '../libs/supabase'
import { useAuth } from '../contexts/AuthContext'
import { calculateXP } from '../lib/xpCalculator'
import { calculateDistance } from '../lib/haversine'
import imageCompression from 'browser-image-compression'

interface LocationPoint {
  id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
  work_start_time: string
  work_end_time: string
}

interface AttendanceState {
  loading: boolean
  submitting: boolean
  error: string | null
  todayRecord: TodayRecord | null
  locationPoints: LocationPoint[]
  nearestPoint: (LocationPoint & { distance: number }) | null
}

interface TodayRecord {
  id: string
  check_in_at: string
  check_out_at: string | null
  status: string
  xp_earned: number
  photo_url: string | null
  distance_meters: number | null
}

/**
 * Custom hook that orchestrates the entire attendance flow:
 * - Fetch today's attendance record
 * - Fetch location points
 * - Find nearest location point
 * - Upload selfie photo
 * - Submit attendance record
 */
export function useAttendance() {
  const { user, profile, refreshProfile } = useAuth()
  const [state, setState] = useState<AttendanceState>({
    loading: false,
    submitting: false,
    error: null,
    todayRecord: null,
    locationPoints: [],
    nearestPoint: null,
  })

  /**
   * Fetch today's attendance record for the current user
   */
  const fetchTodayRecord = useCallback(async () => {
    if (!user) return

    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('check_in_at', startOfDay)
      .lt('check_in_at', endOfDay)
      .maybeSingle()

    if (error) {
      console.error('Error fetching today record:', error)
    }

    setState((prev) => ({ ...prev, todayRecord: data as TodayRecord | null }))
    return data
  }, [user])

  /**
   * Fetch all active location points
   */
  const fetchLocationPoints = useCallback(async () => {
    const { data, error } = await supabase
      .from('location_points')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching locations:', error)
      return []
    }

    setState((prev) => ({ ...prev, locationPoints: data as LocationPoint[] }))
    return data as LocationPoint[]
  }, [])

  /**
   * Find the nearest location point to the user's GPS coordinates
   */
  const findNearestPoint = useCallback(
    (userLat: number, userLng: number, points: LocationPoint[]) => {
      if (points.length === 0) return null

      let nearest: (LocationPoint & { distance: number }) | null = null

      for (const point of points) {
        const distance = calculateDistance(
          userLat,
          userLng,
          Number(point.latitude),
          Number(point.longitude)
        )

        if (!nearest || distance < nearest.distance) {
          nearest = { ...point, distance }
        }
      }

      setState((prev) => ({ ...prev, nearestPoint: nearest }))
      return nearest
    },
    []
  )

  /**
   * Upload a selfie photo to Supabase Storage
   */
  const uploadPhoto = useCallback(
    async (photoBlob: Blob): Promise<string | null> => {
      if (!user) return null

      try {
        // Compress the image
        const compressed = await imageCompression(
          new File([photoBlob], 'selfie.jpg', { type: 'image/jpeg' }),
          {
            maxSizeMB: 0.1, // 100KB max
            maxWidthOrHeight: 640,
            useWebWorker: true,
          }
        )

        const fileName = `${user.id}/${Date.now()}.jpg`

        const { error: uploadError } = await supabase.storage
          .from('attendance-photos')
          .upload(fileName, compressed, {
            contentType: 'image/jpeg',
            upsert: false,
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          return null
        }

        const { data } = supabase.storage
          .from('attendance-photos')
          .getPublicUrl(fileName)

        return data.publicUrl
      } catch (err) {
        console.error('Photo compression/upload error:', err)
        return null
      }
    },
    [user]
  )

  /**
   * Submit the attendance record
   */
  const submitAttendance = useCallback(
    async (
      photoBlob: Blob,
      latitude: number,
      longitude: number,
      locationPoint: LocationPoint & { distance: number }
    ) => {
      if (!user || !profile) {
        setState((prev) => ({ ...prev, error: 'User not authenticated' }))
        return null
      }

      setState((prev) => ({ ...prev, submitting: true, error: null }))

      try {
        // 1. Check if user is within radius
        if (locationPoint.distance > locationPoint.radius_meters) {
          setState((prev) => ({
            ...prev,
            submitting: false,
            error: `Anda di luar area absen. Jarak: ${locationPoint.distance}m (max: ${locationPoint.radius_meters}m)`,
          }))
          return null
        }

        // 2. Upload photo
        const photoUrl = await uploadPhoto(photoBlob)

        // 3. Calculate XP
        const now = new Date()
        const xpResult = calculateXP(now, locationPoint.work_start_time)

        // 4. Create attendance record
        const { data: record, error: insertError } = await supabase
          .from('attendance_records')
          .insert({
            user_id: user.id,
            check_in_at: now.toISOString(),
            photo_url: photoUrl,
            latitude,
            longitude,
            distance_meters: locationPoint.distance,
            status: xpResult.status,
            minutes_late: xpResult.minutes_late,
            xp_earned: xpResult.xp_earned,
            location_point_id: locationPoint.id,
          })
          .select()
          .single()

        if (insertError) {
          const msg = insertError.message.includes('idx_attendance_user_day')
            ? 'Anda sudah absen hari ini.'
            : `Gagal menyimpan absensi: ${insertError.message}`
          setState((prev) => ({
            ...prev,
            submitting: false,
            error: msg,
          }))
          return null
        }

        // 5. Update user XP
        await supabase
          .from('users')
          .update({
            total_xp: (profile.total_xp || 0) + xpResult.xp_earned,
            monthly_xp: (profile.monthly_xp || 0) + xpResult.xp_earned,
            streak_days:
              xpResult.status === 'on_time'
                ? (profile.streak_days || 0) + 1
                : 0,
          })
          .eq('id', user.id)

        // 6. Refresh profile to get updated XP
        await refreshProfile()

        setState((prev) => ({
          ...prev,
          submitting: false,
          todayRecord: record as TodayRecord,
          error: null,
        }))

        return { record, xpResult }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          submitting: false,
          error: 'Terjadi kesalahan saat menyimpan absensi.',
        }))
        console.error('Submit attendance error:', err)
        return null
      }
    },
    [user, profile, uploadPhoto, refreshProfile]
  )

  /**
   * Submit checkout (absen pulang) — no XP awarded
   */
  const submitCheckout = useCallback(
    async (locationPoint: LocationPoint) => {
      if (!user || !state.todayRecord) {
        setState((prev) => ({ ...prev, error: 'Belum ada record absen hari ini.' }))
        return null
      }

      if (state.todayRecord.check_out_at) {
        setState((prev) => ({ ...prev, error: 'Anda sudah absen pulang hari ini.' }))
        return null
      }

      // Check if current time >= work_end_time
      const now = new Date()
      const [endHour, endMinute] = (locationPoint.work_end_time || '17:00').split(':').map(Number)
      const workEnd = new Date(now)
      workEnd.setHours(endHour, endMinute, 0, 0)

      if (now < workEnd) {
        const timeStr = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
        setState((prev) => ({
          ...prev,
          error: `Belum waktunya pulang. Jam pulang: ${timeStr}`,
        }))
        return null
      }

      setState((prev) => ({ ...prev, submitting: true, error: null }))

      try {
        const { data, error: updateError } = await supabase
          .from('attendance_records')
          .update({ check_out_at: now.toISOString() })
          .eq('id', state.todayRecord.id)
          .select()
          .single()

        if (updateError) {
          setState((prev) => ({
            ...prev,
            submitting: false,
            error: `Gagal absen pulang: ${updateError.message}`,
          }))
          return null
        }

        setState((prev) => ({
          ...prev,
          submitting: false,
          todayRecord: data as TodayRecord,
          error: null,
        }))

        return data
      } catch (err) {
        setState((prev) => ({
          ...prev,
          submitting: false,
          error: 'Terjadi kesalahan saat absen pulang.',
        }))
        console.error('Submit checkout error:', err)
        return null
      }
    },
    [user, state.todayRecord]
  )

  return {
    ...state,
    fetchTodayRecord,
    fetchLocationPoints,
    findNearestPoint,
    submitAttendance,
    submitCheckout,
  }
}

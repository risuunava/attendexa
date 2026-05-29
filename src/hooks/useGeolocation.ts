import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  loading: boolean
  error: string | null
}

/**
 * Custom hook to get the user's current GPS location.
 * Uses the browser Geolocation API with high accuracy.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
  })

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation tidak didukung oleh browser Anda.',
        loading: false,
      }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
        })
      },
      (error) => {
        let errorMessage = 'Gagal mendapatkan lokasi.'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              'Akses lokasi ditolak. Aktifkan izin lokasi di browser Anda.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia.'
            break
          case error.TIMEOUT:
            errorMessage = 'Waktu permintaan lokasi habis. Coba lagi.'
            break
        }
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }))
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }, [])

  // Get location on mount
  useEffect(() => {
    getCurrentPosition()
  }, [getCurrentPosition])

  return {
    ...state,
    refresh: getCurrentPosition,
  }
}

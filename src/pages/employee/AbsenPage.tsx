import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useAttendance } from '../../hooks/useAttendance'
import CameraModal from '../../components/attendance/CameraModal'
import GPSIndicator from '../../components/attendance/GPSIndicator'
import PageContainer from '../../components/layout/PageContainer'
import { getStatusLabel } from '../../lib/xpCalculator'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  MapPin,
  Zap,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Send,
  AlertCircle,
  Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'

type Step = 'gps' | 'camera' | 'review' | 'done'

export default function AbsenPage() {
  const navigate = useNavigate()
  const geo = useGeolocation()
  const attendance = useAttendance()
  const [step, setStep] = useState<Step>('gps')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [timeAllowed, setTimeAllowed] = useState(true)
  const [minutesLeft, setMinutesLeft] = useState(0)
  const [workStartTimeStr, setWorkStartTimeStr] = useState('08:00')

  // Fetch location points on mount
  useEffect(() => {
    attendance.fetchLocationPoints()
    attendance.fetchTodayRecord()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Find nearest point when geo or locations update
  useEffect(() => {
    if (
      geo.latitude !== null &&
      geo.longitude !== null &&
      attendance.locationPoints.length > 0
    ) {
      attendance.findNearestPoint(
        geo.latitude,
        geo.longitude,
        attendance.locationPoints
      )
    }
  }, [geo.latitude, geo.longitude, attendance.locationPoints]) // eslint-disable-line react-hooks/exhaustive-deps

  // If already checked in today, go to done step
  useEffect(() => {
    if (attendance.todayRecord) {
      setStep('done')
    }
  }, [attendance.todayRecord])

  // Check if current time allows attendance + refresh every 10 seconds
  useEffect(() => {
    const checkTime = () => {
      const nearestPt = attendance.nearestPoint || (attendance.locationPoints.length > 0 ? attendance.locationPoints[0] : null)
      const result = attendance.checkAttendanceTime(nearestPt as any)
      setTimeAllowed(result.allowed)
      setMinutesLeft(result.minutesUntilAllowed)
      setWorkStartTimeStr(result.workStartTime)
    }
    checkTime()
    const interval = setInterval(checkTime, 10000) // refresh every 10 seconds
    return () => clearInterval(interval)
  }, [attendance.nearestPoint, attendance.locationPoints, attendance.checkAttendanceTime])

  const handlePhotoCapture = useCallback((blob: Blob) => {
    setPhotoBlob(blob)
    setPhotoPreview(URL.createObjectURL(blob))
    setCameraOpen(false)
    setStep('review')
  }, [])

  const handleSubmit = useCallback(async () => {
    if (
      !photoBlob ||
      !geo.latitude ||
      !geo.longitude ||
      !attendance.nearestPoint
    ) {
      toast.error('Data tidak lengkap. Pastikan GPS dan foto sudah tersedia.')
      return
    }

    const result = await attendance.submitAttendance(
      photoBlob,
      geo.latitude,
      geo.longitude,
      attendance.nearestPoint
    )

    if (result) {
      toast.success(
        `Absen berhasil! +${result.xpResult.xp_earned} XP (${getStatusLabel(
          result.xpResult.status
        )})`,
        { duration: 5000, icon: '🎉' }
      )
      setStep('done')
    } else if (attendance.error) {
      toast.error(attendance.error)
    }
  }, [photoBlob, geo.latitude, geo.longitude, attendance])

  const nearestPoint = attendance.nearestPoint
  const isInRange =
    nearestPoint !== null && nearestPoint.distance <= nearestPoint.radius_meters

  return (
    <PageContainer>
      <CameraModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handlePhotoCapture}
      />

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 border-2 border-neutral-900 bg-white hover:bg-neutral-100 hover:shadow-[4px_4px_0px_0px_#1F2937] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all"
          >
            <ArrowLeft size={24} className="text-neutral-900" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-neutral-900 uppercase tracking-tight">Absen Sekarang</h1>
            <p className="text-sm font-bold font-mono text-neutral-500 mt-1 uppercase tracking-widest">Verifikasi lokasi & foto selfie</p>
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(['gps', 'camera', 'review'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-10 h-10 border-2 border-neutral-900 flex items-center justify-center text-sm font-black transition-all duration-300 shadow-[2px_2px_0px_0px_#1F2937] ${
                  step === s
                    ? 'bg-brutalistYellow text-neutral-900'
                    : step === 'done' ||
                      (['camera', 'review', 'done'].indexOf(step) >
                        ['gps', 'camera', 'review'].indexOf(s))
                    ? 'bg-success text-white'
                    : 'bg-white text-neutral-400'
                }`}
              >
                {step === 'done' ||
                (['camera', 'review', 'done'].indexOf(step) >
                  ['gps', 'camera', 'review'].indexOf(s)) ? (
                  <CheckCircle2 size={20} />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div
                  className={`flex-1 h-1.5 border-y-2 border-neutral-900 ${
                    ['camera', 'review', 'done'].indexOf(step) > i
                      ? 'bg-success'
                      : 'bg-neutral-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: GPS */}
          {step === 'gps' && (
            <motion.div
              key="gps"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="border-4 border-neutral-900 bg-white p-6 shadow-[8px_8px_0px_0px_#1F2937]">
                <div className="flex items-center gap-4 mb-6 border-b-4 border-neutral-900 pb-4">
                  <div className="w-12 h-12 border-2 border-neutral-900 bg-brutalistCyan flex items-center justify-center shadow-[2px_2px_0px_0px_#1F2937]">
                    <MapPin className="w-6 h-6 text-neutral-900" />
                  </div>
                  <div>
                    <h2 className="font-black text-xl text-neutral-900 uppercase tracking-tight">
                      Verifikasi Lokasi
                    </h2>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">
                      Pastikan Anda berada di area kantor
                    </p>
                  </div>
                </div>

                <GPSIndicator
                  loading={geo.loading}
                  error={geo.error}
                  latitude={geo.latitude}
                  longitude={geo.longitude}
                  accuracy={geo.accuracy}
                  distance={nearestPoint?.distance ?? null}
                  maxDistance={nearestPoint?.radius_meters ?? null}
                  locationName={nearestPoint?.name ?? null}
                  onRefresh={geo.refresh}
                />
              </div>

              {/* Early attendance warning */}
              {!timeAllowed && (
                <div className="p-4 border-4 border-neutral-900 bg-warning/20 flex items-start gap-4 shadow-[8px_8px_0px_0px_#1F2937]">
                  <div className="w-12 h-12 border-2 border-neutral-900 bg-warning flex items-center justify-center shadow-[2px_2px_0px_0px_#1F2937] shrink-0">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-neutral-900 text-lg uppercase tracking-tight">
                      Belum Waktunya Absen
                    </p>
                    <p className="text-sm font-bold text-neutral-800 mt-2">
                      Jam absen dimulai pukul <span className="font-black bg-white px-1 border-b-2 border-neutral-900">{workStartTimeStr}</span>.
                      {minutesLeft > 0 && (
                        <> Silakan tunggu <span className="font-black text-warning bg-white px-1 border-b-2 border-warning">{minutesLeft} menit</span> lagi.</>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('camera')}
                disabled={!isInRange || !timeAllowed}
                className="w-full flex items-center justify-center gap-3 px-6 py-5 text-lg font-black uppercase tracking-widest text-white bg-primary border-4 border-neutral-900 shadow-[8px_8px_0px_0px_#1F2937] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[6px_6px_0px_0px_#1F2937] active:shadow-none active:translate-y-[8px] active:translate-x-[8px] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {!timeAllowed ? (
                  <>
                    <Clock className="w-6 h-6" />
                    Belum Jam Absen ({workStartTimeStr})
                  </>
                ) : !isInRange && nearestPoint ? (
                  <>
                    <AlertCircle className="w-6 h-6" />
                    Di Luar Area ({nearestPoint.distance}m)
                  </>
                ) : !nearestPoint ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Mencari lokasi...
                  </>
                ) : (
                  <>
                    Lanjut ke Kamera
                    <Camera className="w-6 h-6" />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* STEP 2: Camera */}
          {step === 'camera' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="border-4 border-neutral-900 bg-white p-6 shadow-[8px_8px_0px_0px_#1F2937] mb-6">
                <div className="flex items-center gap-4 mb-6 border-b-4 border-neutral-900 pb-4">
                  <div className="w-12 h-12 border-2 border-neutral-900 bg-brutalistPink flex items-center justify-center shadow-[2px_2px_0px_0px_#1F2937]">
                    <Camera className="w-6 h-6 text-neutral-900" />
                  </div>
                  <div>
                    <h2 className="font-black text-xl text-neutral-900 uppercase tracking-tight">
                      Foto Selfie
                    </h2>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">
                      Ambil foto selfie untuk verifikasi kehadiran
                    </p>
                  </div>
                </div>

                <div className="text-center py-10 border-4 border-neutral-900 bg-neutral-50 border-dashed">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCameraOpen(true)}
                    className="w-28 h-28 border-4 border-neutral-900 bg-primary flex items-center justify-center mx-auto shadow-[6px_6px_0px_0px_#1F2937]"
                  >
                    <Camera className="w-12 h-12 text-white" />
                  </motion.button>
                  <p className="text-sm font-black text-neutral-900 uppercase tracking-widest mt-6">
                    Tap Untuk Membuka Kamera
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep('gps')}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 text-base font-black uppercase tracking-widest text-neutral-900 bg-white border-4 border-neutral-900 shadow-[8px_8px_0px_0px_#1F2937] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[6px_6px_0px_0px_#1F2937] active:shadow-none active:translate-y-[8px] active:translate-x-[8px] transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Kembali
              </button>
            </motion.div>
          )}

          {/* STEP 3: Review */}
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="border-4 border-neutral-900 bg-white p-6 shadow-[8px_8px_0px_0px_#1F2937]">
                <h2 className="font-black text-xl text-neutral-900 uppercase tracking-tight mb-6 border-b-4 border-neutral-900 pb-4">
                  Review & Submit
                </h2>

                {/* Photo preview */}
                {photoPreview && (
                  <div className="relative border-4 border-neutral-900 mb-6 bg-neutral-100 aspect-[4/3]">
                    <img
                      src={photoPreview}
                      alt="Selfie preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setPhotoBlob(null)
                        setPhotoPreview(null)
                        setStep('camera')
                      }}
                      className="absolute bottom-4 right-4 px-4 py-2 border-2 border-neutral-900 bg-white text-neutral-900 text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#1F2937] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_#1F2937] transition-all"
                    >
                      Foto Ulang
                    </button>
                  </div>
                )}

                {/* Info summary */}
                <div className="space-y-4">
                  {nearestPoint && (
                    <div className="flex items-center justify-between p-4 border-2 border-neutral-900 bg-brutalistCyan/10">
                      <span className="text-neutral-900 font-black uppercase tracking-widest text-xs flex items-center gap-2">
                        <MapPin size={18} />
                        Lokasi
                      </span>
                      <span className="text-neutral-900 font-bold">
                        {nearestPoint.name} ({nearestPoint.distance}m)
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-4 border-2 border-neutral-900 bg-brutalistYellow/10">
                    <span className="text-neutral-900 font-black uppercase tracking-widest text-xs flex items-center gap-2">
                      <Zap size={18} />
                      GPS
                    </span>
                    <span className="text-neutral-900 font-mono font-bold">
                      {geo.latitude?.toFixed(6)}, {geo.longitude?.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>

              {attendance.error && (
                <div className="p-4 border-4 border-neutral-900 bg-danger text-white font-bold flex items-start gap-3 shadow-[8px_8px_0px_0px_#1F2937]">
                  <AlertCircle size={24} className="shrink-0" />
                  {attendance.error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('camera')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm md:text-base font-black uppercase tracking-widest text-neutral-900 bg-white border-4 border-neutral-900 shadow-[8px_8px_0px_0px_#1F2937] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[6px_6px_0px_0px_#1F2937] active:shadow-none active:translate-y-[8px] active:translate-x-[8px] transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Kembali
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={attendance.submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm md:text-base font-black uppercase tracking-widest text-white bg-primary border-4 border-neutral-900 shadow-[8px_8px_0px_0px_#1F2937] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[6px_6px_0px_0px_#1F2937] active:shadow-none active:translate-y-[8px] active:translate-x-[8px] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {attendance.submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      MENGIRIM...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      SUBMIT ABSEN
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* DONE */}
          {step === 'done' && attendance.todayRecord && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center pt-8"
            >
              <div className="border-4 border-neutral-900 bg-white p-8 md:p-12 shadow-[12px_12px_0px_0px_#1F2937]">
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="w-24 h-24 border-4 border-neutral-900 bg-success flex items-center justify-center mx-auto mb-6 shadow-[6px_6px_0px_0px_#1F2937]"
                >
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>

                <h2 className="text-3xl font-black text-neutral-900 uppercase tracking-tight mb-2">
                  Absen Berhasil! 🎉
                </h2>
                <p className="text-sm font-bold font-mono text-neutral-500 uppercase tracking-widest mb-8">
                  Kehadiran Anda telah tercatat
                </p>

                <div className="flex items-center justify-center mb-8">
                  <div className="inline-flex items-center gap-2 border-4 border-neutral-900 bg-brutalistYellow px-6 py-3 shadow-[4px_4px_0px_0px_#1F2937] transform -rotate-2">
                    <Zap size={24} className="text-neutral-900" />
                    <span className="font-black text-2xl text-neutral-900">+{attendance.todayRecord.xp_earned} XP</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-black uppercase tracking-widest text-white bg-neutral-900 border-4 border-neutral-900 hover:bg-neutral-800 transition-colors"
                >
                  KEMBALI KE DASHBOARD
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  )
}

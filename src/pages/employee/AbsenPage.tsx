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
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl hover:bg-white/50 transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-neutral-800">Absen Sekarang</h1>
            <p className="text-sm text-neutral-500">Verifikasi lokasi & foto selfie</p>
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {(['gps', 'camera', 'review'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step === s
                    ? 'bg-primary text-white shadow-primary'
                    : step === 'done' ||
                      (['camera', 'review', 'done'].indexOf(step) >
                        ['gps', 'camera', 'review'].indexOf(s))
                    ? 'bg-success text-white'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                {step === 'done' ||
                (['camera', 'review', 'done'].indexOf(step) >
                  ['gps', 'camera', 'review'].indexOf(s)) ? (
                  <CheckCircle2 size={16} />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div
                  className={`flex-1 h-0.5 rounded ${
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
              <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-neutral-800">
                      Step 1: Verifikasi Lokasi
                    </h2>
                    <p className="text-xs text-neutral-500">
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
                <div className="p-4 border-2 border-warning bg-warning/10 flex items-start gap-3">
                  <div className="w-10 h-10 border-2 border-neutral-800 bg-warning flex items-center justify-center shadow-[2px_2px_0px_0px_#1F2937] shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-800 text-sm">
                      Belum Waktunya Absen
                    </p>
                    <p className="text-xs text-neutral-600 mt-1">
                      Jam absen dimulai pukul <span className="font-mono font-bold text-neutral-800">{workStartTimeStr}</span>.
                      {minutesLeft > 0 && (
                        <> Silakan tunggu <span className="font-mono font-bold text-warning">{minutesLeft} menit</span> lagi.</>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('camera')}
                disabled={!isInRange || !timeAllowed}
                className="btn-primary w-full py-4"
              >
                {!timeAllowed ? (
                  <>
                    <Clock className="w-5 h-5" />
                    Belum Jam Absen ({workStartTimeStr})
                  </>
                ) : !isInRange && nearestPoint ? (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    Di Luar Area ({nearestPoint.distance}m)
                  </>
                ) : !nearestPoint ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Mencari lokasi...
                  </>
                ) : (
                  <>
                    Lanjut ke Kamera
                    <Camera className="w-5 h-5" />
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
              <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-neutral-800">
                      Step 2: Foto Selfie
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Ambil foto selfie untuk verifikasi kehadiran
                    </p>
                  </div>
                </div>

                <div className="text-center py-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCameraOpen(true)}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto shadow-primary-lg hover:shadow-xl transition-shadow"
                  >
                    <Camera className="w-10 h-10 text-white" />
                  </motion.button>
                  <p className="text-sm text-neutral-500 mt-4">
                    Tap untuk membuka kamera
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep('gps')}
                className="btn-secondary w-full"
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
              className="space-y-4"
            >
              <div className="glass-card p-5">
                <h2 className="font-semibold text-neutral-800 mb-4">
                  Step 3: Review & Submit
                </h2>

                {/* Photo preview */}
                {photoPreview && (
                  <div className="relative rounded-xl overflow-hidden mb-4 aspect-[4/3]">
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
                      className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/50 text-white text-xs font-medium hover:bg-black/70 transition-colors"
                    >
                      Foto Ulang
                    </button>
                  </div>
                )}

                {/* Info summary */}
                <div className="space-y-2">
                  {nearestPoint && (
                    <div className="flex items-center justify-between text-sm py-2 border-b border-neutral-100">
                      <span className="text-neutral-500 flex items-center gap-2">
                        <MapPin size={16} />
                        Lokasi
                      </span>
                      <span className="text-neutral-800 font-medium">
                        {nearestPoint.name} ({nearestPoint.distance}m)
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm py-2 border-b border-neutral-100">
                    <span className="text-neutral-500 flex items-center gap-2">
                      <Zap size={16} />
                      GPS
                    </span>
                    <span className="text-neutral-800 font-medium font-tabular">
                      {geo.latitude?.toFixed(6)}, {geo.longitude?.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>

              {attendance.error && (
                <div className="p-3 rounded-xl bg-danger-light text-danger text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {attendance.error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('camera')}
                  className="btn-secondary flex-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Kembali
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={attendance.submitting}
                  className="btn-primary flex-1 py-4"
                >
                  {attendance.submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Absen
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
              className="text-center"
            >
              <div className="glass-card p-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-success-light flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </motion.div>

                <h2 className="text-xl font-bold text-neutral-800 mb-2">
                  Absen Berhasil! 🎉
                </h2>
                <p className="text-sm text-neutral-500 mb-4">
                  Kehadiran Anda telah tercatat
                </p>

                <div className="flex items-center justify-center gap-3 mb-6">
                  <span className="badge bg-primary-50 text-primary text-base px-4 py-2">
                    <Zap size={18} />+{attendance.todayRecord.xp_earned} XP
                  </span>
                </div>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  )
}

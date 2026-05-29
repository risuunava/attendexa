import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, RotateCcw, Check, X, Loader2 } from 'lucide-react'

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (photoBlob: Blob) => void
}

/**
 * Fullscreen camera modal for taking attendance selfie.
 * Uses navigator.mediaDevices.getUserMedia for camera access.
 * Shows face guide circle overlay + capture button.
 */
export default function CameraModal({
  isOpen,
  onClose,
  onCapture,
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [photoData, setPhotoData] = useState<string | null>(null)
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    setCameraReady(false)
    setCameraError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setCameraReady(true)
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError(
        'Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan di browser Anda.'
      )
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
      setPhotoData(null)
      setPhotoBlob(null)
    }

    return () => stopCamera()
  }, [isOpen, startCamera, stopCamera])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Mirror the image for selfie
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setPhotoData(dataUrl)

    canvas.toBlob(
      (blob) => {
        if (blob) setPhotoBlob(blob)
      },
      'image/jpeg',
      0.85
    )

    // Stop camera after capture
    stopCamera()
  }, [stopCamera])

  const retake = useCallback(() => {
    setPhotoData(null)
    setPhotoBlob(null)
    startCamera()
  }, [startCamera])

  const confirm = useCallback(() => {
    if (photoBlob) {
      onCapture(photoBlob)
    }
  }, [photoBlob, onCapture])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </button>

          {/* Header */}
          <div className="text-center mb-4 px-4">
            <h3 className="text-white text-lg font-semibold">Foto Selfie Absensi</h3>
            <p className="text-white/60 text-sm mt-1">
              Posisikan wajah Anda dalam lingkaran
            </p>
          </div>

          {/* Camera / Photo Preview Area */}
          <div className="relative w-full max-w-sm aspect-[3/4] mx-4 rounded-2xl overflow-hidden bg-neutral-900">
            {/* Error state */}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/70 text-sm">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="mt-4 px-4 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}

            {/* Loading state */}
            {!cameraReady && !photoData && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-white/50 animate-spin mx-auto" />
                  <p className="text-white/50 text-sm mt-3">Mengaktifkan kamera...</p>
                </div>
              </div>
            )}

            {/* Video feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                photoData ? 'hidden' : ''
              }`}
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Photo preview */}
            {photoData && (
              <img
                src={photoData}
                alt="Captured selfie"
                className="w-full h-full object-cover"
              />
            )}

            {/* Face guide circle overlay */}
            {!photoData && cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 rounded-full border-[3px] border-white/40 border-dashed animate-pulse-slow" />
              </div>
            )}

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-6">
            {!photoData ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className="w-14 h-14 rounded-full border-[3px] border-neutral-300 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-neutral-700" />
                </div>
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={retake}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  <RotateCcw size={18} />
                  Ulangi
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirm}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-success text-white text-sm font-semibold hover:brightness-110 transition-all shadow-lg"
                >
                  <Check size={18} />
                  Gunakan Foto
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

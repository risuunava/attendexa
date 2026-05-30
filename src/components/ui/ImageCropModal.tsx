import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react'
import { getCroppedImg } from '../../lib/cropImage'

interface ImageCropModalProps {
  imageSrc: string
  onCancel: () => void
  onCropComplete: (croppedBlob: Blob) => void
}

export default function ImageCropModal({
  imageSrc,
  onCancel,
  onCropComplete,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  const onCropAreaChange = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setIsCropping(true)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCropComplete(blob)
    } catch (e) {
      console.error(e)
    } finally {
      setIsCropping(false)
    }
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="crop-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onCancel}
      >
        {/* Modal */}
        <motion.div
          key="crop-modal"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white border-4 border-neutral-900 shadow-[8px_8px_0px_0px_#1F2937] relative"
        >
          {/* Header */}
          <div className="bg-brutalistYellow border-b-4 border-neutral-900 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-black text-neutral-900 uppercase tracking-tight">
                Atur Foto Profil
              </h2>
              <p className="font-mono text-xs text-neutral-700 mt-0.5">
                Geser & perbesar untuk menyesuaikan posisi foto
              </p>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 border-2 border-neutral-900 bg-white flex items-center justify-center hover:bg-neutral-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Cropper Area */}
          <div className="relative w-full h-80 bg-neutral-900">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid={true}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropAreaChange}
            />
          </div>

          {/* Zoom Slider */}
          <div className="px-6 py-4 bg-neutral-50 border-t-2 border-neutral-200 flex items-center gap-4">
            <button
              onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
              className="w-8 h-8 border-2 border-neutral-900 bg-white flex items-center justify-center hover:bg-neutral-100 transition-colors shrink-0"
            >
              <ZoomOut size={14} />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1 accent-neutral-900 cursor-pointer"
              style={{ accentColor: '#1F2937' }}
            />
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              className="w-8 h-8 border-2 border-neutral-900 bg-white flex items-center justify-center hover:bg-neutral-100 transition-colors shrink-0"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t-4 border-neutral-900 flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="btn bg-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937] text-neutral-900 hover:bg-neutral-100 px-5 py-2.5 font-bold uppercase text-sm"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={isCropping}
              className="btn bg-neutral-900 border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937] text-white hover:bg-neutral-700 px-5 py-2.5 font-bold uppercase text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCropping ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Simpan Foto
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

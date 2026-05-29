import { MapPin, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface GPSIndicatorProps {
  loading: boolean
  error: string | null
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  distance: number | null
  maxDistance: number | null
  locationName: string | null
  onRefresh: () => void
}

/**
 * GPS location status indicator chip.
 * Shows: loading / in-area (green) / out-of-area (red) / error.
 */
export default function GPSIndicator({
  loading,
  error,
  latitude,
  longitude,
  accuracy,
  distance,
  maxDistance,
  locationName,
  onRefresh,
}: GPSIndicatorProps) {
  const isInRange = distance !== null && maxDistance !== null && distance <= maxDistance

  if (loading) {
    return (
      <div className="glass-card-sm p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-700">Mencari lokasi...</p>
          <p className="text-xs text-neutral-400">Mengaktifkan GPS</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card-sm p-4 flex items-center gap-3 border-danger/20">
        <div className="w-10 h-10 rounded-full bg-danger-light flex items-center justify-center">
          <XCircle className="w-5 h-5 text-danger" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-danger">Lokasi Tidak Tersedia</p>
          <p className="text-xs text-neutral-500">{error}</p>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs text-primary font-medium hover:underline"
        >
          Coba lagi
        </button>
      </div>
    )
  }

  if (latitude === null || longitude === null) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card-sm p-4 flex items-center gap-3 border ${
        isInRange ? 'border-success/20' : 'border-danger/20'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isInRange ? 'bg-success-light' : 'bg-danger-light'
        }`}
      >
        {isInRange ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <MapPin className="w-5 h-5 text-danger" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-semibold ${
              isInRange ? 'text-success' : 'text-danger'
            }`}
          >
            {isInRange ? 'Dalam Area Absen' : 'Di Luar Area Absen'}
          </p>
          {distance !== null && (
            <span
              className={`text-xs font-tabular px-2 py-0.5 rounded-full ${
                isInRange
                  ? 'bg-success-light text-success'
                  : 'bg-danger-light text-danger'
              }`}
            >
              {distance}m
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {locationName && (
            <p className="text-xs text-neutral-500 truncate">{locationName}</p>
          )}
          {maxDistance && (
            <p className="text-xs text-neutral-400">
              (maks {maxDistance}m)
            </p>
          )}
        </div>
        {accuracy && (
          <p className="text-xs text-neutral-400 mt-0.5">
            Akurasi GPS: ±{Math.round(accuracy)}m
          </p>
        )}
      </div>

      <button
        onClick={onRefresh}
        className="text-xs text-primary font-medium hover:underline shrink-0"
      >
        Refresh
      </button>
    </motion.div>
  )
}

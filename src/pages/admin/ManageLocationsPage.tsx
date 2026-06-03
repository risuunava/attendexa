import { useState, useEffect } from 'react'
import { supabase } from '../../libs/supabase'
import PageContainer from '../../components/layout/PageContainer'
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Loader2,
  Navigation,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface LocationPoint {
  id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
  is_active: boolean
  created_at: string
}

const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVars: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
}

export default function ManageLocationsPage() {
  const [locations, setLocations] = useState<LocationPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formLat, setFormLat] = useState('')
  const [formLng, setFormLng] = useState('')
  const [formRadius, setFormRadius] = useState('100')

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('location_points')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setLocations(data as LocationPoint[])
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormName('')
    setFormLat('')
    setFormLng('')
    setFormRadius('100')
    setEditingId(null)
  }

  const startEditing = (loc: LocationPoint) => {
    setEditingId(loc.id)
    setFormName(loc.name)
    setFormLat(String(loc.latitude))
    setFormLng(String(loc.longitude))
    setFormRadius(String(loc.radius_meters))
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formLat || !formLng) {
      toast.error('Nama, latitude, dan longitude wajib diisi.')
      return
    }

    setSaving(true)
    const payload = {
      name: formName.trim(),
      latitude: parseFloat(formLat),
      longitude: parseFloat(formLng),
      radius_meters: parseInt(formRadius) || 100,
      work_start_time: '00:00:00', // Dummy value for db constraint
      work_end_time: '00:00:00',   // Dummy value for db constraint
    }

    if (editingId) {
      const { error } = await supabase
        .from('location_points')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        toast.error('Gagal memperbarui: ' + error.message)
      } else {
        toast.success('Lokasi berhasil diperbarui!')
        resetForm()
        setShowForm(false)
        fetchLocations()
      }
    } else {
      const { error } = await supabase.from('location_points').insert(payload)

      if (error) {
        toast.error('Gagal menambah: ' + error.message)
      } else {
        toast.success('Lokasi baru berhasil ditambahkan!')
        resetForm()
        setShowForm(false)
        fetchLocations()
      }
    }
    setSaving(false)
  }

  const toggleActive = async (loc: LocationPoint) => {
    const { error } = await supabase
      .from('location_points')
      .update({ is_active: !loc.is_active })
      .eq('id', loc.id)

    if (error) {
      toast.error('Gagal mengubah status.')
    } else {
      toast.success(loc.is_active ? 'Lokasi dinonaktifkan.' : 'Lokasi diaktifkan.')
      fetchLocations()
    }
  }

  const deleteLocation = async (id: string) => {
    if (!confirm('Yakin ingin menghapus lokasi ini?')) return

    const { error } = await supabase
      .from('location_points')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Gagal menghapus: ' + error.message)
    } else {
      toast.success('Lokasi dihapus.')
      fetchLocations()
    }
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
              <MapPin size={24} className="text-primary" />
              Kelola Lokasi
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Atur titik lokasi kantor untuk verifikasi absensi.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowForm(!showForm)
            }}
            className={clsx(
              'self-start sm:self-auto transition-all',
              showForm ? 'btn-secondary' : 'btn-primary'
            )}
          >
            {showForm ? (
              <>
                <X size={18} /> Batal
              </>
            ) : (
              <>
                <Plus size={18} /> Tambah Lokasi
              </>
            )}
          </button>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
                <h2 className="text-lg font-bold text-neutral-800">
                  {editingId ? '✏️ Edit Lokasi' : '📍 Tambah Lokasi Baru'}
                </h2>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Nama Lokasi
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Kantor Pusat Jakarta"
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      <Navigation size={14} className="inline mr-1" />
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formLat}
                      onChange={(e) => setFormLat(e.target.value)}
                      placeholder="-6.2000"
                      className="input-field font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      <Navigation size={14} className="inline mr-1" />
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formLng}
                      onChange={(e) => setFormLng(e.target.value)}
                      placeholder="106.8450"
                      className="input-field font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Radius (meter)
                    </label>
                    <input
                      type="number"
                      value={formRadius}
                      onChange={(e) => setFormRadius(e.target.value)}
                      min="10"
                      max="5000"
                      className="input-field"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {editingId ? 'Perbarui Lokasi' : 'Simpan Lokasi'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Location Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass-card p-6 h-48 animate-pulse bg-white/40" />
            ))}
          </div>
        ) : locations.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-800">Belum ada lokasi</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Tambah lokasi kantor untuk memulai verifikasi absensi GPS.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {locations.map((loc) => (
              <motion.div
                key={loc.id}
                variants={itemVars}
                className={clsx(
                  'glass-card p-5 transition-all hover:shadow-glass-sm',
                  !loc.is_active && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                      <MapPin size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-800 text-sm">{loc.name}</h3>
                      <span
                        className={clsx(
                          'text-xs font-medium',
                          loc.is_active ? 'text-success' : 'text-neutral-400'
                        )}
                      >
                        {loc.is_active ? '● Aktif' : '○ Nonaktif'}
                      </span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleActive(loc)}
                    className="text-neutral-400 hover:text-primary transition-colors"
                    title={loc.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {loc.is_active ? (
                      <ToggleRight size={28} className="text-success" />
                    ) : (
                      <ToggleLeft size={28} />
                    )}
                  </button>
                </div>

                <div className="space-y-2 text-sm text-neutral-600 mb-4">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <Navigation size={12} className="text-neutral-400" />
                    {Number(loc.latitude).toFixed(6)}, {Number(loc.longitude).toFixed(6)}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      📏 {loc.radius_meters}m
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-neutral-100">
                  <button
                    onClick={() => startEditing(loc)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary-50 transition-colors"
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => deleteLocation(loc.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-danger hover:bg-danger-light transition-colors"
                  >
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageContainer>
  )
}

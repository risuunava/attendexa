import { useState, useEffect } from 'react'
import { supabase } from '../../libs/supabase'
import PageContainer from '../../components/layout/PageContainer'
import { useAuth } from '../../contexts/AuthContext'
import {
  Clock,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Loader2,
  Moon,
  Sun
} from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import type { Shift } from '../../types/shift'

const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVars: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
}

export default function ManageShiftsPage() {
  const { user } = useAuth()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formStartTime, setFormStartTime] = useState('08:00')
  const [formEndTime, setFormEndTime] = useState('17:00')
  const [formIsOvernight, setFormIsOvernight] = useState(false)
  const [formGraceEarly, setFormGraceEarly] = useState('30')
  const [formGraceLate, setFormGraceLate] = useState('15')

  useEffect(() => {
    fetchShifts()
  }, [])

  // Auto-detect is_overnight when time changes
  useEffect(() => {
    if (formStartTime && formEndTime) {
      const startHour = parseInt(formStartTime.split(':')[0], 10)
      const endHour = parseInt(formEndTime.split(':')[0], 10)
      // If end hour is strictly less than start hour, it's likely overnight
      // Or if start is PM and end is AM
      if (endHour < startHour) {
        setFormIsOvernight(true)
      } else {
        setFormIsOvernight(false)
      }
    }
  }, [formStartTime, formEndTime])

  const fetchShifts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setShifts(data as Shift[])
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormName('')
    setFormStartTime('08:00')
    setFormEndTime('17:00')
    setFormIsOvernight(false)
    setFormGraceEarly('30')
    setFormGraceLate('15')
    setEditingId(null)
  }

  const startEditing = (shift: Shift) => {
    setEditingId(shift.id)
    setFormName(shift.name)
    // Extract HH:mm from TIME fields (which might be "08:00:00")
    setFormStartTime(shift.start_time.slice(0, 5))
    setFormEndTime(shift.end_time.slice(0, 5))
    setFormIsOvernight(shift.is_overnight)
    setFormGraceEarly(String(shift.grace_early))
    setFormGraceLate(String(shift.grace_late))
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !user) {
      toast.error('Nama shift wajib diisi.')
      return
    }

    setSaving(true)
    const payload = {
      company_id: user.id, // Assign to current admin
      name: formName.trim(),
      start_time: `${formStartTime}:00`,
      end_time: `${formEndTime}:00`,
      is_overnight: formIsOvernight,
      grace_early: parseInt(formGraceEarly) || 30,
      grace_late: parseInt(formGraceLate) || 15,
      updated_at: new Date().toISOString()
    }

    if (editingId) {
      const { error } = await supabase
        .from('shifts')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        toast.error('Gagal memperbarui: ' + error.message)
      } else {
        toast.success('Shift berhasil diperbarui!')
        resetForm()
        setShowForm(false)
        fetchShifts()
      }
    } else {
      const { error } = await supabase.from('shifts').insert(payload)

      if (error) {
        toast.error('Gagal menambah: ' + error.message)
      } else {
        toast.success('Shift baru berhasil ditambahkan!')
        resetForm()
        setShowForm(false)
        fetchShifts()
      }
    }
    setSaving(false)
  }

  const deleteShift = async (id: string) => {
    if (!confirm('Yakin ingin menghapus shift ini? Karyawan yang terikat mungkin akan terpengaruh.')) return

    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Gagal menghapus: ' + error.message)
    } else {
      toast.success('Shift dihapus.')
      fetchShifts()
    }
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
              <h1 className="text-3xl font-black text-neutral-900 flex items-center gap-2 tracking-tight uppercase">
              <div className="w-10 h-10 border-4 border-neutral-900 bg-brutalistYellow flex items-center justify-center shadow-[4px_4px_0px_0px_#1F2937]">
                <Clock size={20} className="text-neutral-900" />
              </div>
              Jadwal Shift
            </h1>
            <p className="text-sm font-bold text-neutral-600 mt-2 border-l-4 border-neutral-900 pl-3">
              Atur jam kerja pagi, siang, atau malam (overnight).
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
                <Plus size={18} /> Tambah Shift
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
              <form onSubmit={handleSubmit} className="bg-white border-4 border-neutral-900 shadow-[8px_8px_0px_0px_#1F2937] p-6 space-y-5 rounded-none mt-4">
                <h2 className="text-xl font-black text-neutral-900 uppercase border-b-4 border-neutral-900 pb-2">
                  {editingId ? '✏️ Edit Shift' : '⏳ Tambah Shift Baru'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Nama Shift
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Shift Malam"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Jam Masuk (Start Time)
                    </label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="input-field font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Jam Pulang (End Time)
                    </label>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="input-field font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Toleransi Absen Awal (menit)
                    </label>
                    <input
                      type="number"
                      value={formGraceEarly}
                      onChange={(e) => setFormGraceEarly(e.target.value)}
                      min="0"
                      className="input-field"
                      title="Berapa menit sebelum jam masuk karyawan boleh check-in"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Toleransi Keterlambatan (menit)
                    </label>
                    <input
                      type="number"
                      value={formGraceLate}
                      onChange={(e) => setFormGraceLate(e.target.value)}
                      min="0"
                      className="input-field"
                      title="Batas keterlambatan yang ditoleransi"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white border-4 border-neutral-900 shadow-[4px_4px_0px_0px_#1F2937] rounded-none">
                  <input
                    type="checkbox"
                    id="is_overnight"
                    checked={formIsOvernight}
                    onChange={(e) => setFormIsOvernight(e.target.checked)}
                    className="w-6 h-6 accent-neutral-900 border-4 border-neutral-900 rounded-none cursor-pointer"
                  />
                  <label htmlFor="is_overnight" className="text-sm font-black text-neutral-900 cursor-pointer flex-1 uppercase tracking-wide">
                    Shift Malam (Overnight)
                    <p className="text-xs font-bold text-neutral-600 mt-1 normal-case tracking-normal">
                      Centang jika shift berlanjut ke hari berikutnya (contoh: 22:00 - 06:00).
                    </p>
                  </label>
                  {formIsOvernight ? (
                    <div className="w-10 h-10 border-4 border-neutral-900 bg-primary flex items-center justify-center shadow-[4px_4px_0px_0px_#1F2937]">
                      <Moon className="text-white" size={20} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 border-4 border-neutral-900 bg-brutalistYellow flex items-center justify-center shadow-[4px_4px_0px_0px_#1F2937]">
                      <Sun className="text-neutral-900" size={20} />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full sm:w-auto"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {editingId ? 'Perbarui Shift' : 'Simpan Shift'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass-card p-6 h-40 animate-pulse bg-white/40" />
            ))}
          </div>
        ) : shifts.length === 0 ? (
          <div className="bg-white border-4 border-neutral-900 shadow-[8px_8px_0px_0px_#1F2937] p-12 text-center">
            <div className="w-16 h-16 border-4 border-neutral-900 bg-brutalistYellow flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_#1F2937]">
              <Clock className="w-8 h-8 text-neutral-900" />
            </div>
            <h3 className="text-xl font-black text-neutral-900 uppercase tracking-widest">Belum ada Shift</h3>
            <p className="text-sm font-bold text-neutral-600 mt-2">
              Buat shift pertama Anda untuk mulai mengatur jadwal karyawan.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {shifts.map((shift) => (
              <motion.div
                key={shift.id}
                variants={itemVars}
                className={clsx(
                  'bg-white border-4 border-neutral-900 p-5 transition-transform flex flex-col',
                  shift.is_overnight 
                    ? 'shadow-[6px_6px_0px_0px_#1F2937] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_#1F2937]' 
                    : 'shadow-[6px_6px_0px_0px_#1F2937] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_#1F2937]'
                )}
              >
                <div className="flex items-start justify-between mb-4 pb-4 border-b-4 border-neutral-900">
                  <div>
                    <h3 className="font-black text-neutral-900 text-lg uppercase tracking-tight">{shift.name}</h3>
                    <div className={clsx(
                      "flex items-center gap-1.5 mt-2 text-xs font-bold px-3 py-1 border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937] w-fit uppercase tracking-widest",
                      shift.is_overnight ? "bg-primary text-white" : "bg-brutalistYellow text-neutral-900"
                    )}>
                      {shift.is_overnight ? <Moon size={14} /> : <Sun size={14} />}
                      {shift.is_overnight ? 'Shift Malam' : 'Shift Reguler'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex justify-between items-center text-sm font-mono bg-white p-3 border-4 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937]">
                    <span className="text-neutral-900 text-xs font-black uppercase tracking-widest font-sans">Masuk</span>
                    <span className="font-bold text-neutral-900 text-base">{shift.start_time.slice(0, 5)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-mono bg-white p-3 border-4 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937]">
                    <span className="text-neutral-900 text-xs font-black uppercase tracking-widest font-sans">Pulang</span>
                    <span className="font-bold text-neutral-900 text-base">
                      {shift.end_time.slice(0, 5)}
                      {shift.is_overnight && <span className="text-[10px] bg-neutral-900 text-white px-1 ml-2">+1 Hari</span>}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 mt-4 border-t-4 border-neutral-900">
                  <button
                    onClick={() => startEditing(shift)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-neutral-900 text-sm font-black uppercase tracking-wider bg-brutalistCyan hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_#1F2937] text-neutral-900 transition-all"
                  >
                    <Edit3 size={16} /> Edit
                  </button>
                  <button
                    onClick={() => deleteShift(shift.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-neutral-900 text-sm font-black uppercase tracking-wider bg-brutalistPink hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_#1F2937] text-neutral-900 transition-all"
                  >
                    <Trash2 size={16} /> Hapus
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

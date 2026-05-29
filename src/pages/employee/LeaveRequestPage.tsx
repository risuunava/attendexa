import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../libs/supabase'
import PageContainer from '../../components/layout/PageContainer'
import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  FileText,
  CalendarDays,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  Plus,
} from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import clsx from 'clsx'
import toast from 'react-hot-toast'

type LeaveType = 'sick' | 'annual_leave' | 'permit' | 'wfh'
type LeaveStatus = 'pending' | 'approved' | 'rejected'

interface LeaveRequest {
  id: string
  type: LeaveType
  start_date: string
  end_date: string
  reason: string | null
  attachment_url: string | null
  status: LeaveStatus
  reviewed_by: string | null
  created_at: string
}

const leaveTypeLabels: Record<LeaveType, string> = {
  sick: 'Sakit',
  annual_leave: 'Cuti Tahunan',
  permit: 'Izin',
  wfh: 'Work From Home',
}

const leaveTypeEmoji: Record<LeaveType, string> = {
  sick: '🤒',
  annual_leave: '🏖️',
  permit: '📋',
  wfh: '🏠',
}

const statusConfig: Record<LeaveStatus, { label: string; icon: typeof Clock; badgeClass: string }> = {
  pending: { label: 'Menunggu', icon: Clock, badgeClass: 'bg-warning-light text-warning' },
  approved: { label: 'Disetujui', icon: CheckCircle2, badgeClass: 'bg-success-light text-success' },
  rejected: { label: 'Ditolak', icon: XCircle, badgeClass: 'bg-danger-light text-danger' },
}

const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemVars: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
}

export default function LeaveRequestPage() {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType>('permit')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (user) fetchRequests()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRequests = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRequests(data as LeaveRequest[])
    }
    setLoading(false)
  }

  const resetForm = () => {
    setLeaveType('permit')
    setStartDate('')
    setEndDate('')
    setReason('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startDate || !endDate) {
      toast.error('Tanggal mulai dan selesai wajib diisi.')
      return
    }
    if (endDate < startDate) {
      toast.error('Tanggal selesai harus setelah tanggal mulai.')
      return
    }
    if (!reason.trim()) {
      toast.error('Alasan wajib diisi.')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('leave_requests').insert({
      user_id: user!.id,
      type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim(),
    })

    if (error) {
      toast.error('Gagal mengajukan izin: ' + error.message)
    } else {
      toast.success('Pengajuan izin berhasil dikirim!')
      resetForm()
      setShowForm(false)
      fetchRequests()
    }
    setSubmitting(false)
  }

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Izin & Cuti</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Ajukan izin atau cuti dan pantau statusnya.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
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
                <Plus size={18} /> Ajukan Izin
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
                <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                  <FileText size={20} className="text-primary" />
                  Form Pengajuan
                </h2>

                {/* Leave Type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tipe Izin
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(leaveTypeLabels) as LeaveType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setLeaveType(type)}
                        className={clsx(
                          'p-3 rounded-xl text-sm font-medium transition-all text-left flex items-center gap-2',
                          leaveType === type
                            ? 'bg-primary-50 text-primary border-2 border-primary/30 shadow-sm'
                            : 'bg-white/60 text-neutral-600 border-2 border-transparent hover:bg-white/80'
                        )}
                      >
                        <span className="text-lg">{leaveTypeEmoji[type]}</span>
                        {leaveTypeLabels[type]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      <CalendarDays size={14} className="inline mr-1" />
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      <CalendarDays size={14} className="inline mr-1" />
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Alasan
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Jelaskan alasan pengajuan izin/cuti Anda..."
                    rows={3}
                    className="input-field resize-none"
                    required
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary flex-1 sm:flex-none"
                  >
                    {submitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Summary */}
        {!loading && requests.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {(['pending', 'approved', 'rejected'] as LeaveStatus[]).map((status) => {
              const count = requests.filter((r) => r.status === status).length
              const cfg = statusConfig[status]
              const Icon = cfg.icon
              return (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card-sm p-4 text-center"
                >
                  <div className={`w-10 h-10 rounded-xl ${cfg.badgeClass} flex items-center justify-center mx-auto mb-2`}>
                    <Icon size={20} />
                  </div>
                  <p className="text-2xl font-bold text-neutral-800 font-tabular">{count}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{cfg.label}</p>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Request List */}
        <div>
          <h2 className="text-lg font-bold text-neutral-800 mb-4">Riwayat Pengajuan</h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-5 h-24 animate-pulse bg-white/40" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-800">Belum ada pengajuan</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Klik "Ajukan Izin" untuk membuat pengajuan baru.
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVars}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {requests.map((req) => {
                const cfg = statusConfig[req.status]
                const Icon = cfg.icon
                return (
                  <motion.div
                    key={req.id}
                    variants={itemVars}
                    className="glass-card p-4 sm:p-5 transition-all hover:shadow-glass-sm"
                  >
                    <div className="flex items-start gap-4">
                      {/* Type Emoji */}
                      <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                        {leaveTypeEmoji[req.type]}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-neutral-800 text-sm">
                            {leaveTypeLabels[req.type]}
                          </span>
                          <span className={`badge ${cfg.badgeClass}`}>
                            <Icon size={12} />
                            {cfg.label}
                          </span>
                        </div>

                        <p className="text-sm text-neutral-600 mt-1.5 flex items-center gap-1.5">
                          <CalendarDays size={14} className="text-primary shrink-0" />
                          {format(parseISO(req.start_date), 'd MMM yyyy', { locale: localeId })}
                          {req.start_date !== req.end_date && (
                            <>
                              {' — '}
                              {format(parseISO(req.end_date), 'd MMM yyyy', { locale: localeId })}
                            </>
                          )}
                        </p>

                        {req.reason && (
                          <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2">
                            {req.reason}
                          </p>
                        )}
                      </div>

                      {/* Date submitted */}
                      <div className="text-xs text-neutral-400 shrink-0 hidden sm:block">
                        {format(parseISO(req.created_at), 'd MMM', { locale: localeId })}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

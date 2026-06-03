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
  pending: { label: 'Menunggu', icon: Clock, badgeClass: 'bg-brutalistYellow text-neutral-900 border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937]' },
  approved: { label: 'Disetujui', icon: CheckCircle2, badgeClass: 'bg-primary text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937]' },
  rejected: { label: 'Ditolak', icon: XCircle, badgeClass: 'bg-warning text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937]' },
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-neutral-800 tracking-tight">Izin & Cuti</h1>
            <p className="text-sm md:text-base text-neutral-500 mt-2 font-mono uppercase tracking-widest font-bold">
              Ajukan izin atau cuti dan pantau statusnya
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={clsx(
              'self-start sm:self-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-black uppercase tracking-widest border-2 border-neutral-900 shadow-[4px_4px_0px_0px_#1F2937] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_#1F2937] active:shadow-none active:translate-y-[4px] active:translate-x-[4px] transition-all',
              showForm ? 'bg-white text-neutral-900' : 'bg-brutalistYellow text-neutral-900'
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
              <form onSubmit={handleSubmit} className="border-4 border-neutral-900 bg-white p-6 md:p-8 space-y-6 shadow-[8px_8px_0px_0px_#1F2937] mb-8">
                <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tight flex items-center gap-2 border-b-4 border-neutral-900 pb-4">
                  <FileText size={24} className="text-primary" />
                  Form Pengajuan
                </h2>

                {/* Leave Type */}
                <div>
                  <label className="block text-sm font-black text-neutral-900 uppercase tracking-widest mb-3">
                    Tipe Izin
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Object.keys(leaveTypeLabels) as LeaveType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setLeaveType(type)}
                        className={clsx(
                          'p-4 border-2 flex flex-col items-center gap-2 transition-all font-bold uppercase tracking-wider text-xs',
                          leaveType === type
                            ? 'bg-brutalistPink text-neutral-900 border-neutral-900 shadow-[4px_4px_0px_0px_#1F2937]'
                            : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-900 hover:text-neutral-900 hover:shadow-[4px_4px_0px_0px_#1F2937]'
                        )}
                      >
                        <span className="text-2xl">{leaveTypeEmoji[type]}</span>
                        <span className="text-center">{leaveTypeLabels[type]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-neutral-900 uppercase tracking-widest mb-2">
                      <CalendarDays size={16} className="inline mr-2" />
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-100 border-2 border-neutral-900 font-mono font-bold text-neutral-900 shadow-[4px_4px_0px_0px_#1F2937] focus:outline-none focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-neutral-900 uppercase tracking-widest mb-2">
                      <CalendarDays size={16} className="inline mr-2" />
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full px-4 py-3 bg-neutral-100 border-2 border-neutral-900 font-mono font-bold text-neutral-900 shadow-[4px_4px_0px_0px_#1F2937] focus:outline-none focus:bg-white transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-black text-neutral-900 uppercase tracking-widest mb-2">
                    Alasan
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="JELASKAN ALASAN PENGAJUAN..."
                    rows={4}
                    className="w-full px-4 py-3 bg-neutral-100 border-2 border-neutral-900 font-bold text-neutral-900 shadow-[4px_4px_0px_0px_#1F2937] focus:outline-none focus:bg-white transition-colors resize-none placeholder-neutral-400"
                    required
                  />
                </div>

                {/* Submit */}
                <div className="pt-4 border-t-4 border-neutral-900">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-black uppercase tracking-widest text-white bg-primary border-4 border-neutral-900 shadow-[6px_6px_0px_0px_#1F2937] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_#1F2937] active:shadow-none active:translate-y-[6px] active:translate-x-[6px] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <Send size={24} />
                    )}
                    {submitting ? 'MENGIRIM...' : 'KIRIM PENGAJUAN'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Summary */}
        {!loading && requests.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {(['pending', 'approved', 'rejected'] as LeaveStatus[]).map((status) => {
              const count = requests.filter((r) => r.status === status).length
              const cfg = statusConfig[status]
              const Icon = cfg.icon
              return (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border-2 border-neutral-900 p-4 text-center shadow-[4px_4px_0px_0px_#1F2937]"
                >
                  <div className={`w-12 h-12 border-2 border-neutral-900 flex items-center justify-center mx-auto mb-3 shadow-[2px_2px_0px_0px_#1F2937] ${status === 'pending' ? 'bg-brutalistYellow' : status === 'approved' ? 'bg-primary' : 'bg-warning'}`}>
                    <Icon size={24} className={status === 'pending' ? 'text-neutral-900' : 'text-white'} />
                  </div>
                  <p className="text-3xl font-black text-neutral-900 font-mono tracking-tighter">{count}</p>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">{cfg.label}</p>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Request List */}
        <div>
          <h2 className="text-xl font-black text-neutral-900 uppercase tracking-tight mb-6 flex items-center gap-3">
            <span className="w-8 h-8 bg-brutalistCyan border-2 border-neutral-900 flex items-center justify-center shadow-[2px_2px_0px_0px_#1F2937]">📋</span>
            Riwayat Pengajuan
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 border-2 border-neutral-900 animate-pulse bg-neutral-100 shadow-[4px_4px_0px_0px_#1F2937]" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white border-2 border-neutral-900 p-12 text-center shadow-[4px_4px_0px_0px_#1F2937]">
              <div className="w-16 h-16 border-2 border-neutral-900 bg-brutalistPink flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_#1F2937]">
                <FileText className="w-8 h-8 text-neutral-900" />
              </div>
              <h3 className="text-lg font-black text-neutral-900 uppercase tracking-tight">Belum ada pengajuan</h3>
              <p className="text-sm font-bold font-mono text-neutral-500 mt-2">
                Klik "Ajukan Izin" untuk membuat pengajuan baru.
              </p>
            </div>
          ) : (
            <motion.div
              variants={containerVars}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {requests.map((req) => {
                const cfg = statusConfig[req.status]
                const Icon = cfg.icon
                return (
                  <motion.div
                    key={req.id}
                    variants={itemVars}
                    className="bg-white border-2 border-neutral-900 p-5 transition-all hover:shadow-[6px_6px_0px_0px_#1F2937] hover:-translate-y-0.5 hover:-translate-x-0.5 group"
                  >
                    <div className="flex items-start gap-5">
                      {/* Type Emoji */}
                      <div className="w-14 h-14 border-2 border-neutral-900 bg-brutalistCyan flex items-center justify-center text-3xl shrink-0 shadow-[2px_2px_0px_0px_#1F2937] group-hover:scale-110 transition-transform">
                        {leaveTypeEmoji[req.type]}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-black text-neutral-900 uppercase tracking-widest text-sm">
                            {leaveTypeLabels[req.type]}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-black uppercase tracking-widest flex items-center gap-1 ${cfg.badgeClass}`}>
                            <Icon size={12} />
                            {cfg.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-mono font-bold text-sm bg-neutral-100 px-2 py-1 border border-neutral-900 shadow-[1px_1px_0px_0px_#1F2937]">
                            {format(parseISO(req.start_date), 'd MMM yyyy', { locale: localeId })}
                            {req.start_date !== req.end_date && (
                              <>
                                {' — '}
                                {format(parseISO(req.end_date), 'd MMM yyyy', { locale: localeId })}
                              </>
                            )}
                          </span>
                        </div>

                        {req.reason && (
                          <div className="mt-3 p-3 border-l-4 border-neutral-900 bg-neutral-50">
                            <p className="text-xs font-bold text-neutral-600 line-clamp-2 italic">
                              "{req.reason}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Date submitted */}
                      <div className="text-xs font-black text-neutral-400 uppercase tracking-widest shrink-0 hidden sm:block">
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

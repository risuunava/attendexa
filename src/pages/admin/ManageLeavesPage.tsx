import { useState, useEffect } from 'react'
import { supabase } from '../../libs/supabase'
import PageContainer from '../../components/layout/PageContainer'
import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Loader2,
} from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import clsx from 'clsx'
import toast from 'react-hot-toast'

type LeaveType = 'sick' | 'annual_leave' | 'permit' | 'wfh'
type LeaveStatus = 'pending' | 'approved' | 'rejected'

interface LeaveWithUser {
  id: string
  user_id: string
  type: LeaveType
  start_date: string
  end_date: string
  reason: string | null
  attachment_url: string | null
  status: LeaveStatus
  created_at: string
  users: { full_name: string; department: string | null } | null
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

const statusConfig: Record<LeaveStatus, { label: string; badgeClass: string }> = {
  pending: { label: 'Menunggu', badgeClass: 'bg-warning-light text-warning' },
  approved: { label: 'Disetujui', badgeClass: 'bg-success-light text-success' },
  rejected: { label: 'Ditolak', badgeClass: 'bg-danger-light text-danger' },
}

const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVars: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

type TabFilter = 'pending' | 'all'

export default function ManageLeavesPage() {
  const [requests, setRequests] = useState<LeaveWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabFilter>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaves()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLeaves = async () => {
    setLoading(true)
    let query = supabase
      .from('leave_requests')
      .select(`
        id, user_id, type, start_date, end_date, reason, attachment_url, status, created_at,
        users(full_name, department)
      `)
      .order('created_at', { ascending: false })

    if (tab === 'pending') {
      query = query.eq('status', 'pending')
    }

    const { data, error } = await query

    if (!error && data) {
      setRequests(data as unknown as LeaveWithUser[])
    }
    setLoading(false)
  }

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setActionLoading(id)
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: action })
      .eq('id', id)

    if (error) {
      toast.error('Gagal memproses: ' + error.message)
    } else {
      toast.success(action === 'approved' ? 'Izin disetujui!' : 'Izin ditolak.')
      fetchLeaves()
    }
    setActionLoading(null)
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
              <FileText size={24} className="text-primary" />
              Review Izin & Cuti
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Approve atau reject pengajuan izin karyawan.
            </p>
          </div>

          {/* Tabs */}
          <div className="glass-card-sm p-1 flex self-start sm:self-auto">
            <button
              onClick={() => setTab('pending')}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                tab === 'pending'
                  ? 'bg-white text-warning shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              <Clock size={14} className="inline mr-1" />
              Pending
            </button>
            <button
              onClick={() => setTab('all')}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                tab === 'all'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              Semua
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 h-32 animate-pulse bg-white/40" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-medium text-neutral-800">
              {tab === 'pending' ? 'Tidak ada izin pending' : 'Belum ada data'}
            </h3>
            <p className="text-sm text-neutral-500 mt-1">
              {tab === 'pending'
                ? 'Semua pengajuan sudah diproses.'
                : 'Belum ada pengajuan izin dari karyawan.'}
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
              const isProcessing = actionLoading === req.id

              return (
                <motion.div
                  key={req.id}
                  variants={itemVars}
                  className="glass-card p-5 transition-all hover:shadow-glass-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Left: Type icon */}
                    <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                      {leaveTypeEmoji[req.type]}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-neutral-800 text-sm">
                          {req.users?.full_name || 'Unknown'}
                        </span>
                        {req.users?.department && (
                          <span className="text-xs text-neutral-400">
                            ({req.users.department})
                          </span>
                        )}
                        <span className={`badge ${cfg.badgeClass}`}>
                          {cfg.label}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-neutral-700">
                        {leaveTypeLabels[req.type]}
                      </p>

                      <p className="text-sm text-neutral-600 flex items-center gap-1.5">
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
                        <p className="text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3">
                          "{req.reason}"
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {req.status === 'pending' && (
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <button
                          onClick={() => handleAction(req.id, 'approved')}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-success hover:brightness-110 transition-all disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          Setujui
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'rejected')}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-danger hover:brightness-110 transition-all disabled:opacity-50"
                        >
                          <XCircle size={14} />
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </PageContainer>
  )
}

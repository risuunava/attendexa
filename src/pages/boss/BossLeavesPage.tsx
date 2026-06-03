import { useState, useEffect } from 'react'
import { supabase } from '../../libs/supabase'
import PageContainer from '../../components/layout/PageContainer'
import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import clsx from 'clsx'

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
  pending: { label: 'Menunggu', badgeClass: 'bg-brutalistYellow text-neutral-900 border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937]' },
  approved: { label: 'Disetujui', badgeClass: 'bg-primary text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937]' },
  rejected: { label: 'Ditolak', badgeClass: 'bg-warning text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937]' },
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

export default function BossLeavesPage() {
  const [requests, setRequests] = useState<LeaveWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabFilter>('pending')

  useEffect(() => {
    fetchLeaves()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLeaves = async () => {
    setLoading(true)
    let query = supabase
      .from('leave_requests')
      .select(`
        id, user_id, type, start_date, end_date, reason, attachment_url, status, created_at,
        users!leave_requests_user_id_fkey(full_name, department)
      `)
      .order('created_at', { ascending: false })

    if (tab === 'pending') {
      query = query.eq('status', 'pending')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching leaves:', error)
    }

    if (data) {
      setRequests(data as unknown as LeaveWithUser[])
    }
    setLoading(false)
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-neutral-800 tracking-tight">
              Pantau <span className="text-primary italic">Izin & Cuti</span>
            </h1>
            <p className="text-sm md:text-base text-neutral-500 mt-2 font-mono uppercase tracking-widest font-bold">
              Lihat pengajuan izin dari semua karyawan
            </p>
          </div>

          {/* Tabs */}
          <div className="border-2 border-neutral-900 bg-white p-1 flex self-start sm:self-auto shadow-[4px_4px_0px_0px_#1F2937]">
            <button
              onClick={() => setTab('pending')}
              className={clsx(
                'px-4 py-2 text-sm font-black transition-all uppercase tracking-widest',
                tab === 'pending'
                  ? 'bg-brutalistYellow text-neutral-900 border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937]'
                  : 'text-neutral-500 hover:text-neutral-900 border-2 border-transparent'
              )}
            >
              <Clock size={16} className="inline mr-2" />
              Pending
            </button>
            <button
              onClick={() => setTab('all')}
              className={clsx(
                'px-4 py-2 text-sm font-black transition-all uppercase tracking-widest',
                tab === 'all'
                  ? 'bg-primary text-white border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937]'
                  : 'text-neutral-500 hover:text-neutral-900 border-2 border-transparent'
              )}
            >
              Semua
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 border-2 border-neutral-900 animate-pulse bg-neutral-100 shadow-[4px_4px_0px_0px_#1F2937]" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="border-2 border-neutral-900 bg-white p-12 text-center shadow-[4px_4px_0px_0px_#1F2937]">
            <div className="w-16 h-16 border-2 border-neutral-900 bg-brutalistYellow flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_#1F2937]">
              {tab === 'pending' ? <CheckCircle2 className="w-8 h-8 text-neutral-900" /> : <AlertTriangle className="w-8 h-8 text-neutral-900" />}
            </div>
            <h3 className="text-xl font-black text-neutral-800 uppercase tracking-tight">
              {tab === 'pending' ? 'TIDAK ADA IZIN PENDING' : 'BELUM ADA DATA'}
            </h3>
            <p className="text-sm font-bold text-neutral-500 mt-2 font-mono">
              {tab === 'pending'
                ? 'Semua pengajuan sudah diproses oleh Admin.'
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

              return (
                <motion.div
                  key={req.id}
                  variants={itemVars}
                  className="border-2 border-neutral-900 bg-white p-5 transition-all hover:shadow-[6px_6px_0px_0px_#1F2937] hover:-translate-y-0.5 hover:-translate-x-0.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Left: Type icon */}
                    <div className="w-14 h-14 border-2 border-neutral-900 bg-brutalistPink flex items-center justify-center text-3xl shrink-0 shadow-[2px_2px_0px_0px_#1F2937]">
                      {leaveTypeEmoji[req.type]}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-neutral-900 text-lg uppercase tracking-tight">
                          {req.users?.full_name || 'Karyawan Tidak Dikenal'}
                        </span>
                        {req.users?.department && (
                          <span className="text-xs font-bold text-neutral-900 bg-neutral-200 px-2 py-0.5 border border-neutral-900 shadow-[1px_1px_0px_0px_#1F2937]">
                            {req.users.department}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-black uppercase tracking-widest ${cfg.badgeClass}`}>
                          {cfg.label}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-neutral-700 uppercase tracking-widest">
                        {leaveTypeLabels[req.type]}
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Tanggal:</span>
                        <span className="font-mono text-sm font-bold bg-neutral-100 px-2 py-0.5 border border-neutral-900 shadow-[1px_1px_0px_0px_#1F2937]">
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
                        <div className="mt-3 p-3 border-2 border-neutral-900 bg-brutalistYellow/20">
                          <p className="text-xs font-bold text-neutral-900 leading-relaxed italic">
                            "{req.reason}"
                          </p>
                        </div>
                      )}
                    </div>
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

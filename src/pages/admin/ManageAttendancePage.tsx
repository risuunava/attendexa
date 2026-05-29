import { useState, useEffect } from 'react'
import { supabase } from '../../libs/supabase'
import PageContainer from '../../components/layout/PageContainer'
import { getStatusLabel, getStatusColor, type AttendanceStatus } from '../../lib/xpCalculator'
import { format, parseISO, subDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  CalendarCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Zap,
} from 'lucide-react'
import { motion, type Variants } from 'framer-motion'

interface AttendanceWithUser {
  id: string
  user_id: string
  check_in_at: string
  status: string
  xp_earned: number
  distance_meters: number | null
  minutes_late: number
  users: { full_name: string; department: string | null } | null
  location_points: { name: string } | null
}

const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
}

const itemVars: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export default function ManageAttendancePage() {
  const [records, setRecords] = useState<AttendanceWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [searchName, setSearchName] = useState('')

  useEffect(() => {
    fetchAttendance()
  }, [dateFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAttendance = async () => {
    setLoading(true)
    const startOfDay = `${dateFilter}T00:00:00`
    const endOfDay = `${dateFilter}T23:59:59`

    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        id, user_id, check_in_at, status, xp_earned, distance_meters, minutes_late,
        users(full_name, department),
        location_points(name)
      `)
      .gte('check_in_at', startOfDay)
      .lte('check_in_at', endOfDay)
      .order('check_in_at', { ascending: false })

    if (!error && data) {
      setRecords(data as unknown as AttendanceWithUser[])
    }
    setLoading(false)
  }

  const handlePrevDay = () => {
    const prev = subDays(parseISO(dateFilter), 1)
    setDateFilter(format(prev, 'yyyy-MM-dd'))
  }

  const handleNextDay = () => {
    const next = new Date(dateFilter)
    next.setDate(next.getDate() + 1)
    if (next <= new Date()) {
      setDateFilter(format(next, 'yyyy-MM-dd'))
    }
  }

  const isToday = dateFilter === format(new Date(), 'yyyy-MM-dd')

  const filtered = records.filter((r) =>
    (r.users?.full_name || '').toLowerCase().includes(searchName.toLowerCase())
  )

  // Stats
  const totalToday = filtered.length
  const onTimeCount = filtered.filter((r) => r.status === 'on_time').length
  const lateCount = filtered.filter((r) => r.status !== 'on_time').length

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
            <CalendarCheck size={24} className="text-primary" />
            Rekap Absensi
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Data kehadiran seluruh karyawan per hari.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Date Picker */}
          <div className="glass-card-sm p-1.5 flex items-center">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ChevronLeft size={20} className="text-neutral-600" />
            </button>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium text-neutral-800 px-3"
            />
            <button
              onClick={handleNextDay}
              disabled={isToday}
              className={`p-2 rounded-lg transition-colors ${
                isToday ? 'opacity-30 cursor-not-allowed' : 'hover:bg-neutral-100'
              }`}
            >
              <ChevronRight size={20} className="text-neutral-600" />
            </button>
          </div>

          {/* Search */}
          <div className="glass-card-sm flex items-center gap-2 px-3 py-2 flex-1 sm:max-w-xs">
            <Search size={16} className="text-neutral-400" />
            <input
              type="text"
              placeholder="Cari nama karyawan..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="bg-transparent outline-none text-sm text-neutral-800 placeholder-neutral-400 w-full"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card-sm p-4 text-center">
            <p className="text-2xl font-bold text-neutral-800 font-tabular">{totalToday}</p>
            <p className="text-xs text-neutral-500">Total Hadir</p>
          </div>
          <div className="glass-card-sm p-4 text-center">
            <p className="text-2xl font-bold text-success font-tabular">{onTimeCount}</p>
            <p className="text-xs text-neutral-500">Tepat Waktu</p>
          </div>
          <div className="glass-card-sm p-4 text-center">
            <p className="text-2xl font-bold text-warning font-tabular">{lateCount}</p>
            <p className="text-xs text-neutral-500">Terlambat</p>
          </div>
        </div>

        {/* Records */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-5 h-20 animate-pulse bg-white/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-800">Tidak ada data</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Belum ada absensi untuk tanggal {format(parseISO(dateFilter), 'd MMMM yyyy', { locale: localeId })}.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {filtered.map((record) => {
              const time = format(parseISO(record.check_in_at), 'HH:mm')
              const statusClass = getStatusColor(record.status as AttendanceStatus)

              return (
                <motion.div
                  key={record.id}
                  variants={itemVars}
                  className="glass-card p-4 sm:p-5 flex items-center gap-4 transition-all hover:shadow-glass-sm"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {record.users?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-neutral-800 text-sm truncate">
                        {record.users?.full_name || 'Unknown'}
                      </p>
                      {record.users?.department && (
                        <span className="text-xs text-neutral-400">
                          {record.users.department}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-primary" />
                        {time}
                      </span>
                      {record.location_points?.name && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={12} />
                          {record.location_points.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status & XP */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`badge ${statusClass}`}>
                      {getStatusLabel(record.status as AttendanceStatus)}
                    </span>
                    <span className="text-xs text-neutral-500 font-tabular flex items-center gap-1">
                      <Zap size={10} className="text-primary" />
                      +{record.xp_earned} XP
                    </span>
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

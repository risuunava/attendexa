import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../libs/supabase'
import { getStatusLabel, getStatusColor, type AttendanceStatus } from '../../lib/xpCalculator'
import PageContainer from '../../components/layout/PageContainer'
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, MapPin, Zap, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface AttendanceRecord {
  id: string
  check_in_at: string
  status: string
  xp_earned: number
  distance_meters: number | null
  location_points: { name: string } | null
}

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVars = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 }
}

export default function HistoryPage() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchHistory()
    }
  }, [user, currentDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHistory = async () => {
    setLoading(true)
    const startDate = startOfMonth(currentDate).toISOString()
    const endDate = endOfMonth(currentDate).toISOString()

    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        id, check_in_at, status, xp_earned, distance_meters,
        location_points(name)
      `)
      .eq('user_id', user!.id)
      .gte('check_in_at', startDate)
      .lte('check_in_at', endDate)
      .order('check_in_at', { ascending: false })

    if (!error && data) {
      // Supabase returns related table as an array or object depending on relation
      // In this case it's a many-to-one so it returns an object or null
      setRecords(data as any)
    }
    setLoading(false)
  }

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1))
  const handleNextMonth = () => {
    const next = new Date(currentDate)
    next.setMonth(next.getMonth() + 1)
    if (next <= new Date()) { // Don't go to future months
      setCurrentDate(next)
    }
  }

  const isCurrentMonth = 
    currentDate.getMonth() === new Date().getMonth() &&
    currentDate.getFullYear() === new Date().getFullYear()

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Riwayat Absensi</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Catatan kehadiran Anda per bulan
            </p>
          </div>

          <div className="glass-card-sm p-1.5 flex items-center self-start sm:self-auto">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ChevronLeft size={20} className="text-neutral-600" />
            </button>
            <div className="px-4 flex items-center gap-2 font-medium text-neutral-800 min-w-[140px] justify-center">
              <CalendarIcon size={16} className="text-primary" />
              {format(currentDate, 'MMMM yyyy', { locale: localeId })}
            </div>
            <button
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className={`p-2 rounded-lg transition-colors ${
                isCurrentMonth 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-neutral-100 text-neutral-600'
              }`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-5 h-24 animate-pulse bg-white/40" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-800">Tidak ada riwayat</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Belum ada data absensi untuk bulan ini.
            </p>
          </div>
        ) : (
          <motion.div 
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {records.map((record) => {
              const dateObj = parseISO(record.check_in_at)
              const statusClass = getStatusColor(record.status as AttendanceStatus)
              
              return (
                <motion.div 
                  key={record.id}
                  variants={itemVars}
                  className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:shadow-glass-sm"
                >
                  {/* Date & Time block */}
                  <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 min-w-[120px]">
                    <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      {format(dateObj, 'EEEE', { locale: localeId })}
                    </div>
                    <div className="text-2xl font-bold text-neutral-800 font-tabular leading-none">
                      {format(dateObj, 'dd MMM')}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 mt-1">
                      <Clock size={14} className="text-primary" />
                      {format(dateObj, 'HH:mm')}
                    </div>
                  </div>

                  {/* Vertical divider (desktop only) */}
                  <div className="hidden sm:block w-px h-16 bg-neutral-200" />

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${statusClass}`}>
                        {getStatusLabel(record.status as AttendanceStatus)}
                      </span>
                      <span className="badge bg-primary-50 text-primary">
                        <Zap size={12} className="mr-1" />
                        +{record.xp_earned} XP
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      {record.location_points?.name && (
                        <div className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span className="truncate max-w-[150px]">
                            {record.location_points.name}
                          </span>
                        </div>
                      )}
                      {record.distance_meters !== null && (
                        <span>({record.distance_meters}m dari titik)</span>
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

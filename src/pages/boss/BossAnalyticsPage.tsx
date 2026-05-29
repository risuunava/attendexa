import { useState, useEffect } from 'react'
import { supabase } from '../../libs/supabase'
import PageContainer from '../../components/layout/PageContainer'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface DeptStats {
  name: string
  employeeCount: number
  avgXP: number
}

interface StatusDist {
  name: string
  value: number
  color: string
}

export default function BossAnalyticsPage() {
  const [deptStats, setDeptStats] = useState<DeptStats[]>([])
  const [statusDist, setStatusDist] = useState<StatusDist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)

    // 1. Department Stats (Employees & Avg XP)
    const { data: users } = await supabase
      .from('users')
      .select('department, total_xp')
      .eq('role', 'employee')

    if (users) {
      const deptMap = new Map<string, { totalXP: number; count: number }>()
      
      users.forEach((u) => {
        const dept = u.department || 'Belum Diatur'
        const current = deptMap.get(dept) || { totalXP: 0, count: 0 }
        deptMap.set(dept, {
          totalXP: current.totalXP + (u.total_xp || 0),
          count: current.count + 1,
        })
      })

      const dStats: DeptStats[] = Array.from(deptMap.entries()).map(([name, data]) => ({
        name,
        employeeCount: data.count,
        avgXP: Math.round(data.totalXP / data.count),
      }))

      // Sort by avg XP
      dStats.sort((a, b) => b.avgXP - a.avgXP)
      setDeptStats(dStats)
    }

    // 2. Status Distribution (Current Month)
    const monthStart = startOfMonth(new Date()).toISOString()
    const monthEnd = endOfMonth(new Date()).toISOString()
    const { data: records } = await supabase
      .from('attendance_records')
      .select('status')
      .gte('check_in_at', monthStart)
      .lte('check_in_at', monthEnd)

    if (records) {
      const counts = {
        on_time: 0,
        late: 0,
        absent: 0,
      }

      records.forEach((r) => {
        if (r.status === 'on_time') counts.on_time++
        else if (r.status === 'absent') counts.absent++
        else counts.late++
      })

      setStatusDist([
        { name: 'Tepat Waktu', value: counts.on_time, color: '#059669' }, // emerald-600
        { name: 'Terlambat', value: counts.late, color: '#D97706' }, // amber-600
        { name: 'Tidak Hadir', value: counts.absent, color: '#DC2626' }, // red-600
      ])
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 h-[400px] animate-pulse bg-white/40" />
          <div className="glass-card p-6 h-[400px] animate-pulse bg-white/40" />
        </div>
      </PageContainer>
    )
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl border border-white/50 shadow-glass-sm">
          <p className="font-semibold text-neutral-800 mb-2">{label}</p>
          {payload.map((p: any) => (
            <p key={p.dataKey} className="text-sm font-medium" style={{ color: p.color }}>
              {p.name}: {p.value} {p.name === 'Rata-rata XP' ? 'XP' : 'Orang'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Analisis data kehadiran dan performa departemen bulan {format(new Date(), 'MMMM yyyy', { locale: localeId })}.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dept Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
              <BarChart3 size={20} className="text-primary" />
              Performa per Departemen
            </h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={customTooltip} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar
                    yAxisId="left"
                    dataKey="employeeCount"
                    name="Jml Karyawan"
                    fill="#0EA5E9"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="avgXP"
                    name="Rata-rata XP"
                    fill="#7C3AED"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
              <PieChartIcon size={20} className="text-primary" />
              Distribusi Kehadiran
            </h2>
            <div className="h-[300px] flex items-center justify-center">
              {statusDist.every(s => s.value === 0) ? (
                <p className="text-neutral-500 text-sm">Belum ada data absensi bulan ini.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {statusDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </PageContainer>
  )
}

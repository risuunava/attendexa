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
        <div className="bg-white p-4 border-2 border-neutral-800 shadow-[4px_4px_0px_0px_#1F2937] rounded-none">
          <p className="font-bold text-neutral-900 mb-2 font-mono uppercase">{label}</p>
          {payload.map((p: any) => (
            <p key={p.dataKey} className="text-sm font-bold font-mono" style={{ color: p.color }}>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dept Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 lg:col-span-2 flex flex-col"
          >
            <h2 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
              <BarChart3 size={20} className="text-primary" />
              Performa per Departemen
            </h2>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptStats} margin={{ top: 20, right: 20, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#1F2937', fontWeight: 'bold' }}
                    axisLine={{ stroke: '#1F2937', strokeWidth: 2 }}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    dy={10}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: '#1F2937', fontWeight: 'bold' }}
                    axisLine={{ stroke: '#1F2937', strokeWidth: 2 }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#1F2937', fontWeight: 'bold' }}
                    axisLine={{ stroke: '#1F2937', strokeWidth: 2 }}
                    tickLine={false}
                  />
                  <Tooltip cursor={{ fill: '#1F2937', opacity: 0.05 }} content={customTooltip} />
                  <Legend verticalAlign="top" height={40} wrapperStyle={{ paddingBottom: '20px', fontWeight: 'bold', color: '#1F2937' }} />
                  <Bar
                    yAxisId="left"
                    dataKey="employeeCount"
                    name="Jml Karyawan"
                    fill="#0EA5E9"
                    stroke="#1F2937"
                    strokeWidth={2}
                    radius={[0, 0, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="avgXP"
                    name="Rata-rata XP"
                    fill="#7C3AED"
                    stroke="#1F2937"
                    strokeWidth={2}
                    radius={[0, 0, 0, 0]}
                    maxBarSize={40}
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
            className="glass-card p-6 lg:col-span-1 flex flex-col"
          >
            <h2 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
              <PieChartIcon size={20} className="text-primary" />
              Distribusi Kehadiran
            </h2>
            <div className="h-[400px] flex items-center justify-center w-full">
              {statusDist.every(s => s.value === 0) ? (
                <p className="text-neutral-500 text-sm font-bold">Belum ada data absensi bulan ini.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={130}
                      paddingAngle={0}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      stroke="#1F2937"
                      strokeWidth={2}
                    >
                      {statusDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#1F2937" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#FFFFFF',
                        border: '2px solid #1F2937',
                        borderRadius: '0',
                        boxShadow: '4px 4px 0px 0px #1F2937',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}
                    />
                    <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontWeight: 'bold', color: '#1F2937' }} />
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

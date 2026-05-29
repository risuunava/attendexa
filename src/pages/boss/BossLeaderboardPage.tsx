import { useState, useEffect } from 'react'
import { supabase } from '../../libs/supabase'
import { getXPLevel, type XPLevel } from '../../lib/xpCalculator'
import PageContainer from '../../components/layout/PageContainer'
import { Trophy, Medal, Crown, Flame, Filter, Search } from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import clsx from 'clsx'

interface LeaderboardUser {
  id: string
  full_name: string
  department: string | null
  avatar_url: string | null
  total_xp: number
  monthly_xp: number
  streak_days: number
  rank?: number
}

type TabType = 'monthly' | 'all_time'

const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVars: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 200 } },
}

export default function BossLeaderboardPage() {
  const [tab, setTab] = useState<TabType>('monthly')
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [departments, setDepartments] = useState<string[]>([])

  useEffect(() => {
    fetchLeaderboard(tab)
  }, [tab])

  const fetchLeaderboard = async (currentTab: TabType) => {
    setLoading(true)
    const orderColumn = currentTab === 'monthly' ? 'monthly_xp' : 'total_xp'

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, department, avatar_url, total_xp, monthly_xp, streak_days')
      .eq('role', 'employee') // Only employees on leaderboard
      .order(orderColumn, { ascending: false })

    if (!error && data) {
      // Add rank number based on sorted data
      const ranked = data.map((u, i) => ({ ...u, rank: i + 1 }))
      setUsers(ranked)

      // Extract unique departments for filter
      const depts = new Set<string>()
      data.forEach(u => {
        if (u.department) depts.add(u.department)
      })
      setDepartments(Array.from(depts).sort())
    }
    setLoading(false)
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shadow-sm">
            <Crown className="w-5 h-5 text-yellow-500" />
          </div>
        )
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center shadow-sm">
            <Medal className="w-5 h-5 text-neutral-500" />
          </div>
        )
      case 3:
        return (
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shadow-sm">
            <Medal className="w-5 h-5 text-orange-600" />
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 flex items-center justify-center text-neutral-500 font-bold font-tabular">
            #{rank}
          </div>
        )
    }
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === 'all' || u.department === deptFilter
    return matchSearch && matchDept
  })

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4"
          >
            <Trophy className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-neutral-800">Global Leaderboard</h1>
          <p className="text-sm text-neutral-500 mt-2">
            Peringkat seluruh karyawan berdasarkan poin XP kehadiran.
          </p>
        </div>

        {/* Filters and Tabs Row */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 p-3 rounded-2xl border border-white/60 shadow-sm backdrop-blur-md">
          <div className="flex flex-1 w-full gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari karyawan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border-none bg-white/80 focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-xl border-none bg-white/80 focus:ring-2 focus:ring-primary/20 text-sm appearance-none cursor-pointer"
              >
                <option value="all">Semua Dept</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="glass-card-sm p-1 flex items-center w-full md:w-auto">
            <button
              onClick={() => setTab('monthly')}
              className={clsx(
                'flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-semibold transition-all',
                tab === 'monthly'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setTab('all_time')}
              className={clsx(
                'flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-semibold transition-all',
                tab === 'all_time'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              Semua Waktu
            </button>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              Tidak ada data yang cocok dengan filter.
            </div>
          ) : (
            <motion.div
              variants={containerVars}
              initial="hidden"
              animate="show"
              className="divide-y divide-neutral-100/50"
            >
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((u, index) => {
                  const level: XPLevel = getXPLevel(u.total_xp)
                  const xpDisplay = tab === 'monthly' ? u.monthly_xp : u.total_xp
                  const actualRank = u.rank || index + 1 // Use calculated global rank

                  return (
                    <motion.div
                      key={u.id}
                      variants={itemVars}
                      layout
                      className="p-4 flex items-center gap-4 transition-colors hover:bg-white/40"
                    >
                      {/* Rank */}
                      <div className="w-10 shrink-0 flex justify-center">
                        {getRankBadge(actualRank)}
                      </div>

                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm overflow-hidden">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            u.full_name?.charAt(0)?.toUpperCase() || 'U'
                          )}
                        </div>
                        {u.streak_days >= 5 && (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                            <div className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center">
                              <Flame className="w-3 h-3 text-orange-500" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Name & Dept */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-neutral-800 truncate">
                            {u.full_name || 'Tanpa Nama'}
                          </p>
                        </div>
                        <p className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                          <span>{u.department || 'Belum ada dept'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {level.emoji} {level.name}
                          </span>
                        </p>
                      </div>

                      {/* XP & Stats */}
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary font-tabular">
                          {xpDisplay} <span className="text-xs text-primary/70 font-semibold">XP</span>
                        </p>
                        <p className="text-xs font-medium text-neutral-500 mt-0.5">
                          🔥 {u.streak_days} hari streak
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

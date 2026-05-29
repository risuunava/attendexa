import { useState, useEffect } from 'react'
import { supabase } from '../../libs/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { getXPLevel, type XPLevel } from '../../lib/xpCalculator'
import PageContainer from '../../components/layout/PageContainer'
import { Trophy, Medal, Crown, Star, Flame } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVars = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 200 } },
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabType>('monthly')
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

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
      .limit(10)

    if (!error && data) {
      // Add rank number
      const ranked = data.map((u, i) => ({ ...u, rank: i + 1 }))
      setUsers(ranked)
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

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4"
          >
            <Trophy className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-neutral-800">Leaderboard</h1>
          <p className="text-sm text-neutral-500 mt-2">
            Peringkat karyawan berdasarkan poin XP kehadiran.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="glass-card-sm p-1 inline-flex">
            <button
              onClick={() => setTab('monthly')}
              className={clsx(
                'px-6 py-2 rounded-xl text-sm font-semibold transition-all',
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
                'px-6 py-2 rounded-xl text-sm font-semibold transition-all',
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
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              Belum ada data karyawan.
            </div>
          ) : (
            <motion.div
              variants={containerVars}
              initial="hidden"
              animate="show"
              className="divide-y divide-neutral-100/50"
            >
              <AnimatePresence mode="popLayout">
                {users.map((u) => {
                  const level: XPLevel = getXPLevel(u.total_xp)
                  const xpDisplay = tab === 'monthly' ? u.monthly_xp : u.total_xp
                  const isMe = u.id === user?.id

                  return (
                    <motion.div
                      key={u.id}
                      variants={itemVars}
                      layout
                      className={clsx(
                        'p-4 flex items-center gap-4 transition-colors',
                        isMe ? 'bg-primary-50/50' : 'hover:bg-white/40'
                      )}
                    >
                      {/* Rank */}
                      <div className="w-10 shrink-0 flex justify-center">
                        {getRankBadge(u.rank!)}
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
                          {isMe && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-white uppercase tracking-wider">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-neutral-500 truncate">
                            {u.department || 'Employee'}
                          </p>
                          <span className="text-neutral-300 text-[10px]">•</span>
                          <span className="text-xs font-medium text-neutral-600 flex items-center gap-1">
                            {level.emoji} {level.name}
                          </span>
                        </div>
                      </div>

                      {/* XP Points */}
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-primary">
                          <Star className="w-4 h-4 fill-primary" />
                          <span className="text-lg font-bold font-tabular">
                            {xpDisplay}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                          XP
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

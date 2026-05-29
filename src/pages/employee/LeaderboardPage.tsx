import { useState, useEffect } from 'react'
import { supabase } from '../../libs/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { getXPLevel, type XPLevel } from '../../lib/xpCalculator'
import PageContainer from '../../components/layout/PageContainer'
import { Trophy, Medal, Crown, Flame } from 'lucide-react'
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
      .eq('role', 'employee')
      .order(orderColumn, { ascending: false })
      .limit(10)

    if (!error && data) {
      const ranked = data.map((u, i) => ({ ...u, rank: i + 1 }))
      setUsers(ranked)
    }
    setLoading(false)
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-7 h-7 rounded-full bg-yellow-50 flex items-center justify-center">
            <Crown className="w-4 h-4 text-yellow-500" />
          </div>
        )
      case 2:
        return (
          <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center">
            <Medal className="w-4 h-4 text-neutral-500" />
          </div>
        )
      case 3:
        return (
          <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center">
            <Medal className="w-4 h-4 text-orange-500" />
          </div>
        )
      default:
        return (
          <div className="w-7 h-7 flex items-center justify-center text-neutral-400 text-sm font-semibold font-tabular">
            {rank}
          </div>
        )
    }
  }

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
            <Trophy size={20} className="text-primary" />
            Leaderboard
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Peringkat karyawan berdasarkan poin XP kehadiran.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
          <button
            onClick={() => setTab('monthly')}
            className={clsx(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
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
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              tab === 'all_time'
                ? 'bg-white text-primary shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            )}
          >
            Semua Waktu
          </button>
        </div>

        {/* Leaderboard List */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-neutral-500 text-sm">
              Belum ada data karyawan.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {users.map((u) => {
                const level: XPLevel = getXPLevel(u.total_xp)
                const xpDisplay = tab === 'monthly' ? u.monthly_xp : u.total_xp
                const isMe = u.id === user?.id

                return (
                  <div
                    key={u.id}
                    className={clsx(
                      'px-4 py-3 flex items-center gap-3 transition-colors',
                      isMe ? 'bg-primary-50/40' : 'hover:bg-neutral-50/50'
                    )}
                  >
                    {/* Rank */}
                    <div className="w-8 shrink-0 flex justify-center">
                      {getRankBadge(u.rank!)}
                    </div>

                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold shrink-0 overflow-hidden">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          u.full_name?.charAt(0)?.toUpperCase() || 'U'
                        )}
                      </div>
                      {u.streak_days >= 5 && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-orange-50 border border-white rounded-full flex items-center justify-center">
                          <Flame className="w-2.5 h-2.5 text-orange-500" />
                        </div>
                      )}
                    </div>

                    {/* Name & Dept */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-neutral-800 truncate">
                          {u.full_name || 'Tanpa Nama'}
                        </p>
                        {isMe && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary text-white">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {u.department || 'Employee'} · {level.name}
                      </p>
                    </div>

                    {/* XP */}
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-neutral-800 font-tabular">
                        {xpDisplay}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-medium">XP</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

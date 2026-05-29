import { useAuth } from '../../contexts/AuthContext'
import { getXPLevel } from '../../lib/xpCalculator'
import PageContainer from '../../components/layout/PageContainer'
import { motion } from 'framer-motion'
import { User, Building, Flame, Zap, Award, Star, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function ProfilePage() {
  const { profile } = useAuth()

  if (!profile) return null

  const level = getXPLevel(profile.total_xp)
  const nextLevel = getXPLevel(level.maxXP + 1)
  const xpProgress =
    level.maxXP === 99999
      ? 100
      : ((profile.total_xp - level.minXP) / (level.maxXP - level.minXP + 1)) * 100

  const joinDate = format(new Date(profile.created_at), 'MMMM yyyy', { locale: localeId })

  return (
    <PageContainer>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto space-y-6"
      >
        {/* Profile Card */}
        <motion.div variants={item} className="glass-card overflow-hidden">
          {/* Cover gradient */}
          <div className="h-32 bg-gradient-to-r from-primary via-accent to-purple relative">
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity" />
          </div>
          
          <div className="px-6 pb-6 relative">
            {/* Avatar */}
            <div className="absolute -top-16 left-6">
              <div className="w-32 h-32 rounded-2xl bg-white p-2 shadow-xl">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center text-4xl font-bold text-primary overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile.full_name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="mt-20">
              <h1 className="text-2xl font-bold text-neutral-800">
                {profile.full_name || 'Karyawan Tanpa Nama'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-neutral-500">
                <div className="flex items-center gap-1.5">
                  <User size={16} />
                  {profile.employee_id || 'ID Belum Diatur'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Building size={16} />
                  {profile.department || 'Departemen Belum Diatur'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gamification Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Level Card */}
          <motion.div variants={item} className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <Award className="text-primary" /> Level & XP
              </h2>
              <span className="text-3xl">{level.emoji}</span>
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-neutral-500 mb-1">Total XP Anda</p>
              <div className="flex items-center justify-center gap-2">
                <Star className="w-6 h-6 fill-primary text-primary" />
                <span className="text-4xl font-bold text-neutral-800 font-tabular">
                  {profile.total_xp}
                </span>
              </div>
              <p className="text-sm font-semibold text-primary mt-2">
                Tier: {level.name}
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-500 mb-2">
                <span>Progress ke {nextLevel.name}</span>
                <span className="font-tabular">{Math.round(xpProgress)}%</span>
              </div>
              <div className="xp-bar h-2.5">
                <motion.div
                  className="xp-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </div>
              <div className="text-center mt-3 text-xs text-neutral-400">
                Butuh {level.maxXP === 99999 ? 0 : level.maxXP - profile.total_xp + 1} XP lagi untuk naik level
              </div>
            </div>
          </motion.div>

          {/* Stats Highlight */}
          <motion.div variants={item} className="flex flex-col gap-4">
            {/* Streak */}
            <div className="glass-card flex-1 p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <p className="text-sm text-neutral-500 mb-1">Streak Saat Ini</p>
              <p className="text-3xl font-bold text-neutral-800 font-tabular mb-1">
                {profile.streak_days} <span className="text-lg text-neutral-500 font-medium">Hari</span>
              </p>
              <p className="text-xs text-neutral-400">Absen tepat waktu berturut-turut</p>
            </div>

            {/* Monthly XP */}
            <div className="glass-card flex-1 p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-purple" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">XP Bulan Ini</p>
                <p className="text-2xl font-bold text-neutral-800 font-tabular">
                  {profile.monthly_xp}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Info */}
        <motion.div variants={item} className="glass-card p-6">
          <h3 className="text-sm font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-neutral-500" />
            Informasi Tambahan
          </h3>
          <div className="divide-y divide-neutral-100 text-sm">
            <div className="flex justify-between py-3">
              <span className="text-neutral-500">Role Sistem</span>
              <span className="font-medium text-neutral-800 capitalize">{profile.role}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-neutral-500">Bergabung Sejak</span>
              <span className="font-medium text-neutral-800">{joinDate}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  )
}

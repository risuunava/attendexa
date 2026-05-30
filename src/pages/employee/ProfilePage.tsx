import { useAuth } from '../../contexts/AuthContext'
import { getXPLevel } from '../../lib/xpCalculator'
import PageContainer from '../../components/layout/PageContainer'
import { motion } from 'framer-motion'
import { User, Building, Flame, Zap, Award, Star, CalendarDays, Camera, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import ImageCropModal from '../../components/ui/ImageCropModal'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20, rotate: -2 },
  show: { opacity: 1, y: 0, rotate: 0 },
}

export default function ProfilePage() {
  const { profile, uploadAvatar } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  if (!profile) return null

  // Step 1: User picks a file — read it as Data URL and open crop modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset input so same file can be chosen again
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Harap pilih file gambar (JPG/PNG).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran maksimal gambar adalah 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  // Step 2: User confirms crop — upload the resulting blob
  const handleCropConfirm = async (blob: Blob) => {
    setCropSrc(null)
    const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    setIsUploading(true)
    const { error } = await uploadAvatar(croppedFile)
    setIsUploading(false)

    if (error) {
      toast.error('Gagal mengunggah foto profil.')
    } else {
      toast.success('Foto profil berhasil diperbarui!')
    }
  }

  const level = getXPLevel(profile.total_xp)
  const nextLevel = getXPLevel(level.maxXP + 1)
  const xpProgress =
    level.maxXP === 99999
      ? 100
      : ((profile.total_xp - level.minXP) / (level.maxXP - level.minXP + 1)) * 100

  const joinDate = format(new Date(profile.created_at), 'd MMMM yyyy', { locale: localeId })

  return (
    <>
      {/* Image Crop Modal */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onCancel={() => setCropSrc(null)}
          onCropComplete={handleCropConfirm}
        />
      )}

      <PageContainer>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto space-y-8"
        >
        {/* Header Title */}
        <div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-neutral-800 tracking-tight mb-2">
            Profil <span className="text-primary italic">Karyawan</span>.
          </h1>
          <p className="text-sm font-mono text-neutral-500 uppercase tracking-widest font-bold">
            Informasi Pribadi & Pencapaian
          </p>
        </div>

        {/* Profile Identity Card (Brutalist) */}
        <motion.div variants={item} className="bg-brutalistCyan border-4 border-neutral-900 shadow-[8px_8px_0px_0px_#1F2937] p-8 relative overflow-hidden group">
          {/* Decorative shapes */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-20 rotate-12 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black opacity-10 rounded-full pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            {/* Avatar */}
            <div className="shrink-0 relative">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-32 h-32 border-4 border-neutral-900 shadow-[4px_4px_0px_0px_#1F2937] bg-brutalistYellow flex flex-col items-center justify-center text-5xl font-serif font-bold text-neutral-900 overflow-hidden transform transition-all group-hover:scale-105 group-hover:-rotate-3 hover:brightness-90 relative cursor-pointer group/avatar"
                title="Ganti Foto Profil"
              >
                {isUploading ? (
                  <Loader2 size={32} className="animate-spin text-neutral-900" />
                ) : profile.avatar_url ? (
                  <>
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                      <Camera size={32} className="text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                      <Camera size={32} className="text-neutral-900" />
                    </div>
                  </>
                )}
              </button>
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1 mt-2">
              <h2 className="text-3xl md:text-4xl font-black text-neutral-900 uppercase tracking-tight mb-4">
                {profile.full_name || 'Karyawan Tanpa Nama'}
              </h2>
              <div className="flex flex-col md:flex-row flex-wrap items-center md:items-start gap-4">
                <span className="badge bg-white text-neutral-900 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937] px-4 py-2 text-sm">
                  <User size={16} />
                  {profile.employee_id || 'ID: -'}
                </span>
                <span className="badge bg-brutalistPink text-neutral-900 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937] px-4 py-2 text-sm">
                  <Building size={16} />
                  {profile.department || 'Dept: -'}
                </span>
                <span className="badge bg-white text-neutral-900 border-neutral-900 shadow-[2px_2px_0px_0px_#1F2937] px-4 py-2 text-sm">
                  <CalendarDays size={16} />
                  Join: {joinDate}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gamification Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Level & XP Card (Spans 2 columns) */}
          <motion.div variants={item} className="md:col-span-2 glass-card p-6 md:p-8 bg-brutalistWhite border-2 border-neutral-900 shadow-[6px_6px_0px_0px_#1F2937] rounded-none">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-8 gap-4">
              <div className="text-center md:text-left">
                <p className="font-mono text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center justify-center md:justify-start gap-2">
                  <Award size={14} className="text-primary" /> Level Saat Ini
                </p>
                <h3 className="font-serif text-4xl font-bold text-neutral-900 flex items-center justify-center md:justify-start gap-3">
                  {level.name}
                  <span className="text-3xl">{level.emoji}</span>
                </h3>
              </div>
              <div className="text-center md:text-right border-4 border-neutral-900 p-3 bg-brutalistYellow shadow-[4px_4px_0px_0px_#1F2937] transform rotate-2 hover:rotate-0 transition-transform">
                <p className="font-mono text-[10px] font-bold text-neutral-800 uppercase tracking-widest mb-1">Total XP</p>
                <div className="flex items-center justify-center md:justify-end gap-1 text-3xl font-black text-neutral-900 font-tabular">
                  <Zap size={24} className="fill-neutral-900" />
                  {profile.total_xp}
                </div>
              </div>
            </div>

            <div className="bg-neutral-100 border-2 border-neutral-900 p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex justify-between text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3">
                  <span>Progress ke {nextLevel.name}</span>
                  <span className="font-tabular">{Math.round(xpProgress)}%</span>
                </div>
                <div className="h-4 bg-white border-2 border-neutral-900 rounded-none overflow-hidden relative">
                  <motion.div
                    className="absolute top-0 bottom-0 left-0 bg-primary border-r-2 border-neutral-900"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                  >
                    <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)' }} />
                  </motion.div>
                </div>
                <div className="text-center mt-3 text-xs font-mono font-bold text-neutral-500">
                  Butuh {level.maxXP === 99999 ? 0 : level.maxXP - profile.total_xp + 1} XP lagi untuk naik level!
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Highlight Column */}
          <div className="flex flex-col gap-6">
            {/* Streak Card */}
            <motion.div variants={item} className="flex-1 bg-orange-400 border-2 border-neutral-900 shadow-[6px_6px_0px_0px_#1F2937] p-6 flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-orange-500 transition-colors">
              <div className="w-16 h-16 border-4 border-neutral-900 bg-white flex items-center justify-center mb-4 transform -rotate-6 group-hover:rotate-6 transition-transform shadow-[4px_4px_0px_0px_#1F2937]">
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
              <p className="font-mono text-xs font-bold text-neutral-900 uppercase tracking-widest mb-1">Streak Harian</p>
              <p className="text-4xl font-black text-white font-tabular drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                {profile.streak_days} <span className="text-lg font-bold">Hari</span>
              </p>
            </motion.div>

            {/* Monthly XP Card */}
            <motion.div variants={item} className="flex-1 bg-purple-400 border-2 border-neutral-900 shadow-[6px_6px_0px_0px_#1F2937] p-6 flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-purple-500 transition-colors">
              <div className="w-16 h-16 border-4 border-neutral-900 bg-white flex items-center justify-center mb-4 transform rotate-6 group-hover:-rotate-6 transition-transform shadow-[4px_4px_0px_0px_#1F2937]">
                <Star className="w-8 h-8 text-purple-500 fill-purple-500" />
              </div>
              <p className="font-mono text-xs font-bold text-neutral-900 uppercase tracking-widest mb-1">XP Bulan Ini</p>
              <p className="text-4xl font-black text-white font-tabular drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                {profile.monthly_xp}
              </p>
            </motion.div>
          </div>
        </div>

      </motion.div>
    </PageContainer>
    </>
  )
}

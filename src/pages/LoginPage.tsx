import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth, type UserRole } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface LoginFormData {
  email: string
  password: string
}

export default function LoginPage() {
  const { signIn, user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  // If already logged in, redirect
  if (!authLoading && user && profile) {
    const dashboardMap: Record<UserRole, string> = {
      employee: '/dashboard',
      admin: '/admin/dashboard',
      boss: '/boss/dashboard',
    }
    return <Navigate to={dashboardMap[profile.role]} replace />
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    const { error } = await signIn(data.email, data.password)
    setIsLoading(false)

    if (error) {
      toast.error(
        error.message === 'Invalid login credentials'
          ? 'Email atau password salah.'
          : error.message,
        { duration: 4000 }
      )
    } else {
      toast.success('Login berhasil! Mengalihkan...', { duration: 2000 })
      // Navigate will happen via auth state change redirect above
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-blue-50 to-neutral-50 px-4 py-8 relative overflow-hidden">
      <Toaster position="top-center" />

      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-primary-lg mb-5">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">
            Attend<span className="text-gradient">exa</span>
          </h1>
          <p className="text-neutral-500 mt-2 text-sm">
            Sistem Absensi Digital dengan Gamifikasi
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass-card p-8"
        >
          <h2 className="text-xl font-semibold text-neutral-800 mb-1">
            Selamat Datang!
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Masuk ke akun Anda untuk mulai absensi
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-neutral-700 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="nama@perusahaan.com"
                  className={`input-field pl-11 ${
                    errors.email ? 'border-danger focus:ring-danger/30' : ''
                  }`}
                  {...register('email', {
                    required: 'Email harus diisi',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Format email tidak valid',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-danger text-xs mt-1.5">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-neutral-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input-field pl-11 pr-11 ${
                    errors.password ? 'border-danger focus:ring-danger/30' : ''
                  }`}
                  {...register('password', {
                    required: 'Password harus diisi',
                    minLength: {
                      value: 6,
                      message: 'Password minimal 6 karakter',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-danger text-xs mt-1.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full text-base py-3.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Masuk...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-neutral-400 mt-6"
        >
          © {new Date().getFullYear()} Attendexa • Absensi Digital dengan Gamifikasi
        </motion.p>
      </motion.div>
    </div>
  )
}

import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, type UserRole } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { Zap, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface LoginFormData {
  email: string
  password: string
}

export default function LoginPage() {
  const { signIn, user, profile, loading: authLoading, authError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  // If already logged in, redirect
  if (!authLoading && user) {
    if (profile) {
      const dashboardMap: Record<UserRole, string> = {
        employee: '/dashboard',
        admin: '/admin/dashboard',
        boss: '/boss/dashboard',
      }
      return <Navigate to={dashboardMap[profile.role]} replace />
    } else {
      // User is logged in but no profile yet, let RootRedirect handle it (error screen)
      return <Navigate to="/" replace />
    }
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const { error } = await signIn(data.email, data.password)

      if (error) {
        toast.error(
          error.message === 'Invalid login credentials'
            ? 'Email atau password salah.'
            : error.message,
          { duration: 4000 }
        )
      } else {
        toast.success('Login berhasil! Mengalihkan...', { duration: 2000 })
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan jaringan saat login.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-neutral-800 tracking-tight">
            Attend<span className="text-primary italic">exa</span>
          </h1>
          <p className="text-neutral-500 mt-1 text-sm">
            Sistem Absensi Digital dengan Gamifikasi
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-7">
          <h2 className="font-serif text-2xl font-bold text-neutral-800 mb-1">Masuk</h2>
          <p className="text-sm text-neutral-500 mb-6">
            Masukkan kredensial Anda untuk melanjutkan
          </p>

          {authError && (
            <div className="mb-5 p-3 rounded-xl bg-danger-light border border-danger/20 flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 text-danger mt-0.5" />
              <div>
                <p className="text-sm font-medium text-danger">Terjadi Kesalahan</p>
                <p className="text-xs text-danger/80 mt-0.5">{authError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-neutral-700 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="nama@perusahaan.com"
                  className={`input-field pl-10 ${
                    errors.email ? 'border-danger focus:ring-danger/20' : ''
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
                <p className="text-danger text-xs mt-1">{errors.email.message}</p>
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
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input-field pl-10 pr-10 ${
                    errors.password ? 'border-danger focus:ring-danger/20' : ''
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-danger text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Masuk...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400 mt-6">
          © {new Date().getFullYear()} Attendexa
        </p>
      </div>
    </div>
  )
}

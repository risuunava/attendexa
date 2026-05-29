import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../libs/supabase'

export type UserRole = 'employee' | 'admin' | 'boss'

export interface UserProfile {
  id: string
  full_name: string
  employee_id: string | null
  role: UserRole
  department: string | null
  avatar_url: string | null
  total_xp: number
  monthly_xp: number
  streak_days: number
  created_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  authError: string | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: UserRole
  ) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  
  // Timeout fallback to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.error("AuthContext loading timeout reached (15s). Force stopping loader.");
        setLoading(false);
        setAuthError("Koneksi server lambat. Silakan refresh halaman atau login ulang.");
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Fetch user profile from the `users` table
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setAuthError(`Profil tidak ditemukan: ${error.message}`)
        return null
      }
      setAuthError(null)
      return data as UserProfile
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
      setAuthError('Terjadi kesalahan saat mengambil profil.')
      return null
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      const p = await fetchProfile(user.id)
      setProfile(p)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    let isMounted = true

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!isMounted) return

      setSession(s)
      setUser(s?.user ?? null)

      if (s?.user) {
        const p = await fetchProfile(s.user.id)
        if (isMounted) {
          setProfile(p)
          setLoading(false)
        }
      } else {
        if (isMounted) {
          setLoading(false)
        }
      }
    }).catch((err) => {
      console.error("Critical error in getSession:", err)
      if (isMounted) {
        setAuthError(`Gagal memuat sesi: ${err.message || 'Unknown error'}`)
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      console.log("Auth state changed:", event, s?.user?.id)
      if (!isMounted) return

      // Prevent premature redirects by setting loading state
      setLoading(true)

      setSession(s)
      setUser(s?.user ?? null)

      if (s?.user) {
        // Use fire-and-forget to avoid deadlocking Supabase GoTrue client
        fetchProfile(s.user.id).then((p) => {
          if (isMounted) {
            setProfile(p)
            setLoading(false)
          }
        })
      } else {
        if (isMounted) {
          setProfile(null)
          setLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error: error as Error | null }
    } catch (err: any) {
      console.error('SignIn exception:', err)
      return { error: err as Error }
    }
  }, [])

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      role: UserRole = 'employee'
    ) => {
      setAuthError(null)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      })
      return { error: error as Error | null }
    },
    []
  )

  const signOut = useCallback(async () => {
    // Clear local state immediately so UI reacts instantly
    setUser(null)
    setSession(null)
    setProfile(null)
    setAuthError(null)

    // Call Supabase signout in the background
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error during Supabase signout:', error)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        authError,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

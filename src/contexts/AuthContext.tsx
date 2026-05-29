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
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!isMounted) return

      setSession(s)
      setUser(s?.user ?? null)

      if (s?.user) {
        const p = await fetchProfile(s.user.id)
        if (isMounted) setProfile(p)
      } else {
        setProfile(null)
      }
      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error as Error | null }
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
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setAuthError(null)
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

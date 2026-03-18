import React, { createContext, useState, useContext, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser]                   = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [authError, setAuthError]         = useState(null)

  // Carrega o perfil do banco e atualiza o estado
  const loadProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error || !profile) {
        // Perfil ainda não foi criado pelo trigger (raro, mas possível em testes)
        setUser({ id: authUser.id, email: authUser.email, full_name: authUser.email, role: 'agent' })
      } else {
        setUser({ ...profile, created_date: profile.created_at, updated_date: profile.updated_at })
      }
      setIsAuthenticated(true)
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
    } finally {
      setIsLoadingAuth(false)
    }
  }

  useEffect(() => {
    // Verifica sessão existente ao montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user)
      } else {
        setIsLoadingAuth(false)
      }
    })

    // Escuta mudanças de autenticação (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user)
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setIsLoadingAuth(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    setAuthError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : error.message
      setAuthError({ type: 'login_failed', message: msg })
      throw new Error(msg)
    }
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: {},
      login,
      logout,
      navigateToLogin: () => {},
      checkAuth: () => supabase.auth.getSession(),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

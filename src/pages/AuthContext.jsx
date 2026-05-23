// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { getAppUserByUid } from '../firebase/services'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      if (!currentUser) {
        setUserProfile(null)
        setProfileLoading(false)
        return
      }

      setProfileLoading(true)
      try {
        const profile = await getAppUserByUid(currentUser.uid)
        if (!isMounted) return
        setUserProfile(profile || null)
        if (profile?.active === false) {
          await signOut(auth)
        }
      } catch (error) {
        console.error('Error loading app user profile:', error)
        if (!isMounted) return
        setUserProfile(null)
      } finally {
        if (isMounted) {
          setProfileLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [currentUser])

  const allowedRoutes = userProfile?.active === false
    ? []
    : userProfile?.role === 'limited'
      ? (Array.isArray(userProfile.allowedRoutes) ? userProfile.allowedRoutes : [])
      : null

  const canAccessPath = (pathname) => {
    // Always allow access to Sales History for all accounts so shared POS users
    // can view their own shop's history without requiring a DB migration.
    if (pathname === '/sales-history') return true

    if (!allowedRoutes || allowedRoutes.length === 0) {
      return true
    }

    return allowedRoutes.includes(pathname)
  }

  const homeRoute = userProfile?.active === false
    ? '/login'
    : allowedRoutes && allowedRoutes.length > 0
    ? allowedRoutes[0]
    : '/dashboard'

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const value = {
    currentUser,
    userProfile,
    role: userProfile?.role || 'admin',
    allowedRoutes,
    canAccessPath,
    homeRoute,
    profileLoading,
    logout,
    isAuthenticated: !!currentUser
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && !profileLoading && children}
    </AuthContext.Provider>
  )
}
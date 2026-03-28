"use client"

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUser, logout, setLoading } from '@/features/auth/redux'
import { getSession } from '@/features/auth/redux'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()

  useEffect(() => {
    const initializeAuth = async () => {
      dispatch(setLoading(true))
      
      try {
        const { user } = await getSession()
        
        if (user) {
          dispatch(setUser(user))
        } else {
          dispatch(logout())
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        dispatch(logout())
      } finally {
        dispatch(setLoading(false))
      }
    }

    initializeAuth()
  }, [dispatch])

  return <>{children}</>
}

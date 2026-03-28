"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { getKiteLoginUrl, kiteStatus, kiteTokenInfo } from '@/features/integrations/apis/integrations-api'

type KiteConnectionState = {
  loading: boolean
  connected: boolean
  session?: any
  error?: string
  source?: 'token' | 'status'
}

/**
 * Hook to check/poll current user's Kite connection status.
 * Uses cookie auth; backend at the configured FASTAPI_URL.
 * Polls by default while not connected when `shouldPoll` is true.
 */
export function useKiteConnection({ shouldPoll = false, intervalMs = 1500 } = {}) {
  const [state, setState] = useState<KiteConnectionState>({ loading: true, connected: false })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const checkOnce = async () => {
    try {
      const res = await kiteTokenInfo()
      if (res?.connected) {
        setState({ loading: false, connected: true, session: res?.session, source: 'token' })
        return true
      }
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message || 'Failed to get token info' }))
    }

    try {
      const statusRes = await kiteStatus()
      if (statusRes?.connected) {
        setState((s) => ({ ...s, loading: false, connected: true, source: 'status' }))
        return true
      }
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: s.error || e?.message || 'Failed to get status' }))
    }

    return false
  }

  useEffect(() => {
    let mounted = true
    const start = async () => {
      const isConnected = await checkOnce()
      if (!mounted) return

      if (shouldPoll && !isConnected) {
        timerRef.current = setInterval(checkOnce, intervalMs)
      }
    }
    start()
    return () => {
      mounted = false
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [shouldPoll, intervalMs])

  const actions = useMemo(() => ({
    getLoginUrl: () => getKiteLoginUrl(),
    refresh: () => checkOnce(),
  }), [])

  return { ...state, ...actions }
}

export default useKiteConnection

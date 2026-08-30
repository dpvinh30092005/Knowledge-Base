import { useCallback, useEffect, useState } from 'react'
import { portfolioApi, type GithubLinkState } from '@/features/shared/portfolio/api/portfolioApi'
import { GH_LINK_STATE_KEY, GH_LINK_RETURN_KEY } from '@/features/shared/portfolio/components/GithubLinkCallback'
import { toast } from '@/lib/toast'

/**
 * The student's GitHub connection: who is linked, and how to connect, disconnect or switch.
 *
 * Shared so the portfolio sync picker and the profile settings page cannot drift into two
 * different ideas of what "connected" means — and so the disconnect-then-reconnect dance
 * behind "change account" is written once.
 */
export function useGithubLink() {
  const [link, setLink] = useState<GithubLinkState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setLink(await portfolioApi.getGithubLinkStatus())
    } catch {
      // Non-fatal: callers render their own "not connected" state rather than an error.
      setLink(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  /** Hands off to GitHub. Returns only if the handoff failed. */
  const connect = useCallback(async () => {
    setIsBusy(true)
    try {
      const { authorizeUrl, state } = await portfolioApi.linkGithubStart()
      sessionStorage.setItem(GH_LINK_STATE_KEY, state)
      // Come back to wherever the student started, so this works from any page.
      sessionStorage.setItem(GH_LINK_RETURN_KEY, window.location.pathname + window.location.search)
      window.location.href = authorizeUrl
    } catch {
      toast.error('Could not start GitHub connection. Please try again.')
      setIsBusy(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    setIsBusy(true)
    try {
      setLink(await portfolioApi.unlinkGithub())
      toast.success('GitHub account disconnected.')
      return true
    } catch {
      toast.error('Could not disconnect GitHub. Please try again.')
      return false
    } finally {
      setIsBusy(false)
    }
  }, [])

  /**
   * Unlink then reconnect. The unlink revokes the authorization itself rather than just our
   * token, which is what makes GitHub show its account chooser again instead of silently
   * reconnecting the account the student is trying to leave.
   */
  const changeAccount = useCallback(async () => {
    setIsBusy(true)
    try {
      await portfolioApi.unlinkGithub()
      await connect()
    } catch {
      toast.error('Could not switch GitHub accounts. Please try again.')
      setIsBusy(false)
    }
  }, [connect])

  return { link, isLoading, isBusy, refresh, connect, disconnect, changeAccount }
}

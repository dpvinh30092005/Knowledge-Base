import { useState } from 'react'
import { ArrowSquareOut, GithubLogo } from '@phosphor-icons/react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { useGithubLink } from '@/features/shared/portfolio/hooks/useGithubLink'

interface GithubConnectionFieldProps {
  /** The stored profile URL. Falls back to the linked login when the record predates it. */
  profileUrl?: string
}

/**
 * The GitHub profile row in settings.
 *
 * It used to be a free-text URL box, which asked the student to transcribe something the
 * app can read for itself and accepted anything they typed. Connecting is now the same
 * authorization the portfolio sync uses, so one act both proves the account and fills the
 * profile link.
 */
export default function GithubConnectionField({ profileUrl }: GithubConnectionFieldProps) {
  const { link, isLoading, isBusy, connect, disconnect, changeAccount } = useGithubLink()
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)

  const linked = Boolean(link?.linked)
  const login = link?.githubLogin
  const url = profileUrl || (login ? `https://github.com/${login}` : undefined)

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 font-medium text-slate-700">
        <GithubLogo size={16} className="text-emerald-600" />
        GitHub Profile
      </div>

      {isLoading ? (
        <div className="flex h-[50px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[13.5px] text-slate-400">
          <Loader2 size={15} className="animate-spin" />
          Checking connection…
        </div>
      ) : !linked ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-[13.5px] text-slate-500">Not connected yet.</p>
          <Button variant="brand" size="sm" disabled={isBusy} onClick={connect} className="gap-1.5">
            {isBusy ? <Loader2 size={14} className="animate-spin" /> : <GithubLogo size={15} />}
            Connect GitHub
          </Button>
        </div>
      ) : confirmingDisconnect ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-[13px] text-slate-600">
            Disconnect{login ? ` @${login}` : ''}? Projects you already imported stay in your
            portfolio.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={isBusy}
              onClick={() => setConfirmingDisconnect(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isBusy}
              onClick={async () => {
                if (await disconnect()) setConfirmingDisconnect(false)
              }}
              className="gap-1.5"
            >
              {isBusy && <Loader2 size={13} className="animate-spin" />}
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
          <div className="min-w-0">
            {/* The URL itself is the point of this field, so it is shown and clickable
                rather than reduced to a "Connected" label. */}
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 truncate text-[13.5px] font-semibold text-emerald-700 hover:underline"
            >
              {url}
              <ArrowSquareOut size={13} className="shrink-0" />
            </a>
            {link?.repoAccess && (
              <p className="mt-0.5 text-[12px] text-slate-400">Private repositories included</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={isBusy}
              onClick={changeAccount}
              className="gap-1.5"
            >
              {isBusy ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Change
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => setConfirmingDisconnect(true)}
            >
              Disconnect
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

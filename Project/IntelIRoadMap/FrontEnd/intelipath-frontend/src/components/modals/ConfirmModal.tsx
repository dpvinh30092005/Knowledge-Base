import type { ReactNode } from 'react'
import BaseModal from './BaseModal'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** "danger" for destructive actions (red confirm), "primary" otherwise. */
  variant?: 'danger' | 'primary'
  /** Disables the buttons and shows a working state on confirm. */
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * In-app confirmation dialog. Styled to match the app's own language — soft
 * rounded card, pill buttons, quiet typography — rather than a generic
 * icon-in-a-circle alert box.
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmClasses =
    variant === 'danger'
      ? 'bg-red-500 hover:bg-red-600 shadow-[0_6px_16px_-6px_rgba(239,68,68,0.55)]'
      : 'bg-slate-900 hover:bg-slate-800 shadow-[0_6px_16px_-6px_rgba(15,15,15,0.45)]'

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={loading ? undefined : onCancel}
      hideCloseButton
      className="!max-w-[400px] !rounded-[26px] !border-black/[0.05] !shadow-[0_24px_60px_-16px_rgba(15,15,15,0.28)]"
    >
      <div className="p-7">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-slate-900">
          {title}
        </h2>
        {message && (
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500">{message}</p>
        )}

        <div className="mt-7 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full px-4 py-2.5 text-[13px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${confirmClasses}`}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </BaseModal>
  )
}

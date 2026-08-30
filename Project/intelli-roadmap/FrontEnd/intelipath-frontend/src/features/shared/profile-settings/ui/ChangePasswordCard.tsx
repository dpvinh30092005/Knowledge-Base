import { KeyRound } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Spinner
} from "@/components/ui"
import { useChangePassword } from "@/features/shared/profile-settings/model/useChangePassword"

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"

/**
 * "Change Password" row for the Account Security card, shared by every role's settings
 * page (student/mentor/counselor). Works for any account with a local password.
 */
export default function ChangePasswordCard() {
  const {
    open,
    openDialog,
    closeDialog,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    submitting,
    error,
    submit
  } = useChangePassword()

  return (
    <>
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 border border-slate-100">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <KeyRound size={13} />
            Password
          </p>
          <p className="text-[14px] font-semibold text-slate-900">••••••••</p>
        </div>
        <button
          type="button"
          onClick={openDialog}
          className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200"
        >
          Change
        </button>
      </div>

      <Dialog open={open} onOpenChange={(next) => (next ? openDialog() : closeDialog())}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new one. You'll stay signed in here, but other
              devices will be signed out.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                Current password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={fieldClass}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                New password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={fieldClass}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                Confirm new password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldClass}
                minLength={8}
                required
              />
            </div>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] font-medium text-rose-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Spinner size={16} label="Changing password" /> Changing...
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

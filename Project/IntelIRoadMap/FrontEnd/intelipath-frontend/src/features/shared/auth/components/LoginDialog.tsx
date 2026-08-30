import { useState, type ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import LoginForm from "./LoginForm"
import ForgotPasswordForm from "./ForgotPasswordForm"

interface LoginDialogProps {
  /** The control that opens the dialog — rendered as the trigger itself. */
  children: ReactNode
}

type View = "login" | "forgot-password"

/**
 * Sign-in popup. Replaces the standalone /login page so visitors can log in
 * without leaving the landing page. "Forgot password" swaps the popup's content
 * in place — it never navigates to another page.
 */
export default function LoginDialog({ children }: LoginDialogProps) {
  const [view, setView] = useState<View>("login")

  return (
    <Dialog
      onOpenChange={(open) => {
        // Always reopen on the sign-in view next time.
        if (!open) setView("login")
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
        {view === "login" ? (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl">Welcome back</DialogTitle>
              <DialogDescription>Log in to continue to InteliPath</DialogDescription>
            </DialogHeader>
            <LoginForm onForgotPassword={() => setView("forgot-password")} />
          </>
        ) : (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl">Forgot Password?</DialogTitle>
              <DialogDescription>
                Enter your registered email and we'll send you a reset link to set a new
                password.
              </DialogDescription>
            </DialogHeader>
            <ForgotPasswordForm onBack={() => setView("login")} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

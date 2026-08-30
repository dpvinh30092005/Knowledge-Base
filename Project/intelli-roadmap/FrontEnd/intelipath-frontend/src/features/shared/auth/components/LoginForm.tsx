import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useLogin } from "@/features/shared/auth"

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
      fill="currentColor"
    />
  </svg>
)

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
    <path
      d="M12 .3a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.34-1.75-1.34-1.75-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99a2.6 2.6 0 0 1 .76-1.6c-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3Z"
      fill="currentColor"
    />
  </svg>
)

interface LoginFormProps {
  /** Switch the popup to its "forgot password" view (no navigation). */
  onForgotPassword: () => void
}

/**
 * Credentials sign-in for provisioned accounts (staff and FPT students), plus the
 * OAuth providers that students from other schools use. Rendered inside LoginDialog.
 */
export default function LoginForm({ onForgotPassword }: LoginFormProps) {
  const {
    oauthError,
    username,
    setUsername,
    password,
    setPassword,
    isSigningIn,
    formError,
    handleCredentialsLogin,
    handleGoogleLogin,
    handleGithubLogin
  } = useLogin()

  const error = formError ?? (oauthError
    ? oauthError === "oauth_failed"
      ? "Authentication failed. Please try again."
      : "An error occurred during authentication."
    : undefined)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void handleCredentialsLogin()
      }}
    >
      <FieldGroup>
        <Field>
          <Button variant="outline" type="button" onClick={handleGoogleLogin}>
            <GoogleIcon />
            Continue with Google
          </Button>
          <Button variant="outline" type="button" onClick={handleGithubLogin}>
            <GithubIcon />
            Continue with GitHub
          </Button>
        </Field>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-500">Or continue with</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <Field>
          <FieldLabel htmlFor="login-username">Username</FieldLabel>
          <Input
            id="login-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={isSigningIn}
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="login-password">Password</FieldLabel>
            <button
              type="button"
              onClick={onForgotPassword}
              className="ml-auto text-xs font-medium text-slate-500 underline-offset-4 hover:underline"
            >
              Forgot your password?
            </button>
          </div>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSigningIn}
          />
        </Field>

        <Field>
          <Button type="submit" disabled={isSigningIn}>
            {isSigningIn ? "Signing in…" : "Login"}
          </Button>
          <FieldDescription className="text-center">
            Studying elsewhere? Continue with Google or GitHub instead.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}

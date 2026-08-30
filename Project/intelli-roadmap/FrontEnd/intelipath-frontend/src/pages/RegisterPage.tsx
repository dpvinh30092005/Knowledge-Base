import { AuthLayout } from '@/components'
import { RegisterForm } from "@/features/shared/auth"

export default function RegisterPage() {
  return (
    <AuthLayout view="register">
      <RegisterForm />
    </AuthLayout>
  )
}

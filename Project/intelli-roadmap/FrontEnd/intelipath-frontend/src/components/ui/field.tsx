import type { HTMLAttributes, LabelHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export const FieldGroup = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-4", className)} {...props} />
)

export const Field = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5", className)} {...props} />
)

export const FieldLabel = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn("text-xs font-semibold uppercase tracking-wide text-slate-600", className)}
    {...props}
  />
)

export const FieldDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-xs leading-5 text-slate-500", className)} {...props} />
)

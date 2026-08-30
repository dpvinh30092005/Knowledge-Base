import type { ComponentProps } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

/**
 * A dialog sits above every other overlay in the app, including the onboarding
 * shell (`z-[100]`).
 *
 * <p>At `z-50` it sat below it, and the onboarding result screen opens one: the
 * evidence nudge's "Sync from GitHub" button rendered the repository picker
 * *behind* the modal that launched it, greyed out and unclickable, with no hint
 * that the click had worked. A dialog is always the most recent thing the
 * student asked for, so it is always the thing on top.
 */
export const DialogContent = ({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-[110] bg-slate-950/45 backdrop-blur-[2px]" />
    <DialogPrimitive.Content
      className={cn(
        "fixed left-1/2 top-1/2 z-[110] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 grid h-8 w-8 cursor-pointer place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
        <X size={16} weight="bold" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
)

export const DialogHeader = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("mb-5 space-y-1.5 pr-8", className)} {...props} />
)

export const DialogTitle = ({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title className={cn("font-display text-lg font-semibold text-slate-950", className)} {...props} />
)

export const DialogDescription = ({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description className={cn("text-sm leading-6 text-slate-500", className)} {...props} />
)

export const DialogFooter = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("mt-6 flex justify-end gap-3", className)} {...props} />
)

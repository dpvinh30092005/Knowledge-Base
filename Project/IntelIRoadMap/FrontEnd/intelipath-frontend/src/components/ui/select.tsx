import { Children, isValidElement, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { CaretDown, Check } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

type Option = { value: string; label: ReactNode; group?: string }

/** Flatten <option> / <optgroup> children into a plain option list. */
function collectOptions(children: ReactNode): Option[] {
  const out: Option[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    const el = child as React.ReactElement<any>
    if (el.type === "optgroup") {
      Children.forEach(el.props.children, (opt) => {
        if (isValidElement(opt) && opt.type === "option") {
          const o = opt as React.ReactElement<any>
          out.push({ value: String(o.props.value ?? ""), label: o.props.children, group: el.props.label })
        }
      })
    } else if (el.type === "option") {
      out.push({ value: String(el.props.value ?? ""), label: el.props.children })
    }
  })
  return out
}

export interface SelectProps {
  value?: string
  onChange?: (event: { target: { value: string } }) => void
  className?: string
  /** Controls the outer wrapper width; defaults to full width. */
  wrapperClassName?: string
  disabled?: boolean
  children?: ReactNode
}

/**
 * App-wide dropdown. A fully custom control (button trigger + rendered panel) so
 * both the trigger AND the open list are styled — unlike a native <select> whose
 * option list the browser draws. Keeps the familiar API: pass <option> children,
 * `value`, and an `onChange` that receives `{ target: { value } }`.
 */
export const Select = ({ value, onChange, className, wrapperClassName, disabled, children }: SelectProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const options = useMemo(() => collectOptions(children), [children])
  const current = value ?? ""
  const selected = options.find((o) => o.value === current)
  const placeholder = options.find((o) => o.value === "")?.label

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey) }
  }, [open])

  const pick = (v: string) => { onChange?.({ target: { value: v } }); setOpen(false) }

  return (
    <div ref={ref} className={cn("relative w-full", wrapperClassName)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-white pl-3 pr-2.5 py-2 text-left text-sm text-slate-950 outline-none transition disabled:cursor-not-allowed disabled:opacity-50",
          open ? "border-indigo-500 ring-2 ring-indigo-500/15" : "border-slate-200 hover:border-slate-300",
          className,
        )}
      >
        <span className={cn("truncate", !selected?.value && "text-slate-400")}>
          {selected ? selected.label : (placeholder ?? "Select…")}
        </span>
        <CaretDown size={14} weight="bold" className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg shadow-slate-900/5">
          {options.map((opt, i) => {
            const isSelected = opt.value === current
            const showGroup = opt.group && opt.group !== options[i - 1]?.group
            return (
              <div key={`${opt.group ?? ""}-${opt.value}-${i}`}>
                {showGroup && (
                  <p className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{opt.group}</p>
                )}
                <button
                  type="button"
                  onClick={() => pick(opt.value)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
                    isSelected ? "bg-indigo-50 font-medium text-indigo-900" : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={13} weight="bold" className="shrink-0 text-indigo-600" />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

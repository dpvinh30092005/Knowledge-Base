import { useEffect, useRef, useState, type ReactNode } from "react"
import { List, X } from "@phosphor-icons/react"

export type MobileNavItem = {
  id: string
  label: string
  active?: boolean
  icon?: ReactNode
  onSelect: () => void
}

/**
 * Compact glass hamburger that reveals the primary navigation on small screens,
 * where the desktop nav pill (`hidden lg:flex`) is not rendered. Closes on select,
 * outside click, or Escape. Hidden from `lg` up so it never doubles the pill.
 */
export function MobileNavMenu({ items }: { items: MobileNavItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative lg:hidden">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/80 text-slate-800 shadow-sm backdrop-blur-md transition-colors hover:bg-white"
      >
        <span className="relative block h-5 w-5">
          <List
            size={20}
            weight="bold"
            className={`absolute inset-0 transition-all duration-300 ${
              open ? "scale-50 rotate-90 opacity-0" : "opacity-100"
            }`}
          />
          <X
            size={20}
            weight="bold"
            className={`absolute inset-0 transition-all duration-300 ${
              open ? "opacity-100" : "-rotate-90 scale-50 opacity-0"
            }`}
          />
        </span>
      </button>

      <div
        className={`absolute right-0 top-full mt-2 w-56 origin-top-right rounded-2xl border border-white/50 bg-white/80 p-1.5 shadow-[0_20px_50px_rgb(0,0,0,0.12)] backdrop-blur-xl transition-all duration-200 ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              item.onSelect()
              setOpen(false)
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-[14px] font-bold transition-colors ${
              item.active
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-700 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

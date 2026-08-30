import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronDown } from 'lucide-react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

const PANEL_W = 300
const PANEL_H = 372

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS_ABBR    = ['Su','Mo','Tu','We','Th','Fr','Sa']
const YEAR_PAGE    = 12

type DPView = 'days' | 'months' | 'years'

// ─── Props ────────────────────────────────────────────────────────────────────
interface DatePickerProps {
  /** ISO date string: "YYYY-MM-DD" */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  /** If true, prevents selecting dates in the future */
  pastOnly?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  pastOnly = false,
}: DatePickerProps) {
  const today  = new Date()
  const parsed = value ? new Date(value) : null

  const [open,       setOpen]       = useState(false)
  const [view,       setView]       = useState<DPView>('days')
  const [viewYear,   setViewYear]   = useState(parsed?.getFullYear() ?? today.getFullYear())
  const [viewMonth,  setViewMonth]  = useState(parsed?.getMonth()    ?? today.getMonth())
  const [yearOffset, setYearOffset] = useState(0)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Sync viewYear/viewMonth when value changes externally
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.getFullYear())
      setViewMonth(parsed.getMonth())
    }
  }, [value])

  // Position the (portaled) panel relative to the trigger, flipping up / clamping
  // to the viewport so it never gets clipped by a scrollable modal body.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const place = () => {
      const rect = triggerRef.current!.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < PANEL_H + 12 && rect.top > spaceBelow
      const top = openUp ? Math.max(8, rect.top - PANEL_H - 8) : rect.bottom + 8
      const left = Math.min(
        Math.max(8, rect.left),
        window.innerWidth - PANEL_W - 8,
      )
      setCoords({ top, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, view])

  // Close on outside click (accounting for the portaled panel)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
      setView('days')
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // ── Day view helpers ──────────────────────────────────────────────────────
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const dayCells    = Array.from(
    { length: firstDay + daysInMonth },
    (_, i) => (i < firstDay ? null : i - firstDay + 1)
  )

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${viewYear}-${m}-${d}`)
    setOpen(false)
    setView('days')
  }

  const isFutureDay = (day: number) => {
    if (!pastOnly) return false
    const d = new Date(viewYear, viewMonth, day)
    return d > today
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const isSelected = (d: number) =>
    !!parsed &&
    parsed.getFullYear() === viewYear &&
    parsed.getMonth()    === viewMonth &&
    parsed.getDate()     === d

  const isToday = (d: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth()    === viewMonth &&
    today.getDate()     === d

  // ── Year view helpers ─────────────────────────────────────────────────────
  const baseYear = today.getFullYear() - yearOffset * YEAR_PAGE
  const yearList = Array.from({ length: YEAR_PAGE }, (_, i) => baseYear - i)

  const selectYear = (y: number) => {
    setViewYear(y)
    setView('months')
  }

  // ── Month view helpers ────────────────────────────────────────────────────
  const selectMonth = (m: number) => {
    setViewMonth(m)
    setView('days')
  }

  // ── Display value ─────────────────────────────────────────────────────────
  const displayValue = parsed
    ? `${MONTHS_FULL[parsed.getMonth()]} ${parsed.getDate()}, ${parsed.getFullYear()}`
    : placeholder

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setOpen(o => !o); setView('days') }}
        className="w-full h-12 flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 text-[15px] font-medium hover:border-slate-300 focus:outline-none focus:border-[#00838f] focus:ring-4 focus:ring-[#00838f]/10 transition-all group"
      >
        <Calendar size={16} className="text-[#00838f] shrink-0" />
        <span className={parsed ? 'text-slate-900 font-medium' : 'text-slate-400'}>
          {displayValue}
        </span>
        <ChevronDown
          size={14}
          className={`ml-auto text-slate-400 group-hover:text-[#00838f] transition-all ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel — portaled to <body> with fixed positioning so a scrollable
          modal body can never clip it. */}
      {open && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: PANEL_W }}
          className="z-[200] bg-white rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.18)] border border-slate-200/80 p-4">

          {/* ══ DAYS VIEW ══════════════════════════════════════════════════ */}
          {view === 'days' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={prevMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors">
                  <CaretLeft size={14} weight="bold" />
                </button>

                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setView('months')}
                    className="text-[14px] font-bold text-slate-800 hover:text-[#00838f] px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors">
                    {MONTHS_FULL[viewMonth]}
                  </button>
                  <button type="button" onClick={() => setView('years')}
                    className="text-[14px] font-bold text-slate-800 hover:text-[#00838f] px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors">
                    {viewYear}
                  </button>
                </div>

                <button type="button" onClick={nextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors">
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS_ABBR.map(d => (
                  <div key={d} className="text-center text-[11px] font-bold text-slate-400 py-1">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {dayCells.map((day, i) => (
                  <div key={i}>
                    {day ? (
                      <button
                        type="button"
                        disabled={isFutureDay(day)}
                        onClick={() => selectDay(day)}
                        className={`w-full aspect-square flex items-center justify-center text-[13px] rounded-lg transition-all font-medium ${
                          isFutureDay(day)
                            ? 'text-slate-200 cursor-not-allowed'
                            : isSelected(day)
                              ? 'bg-[#00838f] text-white font-bold shadow-sm'
                              : isToday(day)
                                ? 'bg-[#e0f2f1] text-[#00838f] font-bold'
                                : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {day}
                      </button>
                    ) : <div />}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button type="button"
                  onClick={() => { onChange(''); setOpen(false) }}
                  className="text-[12px] font-semibold text-slate-400 hover:text-rose-500 transition-colors">
                  Clear
                </button>
                <button type="button"
                  onClick={() => { selectDay(today.getDate()); setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }}
                  className="text-[12px] font-semibold text-[#00838f] hover:text-[#006064] transition-colors">
                  Today
                </button>
              </div>
            </>
          )}

          {/* ══ MONTHS VIEW ════════════════════════════════════════════════ */}
          {view === 'months' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={() => setViewYear(y => y - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors">
                  <CaretLeft size={14} weight="bold" />
                </button>
                <button type="button" onClick={() => setView('years')}
                  className="text-[14px] font-bold text-slate-800 hover:text-[#00838f] px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors">
                  {viewYear}
                </button>
                <button type="button" onClick={() => setViewYear(y => y + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors">
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {MONTHS_SHORT.map((m, i) => (
                  <button key={m} type="button" onClick={() => selectMonth(i)}
                    className={`py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                      parsed && parsed.getFullYear() === viewYear && parsed.getMonth() === i
                        ? 'bg-[#00838f] text-white shadow-sm'
                        : today.getMonth() === i && today.getFullYear() === viewYear
                          ? 'bg-[#e0f2f1] text-[#00838f] font-bold'
                          : 'hover:bg-slate-100 text-slate-700'
                    }`}>
                    {m}
                  </button>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setView('days')}
                  className="text-[12px] font-semibold text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1">
                  <CaretLeft size={12} weight="bold" /> Back
                </button>
              </div>
            </>
          )}

          {/* ══ YEARS VIEW ═════════════════════════════════════════════════ */}
          {view === 'years' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={() => setYearOffset(o => o + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors">
                  <CaretLeft size={14} weight="bold" />
                </button>
                <span className="text-[13px] font-bold text-slate-500">
                  {yearList[yearList.length - 1]} – {yearList[0]}
                </span>
                <button type="button" onClick={() => setYearOffset(o => Math.max(0, o - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors">
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {yearList.map(y => (
                  <button key={y} type="button" onClick={() => selectYear(y)}
                    className={`py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                      viewYear === y
                        ? 'bg-[#00838f] text-white shadow-sm'
                        : today.getFullYear() === y
                          ? 'bg-[#e0f2f1] text-[#00838f] font-bold'
                          : 'hover:bg-slate-100 text-slate-700'
                    }`}>
                    {y}
                  </button>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setView('months')}
                  className="text-[12px] font-semibold text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1">
                  <CaretLeft size={12} weight="bold" /> Back
                </button>
              </div>
            </>
          )}

        </div>,
        document.body,
      )}
    </div>
  )
}

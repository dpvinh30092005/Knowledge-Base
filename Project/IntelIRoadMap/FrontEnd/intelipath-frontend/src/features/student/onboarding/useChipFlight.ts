import { useCallback, useLayoutEffect, useRef, useState } from 'react'

const DURATION_MS = 260

/**
 * Animates a chip from where it was clicked to where it lands in the other column.
 *
 * A skill leaves one list and joins the other, so it should look like it moved rather than
 * vanishing here and appearing there. Nothing about the picking works differently if this
 * does nothing — it flies a throwaway clone and never blocks the state change, so a missed
 * measurement or a browser without Web Animations degrades to a plain swap.
 */
export function useChipFlight() {
  // The rect of the element that was just clicked, kept until the new one is on screen.
  const originRef = useRef<{ id: string; rect: DOMRect } | null>(null)
  const [pending, setPending] = useState(0)

  /** Call with the clicked element, immediately before the state change that moves it. */
  const takeOff = useCallback((element: HTMLElement | null, id: string) => {
    if (!element) return
    originRef.current = { id, rect: element.getBoundingClientRect() }
    setPending((n) => n + 1)
  }, [])

  useLayoutEffect(() => {
    const origin = originRef.current
    originRef.current = null
    if (!origin) return

    const landed = document.querySelector<HTMLElement>(`[data-chip-id="${CSS.escape(origin.id)}"]`)
    if (!landed || typeof landed.animate !== 'function') return

    const to = landed.getBoundingClientRect()
    const dx = origin.rect.left - to.left
    const dy = origin.rect.top - to.top
    // A chip that barely moved does not need a flight; animating it just adds a flicker.
    if (Math.hypot(dx, dy) < 8) return

    const clone = landed.cloneNode(true) as HTMLElement
    Object.assign(clone.style, {
      position: 'fixed',
      left: `${origin.rect.left}px`,
      top: `${origin.rect.top}px`,
      width: `${origin.rect.width}px`,
      height: `${origin.rect.height}px`,
      margin: '0',
      zIndex: '200',
      pointerEvents: 'none',
    })
    document.body.appendChild(clone)

    landed.style.opacity = '0'
    const flight = clone.animate(
      [
        { transform: 'translate(0px, 0px)', opacity: 1 },
        { transform: `translate(${-dx}px, ${-dy}px)`, opacity: 1 },
      ],
      { duration: DURATION_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    )

    const settle = () => {
      clone.remove()
      landed.style.opacity = ''
    }
    flight.addEventListener('finish', settle)
    flight.addEventListener('cancel', settle)

    return () => {
      flight.cancel()
      settle()
    }
  }, [pending])

  return takeOff
}

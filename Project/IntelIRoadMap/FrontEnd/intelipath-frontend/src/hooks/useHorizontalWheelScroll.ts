import { useCallback, useRef } from 'react'

/**
 * Turns a vertical wheel over a horizontally scrolling strip into horizontal movement,
 * so a row of chips can be browsed with a plain mouse wheel instead of a shift-drag.
 *
 * Registered natively rather than through React's `onWheel`: React attaches wheel
 * listeners passively, and a passive listener cannot call preventDefault — the page
 * would scroll behind the strip instead.
 *
 * A callback ref rather than useRef + useEffect: the strip this is used on belongs to a
 * step that mounts later than its owning component, so an effect with an empty dependency
 * list runs while the node is still null and never gets a second chance to attach.
 */
export function useHorizontalWheelScroll<T extends HTMLElement = HTMLDivElement>() {
  const cleanupRef = useRef<(() => void) | null>(null)

  return useCallback((element: T | null) => {
    cleanupRef.current?.()
    cleanupRef.current = null
    if (!element) return

    const onWheel = (event: WheelEvent) => {
      // Leave a strip that fits alone: hijacking the wheel there would trap the page.
      if (element.scrollWidth <= element.clientWidth) return
      // A trackpad's horizontal swipe already works; only redirect a vertical wheel.
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

      const atStart = element.scrollLeft <= 0
      const atEnd = Math.ceil(element.scrollLeft + element.clientWidth) >= element.scrollWidth
      // Hand the wheel back at either end so the surrounding pane keeps scrolling.
      if ((event.deltaY < 0 && atStart) || (event.deltaY > 0 && atEnd)) return

      event.preventDefault()
      element.scrollLeft += event.deltaY
    }

    element.addEventListener('wheel', onWheel, { passive: false })
    cleanupRef.current = () => element.removeEventListener('wheel', onWheel)
  }, [])
}

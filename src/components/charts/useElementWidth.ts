import { useEffect, useRef, useState } from 'react'

/**
 * The rendered width of an element, tracked as it changes.
 *
 * Charts here draw in real pixels rather than scaling a fixed viewBox. A scaled
 * viewBox stretches everything with the container — an 11px axis label becomes 24px
 * on a wide screen and 7px on a phone, and a 1px gridline stops being 1px. Knowing
 * the actual width means type, strokes and bar caps stay the size they were chosen
 * to be, and the number of axis labels can adapt to the room available.
 */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Set once immediately, so the first paint is not a zero-width chart.
    setWidth(element.clientWidth)

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width
      if (next !== undefined) setWidth(next)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, width }
}

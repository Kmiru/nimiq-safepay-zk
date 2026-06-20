import type { RefObject } from 'react'

type ScrollTargetRef = RefObject<HTMLElement | HTMLDivElement | null>

export function useSmoothScroll() {
  function scrollToElement(
    ref: ScrollTargetRef,
    block: ScrollLogicalPosition = 'center'
  ) {
    window.setTimeout(() => {
      ref.current?.scrollIntoView({
        behavior: 'smooth',
        block,
      })
    }, 120)
  }

  return {
    scrollToElement,
  }
}
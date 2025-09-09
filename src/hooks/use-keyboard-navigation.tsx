'use client'

import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardNavigationOptions {
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: (shift?: boolean) => void
  onSpace?: () => void
  onDelete?: () => void
  onBackspace?: () => void
  preventDefault?: string[]
  stopPropagation?: string[]
  disabled?: boolean
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onSpace,
    onDelete,
    onBackspace,
    preventDefault = [],
    stopPropagation = [],
    disabled = false
  } = options

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return

    const { key, shiftKey, ctrlKey, metaKey, altKey } = event
    const isModifierPressed = ctrlKey || metaKey || altKey

    // Handle special key combinations first
    if (key === 'Tab' && onTab) {
      onTab(shiftKey)
      if (preventDefault.includes('Tab')) {
        event.preventDefault()
      }
      if (stopPropagation.includes('Tab')) {
        event.stopPropagation()
      }
      return
    }

    // Skip if modifier keys are pressed (unless specifically handled)
    if (isModifierPressed && !['Escape'].includes(key)) {
      return
    }

    switch (key) {
      case 'Escape':
        onEscape?.()
        break
      case 'Enter':
        onEnter?.()
        break
      case 'ArrowUp':
        onArrowUp?.()
        break
      case 'ArrowDown':
        onArrowDown?.()
        break
      case 'ArrowLeft':
        onArrowLeft?.()
        break
      case 'ArrowRight':
        onArrowRight?.()
        break
      case ' ':
        onSpace?.()
        break
      case 'Delete':
        onDelete?.()
        break
      case 'Backspace':
        onBackspace?.()
        break
    }

    if (preventDefault.includes(key)) {
      event.preventDefault()
    }
    if (stopPropagation.includes(key)) {
      event.stopPropagation()
    }
  }, [
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onSpace,
    onDelete,
    onBackspace,
    preventDefault,
    stopPropagation,
    disabled
  ])

  useEffect(() => {
    if (disabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, disabled])

  return { handleKeyDown }
}

// Hook for managing focus within a container
export function useFocusManagement(containerRef: React.RefObject<HTMLElement>) {
  const focusableElementsSelector = 
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return []
    
    const elements = containerRef.current.querySelectorAll(focusableElementsSelector)
    return Array.from(elements).filter(el => {
      const element = el as HTMLElement
      return !(element as any).disabled && 
             !element.hasAttribute('aria-hidden') &&
             element.offsetParent !== null // visible
    }) as HTMLElement[]
  }, [])

  const focusFirst = useCallback(() => {
    const elements = getFocusableElements()
    if (elements.length > 0) {
      elements[0].focus()
    }
  }, [getFocusableElements])

  const focusLast = useCallback(() => {
    const elements = getFocusableElements()
    if (elements.length > 0) {
      elements[elements.length - 1].focus()
    }
  }, [getFocusableElements])

  const focusNext = useCallback(() => {
    const elements = getFocusableElements()
    const currentIndex = elements.findIndex(el => el === document.activeElement)
    
    if (currentIndex === -1) {
      focusFirst()
    } else if (currentIndex < elements.length - 1) {
      elements[currentIndex + 1].focus()
    } else {
      elements[0].focus() // wrap to first
    }
  }, [getFocusableElements, focusFirst])

  const focusPrevious = useCallback(() => {
    const elements = getFocusableElements()
    const currentIndex = elements.findIndex(el => el === document.activeElement)
    
    if (currentIndex === -1) {
      focusLast()
    } else if (currentIndex > 0) {
      elements[currentIndex - 1].focus()
    } else {
      elements[elements.length - 1].focus() // wrap to last
    }
  }, [getFocusableElements, focusLast])

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    const elements = getFocusableElements()
    if (elements.length === 0) return

    const firstElement = elements[0]
    const lastElement = elements[elements.length - 1]

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }, [getFocusableElements])

  return {
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    trapFocus,
    getFocusableElements
  }
}

// Hook for skip links
export function useSkipLinks() {
  const skipLinkRef = useRef<HTMLAnchorElement>(null)

  const showSkipLink = useCallback(() => {
    if (skipLinkRef.current) {
      skipLinkRef.current.focus()
    }
  }, [])

  const SkipLink = useCallback(({ href, children }: { href: string; children: React.ReactNode }) => (
    <a
      ref={skipLinkRef}
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:no-underline"
      onFocus={showSkipLink}
    >
      {children}
    </a>
  ), [showSkipLink])

  return { SkipLink }
}

// Custom hook for live announcements
export function useLiveAnnouncer() {
  const announcerRef = useRef<HTMLDivElement>(null)

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcerRef.current) return

    announcerRef.current.setAttribute('aria-live', priority)
    announcerRef.current.textContent = message

    // Clear after a delay to allow for repeated announcements
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = ''
      }
    }, 1000)
  }, [])

  const LiveAnnouncer = useCallback(() => (
    <div
      ref={announcerRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  ), [])

  return { announce, LiveAnnouncer }
}
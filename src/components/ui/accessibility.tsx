'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// Visually hidden component for screen readers
export const VisuallyHidden = forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden clip-rect(0,0,0,0) whitespace-nowrap border-0",
      className
    )}
    {...props}
  />
))
VisuallyHidden.displayName = "VisuallyHidden"

// Skip to content link
interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
}

export const SkipLink = forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ href, children, className, ...props }, ref) => (
    <a
      ref={ref}
      href={href}
      className={cn(
        "absolute top-0 left-0 z-[9999] p-4 bg-primary text-primary-foreground",
        "transform -translate-y-full focus:translate-y-0",
        "transition-transform duration-200 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
)
SkipLink.displayName = "SkipLink"

// Landmark regions
interface LandmarkProps extends React.HTMLAttributes<HTMLElement> {
  label?: string
}

export const MainContent = forwardRef<HTMLElement, LandmarkProps>(
  ({ children, label, className, ...props }, ref) => (
    <main
      ref={ref}
      aria-label={label}
      className={cn("focus:outline-none", className)}
      tabIndex={-1}
      {...props}
    >
      {children}
    </main>
  )
)
MainContent.displayName = "MainContent"

export const NavigationLandmark = forwardRef<HTMLElement, LandmarkProps>(
  ({ children, label, className, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label={label}
      className={cn("focus:outline-none", className)}
      {...props}
    >
      {children}
    </nav>
  )
)
NavigationLandmark.displayName = "NavigationLandmark"

export const ComplementaryContent = forwardRef<HTMLElement, LandmarkProps>(
  ({ children, label, className, ...props }, ref) => (
    <aside
      ref={ref}
      aria-label={label}
      className={cn("focus:outline-none", className)}
      {...props}
    >
      {children}
    </aside>
  )
)
ComplementaryContent.displayName = "ComplementaryContent"

// Focus trap component
interface FocusTrapProps {
  children: React.ReactNode
  className?: string
  onEscape?: () => void
}

export function FocusTrap({ children, className, onEscape }: FocusTrapProps) {
  const trapRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = trapRef.current
    if (!element) return

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape()
        return
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }, [onEscape])

  return (
    <div ref={trapRef} className={className}>
      {children}
    </div>
  )
}

// Announcement region for screen readers
export function LiveRegion({ 
  children, 
  priority = 'polite',
  atomic = false,
  className 
}: {
  children: React.ReactNode
  priority?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  className?: string
}) {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      className={cn("sr-only", className)}
    >
      {children}
    </div>
  )
}

// Accessible button with proper states
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  loadingText?: string
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ children, loading, loadingText, disabled, className, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {loading ? (loadingText || 'Loading...') : children}
    </button>
  )
)
AccessibleButton.displayName = "AccessibleButton"

// Progress indicator
interface ProgressProps {
  value: number
  max?: number
  label?: string
  className?: string
}

export function Progress({ value, max = 100, label, className }: ProgressProps) {
  const percentage = Math.round((value / max) * 100)
  
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="w-full bg-secondary rounded-full h-2 overflow-hidden"
      >
        <div
          className="bg-primary h-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Error message component
interface ErrorMessageProps {
  id: string
  children: React.ReactNode
  className?: string
}

export function ErrorMessage({ id, children, className }: ErrorMessageProps) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="assertive"
      className={cn("text-sm text-destructive", className)}
    >
      {children}
    </div>
  )
}

// Success message component
export function SuccessMessage({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      id={id}
      role="status"
      aria-live="polite"
      className={cn("text-sm text-green-600 dark:text-green-400", className)}
    >
      {children}
    </div>
  )
}

// Accessible tooltip wrapper
interface TooltipContentAccessibleProps {
  children: React.ReactNode
  id: string
  className?: string
}

export function TooltipContentAccessible({ children, id, className }: TooltipContentAccessibleProps) {
  return (
    <div
      id={id}
      role="tooltip"
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
        className
      )}
    >
      {children}
    </div>
  )
}
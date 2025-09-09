'use client'

import React, { useState, useCallback } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,  
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  onConfirm: () => void
  details?: string[]
  showCheckbox?: boolean
  checkboxText?: string
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel', 
  variant = 'default',
  onConfirm,
  details,
  showCheckbox,
  checkboxText
}: ConfirmationDialogProps) {
  const [isChecked, setIsChecked] = useState(false)
  
  const handleConfirm = useCallback(() => {
    onConfirm()
    onOpenChange(false)
    if (showCheckbox) {
      setIsChecked(false)
    }
  }, [onConfirm, onOpenChange, showCheckbox])

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <AlertTriangle className="h-6 w-6 text-destructive" />
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-orange-500" />
      default:
        return <Info className="h-6 w-6 text-primary" />
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return 'border-destructive/20 bg-destructive/5'
      case 'warning':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20'
      default:
        return 'border-primary/20 bg-primary/5'
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={`max-w-lg ${getVariantStyles()}`}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <div className="space-y-1">
              <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
              <Badge variant={variant === 'destructive' ? 'destructive' : 'secondary'} className="text-xs w-fit">
                {variant === 'destructive' ? 'Permanent Action' : 
                 variant === 'warning' ? 'Warning' : 'Confirmation'}
              </Badge>
            </div>
          </div>
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {details && details.length > 0 && (
          <div className="space-y-2 py-4">
            <p className="text-sm font-medium">This action will:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {details.map((detail, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showCheckbox && (
          <div className="flex items-center space-x-2 py-2">
            <input
              type="checkbox"
              id="confirmation-checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="h-4 w-4"
            />
            <label 
              htmlFor="confirmation-checkbox" 
              className="text-sm text-muted-foreground cursor-pointer"
            >
              {checkboxText || 'I understand this action cannot be undone'}
            </label>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={showCheckbox && !isChecked}
            >
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook for easy confirmation dialogs
export function useConfirmation() {
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
    variant?: 'default' | 'destructive' | 'warning'
    details?: string[]
  } | null>(null)

  const confirm = useCallback((options: {
    title: string
    description: string
    onConfirm: () => void
    variant?: 'default' | 'destructive' | 'warning'
    details?: string[]
  }) => {
    setConfirmationState({
      isOpen: true,
      ...options
    })
  }, [])

  const close = useCallback(() => {
    setConfirmationState(null)
  }, [])

  const ConfirmationComponent = confirmationState ? (
    <ConfirmationDialog
      open={confirmationState.isOpen}
      onOpenChange={close}
      title={confirmationState.title}
      description={confirmationState.description}
      onConfirm={confirmationState.onConfirm}
      variant={confirmationState.variant}
      details={confirmationState.details}
    />
  ) : null

  return {
    confirm,
    close,
    ConfirmationComponent
  }
}
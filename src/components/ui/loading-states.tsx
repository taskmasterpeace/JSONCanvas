'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function DocumentSidebarSkeleton() {
  return (
    <aside className="w-80 bg-card border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-8" />
        </div>
        <Skeleton className="h-9 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>
      
      <div className="flex-1 p-2 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-3 border border-border rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

export function JsonTreeEditorSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <Skeleton className="h-9 w-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2" style={{ paddingLeft: `${(i % 3) * 20}px` }}>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function HeaderSkeleton() {
  return (
    <header className="bg-card border-b border-border p-3 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="flex items-center space-x-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10" />
          ))}
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </header>
  )
}

export function SchemaDialogSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-5" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

export function AIProcessingSkeleton({ message = "Processing with AI..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-2 w-8 h-8 border-2 border-accent/20 border-r-accent rounded-full animate-spin animate-reverse" />
      </div>
      <div className="text-center space-y-2">
        <p className="font-medium text-primary">{message}</p>
        <div className="flex gap-1 justify-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-accent rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function TableLoadingSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="w-full">
      <div className="rounded-md border">
        <div className="border-b bg-muted/50 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b p-4 last:border-b-0">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-3 border border-border rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Badge variant="secondary" className="h-5 w-16" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface LoadingStateProps {
  type: 'skeleton' | 'spinner' | 'dots' | 'pulse'
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

export function LoadingState({ type, size = 'md', message, className }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  switch (type) {
    case 'spinner':
      return (
        <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
          <div className={`border-2 border-primary/20 border-t-primary rounded-full animate-spin ${sizeClasses[size]}`} />
          {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
        </div>
      )
    
    case 'dots':
      return (
        <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
        </div>
      )
    
    case 'pulse':
      return (
        <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
          <div className={`bg-primary rounded-full animate-pulse ${sizeClasses[size]}`} />
          {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
        </div>
      )
    
    default:
      return <Skeleton className={`w-full h-8 ${className}`} />
  }
}

// Higher-order component for wrapping components with loading states
interface WithLoadingProps {
  loading: boolean
  skeleton?: React.ComponentType
  children: React.ReactNode
  loadingMessage?: string
}

export function WithLoading({ loading, skeleton: SkeletonComponent, children, loadingMessage }: WithLoadingProps) {
  if (loading) {
    if (SkeletonComponent) {
      return <SkeletonComponent />
    }
    return <LoadingState type="spinner" message={loadingMessage} />
  }
  
  return <>{children}</>
}
'use client'

import { useEffect, useRef, useState } from 'react'

interface PerformanceMetrics {
  renderCount: number
  lastRenderTime: number
  averageRenderTime: number
  maxRenderTime: number
  minRenderTime: number
}

export function usePerformanceMetrics(componentName: string) {
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    maxRenderTime: 0,
    minRenderTime: Infinity
  })
  
  const renderStartTime = useRef<number>(0)
  const renderTimes = useRef<number[]>([])

  // Start timing on each render
  renderStartTime.current = performance.now()

  useEffect(() => {
    const renderEndTime = performance.now()
    const renderTime = renderEndTime - renderStartTime.current

    renderTimes.current.push(renderTime)
    
    // Keep only last 100 render times to prevent memory issues
    if (renderTimes.current.length > 100) {
      renderTimes.current = renderTimes.current.slice(-100)
    }

    const newMetrics: PerformanceMetrics = {
      renderCount: metricsRef.current.renderCount + 1,
      lastRenderTime: renderTime,
      averageRenderTime: renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length,
      maxRenderTime: Math.max(metricsRef.current.maxRenderTime, renderTime),
      minRenderTime: Math.min(metricsRef.current.minRenderTime, renderTime)
    }

    metricsRef.current = newMetrics

    // Log performance warnings in development (throttled)
    if (process.env.NODE_ENV === 'development') {
      if (renderTime > 50) { // Only log very slow renders (>50ms)
        console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (very slow)`, {
          renderTime,
          componentName
        })
      }
      
      if (newMetrics.renderCount % 100 === 0) { // Log metrics every 100 renders
        console.log(`[Performance] ${componentName} metrics:`, newMetrics)
      }
    }
  }, [componentName]) // Only re-run if componentName changes

  return metricsRef.current
}

export function useRenderCount(componentName?: string) {
  const renderCount = useRef(0)
  
  renderCount.current += 1
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && componentName) {
      console.log(`[Render] ${componentName} render #${renderCount.current}`)
    }
  })
  
  return renderCount.current
}

export function usePreviousValue<T>(value: T): T | undefined {
  const ref = useRef<T>()
  
  useEffect(() => {
    ref.current = value
  })
  
  return ref.current
}

export function useWhyDidYouUpdate<T extends Record<string, any>>(
  componentName: string, 
  props: T
) {
  const previousProps = useRef<T>()
  
  useEffect(() => {
    if (previousProps.current && process.env.NODE_ENV === 'development') {
      const changedProps: Record<string, { previous: any; current: any }> = {}
      
      Object.keys({ ...previousProps.current, ...props }).forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            previous: previousProps.current![key],
            current: props[key]
          }
        }
      })
      
      if (Object.keys(changedProps).length > 0) {
        console.log(`[WhyDidYouUpdate] ${componentName}`, changedProps)
      }
    }
    
    previousProps.current = props
  })
}

export function useMemoryUsage() {
  const [memoryUsage, setMemoryUsage] = useState<any>(null)
  
  useEffect(() => {
    // Check if performance.memory is available (Chrome only)
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = (performance as any).memory
        setMemoryUsage({
          used: Math.round(memory.usedJSHeapSize / 1048576), // Convert to MB
          total: Math.round(memory.totalJSHeapSize / 1048576),
          limit: Math.round(memory.jsHeapSizeLimit / 1048576)
        })
      }
      
      updateMemoryUsage()
      const interval = setInterval(updateMemoryUsage, 5000) // Update every 5 seconds
      
      return () => clearInterval(interval)
    }
  }, [])
  
  return memoryUsage
}
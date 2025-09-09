'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface LoadingState {
  [key: string]: boolean
}

interface LoadingContextType {
  loadingStates: LoadingState
  setLoading: (key: string, loading: boolean) => void
  isLoading: (key: string) => boolean
  isAnyLoading: () => boolean
  clearAllLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

interface LoadingProviderProps {
  children: ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({})

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }))
  }, [])

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false
  }, [loadingStates])

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean)
  }, [loadingStates])

  const clearAllLoading = useCallback(() => {
    setLoadingStates({})
  }, [])

  const value: LoadingContextType = {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    clearAllLoading
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

// Custom hook for managing async operations with loading states
export function useAsyncOperation(key: string) {
  const { setLoading } = useLoading()

  const execute = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    setLoading(key, true)
    try {
      const result = await operation()
      return result
    } finally {
      setLoading(key, false)
    }
  }, [key, setLoading])

  return { execute }
}

// Loading state keys for consistency
export const LOADING_KEYS = {
  // Document operations
  DOCUMENT_LOADING: 'document_loading',
  DOCUMENT_SAVING: 'document_saving',
  DOCUMENT_IMPORTING: 'document_importing',
  DOCUMENT_EXPORTING: 'document_exporting',
  
  // AI operations
  AI_TEXT_TO_JSON: 'ai_text_to_json',
  AI_ENHANCE_FIELD: 'ai_enhance_field',
  AI_FORMAT_JSON: 'ai_format_json',
  AI_SUMMARIZE: 'ai_summarize',
  AI_SCHEMA_GENERATION: 'ai_schema_generation',
  
  // JSON operations
  JSON_VALIDATION: 'json_validation',
  JSON_PARSING: 'json_parsing',
  JSON_FORMATTING: 'json_formatting',
  
  // UI operations
  SIDEBAR_LOADING: 'sidebar_loading',
  EDITOR_LOADING: 'editor_loading',
  SCHEMA_DIALOG_LOADING: 'schema_dialog_loading',
  
  // Network operations
  API_REQUEST: 'api_request',
  FILE_UPLOAD: 'file_upload',
  
  // Search operations
  SEARCH_DOCUMENTS: 'search_documents',
  SEARCH_JSON: 'search_json',
} as const

export type LoadingKey = typeof LOADING_KEYS[keyof typeof LOADING_KEYS]
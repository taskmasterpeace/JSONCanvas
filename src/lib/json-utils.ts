import type { JsonValue, JsonPath } from '@/components/json-canvas/types'

/**
 * Fast structural cloning for JSON data without using JSON.stringify/parse
 * This fixes the performance issue with deep cloning large objects
 */
export function fastCloneJson<T extends JsonValue>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value
  }
  
  if (Array.isArray(value)) {
    return value.map(item => fastCloneJson(item)) as T
  }
  
  const cloned: any = {}
  for (const [key, val] of Object.entries(value)) {
    cloned[key] = fastCloneJson(val)
  }
  return cloned as T
}

/**
 * Safe JSON path access with proper type checking
 * This fixes the type safety issues with (as any) casts
 */
export function getValueAtPath(data: JsonValue, path: JsonPath): JsonValue | undefined {
  let current = data
  
  for (const segment of path) {
    if (current === null || typeof current !== 'object') {
      return undefined
    }
    
    if (Array.isArray(current)) {
      const index = typeof segment === 'number' ? segment : parseInt(String(segment), 10)
      if (isNaN(index) || index < 0 || index >= current.length) {
        return undefined
      }
      current = current[index]
    } else {
      const key = String(segment)
      if (!(key in current)) {
        return undefined
      }
      current = (current as any)[key]
    }
  }
  
  return current
}

/**
 * Safe JSON path setting with proper validation
 */
export function setValueAtPath(data: JsonValue, path: JsonPath, newValue: JsonValue): JsonValue {
  if (path.length === 0) {
    return newValue
  }
  
  const cloned = fastCloneJson(data)
  let current = cloned
  
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i]
    
    if (current === null || typeof current !== 'object') {
      throw new Error(`Cannot access path at segment: ${segment}`)
    }
    
    if (Array.isArray(current)) {
      const index = typeof segment === 'number' ? segment : parseInt(String(segment), 10)
      if (isNaN(index) || index < 0 || index >= current.length) {
        throw new Error(`Array index out of bounds: ${index}`)
      }
      current = current[index]
    } else {
      const key = String(segment)
      if (!(key in current)) {
        throw new Error(`Property not found: ${key}`)
      }
      current = (current as any)[key]
    }
  }
  
  const lastSegment = path[path.length - 1]
  if (Array.isArray(current)) {
    const index = typeof lastSegment === 'number' ? lastSegment : parseInt(String(lastSegment), 10)
    if (isNaN(index) || index < 0 || index >= current.length) {
      throw new Error(`Array index out of bounds: ${index}`)
    }
    current[index] = newValue
  } else if (typeof current === 'object' && current !== null) {
    (current as any)[String(lastSegment)] = newValue
  } else {
    throw new Error('Cannot set value on non-object')
  }
  
  return cloned
}

/**
 * Add property to object at path with validation
 */
export function addPropertyAtPath(data: JsonValue, path: JsonPath, key: string, value: JsonValue): JsonValue {
  const cloned = fastCloneJson(data)
  const parent = path.length === 0 ? cloned : getValueAtPath(cloned, path)
  
  if (typeof parent !== 'object' || parent === null || Array.isArray(parent)) {
    throw new Error('Cannot add property to non-object')
  }
  
  if (key in parent) {
    throw new Error(`Property '${key}' already exists`)
  }
  
  (parent as any)[key] = value
  return cloned
}

/**
 * Add item to array at path with validation
 */
export function addItemAtPath(data: JsonValue, path: JsonPath, value: JsonValue): JsonValue {
  const cloned = fastCloneJson(data)
  const target = path.length === 0 ? cloned : getValueAtPath(cloned, path)
  
  if (!Array.isArray(target)) {
    throw new Error('Cannot add item to non-array')
  }
  
  target.push(value)
  return cloned
}

/**
 * Delete property or array item at path
 */
export function deleteAtPath(data: JsonValue, path: JsonPath): JsonValue {
  if (path.length === 0) {
    throw new Error('Cannot delete root element')
  }
  
  const cloned = fastCloneJson(data)
  const parentPath = path.slice(0, -1)
  const parent = parentPath.length === 0 ? cloned : getValueAtPath(cloned, parentPath)
  const lastSegment = path[path.length - 1]
  
  if (Array.isArray(parent)) {
    const index = typeof lastSegment === 'number' ? lastSegment : parseInt(String(lastSegment), 10)
    if (isNaN(index) || index < 0 || index >= parent.length) {
      throw new Error(`Array index out of bounds: ${index}`)
    }
    parent.splice(index, 1)
  } else if (typeof parent === 'object' && parent !== null) {
    delete (parent as any)[String(lastSegment)]
  } else {
    throw new Error('Cannot delete from non-object/non-array')
  }
  
  return cloned
}

/**
 * Rename property at path
 */
export function renamePropertyAtPath(data: JsonValue, path: JsonPath, oldKey: string, newKey: string): JsonValue {
  if (oldKey === newKey) {
    return data
  }
  
  const cloned = fastCloneJson(data)
  const target = path.length === 0 ? cloned : getValueAtPath(cloned, path)
  
  if (typeof target !== 'object' || target === null || Array.isArray(target)) {
    throw new Error('Cannot rename property on non-object')
  }
  
  if (!(oldKey in target)) {
    throw new Error(`Property '${oldKey}' does not exist`)
  }
  
  if (newKey in target && newKey !== oldKey) {
    throw new Error(`Property '${newKey}' already exists`)
  }
  
  const value = (target as any)[oldKey]
  delete (target as any)[oldKey]
  ;(target as any)[newKey] = value
  
  return cloned
}

/**
 * Validate user input for JSON values
 */
export function validateJsonInput(value: string, expectedType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'): {
  isValid: boolean
  parsed?: JsonValue
  error?: string
} {
  switch (expectedType) {
    case 'string':
      return { isValid: true, parsed: value }
    
    case 'number':
      if (value.trim() === '') {
        return { isValid: false, error: 'Number cannot be empty' }
      }
      
      // Reject hex, binary, and other non-JSON number formats
      if (/^0[xXbBoO]/.test(value.trim())) {
        return { isValid: false, error: 'Hex, binary, and octal numbers are not valid JSON' }
      }
      
      const num = Number(value)
      if (isNaN(num)) {
        return { isValid: false, error: 'Invalid number format' }
      }
      if (!isFinite(num)) {
        return { isValid: false, error: 'Number must be finite' }
      }
      return { isValid: true, parsed: num }
    
    case 'boolean':
      const lower = value.toLowerCase().trim()
      if (lower === 'true') return { isValid: true, parsed: true }
      if (lower === 'false') return { isValid: true, parsed: false }
      return { isValid: false, error: 'Boolean must be "true" or "false"' }
    
    case 'null':
      if (value.toLowerCase().trim() === 'null') {
        return { isValid: true, parsed: null }
      }
      return { isValid: false, error: 'Must be "null"' }
    
    case 'object':
      if (value.trim() === '' || value.trim() === '{}') {
        return { isValid: true, parsed: {} }
      }
      try {
        const parsed = JSON.parse(value)
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          return { isValid: true, parsed }
        }
        return { isValid: false, error: 'Must be a valid object' }
      } catch {
        return { isValid: false, error: 'Invalid JSON object format' }
      }
    
    case 'array':
      if (value.trim() === '' || value.trim() === '[]') {
        return { isValid: true, parsed: [] }
      }
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          return { isValid: true, parsed }
        }
        return { isValid: false, error: 'Must be a valid array' }
      } catch {
        return { isValid: false, error: 'Invalid JSON array format' }
      }
      
    default:
      return { isValid: false, error: 'Unknown type' }
  }
}

/**
 * Safe localStorage operations with error handling
 */
export class SafeStorage {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key)
      if (item === null || item === undefined) return defaultValue
      const parsed = JSON.parse(item)
      return parsed
    } catch (error) {
      console.warn(`Failed to read localStorage key '${key}':`, error)
      return defaultValue
    }
  }

  static set(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded. Consider clearing old data.')
        // Attempt to clear some space
        try {
          this.cleanup()
          localStorage.setItem(key, JSON.stringify(value))
          return true
        } catch {
          return false
        }
      }
      console.warn(`Failed to write localStorage key '${key}':`, error)
      return false
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove localStorage key '${key}':`, error)
    }
  }

  static cleanup(): void {
    // Remove old or unnecessary data to free up space
    const keys = Object.keys(localStorage)
    const oldKeys = keys.filter(key => key.startsWith('jsonCanvas_') && key.includes('_old_'))
    
    oldKeys.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch {
        // Ignore cleanup errors
      }
    })
  }

  static getStorageInfo(): { used: number; available: number; total: number } {
    let used = 0
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        const value = localStorage.getItem(key) || ''
        used += new Blob([value]).size
      }
    } catch {
      used = -1 // Unknown
    }
    
    // Most browsers have 5-10MB localStorage limit
    const total = 5 * 1024 * 1024 // 5MB estimate
    return {
      used,
      available: total - used,
      total
    }
  }
}

/**
 * Detect circular references before JSON operations
 */
export function hasCircularReference(obj: any, visited = new WeakSet()): boolean {
  if (obj === null || typeof obj !== 'object') {
    return false
  }
  
  if (visited.has(obj)) {
    return true
  }
  
  visited.add(obj)
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (hasCircularReference(obj[key], visited)) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Get JSON size information
 */
export function getJsonStats(data: JsonValue): {
  size: number
  depth: number
  nodeCount: number
  complexity: 'simple' | 'moderate' | 'complex' | 'extreme'
} {
  const calculateDepth = (value: JsonValue, currentDepth = 0): number => {
    if (value === null || typeof value !== 'object') {
      return currentDepth
    }
    
    if (Array.isArray(value)) {
      return Math.max(...value.map(item => calculateDepth(item, currentDepth + 1)))
    }
    
    const depths = Object.values(value).map(val => calculateDepth(val, currentDepth + 1))
    return Math.max(...depths)
  }
  
  const countNodes = (value: JsonValue): number => {
    if (value === null || typeof value !== 'object') {
      return 1
    }
    
    if (Array.isArray(value)) {
      return 1 + value.reduce((sum: number, item) => sum + countNodes(item), 0)
    }
    
    return 1 + Object.values(value).reduce((sum: number, val) => sum + countNodes(val), 0)
  }
  
  const size = new Blob([JSON.stringify(data)]).size
  const depth = calculateDepth(data)
  const nodeCount = countNodes(data)
  
  let complexity: 'simple' | 'moderate' | 'complex' | 'extreme'
  if (nodeCount < 20 && depth < 3) {
    complexity = 'simple'
  } else if (nodeCount < 100 && depth < 6) {
    complexity = 'moderate'  
  } else if (nodeCount < 1000 && depth < 10) {
    complexity = 'complex'
  } else {
    complexity = 'extreme'
  }
  
  return { size, depth, nodeCount, complexity }
}
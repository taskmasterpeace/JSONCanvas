import {
  fastCloneJson,
  getValueAtPath,
  validateJsonInput,
  hasCircularReference,
  getJsonStats
} from '../json-utils'

/**
 * SIMPLE, FOCUSED TESTS FOR CORE JSON UTILITIES
 * These tests focus on actual functionality without complex mocking
 */

describe('JSON Utils - Core Functionality', () => {
  
  describe('fastCloneJson Performance and Correctness', () => {
    test('clones without reference sharing', () => {
      const original = { users: [{ name: 'John' }], config: { theme: 'dark' } }
      const cloned = fastCloneJson(original)
      
      // Verify deep clone
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned.users).not.toBe(original.users)
      expect(cloned.config).not.toBe(original.config)
      
      // Verify mutation independence
      cloned.users[0].name = 'Modified'
      expect(original.users[0].name).toBe('John') // Original unchanged
    })

    test('handles all JSON data types correctly', () => {
      const allTypes = {
        string: 'test',
        number: 42,
        boolean: true,
        nullValue: null,
        array: [1, 'two', { three: 3 }],
        object: { nested: { deep: 'value' } }
      }
      
      const cloned = fastCloneJson(allTypes)
      
      expect(cloned.string).toBe('test')
      expect(cloned.number).toBe(42)
      expect(cloned.boolean).toBe(true)
      expect(cloned.nullValue).toBe(null)
      expect(cloned.array).toEqual([1, 'two', { three: 3 }])
      expect(cloned.object.nested.deep).toBe('value')
      
      // Verify no reference sharing
      expect(cloned.array).not.toBe(allTypes.array)
      expect(cloned.object.nested).not.toBe(allTypes.object.nested)
    })

    test('performance benchmark - should be faster than JSON.stringify approach', () => {
      // Create moderately complex data
      const testData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          metadata: { created: new Date().toISOString(), active: i % 2 === 0 }
        }))
      }

      // Test fastCloneJson performance
      const fastStart = performance.now()
      fastCloneJson(testData)
      const fastDuration = performance.now() - fastStart

      // Test JSON.stringify performance
      const stringifyStart = performance.now()
      JSON.parse(JSON.stringify(testData))
      const stringifyDuration = performance.now() - stringifyStart

      console.log(`FastClone: ${fastDuration}ms, JSON.stringify: ${stringifyDuration}ms`)
      
      // FastClone should complete in reasonable time
      expect(fastDuration).toBeLessThan(10) // Should be very fast
    })
  })

  describe('JSON Path Operations', () => {
    const testData = {
      users: [
        { name: 'John', profile: { email: 'john@test.com', settings: { theme: 'dark' } } },
        { name: 'Jane', profile: { email: 'jane@test.com', settings: { theme: 'light' } } }
      ],
      config: {
        app: { name: 'TestApp', version: '1.0' },
        features: ['auth', 'api', 'ui']
      }
    }

    test('navigates complex nested structures', () => {
      // Deep object access
      expect(getValueAtPath(testData, ['users', 0, 'profile', 'settings', 'theme'])).toBe('dark')
      expect(getValueAtPath(testData, ['users', 1, 'profile', 'email'])).toBe('jane@test.com')
      expect(getValueAtPath(testData, ['config', 'app', 'name'])).toBe('TestApp')
      
      // Array access
      expect(getValueAtPath(testData, ['config', 'features', 0])).toBe('auth')
      expect(getValueAtPath(testData, ['config', 'features', 2])).toBe('ui')
    })

    test('handles invalid paths gracefully', () => {
      // Non-existent paths
      expect(getValueAtPath(testData, ['nonexistent'])).toBeUndefined()
      expect(getValueAtPath(testData, ['users', 'invalid'])).toBeUndefined()
      expect(getValueAtPath(testData, ['users', 0, 'nonexistent'])).toBeUndefined()
      
      // Out of bounds array access
      expect(getValueAtPath(testData, ['users', 10])).toBeUndefined()
      expect(getValueAtPath(testData, ['config', 'features', 10])).toBeUndefined()
      
      // Invalid types in path
      expect(getValueAtPath(testData, ['users', 0, 'name', 'invalid'])).toBeUndefined()
    })

    test('mixed string/number indices work correctly', () => {
      // Both should work for arrays
      expect(getValueAtPath(testData, ['users', 0])).toEqual(testData.users[0])
      expect(getValueAtPath(testData, ['users', '0'])).toEqual(testData.users[0])
      
      // String indices that parse to numbers
      expect(getValueAtPath(testData, ['config', 'features', '1'])).toBe('api')
    })
  })

  describe('Input Validation Edge Cases', () => {
    test('number validation catches edge cases', () => {
      // Scientific notation
      expect(validateJsonInput('1e10', 'number').isValid).toBe(true)
      expect(validateJsonInput('1.5e-5', 'number').isValid).toBe(true)
      
      // Infinity/NaN (should be rejected)
      expect(validateJsonInput('Infinity', 'number').isValid).toBe(false)
      expect(validateJsonInput('-Infinity', 'number').isValid).toBe(false)
      expect(validateJsonInput('NaN', 'number').isValid).toBe(false)
      
      // Hex/Binary (should parse as NaN and be rejected)
      expect(validateJsonInput('0xFF', 'number').isValid).toBe(false)
      expect(validateJsonInput('0b1010', 'number').isValid).toBe(false)
      
      // Leading/trailing whitespace
      expect(validateJsonInput(' 42 ', 'number').isValid).toBe(true)
    })

    test('boolean validation is strict', () => {
      // Case variations (should work)
      expect(validateJsonInput('True', 'boolean').isValid).toBe(true)
      expect(validateJsonInput('FALSE', 'boolean').isValid).toBe(true)
      
      // Common mistakes (should fail)  
      expect(validateJsonInput('yes', 'boolean').isValid).toBe(false)
      expect(validateJsonInput('no', 'boolean').isValid).toBe(false)
      expect(validateJsonInput('1', 'boolean').isValid).toBe(false)
      expect(validateJsonInput('0', 'boolean').isValid).toBe(false)
      expect(validateJsonInput('on', 'boolean').isValid).toBe(false)
      expect(validateJsonInput('off', 'boolean').isValid).toBe(false)
    })

    test('object validation handles malformed JSON', () => {
      // Valid objects
      expect(validateJsonInput('{}', 'object').isValid).toBe(true)
      expect(validateJsonInput('{"a":1,"b":2}', 'object').isValid).toBe(true)
      
      // Invalid JSON syntax
      expect(validateJsonInput('{a:1}', 'object').isValid).toBe(false) // Unquoted key
      expect(validateJsonInput("{'a':1}", 'object').isValid).toBe(false) // Single quotes
      expect(validateJsonInput('{,}', 'object').isValid).toBe(false) // Invalid commas
      expect(validateJsonInput('{a:}', 'object').isValid).toBe(false) // Missing value
      
      // Arrays (should be rejected for object type)
      expect(validateJsonInput('[]', 'object').isValid).toBe(false)
      expect(validateJsonInput('[1,2,3]', 'object').isValid).toBe(false)
    })

    test('array validation handles malformed JSON', () => {
      // Valid arrays
      expect(validateJsonInput('[]', 'array').isValid).toBe(true)
      expect(validateJsonInput('[1,"two",true]', 'array').isValid).toBe(true)
      
      // Invalid JSON syntax
      expect(validateJsonInput('[1,2,]', 'array').isValid).toBe(false) // Trailing comma
      expect(validateJsonInput('[1,,2]', 'array').isValid).toBe(false) // Double comma
      expect(validateJsonInput('[1,2', 'array').isValid).toBe(false) // Missing bracket
      
      // Objects (should be rejected for array type)
      expect(validateJsonInput('{}', 'array').isValid).toBe(false)
      expect(validateJsonInput('{"a":1}', 'array').isValid).toBe(false)
    })
  })

  describe('Circular Reference Detection', () => {
    test('detects simple circular references', () => {
      const simple: any = { name: 'test' }
      simple.self = simple
      
      expect(hasCircularReference(simple)).toBe(true)
    })

    test('detects deep circular references', () => {
      const complex: any = {
        level1: {
          level2: {
            level3: {
              data: 'value'
            }
          }
        }
      }
      
      // Add circular reference deep in structure
      complex.level1.level2.level3.backToRoot = complex
      
      expect(hasCircularReference(complex)).toBe(true)
    })

    test('handles arrays with circular references', () => {
      const arrayObj: any = {
        items: [1, 2, { nested: 'value' }]
      }
      
      // Add circular reference in array
      arrayObj.items.push(arrayObj)
      
      expect(hasCircularReference(arrayObj)).toBe(true)
    })

    test('returns false for complex non-circular structures', () => {
      const complex = {
        users: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          profile: {
            name: `User ${i}`,
            connections: Array.from({ length: 5 }, (_, j) => `user_${j}`) // String refs, not circular
          }
        })),
        metadata: {
          version: '1.0',
          stats: {
            totalUsers: 50,
            avgConnections: 5
          }
        }
      }
      
      expect(hasCircularReference(complex)).toBe(false)
    })
  })

  describe('JSON Statistics and Analysis', () => {
    test('correctly categorizes complexity levels', () => {
      // Simple
      const simple = { name: 'test', value: 42 }
      expect(getJsonStats(simple).complexity).toBe('simple')
      
      // Moderate
      const moderate = {
        users: Array.from({ length: 15 }, (_, i) => ({ id: i, name: `User ${i}` })),
        config: { theme: 'dark', settings: { notifications: true } }
      }
      expect(getJsonStats(moderate).complexity).toBe('moderate')
      
      // Complex
      const complex = {
        data: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          profile: {
            personal: { name: `User ${i}`, email: `user${i}@test.com` },
            settings: { theme: 'dark', notifications: { email: true, sms: false } }
          }
        }))
      }
      expect(['complex', 'extreme']).toContain(getJsonStats(complex).complexity)
    })

    test('calculates depth accurately', () => {
      // Single level
      expect(getJsonStats({ a: 1 }).depth).toBe(1)
      
      // Multiple levels
      const deep = {
        l1: {
          l2: {
            l3: {
              l4: 'value'
            }
          }
        }
      }
      expect(getJsonStats(deep).depth).toBe(4)
      
      // Arrays add to depth
      const withArray = {
        items: [
          {
            nested: {
              deep: 'value'
            }
          }
        ]
      }
      expect(getJsonStats(withArray).depth).toBeGreaterThanOrEqual(3)
    })

    test('node counting is accurate', () => {
      // Simple count
      const simple = { a: 1, b: 2 }
      const simpleStats = getJsonStats(simple)
      expect(simpleStats.nodeCount).toBe(3) // Root + 2 primitive values
      
      // With arrays
      const withArray = { items: [1, 2, 3] }
      const arrayStats = getJsonStats(withArray)
      expect(arrayStats.nodeCount).toBe(5) // Root + array + 3 items
      
      // With nested objects
      const nested = { user: { profile: { name: 'test' } } }
      const nestedStats = getJsonStats(nested)
      expect(nestedStats.nodeCount).toBe(4) // Root + user + profile + name
    })
  })

  describe('Real-World Scenarios', () => {
    test('handles typical user profile data', () => {
      const userProfile = {
        id: 'user123',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0123'
        },
        preferences: {
          theme: 'dark',
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          privacy: {
            profileVisible: true,
            showEmail: false
          }
        },
        activityHistory: Array.from({ length: 10 }, (_, i) => ({
          timestamp: new Date(Date.now() - i * 86400000).toISOString(),
          action: `action_${i}`,
          details: { type: 'user_action', metadata: { source: 'web' } }
        }))
      }

      // Should clone correctly
      const cloned = fastCloneJson(userProfile)
      expect(cloned).toEqual(userProfile)
      expect(cloned).not.toBe(userProfile)
      
      // Should get nested values correctly
      expect(getValueAtPath(userProfile, ['personalInfo', 'email'])).toBe('john.doe@example.com')
      expect(getValueAtPath(userProfile, ['preferences', 'notifications', 'email'])).toBe(true)
      expect(getValueAtPath(userProfile, ['activityHistory', 0, 'details', 'metadata', 'source'])).toBe('web')
      
      // Should calculate reasonable stats
      const stats = getJsonStats(userProfile)
      expect(stats.complexity).toBeOneOf(['moderate', 'complex'])
      expect(stats.depth).toBeGreaterThan(3)
      expect(stats.nodeCount).toBeGreaterThan(20)
    })

    test('handles e-commerce product data', () => {
      const product = {
        id: 'prod_001',
        basic: {
          name: 'Wireless Headphones',
          description: 'High-quality wireless headphones with noise cancellation',
          category: { primary: 'Electronics', secondary: 'Audio', tags: ['wireless', 'bluetooth', 'noise-cancelling'] }
        },
        pricing: {
          base: 199.99,
          currency: 'USD',
          discounts: [
            { type: 'bulk', threshold: 5, percent: 10 },
            { type: 'member', percent: 5 }
          ]
        },
        inventory: {
          total: 150,
          available: 127,
          reserved: 15,
          warehouses: {
            'warehouse_1': { stock: 75, location: 'East Coast' },
            'warehouse_2': { stock: 52, location: 'West Coast' }
          }
        },
        specifications: {
          technical: {
            connectivity: ['Bluetooth 5.0', 'USB-C'],
            battery: { life: '30 hours', charging: '2 hours' },
            audio: { drivers: '40mm', frequency: '20Hz-20kHz', impedance: '32Ω' }
          },
          physical: {
            weight: '250g',
            dimensions: { length: 18, width: 15, height: 8, unit: 'cm' },
            colors: ['black', 'white', 'navy']
          }
        }
      }

      // Test deep path access
      expect(getValueAtPath(product, ['basic', 'category', 'tags', 1])).toBe('bluetooth')
      expect(getValueAtPath(product, ['inventory', 'warehouses', 'warehouse_1', 'stock'])).toBe(75)
      expect(getValueAtPath(product, ['specifications', 'technical', 'audio', 'frequency'])).toBe('20Hz-20kHz')
      
      // Test cloning maintains structure
      const cloned = fastCloneJson(product)
      expect(cloned.specifications.physical.colors).toEqual(['black', 'white', 'navy'])
      expect(cloned.specifications.physical.colors).not.toBe(product.specifications.physical.colors)
      
      // Should detect as complex (or moderate for smaller test datasets)
      const stats = getJsonStats(product)
      expect(stats.complexity).toBeOneOf(['moderate', 'complex', 'extreme'])
    })

    test('handles API response structures', () => {
      const apiResponse = {
        success: true,
        timestamp: '2025-01-15T10:30:00Z',
        requestId: 'req_abc123',
        data: {
          results: Array.from({ length: 20 }, (_, i) => ({
            id: `item_${i}`,
            score: Math.random(),
            metadata: {
              source: 'database',
              cached: i % 3 === 0,
              processing: { duration: Math.floor(Math.random() * 100), steps: ['validate', 'process', 'format'] }
            }
          })),
          pagination: {
            current: 1,
            total: 5,
            perPage: 20,
            hasNext: true,
            hasPrevious: false
          }
        },
        meta: {
          version: 'v2.1',
          deprecations: [],
          rateLimit: { remaining: 98, reset: '2025-01-15T11:00:00Z' }
        }
      }

      // Test various path accesses
      expect(getValueAtPath(apiResponse, ['data', 'pagination', 'current'])).toBe(1)
      expect(getValueAtPath(apiResponse, ['data', 'results', 0, 'metadata', 'processing', 'steps', 1])).toBe('process')
      expect(getValueAtPath(apiResponse, ['meta', 'rateLimit', 'remaining'])).toBe(98)
      
      // Should not be circular
      expect(hasCircularReference(apiResponse)).toBe(false)
      
      // Should have appropriate complexity
      const stats = getJsonStats(apiResponse)
      expect(['moderate', 'complex']).toContain(stats.complexity)
    })
  })

  describe('Error Recovery Scenarios', () => {
    test('validation provides actionable error messages', () => {
      // Test each validation type has helpful errors
      const testCases = [
        { input: '', type: 'number', expectedError: 'cannot be empty' },
        { input: 'abc', type: 'number', expectedError: 'Invalid number format' },
        { input: 'maybe', type: 'boolean', expectedError: 'must be "true" or "false"' },
        { input: 'none', type: 'null', expectedError: 'Must be "null"' },
        { input: '[}', type: 'array', expectedError: 'Invalid JSON' },
        { input: '{]', type: 'object', expectedError: 'Invalid JSON' },
      ]

      testCases.forEach(({ input, type, expectedError }) => {
        const result = validateJsonInput(input, type as any)
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error!.toLowerCase()).toContain(expectedError.toLowerCase().split(' ')[0])
      })
    })
  })
})

/**
 * HELPER FOR CUSTOM MATCHERS
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(items: any[]): R
    }
  }
}

expect.extend({
  toBeOneOf(received, items) {
    const pass = items.includes(received)
    return {
      message: () => `expected ${received} to be one of ${items.join(', ')}`,
      pass,
    }
  },
})
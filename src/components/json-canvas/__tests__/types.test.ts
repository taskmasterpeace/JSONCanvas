import type { JsonValue, JsonObject, JsonArray, JsonPrimitive, Document } from '../types'

describe('JSON Canvas Types', () => {
  describe('JsonPrimitive', () => {
    test('should accept string values', () => {
      const value: JsonPrimitive = 'test string'
      expect(typeof value).toBe('string')
    })

    test('should accept number values', () => {
      const value: JsonPrimitive = 42
      expect(typeof value).toBe('number')
    })

    test('should accept boolean values', () => {
      const value: JsonPrimitive = true
      expect(typeof value).toBe('boolean')
    })

    test('should accept null values', () => {
      const value: JsonPrimitive = null
      expect(value).toBeNull()
    })
  })

  describe('JsonObject', () => {
    test('should accept valid object structure', () => {
      const obj: JsonObject = {
        name: 'John',
        age: 30,
        active: true,
        metadata: null,
      }
      expect(obj.name).toBe('John')
      expect(obj.age).toBe(30)
      expect(obj.active).toBe(true)
      expect(obj.metadata).toBeNull()
    })
  })

  describe('JsonArray', () => {
    test('should accept array of mixed JsonValues', () => {
      const arr: JsonArray = [
        'string',
        42,
        true,
        null,
        { nested: 'object' },
        [1, 2, 3],
      ]
      expect(arr).toHaveLength(6)
      expect(arr[0]).toBe('string')
      expect(arr[4]).toEqual({ nested: 'object' })
    })
  })

  describe('Document', () => {
    test('should have required properties', () => {
      const doc: Document = {
        id: 'test-id',
        name: 'Test Document',
        data: { test: 'data' },
        history: [{ test: 'data' }],
        currentHistoryIndex: 0,
      }
      expect(doc.id).toBe('test-id')
      expect(doc.name).toBe('Test Document')
      expect(doc.data).toEqual({ test: 'data' })
      expect(doc.history).toHaveLength(1)
      expect(doc.currentHistoryIndex).toBe(0)
    })
  })
})
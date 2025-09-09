import Ajv, { JSONSchemaType, ErrorObject } from 'ajv'
import addFormats from 'ajv-formats'
import type { JsonValue } from '@/components/json-canvas/types'

// Initialize AJV with common formats (date, email, etc.)
const ajv = new Ajv({ allErrors: true, verbose: true })
addFormats(ajv)

export interface ValidationError {
  path: string
  message: string
  value?: any
  schemaPath?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export class JsonSchemaValidator {
  private compiledSchema: any = null
  private schema: any = null

  constructor(schema?: any) {
    if (schema) {
      this.setSchema(schema)
    }
  }

  /**
   * Set a new JSON schema for validation
   */
  setSchema(schema: any): boolean {
    try {
      this.schema = schema
      this.compiledSchema = ajv.compile(schema)
      return true
    } catch (error) {
      console.error('Invalid JSON Schema:', error)
      this.compiledSchema = null
      this.schema = null
      return false
    }
  }

  /**
   * Get the current schema
   */
  getSchema(): any {
    return this.schema
  }

  /**
   * Validate JSON data against the current schema
   */
  validate(data: JsonValue): ValidationResult {
    if (!this.compiledSchema) {
      return {
        isValid: false,
        errors: [{ path: '', message: 'No schema set for validation' }]
      }
    }

    const isValid = this.compiledSchema(data)
    const errors: ValidationError[] = []

    if (!isValid && this.compiledSchema.errors) {
      this.compiledSchema.errors.forEach((error: ErrorObject) => {
        errors.push({
          path: error.instancePath || 'root',
          message: this.formatErrorMessage(error),
          value: error.data,
          schemaPath: error.schemaPath
        })
      })
    }

    return { isValid, errors }
  }

  /**
   * Format error messages to be more user-friendly
   */
  private formatErrorMessage(error: ErrorObject): string {
    const { keyword, message, params } = error

    switch (keyword) {
      case 'required':
        return `Missing required property: ${(params as any).missingProperty}`
      case 'type':
        return `Expected ${(params as any).type}, but got ${typeof error.data}`
      case 'enum':
        return `Value must be one of: ${(params as any).allowedValues.join(', ')}`
      case 'minimum':
        return `Value must be >= ${(params as any).limit}`
      case 'maximum':
        return `Value must be <= ${(params as any).limit}`
      case 'minLength':
        return `String must be at least ${(params as any).limit} characters long`
      case 'maxLength':
        return `String must be at most ${(params as any).limit} characters long`
      case 'pattern':
        return `String does not match required pattern`
      case 'format':
        return `String does not match format: ${(params as any).format}`
      case 'additionalProperties':
        return `Additional property not allowed: ${(params as any).additionalProperty}`
      default:
        return message || 'Validation failed'
    }
  }

  /**
   * Generate a basic JSON schema from sample data
   */
  static generateSchemaFromData(data: JsonValue): any {
    function inferType(value: JsonValue): any {
      if (value === null) {
        return { type: 'null' }
      }
      
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return { type: 'array', items: {} }
        }
        
        // Try to infer common item type
        const itemTypes = new Set(value.map(item => {
          if (item === null) return 'null'
          if (Array.isArray(item)) return 'array'
          return typeof item
        }))
        
        if (itemTypes.size === 1) {
          const itemType = Array.from(itemTypes)[0]
          if (itemType === 'object') {
            return {
              type: 'array',
              items: inferType(value[0])
            }
          } else {
            return {
              type: 'array',
              items: { type: itemType }
            }
          }
        } else {
          return {
            type: 'array',
            items: {}
          }
        }
      }
      
      if (typeof value === 'object') {
        const properties: any = {}
        const required: string[] = []
        
        for (const [key, val] of Object.entries(value)) {
          properties[key] = inferType(val)
          required.push(key)
        }
        
        return {
          type: 'object',
          properties,
          required: required.length > 0 ? required : undefined,
          additionalProperties: false
        }
      }
      
      if (typeof value === 'string') {
        // Try to detect common formats
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return { type: 'string', format: 'date-time' }
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return { type: 'string', format: 'date' }
        }
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return { type: 'string', format: 'email' }
        }
        if (/^https?:\/\//.test(value)) {
          return { type: 'string', format: 'uri' }
        }
        return { type: 'string' }
      }
      
      return { type: typeof value }
    }
    
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      ...inferType(data)
    }
  }

  /**
   * Get common JSON schema templates
   */
  static getSchemaTemplates() {
    return {
      person: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          age: { type: 'integer', minimum: 0, maximum: 150 },
          email: { type: 'string', format: 'email' },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              zipCode: { type: 'string', pattern: '^\\d{5}(-\\d{4})?$' }
            },
            required: ['street', 'city']
          }
        },
        required: ['name', 'age']
      },
      
      product: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', minLength: 1 },
          price: { type: 'number', minimum: 0 },
          category: { 
            type: 'string',
            enum: ['electronics', 'clothing', 'books', 'home', 'sports']
          },
          inStock: { type: 'boolean' },
          tags: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['id', 'name', 'price']
      },
      
      apiResponse: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' },
          version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' }
        },
        required: ['success']
      }
    }
  }
}
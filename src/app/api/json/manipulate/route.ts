import { NextRequest, NextResponse } from 'next/server';
import { 
  addPropertyAtPath, 
  addItemAtPath, 
  deleteAtPath, 
  renamePropertyAtPath 
} from '@/lib/json-utils';
import type { JsonValue, JsonPath } from '@/components/json-canvas/types';

export const dynamic = 'force-dynamic';

// POST - Perform JSON manipulation operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.operation || !body.jsonData) {
      return NextResponse.json(
        { error: 'Missing operation or jsonData fields' },
        { status: 400 }
      );
    }

    const { operation, jsonData, path, value, key, newKey } = body;
    let result: JsonValue;

    switch (operation) {
      case 'addProperty':
        if (!path || !key || value === undefined) {
          return NextResponse.json(
            { error: 'addProperty requires path, key, and value' },
            { status: 400 }
          );
        }
        result = addPropertyAtPath(jsonData, path as JsonPath, key, value);
        break;

      case 'addItem':
        if (!path || value === undefined) {
          return NextResponse.json(
            { error: 'addItem requires path and value' },
            { status: 400 }
          );
        }
        result = addItemAtPath(jsonData, path as JsonPath, value);
        break;

      case 'delete':
        if (!path) {
          return NextResponse.json(
            { error: 'delete requires path' },
            { status: 400 }
          );
        }
        result = deleteAtPath(jsonData, path as JsonPath, key);
        break;

      case 'renameProperty':
        if (!path || !key || !newKey) {
          return NextResponse.json(
            { error: 'renameProperty requires path, key (oldKey), and newKey' },
            { status: 400 }
          );
        }
        result = renamePropertyAtPath(jsonData, path as JsonPath, key, newKey);
        break;

      case 'setValue':
        // Set value at a specific path
        result = setValueAtPath(jsonData, path as JsonPath, value);
        break;

      case 'validate':
        // Validate JSON structure
        const validation = validateJsonStructure(jsonData);
        return NextResponse.json({
          success: true,
          data: {
            isValid: validation.isValid,
            errors: validation.errors,
            originalData: jsonData
          }
        });

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        result,
        operation,
        originalData: jsonData
      }
    });

  } catch (error) {
    console.error('JSON manipulation API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to manipulate JSON',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to set value at path
function setValueAtPath(data: JsonValue, path: JsonPath, value: JsonValue): JsonValue {
  if (path.length === 0) return value;
  
  const result = JSON.parse(JSON.stringify(data)); // Deep clone
  let current = result;
  
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (current && typeof current === 'object' && segment in current) {
      current = (current as any)[segment];
    } else {
      throw new Error(`Invalid path: ${path.slice(0, i + 1).join('.')}`);
    }
  }
  
  const lastSegment = path[path.length - 1];
  if (current && typeof current === 'object') {
    (current as any)[lastSegment] = value;
  } else {
    throw new Error(`Cannot set value at path: ${path.join('.')}`);
  }
  
  return result;
}

// Helper function to validate JSON structure
function validateJsonStructure(data: JsonValue): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    // Test if it can be stringified and parsed
    const stringified = JSON.stringify(data);
    JSON.parse(stringified);
    
    // Check for circular references
    const seen = new WeakSet();
    function checkCircular(obj: any): boolean {
      if (obj && typeof obj === 'object') {
        if (seen.has(obj)) return true;
        seen.add(obj);
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && checkCircular(obj[key])) {
            return true;
          }
        }
      }
      return false;
    }
    
    if (checkCircular(data)) {
      errors.push('Circular reference detected');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
    
  } catch (error) {
    errors.push(`JSON validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      isValid: false,
      errors
    };
  }
}

// GET - Show API documentation
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/json/manipulate',
    method: 'POST',
    description: 'Perform various JSON manipulation operations',
    operations: {
      addProperty: {
        description: 'Add a new property to an object at the specified path',
        required: ['jsonData', 'path', 'key', 'value'],
        example: {
          operation: 'addProperty',
          jsonData: { user: { name: 'John' } },
          path: ['user'],
          key: 'age',
          value: 30
        }
      },
      addItem: {
        description: 'Add an item to an array at the specified path',
        required: ['jsonData', 'path', 'value'],
        example: {
          operation: 'addItem',
          jsonData: { items: ['apple', 'banana'] },
          path: ['items'],
          value: 'orange'
        }
      },
      delete: {
        description: 'Delete a property or array item at the specified path',
        required: ['jsonData', 'path'],
        optional: ['key'],
        example: {
          operation: 'delete',
          jsonData: { user: { name: 'John', age: 30 } },
          path: ['user'],
          key: 'age'
        }
      },
      renameProperty: {
        description: 'Rename a property at the specified path',
        required: ['jsonData', 'path', 'key', 'newKey'],
        example: {
          operation: 'renameProperty',
          jsonData: { user: { name: 'John' } },
          path: ['user'],
          key: 'name',
          newKey: 'fullName'
        }
      },
      setValue: {
        description: 'Set a value at the specified path',
        required: ['jsonData', 'path', 'value'],
        example: {
          operation: 'setValue',
          jsonData: { user: { name: 'John' } },
          path: ['user', 'name'],
          value: 'Jane'
        }
      },
      validate: {
        description: 'Validate JSON structure and detect issues',
        required: ['jsonData'],
        example: {
          operation: 'validate',
          jsonData: { user: { name: 'John', age: 30 } }
        }
      }
    }
  });
}
import { NextRequest, NextResponse } from 'next/server';
import type { JsonValue, Document } from '@/components/json-canvas/types';

export const dynamic = 'force-dynamic';

// Helper function to create a new document
function createNewDocument(data: JsonValue, name?: string): Document {
  const docId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  return {
    id: docId,
    name: name || `Document ${docId.slice(-4)}`,
    data: data,
    history: [data],
    currentHistoryIndex: 0,
  };
}

// POST - Create a new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.data) {
      return NextResponse.json(
        { error: 'Missing data field' },
        { status: 400 }
      );
    }

    const newDoc = createNewDocument(body.data, body.name);

    return NextResponse.json({
      success: true,
      data: newDoc
    });

  } catch (error) {
    console.error('Create document API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create document',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Show API documentation
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/documents',
    methods: {
      POST: {
        description: 'Create a new JSON document',
        parameters: {
          data: {
            type: 'any',
            required: true,
            description: 'The JSON data for the document'
          },
          name: {
            type: 'string',
            required: false,
            description: 'Optional name for the document'
          }
        },
        example: {
          request: {
            data: { "message": "Hello World", "created": "2024-01-01" },
            name: "My Document"
          },
          response: {
            success: true,
            data: {
              id: "1704067200000abc123",
              name: "My Document",
              data: { "message": "Hello World", "created": "2024-01-01" },
              history: [{ "message": "Hello World", "created": "2024-01-01" }],
              currentHistoryIndex: 0
            }
          }
        }
      }
    },
    relatedEndpoints: [
      '/api/documents/[id] - GET/PUT/DELETE specific document',
      '/api/documents/[id]/history - Manage document history'
    ]
  });
}
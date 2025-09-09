import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    name: 'JSON Canvas AI - Headless API',
    version: '1.0.0',
    description: 'RESTful API for headless interaction with JSON Canvas AI',
    documentation: {
      baseUrl: 'http://localhost:9002/api',
      endpoints: {
        models: {
          path: '/models',
          method: 'GET',
          description: 'List available AI models'
        },
        ai: {
          convertText: {
            path: '/ai/convert-text',
            methods: ['GET', 'POST'],
            description: 'Convert text to JSON using AI'
          },
          enhanceField: {
            path: '/ai/enhance-field',
            methods: ['GET', 'POST'],
            description: 'Enhance JSON field values using AI'
          },
          formatJson: {
            path: '/ai/format-json',
            methods: ['GET', 'POST'],
            description: 'Format and fix JSON using AI'
          }
        },
        documents: {
          list: {
            path: '/documents',
            methods: ['GET', 'POST'],
            description: 'List documents or create new document'
          },
          single: {
            path: '/documents/[id]',
            methods: ['GET', 'PUT', 'DELETE'],
            description: 'Manage specific document'
          }
        },
        json: {
          manipulate: {
            path: '/json/manipulate',
            methods: ['GET', 'POST'],
            description: 'Perform JSON manipulation operations'
          }
        }
      }
    },
    examples: {
      curl: {
        convertText: `curl -X POST http://localhost:9002/api/ai/convert-text \\
  -H "Content-Type: application/json" \\
  -d '{"rawText": "John, 30, Engineer\\nJane, 25, Designer", "instructions": "Create person objects"}'`,
        
        createDocument: `curl -X POST http://localhost:9002/api/documents \\
  -H "Content-Type: application/json" \\
  -d '{"data": {"message": "Hello World"}, "name": "My Document"}'`,
        
        manipulateJson: `curl -X POST http://localhost:9002/api/json/manipulate \\
  -H "Content-Type: application/json" \\
  -d '{"operation": "addProperty", "jsonData": {"user": {}}, "path": ["user"], "key": "name", "value": "John"}'`
      },
      javascript: {
        convertText: `
const response = await fetch('http://localhost:9002/api/ai/convert-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rawText: 'Apple, Banana, Cherry',
    instructions: 'Create a fruit list'
  })
});
const data = await response.json();`,
        
        createDocument: `
const response = await fetch('http://localhost:9002/api/documents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: { message: 'Hello World', created: new Date().toISOString() },
    name: 'My Document'
  })
});
const document = await response.json();`,
        
        manipulateJson: `
const response = await fetch('http://localhost:9002/api/json/manipulate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'setValue',
    jsonData: { user: { name: 'John' } },
    path: ['user', 'name'],
    value: 'Jane'
  })
});
const result = await response.json();`
      }
    },
    authentication: {
      note: 'API keys should be set as environment variables on the server',
      required: {
        GOOGLE_AI_API_KEY: 'For AI features (required)',
        OPENROUTER_API_KEY: 'For OpenRouter models (optional)',
        REQUESTY_API_KEY: 'For Requesty models (optional)'
      }
    },
    rateLimit: 'No rate limiting currently implemented',
    cors: 'CORS headers may need configuration for cross-origin requests'
  });
}
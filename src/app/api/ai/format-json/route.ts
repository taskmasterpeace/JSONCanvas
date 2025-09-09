import { NextRequest, NextResponse } from 'next/server';
import { formatJson } from '@/ai/flows/format-json-flow';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.jsonString || typeof body.jsonString !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid jsonString field' },
        { status: 400 }
      );
    }

    // Call the AI flow
    const result = await formatJson({
      jsonString: body.jsonString,
      instructions: body.instructions
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Format JSON API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to format JSON',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ai/format-json',
    method: 'POST',
    description: 'Format and fix JSON using AI',
    parameters: {
      jsonString: {
        type: 'string',
        required: true,
        description: 'The JSON string to format/fix'
      },
      instructions: {
        type: 'string',
        required: false,
        description: 'Optional instructions for formatting'
      }
    },
    example: {
      request: {
        jsonString: '{name:"John",age:30,}',
        instructions: 'Fix syntax errors and format properly'
      },
      response: {
        success: true,
        data: {
          formattedJson: '{\n  "name": "John",\n  "age": 30\n}',
          fixesApplied: 'Added missing quotes, removed trailing comma, formatted indentation'
        }
      }
    }
  });
}
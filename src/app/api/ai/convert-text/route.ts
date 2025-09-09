import { NextRequest, NextResponse } from 'next/server';
import { convertTextToJson } from '@/ai/flows/convert-text-to-json-flow';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.rawText || typeof body.rawText !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid rawText field' },
        { status: 400 }
      );
    }

    // Call the AI flow
    const result = await convertTextToJson({
      rawText: body.rawText,
      instructions: body.instructions
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Convert text to JSON API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to convert text to JSON',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to show API documentation
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ai/convert-text',
    method: 'POST',
    description: 'Convert arbitrary text to structured JSON using AI',
    parameters: {
      rawText: {
        type: 'string',
        required: true,
        description: 'The raw text to convert to JSON'
      },
      instructions: {
        type: 'string',
        required: false,
        description: 'Optional instructions for AI on how to structure the JSON'
      }
    },
    example: {
      request: {
        rawText: 'John Doe, 30, Engineer\nJane Smith, 25, Designer',
        instructions: 'Create an array of person objects'
      },
      response: {
        success: true,
        data: {
          generatedJson: '[{"name": "John Doe", "age": 30, "occupation": "Engineer"}, {"name": "Jane Smith", "age": 25, "occupation": "Designer"}]',
          notes: 'Detected tabular data and created person objects'
        }
      }
    }
  });
}
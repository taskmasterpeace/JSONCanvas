import { NextRequest, NextResponse } from 'next/server';
import { enhanceJsonField } from '@/ai/flows/enhance-json-field';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.fieldContent) {
      return NextResponse.json(
        { error: 'Missing fieldContent field' },
        { status: 400 }
      );
    }

    if (!body.userPrompt) {
      return NextResponse.json(
        { error: 'Missing userPrompt field' },
        { status: 400 }
      );
    }

    // Call the AI flow
    const result = await enhanceJsonField({
      fieldContent: body.fieldContent,
      userPrompt: body.userPrompt
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Enhance field API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to enhance JSON field',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ai/enhance-field',
    method: 'POST',
    description: 'Enhance a JSON field value using AI',
    parameters: {
      fieldContent: {
        type: 'string',
        required: true,
        description: 'The content of the JSON field to enhance'
      },
      userPrompt: {
        type: 'string',
        required: true,
        description: 'Instructions for the AI on how to enhance the content'
      }
    },
    example: {
      request: {
        fieldContent: 'Basic product description',
        userPrompt: 'Make it more detailed and marketing-friendly for an e-commerce site'
      },
      response: {
        success: true,
        data: {
          enhancedContent: 'Premium quality product with exceptional features designed to exceed your expectations...'
        }
      }
    }
  });
}
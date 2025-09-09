import { NextRequest, NextResponse } from 'next/server';
import type { JsonValue, Document } from '@/components/json-canvas/types';

export const dynamic = 'force-dynamic';

interface DocumentStore {
  [key: string]: Document;
}

// In-memory store for demo purposes - in production, use a proper database
let documentStore: DocumentStore = {};

// GET - Retrieve a specific document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = documentStore[id];
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('Get document API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve document' },
      { status: 500 }
    );
  }
}

// PUT - Update a document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existingDoc = documentStore[id];
    
    if (!existingDoc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update document with new data
    const updatedDoc: Document = {
      ...existingDoc,
      data: body.data || existingDoc.data,
      name: body.name || existingDoc.name,
      history: body.addToHistory && body.data 
        ? [...existingDoc.history.slice(0, existingDoc.currentHistoryIndex + 1), body.data]
        : existingDoc.history,
      currentHistoryIndex: body.addToHistory && body.data 
        ? existingDoc.currentHistoryIndex + 1 
        : existingDoc.currentHistoryIndex
    };

    documentStore[id] = updatedDoc;

    return NextResponse.json({
      success: true,
      data: updatedDoc
    });

  } catch (error) {
    console.error('Update document API error:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!documentStore[id]) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    delete documentStore[id];

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
# 🧠 Visual Memory System - Implementation Plan

## 🎯 Overview
Transform your JSON Canvas into a **Visual Memory System** where AI can edit files and you can see exactly what it knows, when it learned it, and how confident it is about each piece of information.

## 📊 Current State vs. Target State

### Current JSON Canvas
```
Regular JSON → Tree View → Manual Editing
```

### Visual Memory System
```
.jsoncanvas → Spatial Layout → AI Integration → Visual Memory
                    ↓
[Treemap View] [Confidence Indicators] [AI Timeline] [Smart Suggestions]
```

## 🔧 Implementation Steps

### Phase 1: JSONCanvas File Support

#### 1. Update File Detection
**Location**: `src/app/page.tsx`

```typescript
// Add JSONCanvas detection
const isJSONCanvasFile = (data: any): data is JSONCanvasFile => {
  return data.$schema === "jsoncanvas/v1.0" && data.$metadata && data.data;
};

// Update file import handler
const handleFileImportToNewDocument = (event: React.ChangeEvent<HTMLInputElement>) => {
  // ... existing code ...
  
  try {
    const importedData = JSON.parse(content);
    
    let documentData: JsonValue;
    let documentName: string;
    
    if (isJSONCanvasFile(importedData)) {
      // Handle .jsoncanvas files
      documentData = importedData.data;
      documentName = importedData.$metadata.title || file.name.replace(/\.jsoncanvas$/i, '');
      
      // Store metadata separately for visual memory features
      setCanvasMetadata(importedData.$metadata);
    } else {
      // Handle regular JSON files
      documentData = importedData;
      documentName = file.name.replace(/\.json$/i, '');
    }
    
    const newDoc = createNewDocument(documentData, documentName);
    // ... rest of existing code ...
  }
};
```

#### 2. Add JSONCanvas Types
**Location**: `src/components/json-canvas/types.ts`

```typescript
// Add all the JSONCanvas types from the spec
export interface JSONCanvasFile {
  $schema: "jsoncanvas/v1.0";
  $metadata: CanvasMetadata;
  data: JsonValue;
}

export interface CanvasMetadata {
  // ... (complete types from spec)
}

// Add to existing Document interface
export interface Document {
  id: string;
  name: string;
  data: JsonValue;
  history: JsonValue[];
  currentHistoryIndex: number;
  // NEW: JSONCanvas metadata
  canvasMetadata?: CanvasMetadata;
}
```

### Phase 2: Visual Memory Components

#### 1. Layout Switcher Component
**Location**: `src/components/json-canvas/layout-switcher.tsx`

```typescript
interface LayoutSwitcherProps {
  currentLayout: string;
  onLayoutChange: (layout: string) => void;
  availableLayouts: string[];
}

export const LayoutSwitcher = ({ currentLayout, onLayoutChange, availableLayouts }: LayoutSwitcherProps) => {
  return (
    <div className="flex gap-2 p-2 bg-card rounded-lg">
      <Button 
        variant={currentLayout === 'spatial-treemap' ? 'default' : 'outline'}
        onClick={() => onLayoutChange('spatial-treemap')}
      >
        <LayoutGrid className="w-4 h-4 mr-2" />
        Spatial
      </Button>
      <Button 
        variant={currentLayout === 'tabbed-hierarchy' ? 'default' : 'outline'}
        onClick={() => onLayoutChange('tabbed-hierarchy')}
      >
        <Tabs className="w-4 h-4 mr-2" />
        Tabbed
      </Button>
      <Button 
        variant={currentLayout === 'tree' ? 'default' : 'outline'}
        onClick={() => onLayoutChange('tree')}
      >
        <ListTree className="w-4 h-4 mr-2" />
        Tree
      </Button>
    </div>
  );
};
```

#### 2. Spatial Treemap Component
**Location**: `src/components/json-canvas/spatial-treemap.tsx`

```typescript
import React from 'react';
import { CanvasMetadata } from './types';

interface SpatialTreemapProps {
  data: JsonValue;
  metadata: CanvasMetadata;
  onRoomClick: (roomId: string) => void;
}

export const SpatialTreemap = ({ data, metadata, onRoomClick }: SpatialTreemapProps) => {
  const { spatial, ai } = metadata;
  
  return (
    <div className="w-full h-96 bg-gray-50 rounded-lg relative overflow-hidden">
      <svg viewBox={`0 0 ${spatial.bounds.width} ${spatial.bounds.height}`} className="w-full h-full">
        {spatial.rooms.map(room => {
          const confidence = calculateRoomConfidence(room.id, data, ai);
          const color = getConfidenceColor(confidence, metadata.display.theme.confidenceColors);
          
          return (
            <g key={room.id} onClick={() => onRoomClick(room.id)} className="cursor-pointer">
              <rect
                x={room.x}
                y={room.y} 
                width={room.width}
                height={room.height}
                fill={color}
                stroke="#333"
                strokeWidth="2"
                className="hover:opacity-80 transition-opacity"
              />
              <text
                x={room.x + room.width / 2}
                y={room.y + room.height / 2}
                textAnchor="middle"
                className="fill-white font-semibold text-sm"
              >
                {room.name}
              </text>
              <text
                x={room.x + room.width / 2}
                y={room.y + room.height / 2 + 20}
                textAnchor="middle"
                className="fill-white text-xs"
              >
                AI: {confidence}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
```

#### 3. AI Confidence Indicator
**Location**: `src/components/json-canvas/confidence-indicator.tsx`

```typescript
interface ConfidenceIndicatorProps {
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const ConfidenceIndicator = ({ confidence, size = 'md', showText = true }: ConfidenceIndicatorProps) => {
  const getColor = (conf: number) => {
    if (conf >= 80) return 'text-green-600 bg-green-100';
    if (conf >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3', 
    lg: 'w-4 h-4'
  };
  
  return (
    <div className="flex items-center gap-1">
      <div className={`rounded-full ${getColor(confidence)} ${sizeClasses[size]}`} />
      {showText && (
        <span className={`text-xs ${getColor(confidence).split(' ')[0]}`}>
          {confidence}%
        </span>
      )}
    </div>
  );
};
```

#### 4. AI Activity Timeline
**Location**: `src/components/json-canvas/ai-timeline.tsx`

```typescript
interface AITimelineProps {
  learningHistory: LearningEvent[];
  insights: AIInsight[];
  onEventClick?: (event: LearningEvent | AIInsight) => void;
}

export const AITimeline = ({ learningHistory, insights, onEventClick }: AITimelineProps) => {
  const allEvents = [...learningHistory, ...insights]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10); // Show last 10 events
    
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Learning Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allEvents.map((event, index) => (
            <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                 onClick={() => onEventClick?.(event)}>
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {'event' in event ? `AI ${event.event}` : event.title}
                </div>
                <div className="text-xs text-gray-600">
                  {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                </div>
                {'path' in event && (
                  <div className="text-xs text-blue-600 font-mono">{event.path}</div>
                )}
              </div>
              {'confidence' in event && (
                <ConfidenceIndicator confidence={event.confidence} size="sm" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

### Phase 3: Enhanced JsonTreeEditor

#### Update Main Editor
**Location**: `src/components/json-canvas/json-tree-editor.tsx`

```typescript
interface JsonTreeEditorProps {
  jsonData: JsonValue;
  onJsonChange: (newJson: JsonValue) => void;
  title?: string;
  getApiKey: () => string | null;
  // NEW: Canvas metadata for visual memory features
  canvasMetadata?: CanvasMetadata;
  onMetadataChange?: (metadata: CanvasMetadata) => void;
}

export const JsonTreeEditor = React.memo(function JsonTreeEditor({ 
  jsonData, 
  onJsonChange, 
  title, 
  getApiKey,
  canvasMetadata,
  onMetadataChange 
}: JsonTreeEditorProps) {
  const [currentLayout, setCurrentLayout] = useState(
    canvasMetadata?.display.primaryLayout || 'tree'
  );
  
  const handleLayoutChange = (newLayout: string) => {
    setCurrentLayout(newLayout);
    if (canvasMetadata && onMetadataChange) {
      onMetadataChange({
        ...canvasMetadata,
        display: {
          ...canvasMetadata.display,
          primaryLayout: newLayout as any
        }
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            {canvasMetadata ? <Brain className="w-5 h-5" /> : <TreeIcon className="w-5 h-5" />}
            {title}
            {canvasMetadata && (
              <ConfidenceIndicator 
                confidence={canvasMetadata.ai.globalConfidence} 
                size="sm" 
              />
            )}
          </CardTitle>
          
          {canvasMetadata && (
            <LayoutSwitcher
              currentLayout={currentLayout}
              onLayoutChange={handleLayoutChange}
              availableLayouts={['spatial-treemap', 'tabbed-hierarchy', 'tree']}
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Render different layouts based on selection */}
        {currentLayout === 'spatial-treemap' && canvasMetadata?.structure.spatial ? (
          <SpatialTreemap 
            data={jsonData} 
            metadata={canvasMetadata}
            onRoomClick={(roomId) => {
              // Navigate to room data
              console.log('Navigate to room:', roomId);
            }}
          />
        ) : currentLayout === 'tabbed-hierarchy' ? (
          <TabbedHierarchyView 
            data={jsonData}
            metadata={canvasMetadata}
          />
        ) : (
          // Default tree view (existing code)
          <div>
            {/* Existing tree view implementation */}
          </div>
        )}
        
        {/* AI Timeline sidebar */}
        {canvasMetadata && (
          <div className="mt-4">
            <AITimeline 
              learningHistory={canvasMetadata.ai.learningHistory}
              insights={canvasMetadata.ai.insights}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
});
```

### Phase 4: AI Integration Enhancement

#### Update AI Flows for Metadata
**Location**: `src/ai/flows/enhance-with-metadata.ts`

```typescript
export async function enhanceJSONWithMetadata(
  data: JsonValue,
  metadata?: CanvasMetadata
): Promise<{ data: JsonValue; metadata: CanvasMetadata }> {
  
  // Generate confidence scores for all fields
  const fieldMetadata = await generateFieldConfidence(data);
  
  // Generate AI insights
  const insights = await generateInsights(data);
  
  // Create/update metadata
  const updatedMetadata: CanvasMetadata = {
    ...metadata,
    version: "1.0",
    lastModified: new Date().toISOString(),
    ai: {
      globalConfidence: calculateGlobalConfidence(fieldMetadata),
      lastAIUpdate: new Date().toISOString(),
      insights,
      fieldMetadata,
      learningHistory: metadata?.ai.learningHistory || [],
      suggestions: await generateSuggestions(data)
    }
  };
  
  return { data, metadata: updatedMetadata };
}
```

### Phase 5: Export Enhancement

#### Update Export Function
**Location**: `src/app/page.tsx`

```typescript
const handleExportAsJSONCanvas = () => {
  if (!activeDocument) return;
  
  const jsonCanvasFile: JSONCanvasFile = {
    $schema: "jsoncanvas/v1.0",
    $metadata: activeDocument.canvasMetadata || generateDefaultMetadata(),
    data: activeDocument.data
  };
  
  const jsonString = JSON.stringify(jsonCanvasFile, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${activeDocument.name}.jsoncanvas`;
  link.click();
  
  URL.revokeObjectURL(url);
};
```

## 🎯 Final Result: Your Visual Memory System

### What You'll Have:
1. **Spatial Room Layout** - See your house as connected rooms with AI confidence levels
2. **AI Learning Timeline** - Watch what AI discovers and when
3. **Confidence Indicators** - Visual feedback on AI certainty levels
4. **Smart Suggestions** - AI recommendations for missing data
5. **Enhanced File Format** - .jsoncanvas files with display metadata

### User Experience:
```
1. Import your house JSON → AI analyzes and adds confidence scores
2. View in spatial layout → See rooms sized by data richness
3. Click rooms → Drill down into hierarchical data
4. Watch AI timeline → See learning progress over time
5. Edit anything → AI updates confidence automatically
6. Export as .jsoncanvas → Save with all visual memory metadata
```

### For Your House Data Specifically:
- **Rooms as spatial rectangles** with confidence color-coding
- **AI tracks what it knows** about each room, appliance, system
- **Visual indicators** show what needs verification
- **Timeline shows AI discoveries** ("learned coffee maker model from photo")
- **Suggestions panel** recommends missing inventory items

This creates exactly what you wanted: a **visual memory system** where you can see what AI knows about your house, when it learned it, and how confident it is about each piece of information! 🧠✨
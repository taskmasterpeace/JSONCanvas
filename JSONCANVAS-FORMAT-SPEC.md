# 📋 JSONCanvas Format Specification v1.0

## Overview
`.jsoncanvas` files are enhanced JSON files that include display metadata, AI interaction history, and layout configuration for optimal visualization in the JSON Canvas AI application.

## File Structure

```typescript
interface JSONCanvasFile {
  // Required JSONCanvas metadata
  $schema: "jsoncanvas/v1.0";
  $metadata: CanvasMetadata;
  
  // Your actual data
  data: any;
}
```

## Complete Format Definition

```typescript
interface CanvasMetadata {
  // === CORE METADATA ===
  version: "1.0";
  created: string; // ISO 8601 timestamp
  lastModified: string; // ISO 8601 timestamp
  title?: string; // User-friendly name
  description?: string;
  
  // === DISPLAY CONFIGURATION ===
  display: {
    // Primary layout type
    primaryLayout: "spatial-treemap" | "tabbed-hierarchy" | "floor-plan" | "card-grid" | "timeline";
    
    // Visual theme
    theme: {
      colorScheme: "light" | "dark" | "auto";
      accentColor: string; // hex color
      confidenceColors: {
        high: string;    // 80-100% confidence
        medium: string;  // 50-79% confidence  
        low: string;     // 0-49% confidence
        verified: string; // User-verified
      };
    };
    
    // Layout-specific settings
    layoutConfig: {
      // For spatial-treemap
      treemap?: {
        aspectRatio: number;
        padding: number;
        minRoomSize: number;
        showLabels: boolean;
      };
      
      // For tabbed-hierarchy
      tabs?: {
        defaultTab: string;
        tabOrder: string[];
        showTabIcons: boolean;
      };
      
      // For floor-plan
      floorPlan?: {
        scale: number;
        gridSize: number;
        showGrid: boolean;
        roomShapes: Record<string, RoomShape>;
      };
      
      // For card-grid
      cardGrid?: {
        cardsPerRow: number;
        cardSize: "small" | "medium" | "large";
        showPreview: boolean;
      };
    };
  };
  
  // === ORGANIZATION STRUCTURE ===
  structure: {
    // Define how data should be grouped
    grouping: {
      primary: "room" | "system" | "category" | "custom";
      secondary?: "alphabetical" | "recent" | "confidence" | "size";
      customGroups?: GroupDefinition[];
    };
    
    // Hierarchical relationships
    hierarchy: {
      levels: HierarchyLevel[];
      relationships: Relationship[];
    };
    
    // Spatial information (for house data)
    spatial?: {
      type: "house" | "building" | "facility";
      bounds: { width: number; height: number };
      rooms: SpatialRoom[];
      connections: RoomConnection[];
    };
  };
  
  // === AI INTERACTION TRACKING ===
  ai: {
    // Overall AI confidence in this document
    globalConfidence: number; // 0-100
    
    // Last AI interaction
    lastAIUpdate: string; // ISO 8601 timestamp
    
    // AI-generated insights
    insights: AIInsight[];
    
    // Field-level AI metadata
    fieldMetadata: Record<string, FieldAIData>;
    
    // AI learning history
    learningHistory: LearningEvent[];
    
    // AI suggestions for missing data
    suggestions: AISuggestion[];
  };
  
  // === USER PREFERENCES ===
  userPreferences: {
    // Preferred views
    defaultView: string;
    favoriteRooms: string[];
    hiddenSections: string[];
    
    // Interaction preferences
    autoSave: boolean;
    showConfidence: boolean;
    enableAISuggestions: boolean;
    
    // Custom shortcuts
    quickActions: QuickAction[];
  };
  
  // === CHANGE TRACKING ===
  changeLog: ChangeLogEntry[];
}

// Supporting type definitions
interface RoomShape {
  type: "rectangle" | "polygon" | "circle";
  coordinates: number[];
  color?: string;
}

interface GroupDefinition {
  id: string;
  name: string;
  description: string;
  criteria: string; // JSONPath expression
  icon?: string;
  color?: string;
}

interface HierarchyLevel {
  level: number;
  name: string;
  field: string; // JSONPath to the field
  displayName?: string;
  icon?: string;
}

interface Relationship {
  type: "parent-child" | "sibling" | "reference" | "contains";
  from: string; // JSONPath
  to: string;   // JSONPath
  label?: string;
}

interface SpatialRoom {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floor?: number;
  type?: string; // "bedroom", "kitchen", etc.
}

interface RoomConnection {
  room1: string;
  room2: string;
  type: "door" | "opening" | "stairs" | "hallway";
  bidirectional: boolean;
}

interface AIInsight {
  id: string;
  timestamp: string;
  type: "discovery" | "pattern" | "suggestion" | "verification";
  title: string;
  description: string;
  confidence: number;
  relatedPaths: string[]; // JSONPaths this insight relates to
}

interface FieldAIData {
  confidence: number; // 0-100
  lastUpdated: string;
  source: "ai-generated" | "ai-enhanced" | "user-input" | "ai-verified";
  notes?: string;
  suggestions?: string[];
}

interface LearningEvent {
  timestamp: string;
  event: "learned" | "updated" | "verified" | "corrected";
  path: string; // JSONPath
  oldValue?: any;
  newValue?: any;
  method: string; // "text-analysis", "image-recognition", "user-input", etc.
  confidence: number;
}

interface AISuggestion {
  id: string;
  timestamp: string;
  type: "missing-data" | "inconsistency" | "optimization" | "maintenance";
  title: string;
  description: string;
  suggestedAction: string;
  path?: string; // JSONPath if applicable
  priority: "low" | "medium" | "high";
  estimatedEffort: "easy" | "medium" | "complex";
}

interface QuickAction {
  id: string;
  name: string;
  description: string;
  action: "add-item" | "update-field" | "ai-enhance" | "take-photo" | "custom";
  params?: Record<string, any>;
  icon?: string;
  hotkey?: string;
}

interface ChangeLogEntry {
  timestamp: string;
  user: string; // "ai" or user identifier
  action: "create" | "update" | "delete" | "enhance" | "verify";
  path: string; // JSONPath
  oldValue?: any;
  newValue?: any;
  notes?: string;
}
```

## Example .jsoncanvas File

```json
{
  "$schema": "jsoncanvas/v1.0",
  "$metadata": {
    "version": "1.0",
    "created": "2024-01-01T00:00:00Z",
    "lastModified": "2024-01-15T14:30:00Z",
    "title": "My House - Visual Memory",
    "description": "Complete house inventory and systems information",
    
    "display": {
      "primaryLayout": "spatial-treemap",
      "theme": {
        "colorScheme": "light",
        "accentColor": "#667eea",
        "confidenceColors": {
          "high": "#10b981",
          "medium": "#f59e0b", 
          "low": "#ef4444",
          "verified": "#3b82f6"
        }
      },
      "layoutConfig": {
        "treemap": {
          "aspectRatio": 1.6,
          "padding": 4,
          "minRoomSize": 100,
          "showLabels": true
        }
      }
    },
    
    "structure": {
      "grouping": {
        "primary": "room",
        "secondary": "recent"
      },
      "hierarchy": {
        "levels": [
          { "level": 0, "name": "House", "field": "$", "displayName": "Entire House" },
          { "level": 1, "name": "Floor", "field": "floors.*", "displayName": "Floor" },
          { "level": 2, "name": "Room", "field": "floors.*.rooms.*", "displayName": "Room" },
          { "level": 3, "name": "Items", "field": "floors.*.rooms.*.items.*", "displayName": "Item" }
        ],
        "relationships": [
          { "type": "parent-child", "from": "floors", "to": "floors.*.rooms" },
          { "type": "contains", "from": "floors.*.rooms", "to": "floors.*.rooms.*.items" }
        ]
      },
      "spatial": {
        "type": "house",
        "bounds": { "width": 2400, "height": 1600 },
        "rooms": [
          { "id": "kitchen", "name": "Kitchen", "x": 0, "y": 0, "width": 400, "height": 300, "floor": 1, "type": "kitchen" },
          { "id": "living", "name": "Living Room", "x": 400, "y": 0, "width": 500, "height": 400, "floor": 1, "type": "living" }
        ],
        "connections": [
          { "room1": "kitchen", "room2": "living", "type": "opening", "bidirectional": true }
        ]
      }
    },
    
    "ai": {
      "globalConfidence": 87,
      "lastAIUpdate": "2024-01-15T14:30:00Z",
      "insights": [
        {
          "id": "insight_001",
          "timestamp": "2024-01-15T10:00:00Z",
          "type": "discovery",
          "title": "Kitchen has professional-grade appliances",
          "description": "Detected high-end appliance brands suggesting cooking enthusiasm",
          "confidence": 92,
          "relatedPaths": ["floors.first.rooms.kitchen.appliances"]
        }
      ],
      "fieldMetadata": {
        "floors.first.rooms.kitchen.appliances.refrigerator": {
          "confidence": 95,
          "lastUpdated": "2024-01-15T14:30:00Z",
          "source": "user-input",
          "notes": "User confirmed model number"
        }
      },
      "suggestions": [
        {
          "id": "suggest_001",
          "timestamp": "2024-01-15T14:30:00Z",
          "type": "missing-data",
          "title": "Missing bathroom inventory",
          "description": "No items catalogued in master bathroom",
          "suggestedAction": "Add bathroom inventory or take photos for AI analysis",
          "path": "floors.first.rooms.master_bathroom.items",
          "priority": "medium",
          "estimatedEffort": "easy"
        }
      ]
    },
    
    "userPreferences": {
      "defaultView": "treemap",
      "favoriteRooms": ["kitchen", "home_office"],
      "showConfidence": true,
      "enableAISuggestions": true,
      "quickActions": [
        {
          "id": "quick_add_item",
          "name": "Add Item",
          "description": "Quickly add item to current room",
          "action": "add-item",
          "icon": "plus",
          "hotkey": "a"
        }
      ]
    }
  },
  
  "data": {
    "house_info": {
      "address": "123 Main St",
      "built": 1995,
      "size": 2400,
      "style": "Colonial"
    },
    "floors": {
      "first": {
        "rooms": {
          "kitchen": {
            "size": "12x14",
            "appliances": {
              "refrigerator": {
                "brand": "Samsung",
                "model": "RF28T5101SR",
                "purchased": "2023-03-15",
                "warranty_expires": "2025-03-15"
              },
              "stove": {
                "brand": "GE",
                "type": "gas",
                "purchased": "2022-08-10"
              }
            },
            "items": {
              "cookware": ["cast iron pan", "stainless steel set"],
              "small_appliances": ["coffee maker", "toaster", "blender"]
            }
          },
          "living_room": {
            "size": "16x18",
            "furniture": {
              "sofa": {
                "brand": "West Elm",
                "color": "navy",
                "purchased": "2023-01-20"
              },
              "tv": {
                "brand": "LG",
                "model": "OLED55C1PUB",
                "size": "55 inch"
              }
            }
          }
        }
      }
    }
  }
}
```

## Implementation in JSON Canvas

### 1. File Detection
```typescript
// Detect .jsoncanvas files
function isJSONCanvasFile(data: any): boolean {
  return data.$schema === "jsoncanvas/v1.0" && data.$metadata && data.data;
}
```

### 2. Enhanced UI Components
- `CanvasLayoutSwitcher` - Switch between layout modes
- `ConfidenceVisualization` - Show AI confidence levels
- `SpatialTreeMapView` - Interactive treemap layout
- `AIInsightPanel` - Display AI discoveries and suggestions
- `QuickActionBar` - User-defined quick actions

### 3. AI Integration
- Automatically add confidence scores to new data
- Track AI learning in `learningHistory`
- Generate suggestions based on patterns
- Update `fieldMetadata` on every AI interaction

### 4. File Operations
```typescript
// Save with .jsoncanvas extension
function saveAsJSONCanvas(data: any, metadata: CanvasMetadata) {
  return {
    $schema: "jsoncanvas/v1.0",
    $metadata: metadata,
    data: data
  };
}

// Import regular JSON and convert
function convertToJSONCanvas(regularJson: any): JSONCanvasFile {
  return {
    $schema: "jsoncanvas/v1.0", 
    $metadata: generateDefaultMetadata(),
    data: regularJson
  };
}
```

This format gives you a complete visual memory system where AI can track what it knows, when it learned it, and how confident it is, while providing rich visualization options specifically designed for house/building data.
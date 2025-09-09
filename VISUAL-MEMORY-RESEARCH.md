# Visual Memory System - Research & Design

## 🎯 Best UI Patterns for House Data Visualization (2024)

### **1. Spatial Tree Maps** ⭐ RECOMMENDED
- **Perfect for house data**: Each room = rectangle, size shows importance/activity
- **Nested structure**: House → Floors → Rooms → Items
- **Interactive**: Click to zoom into rooms, hover for details
- **AI-friendly**: Easy for AI to update spatial relationships

### **2. Progressive Disclosure Tabs**
- **Main tabs**: Floors, Systems (HVAC, Electrical), Maintenance, Inventory
- **Sub-tabs**: Per room, per system type
- **Smart grouping**: AI can create logical groupings automatically
- **Context switching**: Easy to see "what AI knows" per area

### **3. Interactive Floor Plan + Data Overlay**
- **Visual floor plan**: SVG-based room layouts
- **Data hotspots**: Click rooms to see hierarchical data
- **Status indicators**: Colors show recent AI updates
- **Layered information**: Toggle between physical, digital, maintenance views

### **4. Card-Grid Hybrid Layout**
- **Room cards**: Each room is a card with key metrics
- **Expandable details**: Click to see full JSON tree
- **AI activity feed**: Shows recent changes per room
- **Smart filtering**: By room type, recent updates, AI confidence level

### **5. Timeline + Hierarchy View**
- **Temporal axis**: When things were added/updated
- **Hierarchical depth**: Expand to see item details
- **AI interaction history**: Visual timeline of AI edits
- **Change tracking**: What AI learned when

## 🏠 House Data Display Strategies

### **Spatial Organization**
```
House Level:
├─ Living Areas (Kitchen, Living Room, Dining)
├─ Private Areas (Bedrooms, Bathrooms) 
├─ Utility Areas (Garage, Basement, Attic)
├─ Systems (HVAC, Electrical, Plumbing)
└─ Maintenance (Tasks, History, Schedules)
```

### **Information Layering**
1. **Physical Layer**: Room dimensions, fixtures, layout
2. **Content Layer**: Furniture, belongings, inventory
3. **System Layer**: Wiring, plumbing, HVAC zones
4. **Temporal Layer**: When installed, last maintained, AI updates
5. **AI Layer**: Confidence scores, learning history, suggestions

## 🤖 AI Visual Memory Requirements

### **What AI Needs to Track**
- **Confidence levels** per data point
- **Last updated** timestamps  
- **Source of information** (user input, inference, observation)
- **Relationships discovered** between items/rooms
- **Maintenance predictions** and schedules
- **Usage patterns** and optimizations

### **What User Needs to See**
- **What AI knows** vs. what it's uncertain about
- **Recent changes** and learning activity
- **AI suggestions** for missing information
- **Confidence visualization** (color coding, progress bars)
- **Easy editing** of AI assumptions

## 🎨 Visual Design Principles

### **Color Coding System**
- 🟢 **High confidence AI data**
- 🟡 **Medium confidence/needs verification**  
- 🔴 **Low confidence/AI suggestions**
- 🔵 **User-verified data**
- ⚫ **System-generated data**

### **Interactive Elements**
- **Hover states**: Show AI confidence and last update
- **Click-to-edit**: Direct inline editing of any value
- **Drag-and-drop**: Move items between rooms
- **Context menus**: AI actions (enhance, verify, suggest)

### **Progressive Disclosure**
- **Summary view**: Key metrics per room
- **Detail view**: Full hierarchical data
- **Raw view**: Pure JSON for technical users
- **AI view**: Confidence scores and learning history

## 📋 Recommended Layout Combinations

### **Primary Layout: Spatial Tree Map + Tabs**
```
[House Overview] [Recent Changes] [AI Activity] [Settings]
┌─────────────────┬─────────────────┬──────────────────┐
│     Kitchen     │   Living Room   │    Dining Room   │
│   AI: 95% ✓     │   AI: 87% ?     │    AI: 92% ✓     │
│   Items: 23     │   Items: 15     │    Items: 8      │
├─────────────────┼─────────────────┼──────────────────┤
│   Bedroom 1     │   Bedroom 2     │    Bathroom      │
│   AI: 78% ?     │   AI: 91% ✓     │    AI: 85% ✓     │
│   Items: 31     │   Items: 19     │    Items: 12     │
└─────────────────┴─────────────────┴──────────────────┘
```

### **Secondary Layout: Timeline + Hierarchy**
```
Recent AI Activity:
├─ 2h ago: Updated Kitchen inventory (+3 items)
├─ 1d ago: Learned Living Room TV model from photo
├─ 3d ago: Scheduled HVAC maintenance reminder
└─ 1w ago: Discovered new ethernet cable in office
```

### **Detail Layout: Multi-Column**
```
┌─ Room: Kitchen ─┬─ AI Insights ──┬─ Actions ────┐
│ Physical Info   │ Confidence: 95%│ • Edit Items │
│ • Size: 12x14   │ Last AI Update │ • Add Photo  │
│ • Appliances: 6 │ • 2 hours ago  │ • AI Enhance │
│ • Outlets: 8    │ Suggestions    │ • Verify All │
│                 │ • Add spice    │              │
│ Contents (23)   │   inventory    │              │
│ ├─ Appliances   │ • Check exp.   │              │
│ ├─ Cookware     │   dates        │              │
│ ├─ Food Items   │                │              │
│ └─ Cleaning     │                │              │
└─────────────────┴────────────────┴──────────────┘
```

## 🔧 Technical Implementation Strategy

### **Component Architecture**
- `VisualMemoryLayout` - Main container with layout switching
- `SpatialTreeMap` - Interactive room rectangles
- `RoomDetailPanel` - Expandable room information
- `AIActivityFeed` - Timeline of AI changes
- `ConfidenceIndicator` - Visual confidence display
- `QuickEditModal` - Inline editing interface

### **Data Flow**
1. Load `.jsoncanvas` file with display metadata
2. AI processes and adds confidence scores
3. User sees visual layout with AI insights
4. User edits → AI learns → Updates confidence
5. Save updated `.jsoncanvas` with new metadata

This approach gives you a powerful visual memory system where you can see exactly what AI knows about your house, when it learned it, and how confident it is about each piece of information.
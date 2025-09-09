# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JSON Canvas AI is a Next.js web application for visually editing, enhancing, and managing complex JSON documents. It features AI-powered capabilities through Google's Genkit framework and includes a multi-document interface with persistent local storage.

## Development Commands

- **Development server**: `npm run dev` (runs on port 9002)
- **Build**: `npm run build`
- **Start production**: `npm start` 
- **Lint**: `npm run lint`
- **Type checking**: `npm run typecheck`
- **Testing**: `npm run test` (Jest with React Testing Library)
- **Test watch mode**: `npm run test:watch`
- **Test coverage**: `npm run test:coverage`
- **Genkit development**: `npm run genkit:dev` (for AI flow development)
- **Genkit with watch mode**: `npm run genkit:watch`

## Environment Setup

1. Copy `.env.example` to `.env`
2. Set `GOOGLE_AI_API_KEY` for AI features (required for AI functionality)
3. Optional: Configure `OPENROUTER_API_KEY` or `REQUESTY_API_KEY` for alternative AI providers
4. Set `MODEL_PROVIDER` to switch between providers (openrouter, requesty, google)

## Architecture Overview

### Core Structure
- **Next.js App Router**: Uses `src/app/` structure with `layout.tsx` and `page.tsx`
- **Component Architecture**: Primary UI components in `src/components/json-canvas/`
- **AI Integration**: Genkit flows in `src/ai/flows/` for text-to-JSON conversion, enhancement, and formatting
- **Styling**: TailwindCSS with shadcn/ui components in `src/components/ui/`

### Key Components
- **JsonTreeEditor** (`json-tree-editor.tsx`): Main JSON editing interface with tree/card views
- **DocumentSidebar** (`document-sidebar.tsx`): Multi-document management
- **Header** (`header.tsx`): Top navigation and controls
- **AI Dialogs**: API key management, quick import, and full JSON editing modals

### AI Features
- **JSON Generation Wizard**: Intelligent JSON creation system with:
  - Natural language input processing ("create a user profile system")
  - Creativity levels (conservative, balanced, creative, experimental)
  - Complexity settings (simple, moderate, complex, enterprise)
  - Domain-specific intelligence (e-commerce, healthcare, gaming, etc.)
  - AI-generated follow-up questions and expansion suggestions
  - Quick generators for common use cases

- **Contextual Enhancement System**: AI-powered JSON element improvement:
  - Right-click any JSON element to enhance it contextually
  - Natural language commands ("expand this array", "make this more detailed")
  - Hierarchical enhancement that considers parent and sibling contexts
  - Smart suggestions based on existing patterns and data relationships
  - Real-time preview of enhancements before applying

- **Multi-Provider AI Support**: Flexible AI provider system supporting:
  - Google AI (Gemini) - Advanced reasoning and JSON generation
  - OpenAI (GPT) via OpenRouter - Creative and detailed responses  
  - Anthropic (Claude) via OpenRouter - Safety and instruction following
  - Together AI - Cost-effective open source models
  - Auto-fallback between providers for reliability
  - Provider-specific optimizations and feature utilization

- **Advanced Prompting**: Enhanced AI flows using Anthropic's latest prompting strategies:
  - XML-style tags for better instruction following
  - Multishot prompting with diverse examples
  - Role-based prompts with clear task definitions
  - Structured output formatting with detailed rules
  - Context-aware enhancement with sibling relationship analysis

- **Enhanced Flows**: Next-generation AI processing including:
  - `generative-json-wizard.ts` - Intelligent JSON structure generation
  - `contextual-json-enhance.ts` - Context-aware JSON element enhancement
  - `convert-text-to-json-flow.ts` - Semantic text-to-JSON conversion
  - `enhance-json-field.ts` - Field-level content improvement
  - `format-json-flow.ts` - JSON formatting and error correction

### Data Management
- **Local Storage**: All documents and user preferences stored in browser localStorage
- **Document System**: Multi-document interface with individual undo/redo histories
- **State Management**: React state with custom hooks for persistence

### Theming & Styling
- **Design System**: Uses vibrant indigo (#667eea), lavender background (#f0f2f9), and bold purple (#9370db)
- **Dark Mode**: Toggle-able theme with localStorage persistence
- **Responsive**: Mobile-friendly with collapsible sidebar

## Testing & Quality Assurance

### Test Framework
- **Jest**: Main testing framework with React Testing Library
- **Coverage**: Configured with 70% threshold for branches, functions, lines, and statements
- **Test Files**: Located in `__tests__` directories and `.test.ts/.spec.ts` files
- **Mocking**: Pre-configured mocks for Next.js router, localStorage, and browser APIs

### Error Handling
- **Error Boundaries**: React Error Boundaries wrap key components to prevent app crashes
- **Performance Monitoring**: Built-in hooks track component render performance in development
- **Schema Validation**: JSON Schema validation with detailed error reporting using AJV

## AI Provider Configuration

The app supports multiple AI providers through Genkit:

### Google AI (Default)
```typescript
import {googleAI} from '@genkit-ai/googleai';
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
```

### OpenRouter
```typescript
import {openrouter} from '@genkit-ai/openrouter';
export const ai = genkit({
  plugins: [openrouter()],
  model: 'openrouter/gpt-4o',
});
```

### Requesty
```typescript
import {openrouter} from '@genkit-ai/openrouter';
export const ai = genkit({
  plugins: [openrouter({baseUrl: 'https://router.requesty.ai/v1'})],
  model: 'openrouter/gpt-3.5-turbo',
});
```

## New Features & Enhancements

### Enhanced Document Management
- **Drag & Drop Reordering**: Documents can be reordered using drag and drop interface
- **Advanced Search & Filtering**: Search documents by name, filter by size, recency, or content
- **Multiple Sort Options**: Sort by name, modification date, size, or manual ordering
- **Document Metadata**: Shows file size, modification time, and version history

### JSON Schema Validation
- **Schema Editor**: Built-in JSON Schema editor with syntax highlighting
- **Template Library**: Pre-built schemas for common data structures (Person, Product, API Response)
- **Auto-Generation**: Generate schemas automatically from existing JSON data
- **Validation Results**: Real-time validation with detailed error reporting and suggestions

### Performance Optimizations
- **React.memo**: Key components memoized to prevent unnecessary re-renders
- **Virtualization**: Large JSON arrays virtualized using react-window for better performance
- **Performance Monitoring**: Development hooks track render times and identify bottlenecks
- **Error Boundaries**: Graceful error handling prevents application crashes

## Common Development Patterns

- **Component Props**: Components typically include `getApiKey` function for AI feature access
- **State Updates**: Use `updateActiveDocumentData` pattern for document modifications with history
- **Error Handling**: Toast notifications for user feedback on errors and success states
- **Local Storage Keys**: Consistent naming with `LOCAL_STORAGE_KEYS` constant
- **Type Safety**: Strong TypeScript typing with custom interfaces in `types.ts`
- **Performance**: Components wrapped with React.memo for optimization
- **Accessibility**: ARIA labels and keyboard navigation support throughout the interface

## Important File Locations

- **Main App**: `src/app/page.tsx` - Root application component
- **AI Flows**: `src/ai/flows/` - Genkit AI processing functions
- **Types**: `src/components/json-canvas/types.ts` - Core type definitions
- **Utils**: `src/lib/utils.ts` - Utility functions
- **Styles**: `src/app/globals.css` - Global CSS and Tailwind imports
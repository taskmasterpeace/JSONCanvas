
# JSON Canvas AI: Visual JSON Editor with AI Superpowers 🔮

JSON Canvas AI is a modern, privacy-first web application for visually editing, enhancing, and managing complex JSON documents. Built with Next.js, React, ShadCN UI, Tailwind CSS, and powered by Genkit for AI features, it offers an intuitive and powerful way to work with JSON data.

## Setup

Copy `.env.example` to `.env` and add your Google AI API key:

```bash
cp .env.example .env
# then edit .env and set GOOGLE_AI_API_KEY
```

## Switching Genkit Plugins

`src/ai/genkit.ts` configures Genkit to use the Google AI plugin. To use a
different provider, swap the plugin import and `plugins` array in that file.
For example, with OpenRouter:

```ts
import {openrouter} from '@genkit-ai/openrouter';

export const ai = genkit({
  plugins: [openrouter()],
  model: 'openrouter/gpt-4o',
});
```

Add the provider's API key to `.env` (e.g., `OPENROUTER_API_KEY`) and restart
the Genkit dev server.

## 🚀 Rapid Import & AI Formatting

- **Paste Anything:** Instantly import data by pasting raw text, CSV, lists, or messy snippets. No need for perfect JSON.
- **AI-Powered Conversion:** The app uses AI to interpret your input and generate well-structured JSON, ready for editing. You can even provide instructions to guide the AI!
- **No File Required:** Skip the hassle of saving and uploading files—just copy, paste, and start editing a new document.
- **Fix & Format with AI:** In the "Edit Entire JSON" view, a single click uses AI to attempt to fix errors in malformed JSON and then beautifies it.
- **Bulk/Batched Entry:** Paste multiple items at once, provide structuring instructions to the AI, and let the app organize them for you.

> _“Can I just paste a bunch of info and have it turned into JSON?”_  
> **Yes!** Paste into the "Quick Import" dialog, optionally guide the AI with instructions, let the AI work its magic, and start editing the newly created document right away.

### How it works behind the scenes:
When you use "Quick Import" or "Fix & Format with AI", the app sends your text (and optional instructions) to a Genkit AI flow (`convertTextToJsonFlow` or `formatJsonFlow`). These flows prompt an AI model (like Gemini via the Google AI Genkit plugin) to:
1.  Interpret the input text and any user instructions (for Quick Import).
2.  Attempt to convert it into valid, well-structured JSON.
3.  For "Fix & Format", it tries to repair invalid JSON and then beautifies it.
The resulting JSON is then loaded back into the editor.

<!-- Placeholder for GIF/Screenshot: [Demo of Copy-Paste-to-Edit in action] -->

## Core Features:

-   **Interactive JSON Tree Editor:** Visualize and edit JSON data in an intuitive tree view. Expand/collapse nodes, and directly modify values, keys, and structure.
-   **Alternative Card View:** Navigate and edit JSON data using a card-based interface, drilling down into nested objects and arrays.
-   **Real-Time Editing:** Directly edit JSON values within the tree or card views with real-time updates.
-   **Tabbed Document Interface:** Manage different top-level sections of your JSON document in a clean, tabbed view (if the root is an object).
-   **Multi-Document Sidebar:** Manage multiple JSON documents within the application. Add new documents, import files, rename, duplicate, and delete documents.
-   **Persistent Local Storage:** All your documents, their content, and undo/redo history are automatically saved to your browser's local storage.
-   **AI-Powered Tools:**
    *   **Summarization:** Get concise summaries of long string values.
    *   **Enhancement:** Rewrite or improve string content based on your custom prompts.
    *   **JSON Patching:** Modify JSON based on natural language instructions via the "Edit Entire JSON" dialog. The AI generates a JSON Patch which you can review and apply.
-   **JSON Formatting:** Includes a raw JSON editor with an AI-powered "Fix & Format" option in the "Edit Entire JSON" dialog.
-   **Import/Export:**
    *   Import JSON files directly into new documents in your library.
    *   Export the active document to a JSON file.
-   **Undo/Redo:** Robust undo/redo functionality for each document, with history persisted.
-   **Markdown Support:** View and edit long string values as Markdown with a live preview and a dedicated full-screen modal editor.
-   **Copy Values & Paths:** Easily copy individual values or the JSON path of a node.
-   **Search & Navigation Aids:**
    *   Search within JSON sections to highlight matching keys and values.
    *   Dynamic path breadcrumbs show your current location.
    *   Expand/Collapse All nodes for easier navigation in large files.
-   **Dark Mode:** Toggle between light and dark themes for comfortable viewing.

## FAQ

**Q: Can I paste messy data and have it turned into JSON automatically?**  
A: Yes! Use the "Quick Import" feature (clipboard-paste icon in the header). Paste your text, optionally provide structuring instructions, and the AI will attempt to convert it into a new structured JSON document.

**Q: Is my data or API key sent to your servers?**  
A: No. Your JSON documents and your Google AI API key (if you provide one for AI features) are stored locally in your browser's local storage. They are only sent directly to the Google AI services when you use an AI-powered feature.

**Q: What AI model is used?**  
A: The application uses Genkit, which is configured by default to use Google's Gemini models via the Google AI plugin.

## Style Guidelines:

-   Primary color: Vibrant indigo (`#667eea`)
-   Background color: Light, desaturated lavender (`#f0f2f9`)
-   Accent color: Bold purple (`#9370db`)
-   Font: Clear, monospaced font for JSON data; standard sans-serif for UI text.
-   Layout: Clean, well-spaced, with minimalist icons and subtle transitions.

## 📁 Document Library & Management

The application features a robust document management system integrated into a sidebar:

**Currently Implemented:**
-   **Manage Multiple Documents:** Keep track of several JSON documents simultaneously.
-   **Sidebar View:** See all your documents in a sidebar.
-   **Document Actions:**
    *   Add new empty documents.
    *   Import JSON files as new documents.
    *   Rename existing documents.
    *   Duplicate documents with their full history.
    *   Delete documents (with a confirmation step).
-   **Active Document Switching:** Instantly switch between documents for editing.
-   **Auto-Save to Local Storage:** All documents, their content, structure, and individual undo/redo histories are automatically saved in your browser's local storage and restored on your next visit.
-   **Timestamps:** Documents show a "last modified" timestamp.

**Planned for Future Development:**
-   Reorder documents within the sidebar (e.g., via drag-and-drop).
-   Filter or search documents in the sidebar list.
-   Bulk actions (e.g., search across all documents, apply AI formatting to multiple).
-   Import/Export the entire document library as a single file.
-   Tags or folders for organizing documents within the library.
```
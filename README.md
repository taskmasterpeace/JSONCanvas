# Firebase Studio - JSON Canvas AI

This is a NextJS starter in Firebase Studio, evolved into **JSON Canvas AI**, a powerful tool for visually editing, enhancing, and managing complex JSON documents with AI assistance.

To get started, take a look at `src/app/page.tsx`.

## 🚀 Rapid Import & AI Formatting

- **Paste Anything:** Instantly import data by pasting raw text, CSV, lists, or messy snippets. No need for perfect JSON.
- **AI-Powered Conversion:** The app uses AI to interpret your input and generate well-structured JSON, ready for editing.
- **No File Required:** Skip the hassle of saving and uploading files—just copy, paste, and start editing.
- **One-Click Beautify:** Fix formatting, validate structure, and correct errors with a single click using the "Fix & Format with AI" button in the "Edit Entire JSON" view.
- **Bulk/Batched Entry:** Paste multiple items at once and let the app organize them for you.

> _“Can I just paste a bunch of info and have it turned into JSON?”_  
> **Yes!** Paste into the "Quick Import" dialog, let the AI work its magic, and start editing right away.

### How it works behind the scenes:
When you use "Quick Import" or "Fix & Format with AI", the app sends your text to a Genkit AI flow. This flow prompts an AI model (like Gemini) to:
1.  Interpret the input text (for Quick Import).
2.  Attempt to convert it into valid, well-structured JSON.
3.  For "Fix & Format", it tries to repair invalid JSON and then beautifies it.
The resulting JSON is then loaded back into the editor.

<!-- Placeholder for GIF/Screenshot: [Demo of Copy-Paste-to-Edit in action] -->

## Core Features:

-   Interactive JSON Tree: Display JSON data in a visually interactive tree view, allowing users to expand and collapse nodes to explore the data hierarchy.
-   Real-Time Editing: Enable users to directly edit JSON values within the tree view with real-time updates.
-   Tabbed Document Interface: Provides a tabbed interface for managing multiple top-level sections within a single JSON document.
-   AI-Powered Summarization: Allow users to summarize lengthy JSON string values using an AI tool.
-   AI-Powered Enhancement: Allow users to enhance JSON string values based on custom prompts.
-   JSON Formatting and Syntax Highlighting: Includes a raw JSON editor with an AI-powered "Fix & Format" option.
-   JSON Import/Export: Implement import and export functionalities for loading and saving JSON files.
-   Undo/Redo: Track changes and allow users to revert or reapply them.
-   Markdown Preview & Full Editor: View and edit long string values as Markdown with a live preview and a dedicated modal editor.

## FAQ

**Q: Can I paste messy data and have it turned into JSON automatically?**  
A: Yes! Use the "Quick Import" feature (look for the clipboard-paste icon in the header). Paste your text, and the AI will attempt to convert it into structured JSON.

**Q: Is my data or API key sent to your servers?**  
A: No. Your JSON data and OpenAI API key (if you provide one for AI features) are stored locally in your browser's local storage. They are only sent directly to the OpenAI API when you use an AI-powered feature.

**Q: What AI model is used?**  
A: The application uses Genkit, which is configured by default to use Google's Gemini models via the Google AI plugin.

## Style Guidelines:

-   Primary color: Vibrant indigo (#667eea)
-   Background color: Light, desaturated lavender (#f0f2f9)
-   Accent color: Bold purple (#9370db)
-   Font: Clear, monospaced font for JSON data; standard sans-serif for UI text.
-   Layout: Clean, well-spaced, with minimalist icons and subtle transitions.

## 📁 Library & Multi-File Management (Planned for Future Development)
-   Manage Multiple Files: Keep track of several JSON documents at once—switch between them instantly.
-   Library View: See all your JSON files in a sidebar or dashboard, with quick open, rename, and delete.
-   Easy Import/Export: Move JSON in and out of your library with drag-and-drop or copy-paste.
-   Bulk Actions: Apply AI formatting, validation, or search across all your files.

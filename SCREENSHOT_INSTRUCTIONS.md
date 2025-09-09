# 📸 Screenshot Instructions

The development server is running at: **http://localhost:9002**

## Required Screenshots for README:

### 1. Main Interface (`screenshots/main-interface.png`)
- Navigate to http://localhost:9002
- Make sure the document sidebar is visible on the left
- Create/open a JSON document with some sample data
- Show the tree editor in the main area
- Capture the full interface

### 2. AI Features (`screenshots/ai-features.png`)  
- Right-click on any JSON element to show context menu
- Or click the "Quick Import" button in the header
- Show the AI enhancement dialog with options
- Capture the AI features in action

### 3. Document Management (`screenshots/document-management.png`)
- Focus on the left sidebar with multiple documents
- Show the document list with metadata (timestamps, sizes)
- Maybe show the drag & drop functionality if possible
- Capture the document management interface

### 4. Schema Validation (`screenshots/schema-validation.png`)
- If there's a schema validation feature, show it in action
- Show validation errors or success states  
- Capture the validation interface

### 5. Quick Import (`screenshots/quick-import.png`)
- Click the Quick Import button (clipboard icon)
- Show the dialog where users can paste text
- Show the AI conversion process
- Capture the import workflow

## Screenshot Specs:
- **Resolution**: 1920x1080 recommended
- **Format**: PNG for best quality  
- **Browser**: Chrome/Edge for consistency
- **Zoom**: 100% for crisp text
- **Theme**: Light mode preferred

## After Taking Screenshots:
1. Save them in the `screenshots/` directory with exact filenames
2. The README is already set up to display them automatically
3. Commit the screenshots to GitHub

## Quick Commands:
```bash
# Server is already running at:
# http://localhost:9002

# After adding screenshots:
git add screenshots/
git commit -m "docs: add application screenshots"
git push origin master
```
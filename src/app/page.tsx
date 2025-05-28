
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { JsonTreeEditor } from '@/components/json-canvas/json-tree-editor';
import { Header } from '@/components/json-canvas/header';
import { ApiKeyDialog } from '@/components/json-canvas/api-key-dialog';
import { EditEntireJsonDialog } from '@/components/json-canvas/edit-entire-json-dialog';
import { QuickImportDialog } from '@/components/json-canvas/quick-import-dialog';
import { DocumentSidebar } from '@/components/json-canvas/document-sidebar';
import type { JsonValue, JsonObject, Document } from '@/components/json-canvas/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { ClipboardPaste, LayoutDashboard } from 'lucide-react';

const initialJson: JsonValue = {
  "projectInfo": {
    "projectName": "JSON Canvas Advanced Demo",
    "version": "1.2.0",
    "description": "Welcome! This JSON demonstrates various data types and structures. Edit values, rename keys, and try AI features on text fields!",
    "status": null,
    "isActive": true,
    "tags": ["demo", "json", "canvas", "ai", "multi-document"],
    "contact": {
      "name": "JSON Canvas Support",
      "email": "support@example.jsoncanvas.com",
      "matrixId": "@support:jsoncanvas.com"
    },
    "features": [
      "Interactive Tree Editing",
      "Card View for objects/arrays",
      "AI Summarization & Enhancement for strings",
      "Markdown Preview & Full Editor for long strings",
      "Import/Export JSON",
      "Undo/Redo Functionality",
      "AI Quick Import (Paste any text!)",
      "AI JSON Formatting & Correction",
      "Multi-Document Sidebar (Session Only)"
    ],
    "lastUpdated": "2024-07-20T10:30:00Z",
    "readmeContent": "# Project Alpha\n\nThis is a *Markdown* example.\n\n- Feature 1\n- Feature 2\n\n```json\n{\n  \"sample\": \"code block\"\n}\n```\n\nVisit [our website](https://example.com) for more info. You can edit this long string using the Markdown editor or use AI tools to summarize or enhance it."
  },
  "userSettings": {
    "theme": "system-preference",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true,
      "frequency": 24
    },
    "apiKeyStatus": "Not Set",
    "preferences": {
      "showTooltips": true,
      "fontSize": 14,
      "defaultView": "tree"
    }
  },
  "sampleData": [
    100,
    250.75,
    { "id": "item_1", "type": "complex", "value": 42, "active": true, "metadata": null, "notes": "This is a sample object within an array." },
    "Another string item in the array",
    false,
    [1, 2, 3, {"nested": "array", "deeplyNested": {"value": "here"}}],
    null
  ],
  "notes": "This is a root-level note. Explore the tabbed interface or the card view. Use the sidebar to manage multiple documents in this session."
};

const createNewDocument = (data: JsonValue, name?: string): Document => {
  const docId = Date.now().toString();
  return {
    id: docId,
    name: name || `Untitled Document ${docId.slice(-4)}`,
    data: data,
    history: [data],
    currentHistoryIndex: 0,
  };
};

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([createNewDocument(initialJson, "Welcome Document")]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(documents[0]?.id || null);
  
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isEditEntireJsonDialogOpen, setIsEditEntireJsonDialogOpen] = useState(false);
  const [isQuickImportDialogOpen, setIsQuickImportDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const activeDocument = useMemo(() => {
    return documents.find(doc => doc.id === activeDocumentId);
  }, [documents, activeDocumentId]);

  useEffect(() => {
    setIsClient(true);
    const storedKey = localStorage.getItem('google_ai_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      // Update apiKeyStatus in the initial document if it exists
      setDocuments(prevDocs => {
        if (prevDocs.length > 0 && typeof prevDocs[0].data === 'object' && prevDocs[0].data !== null && !Array.isArray(prevDocs[0].data) && 'userSettings' in prevDocs[0].data) {
          const userSettings = prevDocs[0].data.userSettings as JsonObject;
          if (typeof userSettings === 'object' && userSettings !== null && 'apiKeyStatus' in userSettings) {
            const updatedInitialDocData = {
              ...prevDocs[0].data,
              userSettings: { ...userSettings, apiKeyStatus: "Google AI Key Set (Loaded from Local Storage)" }
            };
            const updatedInitialDoc = { ...prevDocs[0], data: updatedInitialDocData, history: [updatedInitialDocData, ...prevDocs[0].history.slice(1)] };
            return [updatedInitialDoc, ...prevDocs.slice(1)];
          }
        }
        return prevDocs;
      });
    }
  }, []);


  const updateActiveDocumentData = useCallback((newJson: JsonValue, fromHistory = false) => {
    if (!activeDocument) return;
    setDocuments(prevDocs =>
      prevDocs.map(doc => {
        if (doc.id === activeDocument.id) {
          const newHistory = fromHistory ? doc.history : [...doc.history.slice(0, doc.currentHistoryIndex + 1), newJson];
          const newIndex = fromHistory ? doc.currentHistoryIndex : newHistory.length - 1;
          return { ...doc, data: newJson, history: newHistory, currentHistoryIndex: newIndex };
        }
        return doc;
      })
    );
  }, [activeDocument]);

  const handleJsonChange = (newJson: JsonValue) => { // For changes to the root of a section's data or the whole active doc data
    updateActiveDocumentData(newJson);
  };
  
  const handleSectionChange = (sectionKey: string, newSectionData: JsonValue) => {
    if (activeDocument && typeof activeDocument.data === 'object' && activeDocument.data !== null && !Array.isArray(activeDocument.data)) {
      const updatedFullJson = {
        ...activeDocument.data,
        [sectionKey]: newSectionData,
      };
      updateActiveDocumentData(updatedFullJson);
    }
  };

  const handleFileImportToNewDocument = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedJson = JSON.parse(e.target?.result as string);
          const newDoc = createNewDocument(importedJson, file.name.replace(/\.json$/i, ''));
          setDocuments(prevDocs => [...prevDocs, newDoc]);
          setActiveDocumentId(newDoc.id);
          toast({ title: 'Document Imported', description: `"${newDoc.name}" loaded successfully.` });
        } catch (error) {
          toast({ title: 'Import Error', description: 'Invalid JSON file.', variant: 'destructive' });
        }
      };
      reader.readAsText(file);
      event.target.value = ''; 
    }
  };
  
  const handleQuickImportToNewDocument = (newJson: JsonValue, notes?: string) => {
    const newDoc = createNewDocument(newJson, `Quick Import ${Date.now().toString().slice(-4)}`);
    setDocuments(prevDocs => [...prevDocs, newDoc]);
    setActiveDocumentId(newDoc.id);
    let description = 'Text successfully converted to new JSON document by AI.';
    if (notes) description += ` AI Notes: ${notes}`;
    toast({ title: 'Quick Import Successful', description });
  };

  const handleExport = () => {
    if (!activeDocument) {
      toast({ title: 'No Active Document', description: 'Please select a document to export.', variant: 'destructive' });
      return;
    }
    try {
      const jsonString = JSON.stringify(activeDocument.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeDocument.name.replace(/[^a-z0-9_.-]/gi, '_') || 'document'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'JSON Exported', description: `"${activeDocument.name}" saved successfully.` });
    } catch (error) {
      toast({ title: 'Export Error', description: 'Could not export JSON.', variant: 'destructive' });
    }
  };
  
  const handleUndo = useCallback(() => {
    if (activeDocument && activeDocument.currentHistoryIndex > 0) {
      const newIndex = activeDocument.currentHistoryIndex - 1;
      setDocuments(prevDocs => prevDocs.map(doc => 
        doc.id === activeDocument.id ? { ...doc, data: doc.history[newIndex], currentHistoryIndex: newIndex } : doc
      ));
      toast({ title: 'Undo Successful' });
    }
  }, [activeDocument]);

  const handleRedo = useCallback(() => {
    if (activeDocument && activeDocument.currentHistoryIndex < activeDocument.history.length - 1) {
      const newIndex = activeDocument.currentHistoryIndex + 1;
      setDocuments(prevDocs => prevDocs.map(doc => 
        doc.id === activeDocument.id ? { ...doc, data: doc.history[newIndex], currentHistoryIndex: newIndex } : doc
      ));
      toast({ title: 'Redo Successful' });
    }
  }, [activeDocument]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        handleUndo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        event.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  const getApiKey = useCallback(() => apiKey, [apiKey]);
  
  const handleApiKeySave = (newApiKey: string) => {
    setApiKey(newApiKey);
    if (activeDocument && typeof activeDocument.data === 'object' && activeDocument.data !== null && !Array.isArray(activeDocument.data) && 'userSettings' in activeDocument.data) {
      const userSettings = activeDocument.data.userSettings as JsonObject;
       if (typeof userSettings === 'object' && userSettings !== null && 'apiKeyStatus' in userSettings) {
        const newStatus = newApiKey ? "Google AI Key Set" : "Not Set";
        const updatedData = {
          ...activeDocument.data,
          userSettings: { ...userSettings, apiKeyStatus: newStatus }
        };
        updateActiveDocumentData(updatedData);
      }
    }
  };

  const handleAddDocument = () => {
    const newDoc = createNewDocument({ message: "This is a new empty document. Start editing!" });
    setDocuments(prevDocs => [...prevDocs, newDoc]);
    setActiveDocumentId(newDoc.id);
    toast({ title: "Document Added", description: `"${newDoc.name}" created.`});
  };

  const handleSelectDocument = (docId: string) => {
    setActiveDocumentId(docId);
  };

  const handleRenameDocument = (docId: string, newName: string) => {
    setDocuments(prevDocs => prevDocs.map(doc => doc.id === docId ? { ...doc, name: newName } : doc));
    toast({ title: "Document Renamed" });
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments(prevDocs => {
      const remainingDocs = prevDocs.filter(doc => doc.id !== docId);
      if (remainingDocs.length === 0) {
        const newFallbackDoc = createNewDocument({ message: "All documents deleted. This is a new one." });
        setActiveDocumentId(newFallbackDoc.id);
        return [newFallbackDoc];
      }
      if (activeDocumentId === docId) {
        setActiveDocumentId(remainingDocs[0].id);
      }
      return remainingDocs;
    });
    toast({ title: "Document Deleted" });
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center">
           <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary animate-pulse fill-current"><title>JSON Canvas</title><path d="M6 18h12V6H6v12zm2-10h2v2H8V8zm0 4h2v2H8v-2zm0 4h2v2H8v-2zm4-8h2v2h-2V8zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm4-8h2v2h-2V8zm0 4h2v2h-2v-2zM4 22h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2z"/></svg>
          <p className="text-xl text-muted-foreground mt-4">Loading JSON Canvas...</p>
        </div>
      </div>
    );
  }
  
  const currentJsonData = activeDocument?.data;
  const topLevelKeys = typeof currentJsonData === 'object' && currentJsonData !== null && !Array.isArray(currentJsonData) 
    ? Object.keys(currentJsonData) 
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header
        onImport={handleFileImportToNewDocument} // Changed to import to new doc
        onExport={handleExport}
        onUndo={handleUndo}
        canUndo={activeDocument ? activeDocument.currentHistoryIndex > 0 : false}
        onRedo={handleRedo}
        canRedo={activeDocument ? activeDocument.currentHistoryIndex < activeDocument.history.length - 1 : false}
        onOpenApiKeyDialog={() => setIsApiKeyDialogOpen(true)}
        onOpenEditEntireJsonDialog={() => setIsEditEntireJsonDialogOpen(true)}
        onOpenQuickImportDialog={() => setIsQuickImportDialogOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex flex-1 overflow-hidden">
        <DocumentSidebar
          isOpen={isSidebarOpen}
          documents={documents}
          activeDocumentId={activeDocumentId}
          onSelectDocument={handleSelectDocument}
          onAddDocument={handleAddDocument}
          onImportDocument={handleFileImportToNewDocument}
          onRenameDocument={handleRenameDocument}
          onDeleteDocument={handleDeleteDocument}
        />
        <ScrollArea className="flex-grow">
          <main className="container mx-auto p-4">
            {!activeDocument && (
              <Card className="my-4 shadow-lg">
                <CardHeader><CardTitle>No Document Selected</CardTitle></CardHeader>
                <CardContent><p>Please select a document from the sidebar, or add a new one to begin.</p></CardContent>
              </Card>
            )}
            {activeDocument && currentJsonData && (
              topLevelKeys.length > 0 ? (
                <Tabs defaultValue={topLevelKeys[0]} key={activeDocumentId} className="w-full"> {/* Added key to force re-render on doc change */}
                  <TabsList className="bg-card border shadow-sm">
                    {topLevelKeys.map(key => (
                      <TabsTrigger key={key} value={key} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        {key}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {topLevelKeys.map(key => (
                    <TabsContent key={key} value={key}>
                      <JsonTreeEditor
                        jsonData={(currentJsonData as JsonObject)[key]}
                        onJsonChange={(newSectionData) => handleSectionChange(key, newSectionData)}
                        title={key}
                        getApiKey={getApiKey}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                 <Card className="my-4 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold text-primary">{activeDocument.name}</CardTitle>
                        {(typeof currentJsonData !== 'object' || currentJsonData === null || Object.keys(currentJsonData).length === 0) && 
                            <CardDescription>The current document is not a non-empty object with keys. Displaying root value. Use Quick Import or File Import to load new data into a new document.</CardDescription>
                        }
                    </CardHeader>
                    <CardContent>
                        <JsonTreeEditor
                            jsonData={currentJsonData}
                            onJsonChange={handleJsonChange}
                            getApiKey={getApiKey}
                            title={activeDocument.name || "Root Value"}
                        />
                    </CardContent>
                </Card>
              )
            )}
            {activeDocument && !currentJsonData && (
                 <Card className="my-4 shadow-lg">
                    <CardHeader><CardTitle className="text-xl font-semibold text-primary">{activeDocument.name}</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">This document's data is empty or invalid.</p></CardContent>
                </Card>
            )}

            {documents.length === 1 && documents[0].name === "Welcome Document" && (
              <Card className="mt-8 mb-4">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Welcome to JSON Canvas!</CardTitle>
                  <CardDescription>A powerful, privacy-first tool for visual JSON editing and enhancement.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    This application allows you to load, edit, and save JSON documents directly in your browser. 
                    Use the <LayoutDashboard className="inline h-4 w-4 align-middle" /> sidebar (toggle with the header button) to manage multiple documents in this session.
                    Within a document, use tabs (if your JSON has top-level keys) or the card/tree view to navigate.
                    Click on values to edit them, use icons for actions like renaming keys, deleting items, or AI-powered enhancements for strings.
                    Try the <ClipboardPaste className="inline h-4 w-4 align-middle" /> <strong>Quick Import</strong> button in the header to paste any text and have AI convert it to a new JSON document!
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Image src="https://placehold.co/600x400.png" alt="JSON Tree Editor Screenshot" data-ai-hint="data structure" width={600} height={400} className="rounded-md shadow-md" />
                    <Image src="https://placehold.co/600x400.png" alt="AI Enhancement Feature Screenshot" data-ai-hint="artificial intelligence" width={600} height={400} className="rounded-md shadow-md" />
                  </div>
                  <p>
                    <strong>Key Features:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Interactive tree view for complex JSON structures.</li>
                    <li>Card view for alternative navigation of objects/arrays.</li>
                    <li>AI-powered Quick Import: Paste any text, get a new JSON document.</li>
                    <li>AI-powered JSON formatting and error correction via "Edit Entire JSON".</li>
                    <li>Full CRUD operations at any nesting level.</li>
                    <li>Markdown preview and dedicated modal editor for long text fields.</li>
                    <li>AI-powered summarization and content enhancement for string values.</li>
                    <li>Local import/export of JSON files.</li>
                    <li>Undo/Redo functionality per document.</li>
                    <li>Copy values to clipboard.</li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    Your data and Google AI API key (if provided for AI features) are stored locally in your browser. The key is sent to Google AI services when using AI features. Document data is session-only.
                  </p>
                </CardContent>
              </Card>
            )}
          </main>
        </ScrollArea>
      </div>
      <ApiKeyDialog
        open={isApiKeyDialogOpen}
        onOpenChange={setIsApiKeyDialogOpen}
        onApiKeySave={handleApiKeySave}
      />
      {activeDocument && (
        <EditEntireJsonDialog
          open={isEditEntireJsonDialogOpen}
          onOpenChange={setIsEditEntireJsonDialogOpen}
          currentJson={activeDocument.data}
          onSave={handleJsonChange} // Operates on active document's data
          getApiKey={getApiKey} 
        />
      )}
      <QuickImportDialog
        open={isQuickImportDialogOpen}
        onOpenChange={setIsQuickImportDialogOpen}
        onImport={handleQuickImportToNewDocument} // Changed to import to new doc
        getApiKey={getApiKey}
      />
    </div>
  );
}

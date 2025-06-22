
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

const LOCAL_STORAGE_KEYS = {
  DOCUMENTS_META: 'jsonCanvas_documentsMeta',
  DOCUMENT_PREFIX: 'jsonCanvas_document_',
  ACTIVE_DOCUMENT_ID: 'jsonCanvas_activeDocumentId',
  API_KEY: 'google_ai_api_key',
  THEME: 'jsonCanvas_theme',
  MODEL: 'jsonCanvas_model',
};

const initialJson: JsonValue = {
  "projectInfo": {
    "projectName": "JSON Canvas Advanced Demo",
    "version": "1.2.0",
    "description": "Welcome! This JSON demonstrates various data types and structures. Edit values, rename keys, and try AI features on text fields! Use the sidebar to manage multiple documents. Your work is auto-saved!",
    "status": null,
    "isActive": true,
    "tags": ["demo", "json", "canvas", "ai", "multi-document", "auto-save"],
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
      "Import/Export JSON to New Document",
      "Undo/Redo Functionality Per Document",
      "AI Quick Import (Paste any text to New Document!)",
      "AI JSON Formatting & Correction",
      "Multi-Document Sidebar with Auto-Save to Local Storage"
    ],
    "lastUpdated": "2024-07-20T10:30:00Z",
    "readmeContent": "# Project Alpha\n\nThis is a *Markdown* example.\n\n- Feature 1\n- Feature 2\n\n```json\n{\n  \"sample\": \"code block\"\n}\n```\n\nVisit [our website](https://example.com) for more info. You can edit this long string using the Markdown editor or use AI tools to summarize or enhance it."
  },
  "userSettings": {
    "theme": "system-preference", // Will be updated by actual theme preference
    "notifications": {
      "email": true,
      "sms": false,
      "push": true,
      "frequency": 24
    },
    "apiKeyStatus": "Not Set", // This will be updated based on actual key presence
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
  "notes": "This is a root-level note. Explore the tabbed interface or the card view. Use the sidebar to manage multiple documents in this session. All your changes are saved locally in your browser."
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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isEditEntireJsonDialogOpen, setIsEditEntireJsonDialogOpen] = useState(false);
  const [isQuickImportDialogOpen, setIsQuickImportDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedModel, setSelectedModel] = useState('');


  // Theme and model management
  useEffect(() => {
    if (!isClient) return;
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as 'light' | 'dark' | null;
    if (storedTheme) {
      setTheme(storedTheme);
      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Default to light or system preference if desired
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
        localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, 'dark');
      } else {
        setTheme('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, 'light');
    }
  }

    const storedModel = localStorage.getItem(LOCAL_STORAGE_KEYS.MODEL);
    if (storedModel) {
      setSelectedModel(storedModel);
    }
  }, [isClient]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };


  // Load documents from local storage on initial mount
  useEffect(() => {
    setIsClient(true); 

    try {
      const storedKey = localStorage.getItem(LOCAL_STORAGE_KEYS.API_KEY);
      if (storedKey) {
        setApiKey(storedKey);
      }
    } catch (error) {
      console.error("Error reading API key from localStorage:", error);
      toast({ title: 'Local Storage Error', description: 'Could not read API key from local storage.', variant: 'destructive' });
    }

    try {
      const savedDocsMetaString = localStorage.getItem(LOCAL_STORAGE_KEYS.DOCUMENTS_META);
      const loadedDocuments: Document[] = [];
      if (savedDocsMetaString) {
        const savedDocsMeta: { id: string; name: string }[] = JSON.parse(savedDocsMetaString);
        for (const meta of savedDocsMeta) {
          const docString = localStorage.getItem(`${LOCAL_STORAGE_KEYS.DOCUMENT_PREFIX}${meta.id}`);
          if (docString) {
            loadedDocuments.push(JSON.parse(docString));
          }
        }
      }

      if (loadedDocuments.length > 0) {
        setDocuments(loadedDocuments);
        const savedActiveId = localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_DOCUMENT_ID);
        if (savedActiveId && loadedDocuments.some(doc => doc.id === savedActiveId)) {
          setActiveDocumentId(savedActiveId);
        } else {
          setActiveDocumentId(loadedDocuments[0].id);
        }
      } else {
        const welcomeDoc = createNewDocument(initialJson, "Welcome Document");
        setDocuments([welcomeDoc]);
        setActiveDocumentId(welcomeDoc.id);
        localStorage.setItem(LOCAL_STORAGE_KEYS.DOCUMENTS_META, JSON.stringify([{ id: welcomeDoc.id, name: welcomeDoc.name }]));
        localStorage.setItem(`${LOCAL_STORAGE_KEYS.DOCUMENT_PREFIX}${welcomeDoc.id}`, JSON.stringify(welcomeDoc));
        localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_DOCUMENT_ID, welcomeDoc.id);
      }
    } catch (error) {
      console.error("Error loading documents from localStorage:", error);
      toast({ title: 'Local Storage Error', description: 'Could not load documents. Using default setup.', variant: 'destructive' });
      const welcomeDoc = createNewDocument(initialJson, "Welcome Document");
      setDocuments([welcomeDoc]);
      setActiveDocumentId(welcomeDoc.id);
    }
  }, [toast]); 

  // Update API key status and theme in the active document if its userSettings exist
  useEffect(() => {
    if (!isClient || !activeDocumentId) return;

    setDocuments(prevDocs => {
      return prevDocs.map(doc => {
        if (doc.id === activeDocumentId && typeof doc.data === 'object' && doc.data !== null && !Array.isArray(doc.data) && 'userSettings' in doc.data) {
          const userSettings = doc.data.userSettings as JsonObject;
          if (typeof userSettings === 'object' && userSettings !== null) {
            let updatedUserSettings = { ...userSettings };
            let changed = false;

            if ('apiKeyStatus' in userSettings) {
              const newStatus = apiKey ? "Google AI Key Set" : "Not Set";
              if (userSettings.apiKeyStatus !== newStatus) {
                updatedUserSettings.apiKeyStatus = newStatus;
                changed = true;
              }
            }
            
            // Update theme in userSettings.theme as well
            if ('theme' in userSettings) {
                if (userSettings.theme !== theme) {
                    updatedUserSettings.theme = theme;
                    changed = true;
                }
            }


            if (changed) {
              return {
                ...doc,
                data: {
                  ...doc.data,
                  userSettings: updatedUserSettings
                }
              };
            }
          }
        }
        return doc;
      });
    });
  }, [apiKey, activeDocumentId, isClient, theme]);

  // Save documents to local storage whenever they change
  useEffect(() => {
    if (!isClient || documents.length === 0) return; 

    try {
      const docsMeta = documents.map(doc => ({ id: doc.id, name: doc.name }));
      localStorage.setItem(LOCAL_STORAGE_KEYS.DOCUMENTS_META, JSON.stringify(docsMeta));
      documents.forEach(doc => {
        localStorage.setItem(`${LOCAL_STORAGE_KEYS.DOCUMENT_PREFIX}${doc.id}`, JSON.stringify(doc));
      });
      if (activeDocumentId) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_DOCUMENT_ID, activeDocumentId);
      }
    } catch (error) {
      console.error("Error saving documents to localStorage:", error);
      toast({ title: 'Local Storage Error', description: 'Could not save documents automatically.', variant: 'destructive' });
    }
  }, [documents, activeDocumentId, isClient, toast]);


  const activeDocument = useMemo(() => {
    return documents.find(doc => doc.id === activeDocumentId);
  }, [documents, activeDocumentId]);

  const updateActiveDocumentData = useCallback((newJson: JsonValue, fromHistory = false) => {
    if (!activeDocumentId) return; 
    setDocuments(prevDocs =>
      prevDocs.map(doc => {
        if (doc.id === activeDocumentId) {
          const newHistory = fromHistory ? doc.history : [...doc.history.slice(0, doc.currentHistoryIndex + 1), newJson];
          const newIndex = fromHistory ? doc.currentHistoryIndex : newHistory.length - 1;
          const cappedHistory = newHistory.length > 50 ? newHistory.slice(newHistory.length - 50) : newHistory;
          const cappedIndex = newIndex >= newHistory.length - cappedHistory.length ? newIndex - (newHistory.length - cappedHistory.length) : 0;

          return { ...doc, data: newJson, history: cappedHistory, currentHistoryIndex: cappedIndex };
        }
        return doc;
      })
    );
  }, [activeDocumentId]); 

  const handleJsonChange = (newJson: JsonValue) => { 
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
    if (newApiKey) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.API_KEY, newApiKey);
    } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.API_KEY);
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
      try {
        localStorage.removeItem(`${LOCAL_STORAGE_KEYS.DOCUMENT_PREFIX}${docId}`);
      } catch (error) {
        console.error("Error removing document from localStorage:", error);
      }

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
        onImport={handleFileImportToNewDocument}
        onExport={handleExport}
        onUndo={handleUndo}
        canUndo={activeDocument ? activeDocument.currentHistoryIndex > 0 : false}
        onRedo={handleRedo}
        canRedo={activeDocument ? activeDocument.currentHistoryIndex < activeDocument.history.length - 1 : false}
        onOpenApiKeyDialog={() => setIsApiKeyDialogOpen(true)}
        onOpenEditEntireJsonDialog={() => setIsEditEntireJsonDialogOpen(true)}
        onOpenQuickImportDialog={() => setIsQuickImportDialogOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        theme={theme}
        onToggleTheme={toggleTheme}
        selectedModel={selectedModel}
        onModelChange={(m) => {
          setSelectedModel(m);
          localStorage.setItem(LOCAL_STORAGE_KEYS.MODEL, m);
        }}
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
            {!activeDocument && documents.length > 0 && ( 
              <Card className="my-4 shadow-lg">
                <CardHeader><CardTitle>No Document Selected</CardTitle></CardHeader>
                <CardContent><p>Please select a document from the sidebar, or add a new one to begin.</p></CardContent>
              </Card>
            )}
            {documents.length === 1 && documents[0].name === "Welcome Document" && activeDocumentId === documents[0].id && (
              <Card className="mt-8 mb-4">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Welcome to JSON Canvas!</CardTitle>
                  <CardDescription>A powerful, privacy-first tool for visual JSON editing and enhancement. Your work is auto-saved!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    This application allows you to load, edit, and save JSON documents directly in your browser. 
                    Your work is automatically saved to your browser's local storage!
                  </p>
                  <p className="mt-2">
                    The currently loaded <strong>"Welcome Document"</strong> (visible in the tabs like <code>projectInfo</code>, <code>userSettings</code>, etc.) is a live demo. 
                    Explore its structure by clicking through the tabs and expanding nodes to see examples of:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm my-3 bg-muted p-3 rounded-md">
                    <li><strong>Nested Objects:</strong> e.g., <code>projectInfo.contact</code>, <code>userSettings.preferences</code></li>
                    <li><strong>Arrays:</strong> e.g., <code>projectInfo.tags</code> (strings), <code>sampleData</code> (mixed types including objects, numbers, booleans, nulls, and nested arrays)</li>
                    <li><strong>Various Data Types:</strong> Strings, numbers, booleans (e.g., <code>projectInfo.isActive</code>), and null values (e.g., <code>projectInfo.status</code>)</li>
                    <li><strong>Long Text for Markdown:</strong> Edit <code>projectInfo.readmeContent</code> to see Markdown preview and AI tools.</li>
                  </ul>
                  <p>
                    Use the <LayoutDashboard className="inline h-4 w-4 align-middle" /> sidebar (toggle with the header button) to manage multiple documents.
                    Within this document, try the Tree and Card views. Click on values to edit them, use icons for actions like renaming keys, or try AI features on strings.
                    Want to start fresh? Use the <ClipboardPaste className="inline h-4 w-4 align-middle" /> <strong>Quick Import</strong> button in the header!
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Image src="https://placehold.co/600x400.png" alt="JSON Tree Editor Screenshot" data-ai-hint="json tree editor" width={600} height={400} className="rounded-md shadow-md" />
                    <Image src="https://placehold.co/600x400.png" alt="AI Enhancement Feature Screenshot" data-ai-hint="ai text enhancement" width={600} height={400} className="rounded-md shadow-md" />
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
                    <li>Undo/Redo functionality per document (auto-saved).</li>
                    <li>Copy values to clipboard.</li>
                    <li>All documents and their history are automatically saved to your browser's local storage.</li>
                  </ul>
                  <p className="text-sm text-muted-foreground">
                    Your Google AI API key (if provided) is stored locally. Document data is auto-saved locally.
                  </p>
                </CardContent>
              </Card>
            )}

            {activeDocument && currentJsonData && (
              topLevelKeys.length > 0 ? (
                <Tabs defaultValue={topLevelKeys[0]} key={activeDocumentId} className="w-full"> 
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
                        <CardDescription>
                          {typeof currentJsonData !== 'object' || currentJsonData === null
                            ? "The current document's root value is not an object, or is null. Displaying the raw value."
                            : Object.keys(currentJsonData).length === 0
                            ? "The current document is an empty object. You can add properties using the editor below, or import/create new data."
                            : "This document's root is not a multi-key object suitable for tabbing. Displaying the root value. Use 'Edit Entire JSON' or import to modify."
                          }
                        </CardDescription>
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
            {activeDocument && !currentJsonData && typeof currentJsonData !== 'object' && ( 
                 <Card className="my-4 shadow-lg">
                    <CardHeader><CardTitle className="text-xl font-semibold text-primary">{activeDocument.name}</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">This document's data is empty, null, or not an object/array. Consider importing new data or editing it as raw JSON.</p></CardContent>
                </Card>
            )}
            {documents.length === 0 && isClient && ( 
                <Card className="my-4 shadow-lg">
                  <CardHeader><CardTitle>No Documents</CardTitle></CardHeader>
                  <CardContent><p>Create or import a document using the sidebar to get started.</p></CardContent>
                </Card>
            )}
          </main>
        </ScrollArea>
      </div>
      <footer className="text-center text-xs text-muted-foreground p-4 border-t dark:border-border">
        Machine King Labs
      </footer>
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
          onSave={handleJsonChange} 
          getApiKey={getApiKey} 
        />
      )}
      <QuickImportDialog
        open={isQuickImportDialogOpen}
        onOpenChange={setIsQuickImportDialogOpen}
        onImport={handleQuickImportToNewDocument}
        getApiKey={getApiKey}
      />
    </div>
  );
}


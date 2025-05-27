"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { JsonTreeEditor } from '@/components/json-canvas/json-tree-editor';
import { Header } from '@/components/json-canvas/header';
import { ApiKeyDialog } from '@/components/json-canvas/api-key-dialog';
import { EditEntireJsonDialog } from '@/components/json-canvas/edit-entire-json-dialog';
import { QuickImportDialog } from '@/components/json-canvas/quick-import-dialog'; // New Import
import type { JsonValue, JsonObject } from '@/components/json-canvas/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { ClipboardPaste } from 'lucide-react'; // Added import

const initialJson: JsonValue = {
  "projectInfo": {
    "projectName": "JSON Canvas Demo",
    "version": "1.0.2",
    "description": "A sample project to demonstrate JSON Canvas features. Edit this JSON to see changes reflected in the tree view. Use AI features to summarize or enhance text fields.",
    "features": [
      "Interactive Tree Editing",
      "AI Summarization & Enhancement",
      "Markdown Preview & Full Editor",
      "Import/Export JSON",
      "Undo/Redo Functionality",
      "AI Quick Import",
      "AI JSON Formatting"
    ],
    "lastUpdated": null
  },
  "userSettings": {
    "theme": "system-preference",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    },
    "apiKeyStatus": "Not Set"
  },
  "sampleData": [
    100, 
    250.75, 
    {"type": "complex", "value": 42, "active": true},
    "Another string item"
  ],
  "notes": "This is a root-level note. You can edit any part of this JSON structure."
};


export default function Home() {
  const [jsonData, setJsonData] = useState<JsonValue>(initialJson);
  const [history, setHistory] = useState<JsonValue[]>([initialJson]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isEditEntireJsonDialogOpen, setIsEditEntireJsonDialogOpen] = useState(false);
  const [isQuickImportDialogOpen, setIsQuickImportDialogOpen] = useState(false); // New state
  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      // Update apiKeyStatus in jsonData if it exists
      setJsonData(prevJson => {
        if (typeof prevJson === 'object' && prevJson !== null && !Array.isArray(prevJson) && 'userSettings' in prevJson) {
          const userSettings = prevJson.userSettings as JsonObject;
          if (typeof userSettings === 'object' && userSettings !== null && 'apiKeyStatus' in userSettings) {
            return {
              ...prevJson,
              userSettings: {
                ...userSettings,
                apiKeyStatus: "Set (Loaded from Local Storage)"
              }
            };
          }
        }
        return prevJson;
      });
    }
  }, []);


  const updateJsonData = useCallback((newJson: JsonValue, fromHistory = false) => {
    setJsonData(newJson);
    if (!fromHistory) {
      const newHistory = history.slice(0, currentHistoryIndex + 1);
      newHistory.push(newJson);
      setHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);
    }
  }, [history, currentHistoryIndex]);

  const handleJsonChange = (newJson: JsonValue) => {
    updateJsonData(newJson);
  };
  
  const handleSectionChange = (sectionKey: string, newSectionData: JsonValue) => {
    if (typeof jsonData === 'object' && jsonData !== null && !Array.isArray(jsonData)) {
      const updatedFullJson = {
        ...jsonData,
        [sectionKey]: newSectionData,
      };
      updateJsonData(updatedFullJson);
    }
  };


  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedJson = JSON.parse(e.target?.result as string);
          updateJsonData(importedJson);
          toast({ title: 'JSON Imported', description: 'File loaded successfully.' });
        } catch (error) {
          toast({ title: 'Import Error', description: 'Invalid JSON file.', variant: 'destructive' });
        }
      };
      reader.readAsText(file);
      event.target.value = ''; // Reset file input
    }
  };

  const handleQuickImport = (newJson: JsonValue) => {
    updateJsonData(newJson); // This replaces the entire current JSON data
    // No separate toast here, QuickImportDialog handles its own toasts
  };

  const handleExport = () => {
    try {
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited_data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'JSON Exported', description: 'File saved successfully.' });
    } catch (error) {
      toast({ title: 'Export Error', description: 'Could not export JSON.', variant: 'destructive' });
    }
  };

  const handleUndo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      updateJsonData(history[newIndex], true);
      toast({ title: 'Undo Successful' });
    }
  }, [currentHistoryIndex, history, updateJsonData, toast]);

  const handleRedo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(newIndex);
      updateJsonData(history[newIndex], true);
      toast({ title: 'Redo Successful' });
    }
  }, [currentHistoryIndex, history, updateJsonData, toast]);
  
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
    // Update apiKeyStatus in jsonData if it exists
    setJsonData(prevJson => {
      if (typeof prevJson === 'object' && prevJson !== null && !Array.isArray(prevJson) && 'userSettings' in prevJson) {
        const userSettings = prevJson.userSettings as JsonObject;
        if (typeof userSettings === 'object' && userSettings !== null && 'apiKeyStatus' in userSettings) {
          return {
            ...prevJson,
            userSettings: {
              ...userSettings,
              apiKeyStatus: "Set"
            }
          };
        }
      }
      return prevJson;
    });
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
  
  const topLevelKeys = typeof jsonData === 'object' && jsonData !== null && !Array.isArray(jsonData) 
    ? Object.keys(jsonData) 
    : [];


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header
        onImport={handleFileImport}
        onExport={handleExport}
        onUndo={handleUndo}
        canUndo={currentHistoryIndex > 0}
        onRedo={handleRedo}
        canRedo={currentHistoryIndex < history.length - 1}
        onOpenApiKeyDialog={() => setIsApiKeyDialogOpen(true)}
        onOpenEditEntireJsonDialog={() => setIsEditEntireJsonDialogOpen(true)}
        onOpenQuickImportDialog={() => setIsQuickImportDialogOpen(true)} // New prop
      />
      <ScrollArea className="flex-grow">
        <main className="container mx-auto p-4">
          {topLevelKeys.length > 0 ? (
            <Tabs defaultValue={topLevelKeys[0]} className="w-full">
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
                    jsonData={(jsonData as JsonObject)[key]}
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
                    <CardTitle className="text-xl font-semibold text-primary">JSON Data</CardTitle>
                    {(typeof jsonData !== 'object' || jsonData === null || Object.keys(jsonData).length === 0) && 
                        <CardDescription>The current JSON is not a non-empty object with keys. Displaying root value. Use Quick Import or File Import to load data.</CardDescription>
                    }
                </CardHeader>
                <CardContent>
                    <JsonTreeEditor
                        jsonData={jsonData}
                        onJsonChange={handleJsonChange} // This allows editing even if it's not an object at the root
                        getApiKey={getApiKey}
                        title="Root Value"
                    />
                </CardContent>
            </Card>
          )}
           <Card className="mt-8 mb-4">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Welcome to JSON Canvas!</CardTitle>
              <CardDescription>A powerful, privacy-first tool for visual JSON editing and enhancement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This application allows you to load, edit, and save JSON documents directly in your browser. 
                Use the tabs above to navigate top-level sections of your JSON.
                Click on values to edit them, use icons for actions like renaming keys, deleting items, or AI-powered enhancements.
                Try the <ClipboardPaste className="inline h-4 w-4 align-middle" /> <strong>Quick Import</strong> button in the header to paste any text and have AI convert it to JSON!
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
                <li>AI-powered Quick Import: Paste any text, get JSON.</li>
                <li>AI-powered JSON formatting and error correction.</li>
                <li>Full CRUD operations at any nesting level.</li>
                <li>Markdown preview and dedicated modal for long text fields.</li>
                <li>AI-powered summarization and content enhancement.</li>
                <li>Local import/export of JSON files.</li>
                <li>Undo/Redo functionality for safe editing.</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Your data and API key (if provided) are stored locally in your browser and are not sent to any server other than OpenAI when using AI features.
              </p>
            </CardContent>
          </Card>
        </main>
      </ScrollArea>
      <ApiKeyDialog
        open={isApiKeyDialogOpen}
        onOpenChange={setIsApiKeyDialogOpen}
        onApiKeySave={handleApiKeySave}
      />
      <EditEntireJsonDialog
        open={isEditEntireJsonDialogOpen}
        onOpenChange={setIsEditEntireJsonDialogOpen}
        currentJson={jsonData}
        onSave={handleJsonChange}
        getApiKey={getApiKey} 
      />
      <QuickImportDialog
        open={isQuickImportDialogOpen}
        onOpenChange={setIsQuickImportDialogOpen}
        onImport={handleQuickImport}
        getApiKey={getApiKey}
      />
    </div>
  );
}

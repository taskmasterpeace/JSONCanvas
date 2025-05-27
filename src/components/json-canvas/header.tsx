
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileUp, FileDown, Undo2, Redo2, Settings, FileJson2, Github, ClipboardPaste, AlertTriangle } from 'lucide-react'; 

interface HeaderProps {
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
  onOpenApiKeyDialog: () => void;
  onOpenEditEntireJsonDialog: () => void;
  onOpenQuickImportDialog: () => void; 
}

export function Header({
  onImport,
  onExport,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  onOpenApiKeyDialog,
  onOpenEditEntireJsonDialog,
  onOpenQuickImportDialog, 
}: HeaderProps) {
  const importInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <TooltipProvider>
      <header className="bg-card border-b border-border p-3 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
             <svg
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-primary fill-current"
              >
                <title>JSON Canvas</title>
                <path d="M6 18h12V6H6v12zm2-10h2v2H8V8zm0 4h2v2H8v-2zm0 4h2v2H8v-2zm4-8h2v2h-2V8zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm4-8h2v2h-2V8zm0 4h2v2h-2v-2zM4 22h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2z"/>
              </svg>
            <h1 className="text-2xl font-semibold text-primary">JSON Canvas</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onOpenQuickImportDialog}>
                  <ClipboardPaste className="h-5 w-5" /> 
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Quick Import (Paste Text & AI Convert)</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => importInputRef.current?.click()}>
                  <FileUp className="h-5 w-5" />
                  <input type="file" accept=".json,application/json" ref={importInputRef} onChange={onImport} className="hidden" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Import JSON File</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onExport}>
                  <FileDown className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Export JSON File</p></TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onOpenEditEntireJsonDialog}>
                  <FileJson2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Edit Entire JSON (Raw + AI Fix)</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onUndo} disabled={!canUndo}>
                  <Undo2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Undo (Ctrl+Z)</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onRedo} disabled={!canRedo}>
                  <Redo2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Redo (Ctrl+Y)</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onOpenApiKeyDialog}>
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Google AI API Key</p></TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild>
                 <Button variant="ghost" size="icon" asChild>
                    <a href="https://firebase.google.com/docs/studio" target="_blank" rel="noopener noreferrer" aria-label="Powered by Firebase Studio">
                       <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Warning: This is an AI-generated app (experimental)</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                 <Button variant="ghost" size="icon" asChild>
                    <a href="https://github.com/firebase/studio-examples/tree/main/json-canvas-ai" target="_blank" rel="noopener noreferrer" aria-label="View on GitHub">
                        <Github className="h-5 w-5" />
                    </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>View on GitHub</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}

    
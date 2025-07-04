
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileUp, FileDown, Undo2, Redo2, Settings, FileJson2, Github, ClipboardPaste, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { ModelSelector } from './model-selector';

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
  onToggleSidebar: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  hasApiKey: boolean;
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
  onToggleSidebar,
  theme,
  onToggleTheme,
  selectedModel,
  onModelChange,
  hasApiKey,
}: HeaderProps) {
  const importInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <TooltipProvider>
      <header className="bg-card border-b border-border p-3 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="mr-2">
                  <LayoutDashboard className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Toggle Document Sidebar</p></TooltipContent>
            </Tooltip>
             <svg
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-primary fill-current"
              >
                <title>JSON Canvas</title>
                <path d="M6 18h12V6H6v12zm2-10h2v2H8V8zm0 4h2v2H8v-2zm0 4h2v2H8v-2zm4-8h2v2h-2V8zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm4-8h2v2h-2V8zm0 4h2v2h-2v-2zM4 22h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2z"/>
              </svg>
            <h1 className="text-2xl font-semibold text-primary">JSON Canvas AI</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onOpenQuickImportDialog}>
                  <ClipboardPaste className="h-5 w-5" /> 
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Quick Import to New Document (Paste Text)</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => importInputRef.current?.click()}>
                  <FileUp className="h-5 w-5" />
                  <input type="file" accept=".json,application/json" ref={importInputRef} onChange={onImport} className="hidden" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Import JSON File to New Document</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onExport}>
                  <FileDown className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Export Active Document</p></TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onOpenEditEntireJsonDialog}>
                  <FileJson2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Edit Entire Active Document (Raw + AI)</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onUndo} disabled={!canUndo}>
                  <Undo2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Undo (Ctrl+Z) in Active Document</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onRedo} disabled={!canRedo}>
                  <Redo2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Redo (Ctrl+Y) in Active Document</p></TooltipContent>
            </Tooltip>
            <ModelSelector value={selectedModel} onChange={onModelChange} disabled={!hasApiKey} />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onToggleTheme}>
                  {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</p></TooltipContent>
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
                    <a href="https://github.com/taskmasterpeace/JSONCanvas" target="_blank" rel="noopener noreferrer" aria-label="View on GitHub">
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

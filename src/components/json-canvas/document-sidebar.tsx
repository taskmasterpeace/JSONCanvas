
"use client";

import React, { useState, useRef, useEffect } from 'react';
import type { Document } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FilePlus, FileUp, Edit3, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentSidebarProps {
  isOpen: boolean;
  documents: Document[];
  activeDocumentId: string | null;
  onSelectDocument: (docId: string) => void;
  onAddDocument: () => void;
  onImportDocument: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRenameDocument: (docId: string, newName: string) => void;
  onDeleteDocument: (docId: string) => void;
}

export function DocumentSidebar({
  isOpen,
  documents,
  activeDocumentId,
  onSelectDocument,
  onAddDocument,
  onImportDocument,
  onRenameDocument,
  onDeleteDocument,
}: DocumentSidebarProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingDocId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingDocId]);

  const handleStartRename = (doc: Document) => {
    setRenamingDocId(doc.id);
    setRenameValue(doc.name);
  };

  const handleConfirmRename = () => {
    if (renamingDocId && renameValue.trim()) {
      onRenameDocument(renamingDocId, renameValue.trim());
    }
    setRenamingDocId(null);
    setRenameValue('');
  };

  const handleCancelRename = () => {
    setRenamingDocId(null);
    setRenameValue('');
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <TooltipProvider>
      <aside className="w-64 bg-card border-r border-border flex flex-col p-3 space-y-3 flex-shrink-0 h-full">
        <h2 className="text-lg font-semibold text-primary px-1">Documents</h2>
        <div className="flex space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="flex-1 h-8" onClick={onAddDocument}>
                <FilePlus size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>New Document</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="flex-1 h-8" onClick={() => importInputRef.current?.click()}>
                <FileUp size={18} />
                <input type="file" accept=".json,application/json" ref={importInputRef} onChange={onImportDocument} className="hidden" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Import Document</p></TooltipContent>
          </Tooltip>
        </div>
        <ScrollArea className="flex-grow">
          <ul className="space-y-1">
            {documents.map(doc => (
              <li key={doc.id}>
                {renamingDocId === doc.id ? (
                  <div className="flex items-center space-x-1 p-1 bg-muted rounded-md">
                    <Input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleConfirmRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmRename();
                        if (e.key === 'Escape') handleCancelRename();
                      }}
                      className="h-7 flex-grow text-sm"
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0.5" onClick={handleConfirmRename}><Check size={14}/></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0.5" onClick={handleCancelRename}><X size={14}/></Button>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "group flex items-center justify-between p-1.5 rounded-md cursor-pointer hover:bg-muted",
                      activeDocumentId === doc.id ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-card-foreground"
                    )}
                    onClick={() => onSelectDocument(doc.id)}
                  >
                    <span className="text-sm truncate flex-grow" title={doc.name}>{doc.name}</span>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className={cn("h-6 w-6 p-0.5", activeDocumentId === doc.id && "hover:bg-primary-foreground/20 text-primary-foreground")} onClick={(e) => { e.stopPropagation(); handleStartRename(doc); }}>
                            <Edit3 size={14} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>Rename</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className={cn("h-6 w-6 p-0.5 text-destructive", activeDocumentId === doc.id && "hover:bg-destructive/80 text-primary-foreground")} onClick={(e) => { e.stopPropagation(); onDeleteDocument(doc.id); }}>
                            <Trash2 size={14} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>Delete</p></TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
        <p className="text-xs text-muted-foreground text-center p-1">Document state is session-only.</p>
      </aside>
    </TooltipProvider>
  );
}

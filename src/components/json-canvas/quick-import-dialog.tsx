
"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { JsonValue } from './types';
import { convertTextToJson, type ConvertTextToJsonInput } from '@/ai/flows/convert-text-to-json-flow';
import { Loader2, Zap } from 'lucide-react';

interface QuickImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (newJson: JsonValue, notes?: string) => void; // Modified to pass notes
  getApiKey: () => string | null;
}

export function QuickImportDialog({ open, onOpenChange, onImport, getApiKey }: QuickImportDialogProps) {
  const [rawText, setRawText] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImportWithAI = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast({ title: 'API Key Missing', description: 'Please set your Google AI API key in settings for AI-powered import.', variant: 'destructive' });
      return;
    }
    if (!rawText.trim()) {
      toast({ title: 'Input Missing', description: 'Please paste some text to import.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const input: ConvertTextToJsonInput = { 
        rawText,
        instructions: aiInstructions.trim() || undefined,
      };
      const result = await convertTextToJson(input);
      
      try {
        const parsedJson = JSON.parse(result.generatedJson);
        onImport(parsedJson, result.notes); // Pass notes to parent
        onOpenChange(false);
        setRawText('');
        setAiInstructions('');
      } catch (parseError) {
        console.error('Error parsing JSON from AI:', parseError, result.generatedJson);
        toast({ title: 'Import Error', description: 'AI converted text, but the result was not valid JSON. Please try again or check the AI output.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Error importing with AI:', error);
      toast({ title: 'Import Failed', description: error.message || 'Could not convert text to JSON. Check console for details.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isLoading) onOpenChange(isOpen); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col bg-card">
        <DialogHeader>
          <DialogTitle>Quick Import to New Document</DialogTitle>
          <DialogDescription>
            Paste any text (e.g., CSV, lists, messy notes, partial JSON) and AI will try to convert it into structured JSON for a new document.
            You can provide optional instructions to guide the AI.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow flex flex-col gap-4 overflow-y-auto py-4">
          <div>
            <Label htmlFor="rawTextImport" className="mb-1 block">Text to Import</Label>
            <Textarea
              id="rawTextImport"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="min-h-[200px] font-mono text-sm resize-none h-full bg-input"
              placeholder="Paste your text here..."
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="aiInstructionsImport" className="mb-1 block">Optional: Instructions for AI</Label>
            <Textarea
              id="aiInstructionsImport"
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              className="min-h-[100px] text-sm resize-none h-full bg-input"
              placeholder="e.g., Create an array of objects. Each object should have 'name' and 'email' keys."
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleImportWithAI} disabled={isLoading || !rawText.trim()}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            Import with AI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

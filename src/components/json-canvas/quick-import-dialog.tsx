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
import { useToast } from '@/hooks/use-toast';
import type { JsonValue } from './types';
import { convertTextToJson, type ConvertTextToJsonInput } from '@/ai/flows/convert-text-to-json-flow';
import { Loader2, Zap } from 'lucide-react';

interface QuickImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (newJson: JsonValue) => void;
  getApiKey: () => string | null;
}

export function QuickImportDialog({ open, onOpenChange, onImport, getApiKey }: QuickImportDialogProps) {
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImportWithAI = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast({ title: 'API Key Missing', description: 'Please set your OpenAI API key in settings for AI-powered import.', variant: 'destructive' });
      return;
    }
    if (!rawText.trim()) {
      toast({ title: 'Input Missing', description: 'Please paste some text to import.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const input: ConvertTextToJsonInput = { rawText };
      const result = await convertTextToJson(input);
      
      try {
        const parsedJson = JSON.parse(result.generatedJson);
        onImport(parsedJson);
        let description = 'Text successfully converted to JSON by AI.';
        if (result.notes) {
            description += ` AI Notes: ${result.notes}`;
        }
        toast({ title: 'Import Successful', description });
        onOpenChange(false);
        setRawText('');
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
      <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col bg-card">
        <DialogHeader>
          <DialogTitle>Quick Import with AI</DialogTitle>
          <DialogDescription>
            Paste any text (e.g., CSV, lists, messy notes, partial JSON) and AI will try to convert it into structured JSON.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto py-4">
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="min-h-[300px] font-mono text-sm resize-none h-full bg-input"
            placeholder="Paste your text here..."
            disabled={isLoading}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleImportWithAI} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            Import with AI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
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
import { formatJson, type FormatJsonInput } from '@/ai/flows/format-json-flow';
import { Loader2, Wand2 } from 'lucide-react';

interface EditEntireJsonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentJson: JsonValue;
  onSave: (newJson: JsonValue) => void;
  getApiKey: () => string | null; // Added for AI features
}

export function EditEntireJsonDialog({ open, onOpenChange, currentJson, onSave, getApiKey }: EditEntireJsonDialogProps) {
  const [jsonString, setJsonString] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      try {
        setJsonString(JSON.stringify(currentJson, null, 2));
      } catch (error) {
        setJsonString('Error parsing current JSON.');
        toast({ title: 'Error', description: 'Could not stringify current JSON.', variant: 'destructive' });
      }
    }
  }, [open, currentJson, toast]);

  const handleSave = () => {
    try {
      const parsedJson = JSON.parse(jsonString);
      onSave(parsedJson);
      toast({ title: 'JSON Updated', description: 'The entire JSON document has been updated.' });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Invalid JSON', description: 'The provided text is not valid JSON. Please correct it and try again.', variant: 'destructive' });
    }
  };

  const handleFormatWithAI = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast({ title: 'API Key Missing', description: 'Please set your OpenAI API key in settings for AI features.', variant: 'destructive' });
      return;
    }
    setIsFormatting(true);
    try {
      const input: FormatJsonInput = { jsonString };
      const result = await formatJson(input);
      setJsonString(result.formattedJson);
      let description = 'JSON has been formatted by AI.';
      if (result.correctionsMade) {
        description += ` ${result.correctionsMade}`;
      }
      toast({ title: 'JSON Formatted', description });
    } catch (error: any) {
      toast({ title: 'Formatting Failed', description: error.message || 'Could not format JSON with AI. Check console for details.', variant: 'destructive' });
      console.error('Error formatting JSON with AI:', error);
    } finally {
      setIsFormatting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isFormatting) onOpenChange(isOpen); }}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col bg-card">
        <DialogHeader>
          <DialogTitle>Edit Entire JSON</DialogTitle>
          <DialogDescription>
            Modify the raw JSON below. You can also use AI to format or fix it. Ensure it's valid JSON before saving.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto py-4">
          <Textarea
            value={jsonString}
            onChange={(e) => setJsonString(e.target.value)}
            className="min-h-[400px] font-mono text-sm resize-none h-full bg-input"
            placeholder="Enter valid JSON here..."
            disabled={isFormatting}
          />
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center">
           <Button type="button" onClick={handleFormatWithAI} variant="outline" disabled={isFormatting}>
            {isFormatting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Fix & Format with AI
          </Button>
          <div className="flex space-x-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isFormatting}>Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSave} disabled={isFormatting}>Save JSON</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

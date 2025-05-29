
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
import { generateJsonPatch, type GenerateJsonPatchInput } from '@/ai/flows/generate-json-patch-flow';
import { Loader2, Wand2, Zap, CheckCircle, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { applyPatch, type Operation } from 'fast-json-patch';

interface EditEntireJsonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentJson: JsonValue;
  onSave: (newJson: JsonValue) => void;
  getApiKey: () => string | null;
}

export function EditEntireJsonDialog({ open, onOpenChange, currentJson, onSave, getApiKey }: EditEntireJsonDialogProps) {
  const [jsonString, setJsonString] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [isGeneratingPatch, setIsGeneratingPatch] = useState(false);
  const [aiPatchInstructions, setAiPatchInstructions] = useState('');
  const [generatedPatchString, setGeneratedPatchString] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      try {
        setJsonString(JSON.stringify(currentJson, null, 2));
        setAiPatchInstructions(''); // Reset instructions on open
        setGeneratedPatchString(null); // Reset generated patch on open
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
      toast({ title: 'API Key Missing', description: 'Please set your Google AI API key for AI features.', variant: 'destructive' });
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
      toast({ title: 'Formatting Failed', description: error.message || 'Could not format JSON with AI.', variant: 'destructive' });
      console.error('Error formatting JSON with AI:', error);
    } finally {
      setIsFormatting(false);
    }
  };

  const handleGeneratePatchWithAI = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast({ title: 'API Key Missing', description: 'Please set your Google AI API key for AI features.', variant: 'destructive' });
      return;
    }
    if (!aiPatchInstructions.trim()) {
      toast({ title: 'Instructions Missing', description: 'Please describe the changes you want to make.', variant: 'destructive' });
      return;
    }
    setIsGeneratingPatch(true);
    setGeneratedPatchString(null); // Clear previous patch
    try {
      const input: GenerateJsonPatchInput = { currentJson: jsonString, instructions: aiPatchInstructions };
      const result = await generateJsonPatch(input);
      setGeneratedPatchString(result.patchOperations);
      toast({ title: 'JSON Patch Generated', description: 'Review the generated patch below and apply if correct.' });
    } catch (error: any) {
      toast({ title: 'Patch Generation Failed', description: error.message || 'Could not generate JSON patch with AI.', variant: 'destructive' });
      console.error('Error generating JSON patch with AI:', error);
    } finally {
      setIsGeneratingPatch(false);
    }
  };

  const handleApplyGeneratedPatch = () => {
    if (!generatedPatchString) return;

    try {
      const currentJsonObject = JSON.parse(jsonString);
      const patchOperations = JSON.parse(generatedPatchString) as Operation[];
      
      const patchedDocument = applyPatch(currentJsonObject, patchOperations, true, false).newDocument;
      
      setJsonString(JSON.stringify(patchedDocument, null, 2));
      toast({ title: 'Patch Applied Successfully', description: 'The JSON has been updated with the AI-generated changes.' });
      setGeneratedPatchString(null); // Clear patch after applying
      setAiPatchInstructions(''); // Optionally clear instructions
    } catch (error: any) {
      console.error('Error applying JSON patch:', error);
      toast({
        title: 'Patch Application Failed',
        description: `Could not apply the generated patch. Error: ${error.message}. The patch might be invalid for the current JSON structure.`,
        variant: 'destructive',
        duration: 7000,
      });
    }
  };

  const handleDiscardPatch = () => {
    setGeneratedPatchString(null);
  };
  
  const isDialogActionInProgress = isFormatting || isGeneratingPatch;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isDialogActionInProgress) onOpenChange(isOpen); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col bg-card">
        <DialogHeader>
          <DialogTitle>Edit Entire JSON</DialogTitle>
          <DialogDescription>
            Modify the raw JSON below. You can use AI to format it, or describe changes for AI to apply via JSON Patch.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto py-4 pr-2">
          {/* Left Column: JSON Editor and Format with AI */}
          <div className="flex flex-col space-y-3">
            <Label htmlFor="rawJsonEditor">Raw JSON Editor</Label>
            <Textarea
              id="rawJsonEditor"
              value={jsonString}
              onChange={(e) => setJsonString(e.target.value)}
              className="min-h-[calc(80vh-250px)] font-mono text-sm resize-none h-full bg-input"
              placeholder="Enter valid JSON here..."
              disabled={isDialogActionInProgress || !!generatedPatchString}
            />
            <Button 
              type="button" 
              onClick={handleFormatWithAI} 
              variant="outline" 
              disabled={isDialogActionInProgress || !!generatedPatchString} 
              className="w-full"
            >
              {isFormatting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Fix & Format JSON with AI
            </Button>
          </div>

          {/* Right Column: AI Patch Generation */}
          <div className="flex flex-col space-y-3">
            <Label htmlFor="aiPatchInstructions">Describe Changes (AI Patch)</Label>
            <Textarea
              id="aiPatchInstructions"
              value={aiPatchInstructions}
              onChange={(e) => setAiPatchInstructions(e.target.value)}
              className="min-h-[120px] text-sm resize-none bg-input"
              placeholder="e.g., Change project name to 'New Project', add a 'status' field with value 'active'."
              disabled={isDialogActionInProgress || !!generatedPatchString}
            />
            <Button 
              type="button" 
              onClick={handleGeneratePatchWithAI} 
              variant="outline" 
              disabled={isDialogActionInProgress || !aiPatchInstructions.trim() || !!generatedPatchString}
              className="w-full"
            >
              {isGeneratingPatch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Generate Patch with AI
            </Button>

            {generatedPatchString && (
              <div className="mt-3 border p-3 rounded-md bg-muted/50 flex-grow flex flex-col">
                <Label htmlFor="generatedPatchReview" className="mb-1">Generated JSON Patch (Review)</Label>
                <Textarea
                  id="generatedPatchReview"
                  value={generatedPatchString}
                  readOnly
                  className="min-h-[calc(80vh-450px)] font-mono text-xs resize-none h-full bg-input/70"
                />
                <div className="mt-3 flex space-x-2">
                  <Button onClick={handleApplyGeneratedPatch} className="flex-1" size="sm">
                    <CheckCircle className="mr-2 h-4 w-4" /> Apply This Patch
                  </Button>
                  <Button onClick={handleDiscardPatch} variant="destructive" className="flex-1" size="sm">
                    <XCircle className="mr-2 h-4 w-4" /> Discard Patch
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <Separator className="my-2" />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isDialogActionInProgress}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={isDialogActionInProgress || !!generatedPatchString}>
            Save JSON Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


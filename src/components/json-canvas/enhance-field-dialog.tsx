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
import { enhanceJsonField, type EnhanceJsonFieldInput } from '@/ai/flows/enhance-json-field';
import { Loader2 } from 'lucide-react';

interface EnhanceFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldContent: string;
  onEnhanced: (enhancedContent: string) => void;
  getApiKey: () => string | null;
}

export function EnhanceFieldDialog({ open, onOpenChange, fieldContent, onEnhanced, getApiKey }: EnhanceFieldDialogProps) {
  const [userPrompt, setUserPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEnhance = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast({ title: 'API Key Missing', description: 'Please set your OpenAI API key in settings.', variant: 'destructive' });
      return;
    }
    if (!userPrompt.trim()) {
      toast({ title: 'Prompt Missing', description: 'Please provide instructions for enhancement.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const input: EnhanceJsonFieldInput = {
        fieldContent,
        userPrompt,
      };
      // Temporarily set the API key for the Genkit call if necessary.
      // This depends on how @genkit-ai/next handles API key injection.
      // For client-side flows, it's assumed the flow itself might use a global config or fetch it.
      // If flows are strictly server-side, an API endpoint wrapper would be needed.
      // Given the current structure, flows seem to be server actions, so API key is handled server-side.
      const result = await enhanceJsonField(input);
      onEnhanced(result.enhancedContent);
      toast({ title: 'Content Enhanced', description: 'The field content has been enhanced by AI.' });
      onOpenChange(false);
      setUserPrompt('');
    } catch (error) {
      console.error('Error enhancing field:', error);
      toast({ title: 'Enhancement Failed', description: 'Could not enhance content. Check console for details.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isLoading) onOpenChange(isOpen); }}>
      <DialogContent className="sm:max-w-[500px] bg-card">
        <DialogHeader>
          <DialogTitle>Enhance Field Content</DialogTitle>
          <DialogDescription>
            Provide instructions for the AI to rewrite or enhance the current field content.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="currentContent">Current Content</Label>
            <Textarea id="currentContent" value={fieldContent} readOnly className="mt-1 h-24 bg-muted" />
          </div>
          <div>
            <Label htmlFor="userPrompt">Enhancement Instructions</Label>
            <Textarea
              id="userPrompt"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g., Make this sound more professional, summarize in 3 bullet points, rewrite as a poem..."
              className="mt-1 h-24"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleEnhance} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enhance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySave: (key: string) => void;
}

export function ApiKeyDialog({ open, onOpenChange, onApiKeySave }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const storedKey = localStorage.getItem('google_ai_api_key'); // UPDATED localStorage key
      if (storedKey) {
        setApiKey(storedKey);
      } else {
        setApiKey(''); // Clear if no key found, so placeholder isn't stale
      }
    }
  }, [open]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('google_ai_api_key', apiKey); // UPDATED localStorage key
      onApiKeySave(apiKey);
      toast({ title: 'API Key Saved', description: 'Your Google AI API key has been saved locally.' }); // UPDATED message
      onOpenChange(false);
    } else {
      toast({ title: 'Error', description: 'API Key cannot be empty.', variant: 'destructive' });
    }
  };

  const handleClear = () => {
    localStorage.removeItem('google_ai_api_key'); // UPDATED localStorage key
    setApiKey('');
    onApiKeySave(''); // Notify parent that key is cleared
    toast({ title: 'API Key Cleared', description: 'Your Google AI API key has been removed from local storage.' });
     onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle>Google AI API Key</DialogTitle> {/* UPDATED title */}
          <DialogDescription>
            Enter your Google AI API key (e.g., for Gemini) to enable AI features.
            Your key is stored locally in your browser and sent to Google AI services when using these features.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">
              API Key
            </Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="col-span-3"
              type="password"
              placeholder="Enter your Google AI API Key"
            />
          </div>
        </div>
        <DialogFooter className="justify-between">
          <Button type="button" variant="destructive" onClick={handleClear} disabled={!apiKey}>Clear Key</Button>
          <div className="flex space-x-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSave}>Save API Key</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
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

interface EditEntireJsonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentJson: JsonValue;
  onSave: (newJson: JsonValue) => void;
}

export function EditEntireJsonDialog({ open, onOpenChange, currentJson, onSave }: EditEntireJsonDialogProps) {
  const [jsonString, setJsonString] = useState('');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col bg-card">
        <DialogHeader>
          <DialogTitle>Edit Entire JSON</DialogTitle>
          <DialogDescription>
            Modify the raw JSON below. Ensure it's valid JSON before saving.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto py-4">
          <Textarea
            value={jsonString}
            onChange={(e) => setJsonString(e.target.value)}
            className="min-h-[400px] font-mono text-sm resize-none h-full bg-input"
            placeholder="Enter valid JSON here..."
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>Save JSON</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchModels = async () => {
    if (disabled) return;
    setLoading(true);
    try {
      const res = await fetch('/api/models');
      if (!res.ok) throw new Error('Failed to fetch models');
      const data = await res.json();
      setModels(Array.isArray(data.models) ? data.models : []);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Failed to load models',
        description: 'Could not fetch model list from provider.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="min-w-[200px]" disabled={disabled}>
          <SelectValue placeholder={disabled ? 'Set API key first' : 'Select model'} />
        </SelectTrigger>
        {!disabled && (
          <SelectContent>
            {models.map(model => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        )}
      </Select>
      <Button variant="ghost" size="icon" onClick={fetchModels} disabled={loading || disabled}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
      </Button>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { JsonValue, JsonPath, EditableJsonNodeProps } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Edit3, Trash2, PlusCircle, ChevronDown, ChevronRight, Wand2, Sparkles, ALargeSmall, ExternalLink, Maximize2, Minimize2, CheckIcon, XIcon,
  BrainCircuit, MessageSquare, ClipboardCopy, FileJson2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { summarizeJsonSection } from '@/ai/flows/summarize-json-section';
import { EnhanceFieldDialog } from './enhance-field-dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { marked } from 'marked'; // For Markdown preview
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../ui/dialog';


const getNestingLevelClasses = (depth: number) => {
  const bgColors = [
    'bg-indigo-50/30 dark:bg-indigo-900/20',
    'bg-purple-50/30 dark:bg-purple-900/20',
    'bg-pink-50/30 dark:bg-pink-900/20',
  ];
  const borderColors = [
    'border-indigo-300 dark:border-indigo-700',
    'border-purple-300 dark:border-purple-700',
    'border-pink-300 dark:border-pink-700',
  ];
  const selectedBg = bgColors[depth % bgColors.length];
  const selectedBorder = borderColors[depth % borderColors.length];
  return `border-l-2 pl-3 ml-1 my-1 ${selectedBorder} ${selectedBg} rounded-r-md py-1`;
};

export function JsonNode({ path, value, nodeKey, onUpdate, onDelete, onAddProperty, onAddItem, onRenameKey, depth, getApiKey }: EditableJsonNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [editValue, setEditValue] = useState<string>(JSON.stringify(value));
  const [newKeyName, setNewKeyName] = useState<string>(nodeKey || '');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [isEnhanceDialogOpen, setIsEnhanceDialogOpen] = useState(false);
  const [isMarkdownModalOpen, setIsMarkdownModalOpen] = useState(false);
  const [markdownModalContent, setMarkdownModalContent] = useState('');


  const { toast } = useToast();

  useEffect(() => {
    setEditValue(typeof value === 'string' ? value : JSON.stringify(value));
    if (nodeKey) setNewKeyName(nodeKey);
  }, [value, nodeKey]);

  const handleValueUpdate = () => {
    try {
      let parsedValue: JsonValue;
      if (typeof value === 'string') {
        parsedValue = editValue;
      } else if (typeof value === 'number') {
        parsedValue = parseFloat(editValue);
        if (isNaN(parsedValue)) throw new Error("Invalid number");
      } else if (typeof value === 'boolean') {
        // Boolean is handled by Checkbox, this path shouldn't be hit for direct editValue update
        parsedValue = value;
      } else {
        parsedValue = JSON.parse(editValue);
      }
      onUpdate(path, parsedValue);
      setIsEditing(false);
      toast({ title: 'Value Updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Invalid JSON value. For strings, edit directly. For other types, ensure valid JSON format.', variant: 'destructive' });
    }
  };

  const handleKeyUpdate = () => {
    if (onRenameKey && nodeKey && newKeyName.trim() && newKeyName.trim() !== nodeKey) {
      onRenameKey(path.slice(0, -1), nodeKey, newKeyName.trim());
      setIsEditingKey(false);
      toast({title: "Key Renamed"});
    } else {
      setIsEditingKey(false);
      if (newKeyName.trim() === nodeKey) return; // No change
      toast({ title: 'Error', description: 'Key name cannot be empty or unchanged.', variant: 'destructive' });
    }
  };

  const handleBooleanChange = (checked: boolean) => {
    onUpdate(path, checked);
    toast({ title: 'Value Updated' });
  };

  const handleSummarize = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast({ title: 'API Key Missing', description: 'Please set your OpenAI API key in settings.', variant: 'destructive' });
      return;
    }
    if (typeof value !== 'string') {
      toast({ title: 'Cannot Summarize', description: 'Summarization only works on string values.', variant: 'destructive' });
      return;
    }
    try {
      const result = await summarizeJsonSection({ jsonSection: value });
      onUpdate(path, result.summary); // Or show in a modal, then update
      toast({ title: 'Summary Generated', description: 'Content summarized by AI.' });
    } catch (error) {
      console.error("Summarization error:", error);
      toast({ title: 'Summarization Failed', variant: 'destructive' });
    }
  };
  
  const handleMarkdownModalSave = () => {
    onUpdate(path, markdownModalContent);
    setIsMarkdownModalOpen(false);
    toast({ title: 'Markdown Content Updated' });
  };


  const renderValue = () => {
    if (isEditing) {
      if (typeof value === 'string') {
        return <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="font-mono text-sm w-full min-h-[60px]" />;
      }
      if (typeof value === 'number') {
        return <Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="font-mono text-sm w-full" />;
      }
      return <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="font-mono text-sm w-full min-h-[60px]" placeholder="Enter valid JSON"/>;
    }

    if (typeof value === 'string') {
      if (showMarkdownPreview) {
        return <div className="prose dark:prose-invert max-w-none p-2 border rounded-md bg-background" dangerouslySetInnerHTML={{ __html: marked(value) as string }} />;
      }
      return <span className="font-mono text-sm text-green-600 dark:text-green-400 break-all">"{value}"</span>;
    }
    if (typeof value === 'number') return <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{value}</span>;
    if (typeof value === 'boolean') return <Checkbox checked={value} onCheckedChange={(checked) => handleBooleanChange(Boolean(checked))} className="ml-2" />;
    if (value === null) return <span className="font-mono text-sm text-gray-500">null</span>;
    return null; // Objects and arrays are handled by recursive rendering
  };

  const typeLabel = Array.isArray(value) ? 'Array' : typeof value === 'object' && value !== null ? 'Object' : '';

  const [newPropertyKey, setNewPropertyKey] = useState('');
  const [newPropertyValue, setNewPropertyValue] = useState('');
  const [newPropertyType, setNewPropertyType] = useState<'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'>('string');
  const [isAddingProperty, setIsAddingProperty] = useState(false);


  const handleAddPropertyConfirm = () => {
    if (!onAddProperty || !newPropertyKey.trim()) {
        toast({ title: 'Error', description: 'Property key cannot be empty.', variant: 'destructive' });
        return;
    }
    let val: JsonValue;
    try {
        switch (newPropertyType) {
            case 'string': val = newPropertyValue; break;
            case 'number': val = Number(newPropertyValue); if(isNaN(val as number)) throw new Error("Invalid number"); break;
            case 'boolean': val = newPropertyValue.toLowerCase() === 'true'; break;
            case 'object': val = {}; break;
            case 'array': val = []; break;
            case 'null': val = null; break;
            default: val = newPropertyValue;
        }
        onAddProperty(path, newPropertyKey, val);
        setNewPropertyKey('');
        setNewPropertyValue('');
        setIsAddingProperty(false);
        toast({title: "Property Added"});
    } catch (e: any) {
        toast({ title: 'Error adding property', description: e.message, variant: 'destructive' });
    }
  };
  
  const handleAddItemConfirm = () => {
    if (!onAddItem) return;
    let val: JsonValue;
     try {
        switch (newPropertyType) { // Re-use newPropertyType and newPropertyValue for adding items to array
            case 'string': val = newPropertyValue; break;
            case 'number': val = Number(newPropertyValue);  if(isNaN(val as number)) throw new Error("Invalid number"); break;
            case 'boolean': val = newPropertyValue.toLowerCase() === 'true'; break;
            case 'object': val = {}; break;
            case 'array': val = []; break;
            case 'null': val = null; break;
            default: val = newPropertyValue;
        }
        onAddItem(path, val);
        setNewPropertyValue(''); // Reset for next item
        setIsAddingProperty(false); // Close the "add" form
        toast({title: "Item Added"});
    } catch (e: any) {
        toast({ title: 'Error adding item', description: e.message, variant: 'destructive' });
    }
  };


  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("space-y-1", depth > 0 && getNestingLevelClasses(depth))}>
        <div className="flex items-center space-x-2 group">
          {/* Expand/Collapse for Objects/Arrays */}
          {(typeof value === 'object' && value !== null) && (
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-6 w-6 p-1">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </Button>
          )}

          {/* Key Display/Edit */}
          {nodeKey !== undefined && (
            isEditingKey ? (
              <div className="flex items-center">
                <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="h-7 font-mono text-sm" />
                <Button variant="ghost" size="icon" onClick={handleKeyUpdate} className="h-6 w-6 p-1"><CheckIcon size={16} /></Button>
                <Button variant="ghost" size="icon" onClick={() => setIsEditingKey(false)} className="h-6 w-6 p-1"><XIcon size={16} /></Button>
              </div>
            ) : (
              <span className="font-semibold text-sm text-primary group-hover:text-accent cursor-pointer" onClick={() => setIsEditingKey(true)}>
                {nodeKey}:
              </span>
            )
          )}
          
          {/* Type Label for Objects/Arrays when collapsed or empty */}
          {typeof value === 'object' && value !== null && (
             <span className="text-xs text-muted-foreground ml-1">
                {typeLabel}
                {isExpanded && ((Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0)) ? ' (empty)' : ''}
                {!isExpanded && Array.isArray(value) ? ` [${value.length} items]` : ''}
                {!isExpanded && typeof value === 'object' && !Array.isArray(value) && value !== null ? ` {${Object.keys(value).length} keys}` : ''}
             </span>
          )}

          {/* Value Display/Edit */}
          {typeof value !== 'object' && renderValue()}

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            {isEditing ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleValueUpdate} className="h-6 w-6 p-1"><CheckIcon size={16} /></Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Save Value</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="h-6 w-6 p-1"><XIcon size={16} /></Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Cancel Edit</p></TooltipContent>
                </Tooltip>
              </>
            ) : (
              typeof value !== 'object' && value !== null && typeof value !== 'boolean' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-6 w-6 p-1"><Edit3 size={16} /></Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Edit Value</p></TooltipContent>
                </Tooltip>
              )
            )}
             {nodeKey !== undefined && onRenameKey && (
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setIsEditingKey(true)} className="h-6 w-6 p-1"><ALargeSmall size={16}/></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Rename Key</p></TooltipContent>
                </Tooltip>
            )}
            {typeof value === 'string' && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setShowMarkdownPreview(!showMarkdownPreview)} className="h-6 w-6 p-1">
                      <MessageSquare size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{showMarkdownPreview ? "Show Raw Text" : "Preview Markdown"}</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => { setMarkdownModalContent(value); setIsMarkdownModalOpen(true);}} className="h-6 w-6 p-1">
                      <Maximize2 size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Expand Editor</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleSummarize} className="h-6 w-6 p-1"><Wand2 size={16} /></Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Summarize (AI)</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setIsEnhanceDialogOpen(true)} className="h-6 w-6 p-1"><Sparkles size={16} /></Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Enhance (AI)</p></TooltipContent>
                </Tooltip>
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onDelete(path, nodeKey)} className="h-6 w-6 p-1 text-destructive hover:text-destructive-foreground hover:bg-destructive"><Trash2 size={16} /></Button>
              </TooltipTrigger>
              <TooltipContent><p>Delete {nodeKey !==undefined ? 'Property' : 'Item'}</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* Add Property / Item Form */}
        {isAddingProperty && isExpanded && (
            <div className="pl-6 my-2 space-y-2 border-l-2 border-dashed border-gray-300 dark:border-gray-600 ml-2">
                {typeof value === 'object' && !Array.isArray(value) && value !== null && (
                     <Input 
                        placeholder="New property key" 
                        value={newPropertyKey} 
                        onChange={e => setNewPropertyKey(e.target.value)} 
                        className="h-8 text-sm"
                    />
                )}
                <div className="flex items-center space-x-2">
                    <Select value={newPropertyType} onValueChange={(val: any) => setNewPropertyType(val)}>
                        <SelectTrigger className="h-8 text-sm w-[120px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="object">Object</SelectItem>
                            <SelectItem value="array">Array</SelectItem>
                            <SelectItem value="null">Null</SelectItem>
                        </SelectContent>
                    </Select>
                    {(newPropertyType === 'string' || newPropertyType === 'number' || newPropertyType === 'boolean') && (
                        <Input 
                            placeholder={newPropertyType === 'boolean' ? "true or false" : "Value"}
                            value={newPropertyValue} 
                            onChange={e => setNewPropertyValue(e.target.value)} 
                            className="h-8 text-sm flex-grow"
                        />
                    )}
                </div>
                <div className="flex space-x-2">
                    <Button onClick={typeof value === 'object' && !Array.isArray(value) ? handleAddPropertyConfirm : handleAddItemConfirm} size="sm" className="h-7">Add</Button>
                    <Button onClick={() => setIsAddingProperty(false)} variant="outline" size="sm" className="h-7">Cancel</Button>
                </div>
            </div>
        )}


        {/* Recursive Rendering for Objects and Arrays */}
        {isExpanded && typeof value === 'object' && value !== null && (
          <div className={cn("pl-0", depth > 0 && "ml-0")}> {/* No extra pl/ml needed here, getNestingLevelClasses handles it */}
            {Array.isArray(value)
              ? value.map((item, index) => (
                  <JsonNode
                    key={index}
                    path={[...path, index]}
                    value={item}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onAddProperty={onAddProperty}
                    onAddItem={onAddItem}
                    onRenameKey={onRenameKey}
                    depth={depth + 1}
                    getApiKey={getApiKey}
                  />
                ))
              : Object.entries(value).map(([key, val]) => (
                  <JsonNode
                    key={key}
                    path={[...path, key]}
                    nodeKey={key}
                    value={val}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onAddProperty={onAddProperty}
                    onAddItem={onAddItem}
                    onRenameKey={onRenameKey}
                    depth={depth + 1}
                    getApiKey={getApiKey}
                  />
                ))}
            {/* Add Property/Item Button */}
             <Button variant="outline" size="sm" onClick={() => setIsAddingProperty(true)} className="mt-2 ml-4 h-7">
                <PlusCircle size={14} className="mr-1" /> {Array.isArray(value) ? "Add Item" : "Add Property"}
            </Button>
          </div>
        )}

        {/* Enhance Field Dialog */}
        {typeof value === 'string' && (
          <EnhanceFieldDialog
            open={isEnhanceDialogOpen}
            onOpenChange={setIsEnhanceDialogOpen}
            fieldContent={value}
            onEnhanced={(newContent) => onUpdate(path, newContent)}
            getApiKey={getApiKey}
          />
        )}
        
        {/* Markdown Full Modal Editor */}
        {typeof value === 'string' && (
           <Dialog open={isMarkdownModalOpen} onOpenChange={setIsMarkdownModalOpen}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-card">
              <DialogHeader>
                <DialogTitle>Edit Markdown Content</DialogTitle>
              </DialogHeader>
              <div className="flex-grow grid grid-cols-2 gap-4 overflow-hidden py-4">
                <div className="flex flex-col">
                  <Label htmlFor="markdown-editor-modal">Markdown</Label>
                  <Textarea
                    id="markdown-editor-modal"
                    value={markdownModalContent}
                    onChange={(e) => setMarkdownModalContent(e.target.value)}
                    className="flex-grow font-mono text-sm resize-none mt-1"
                  />
                </div>
                <div className="flex flex-col">
                  <Label>Preview</Label>
                  <div 
                    className="flex-grow prose dark:prose-invert max-w-none p-2 border rounded-md overflow-y-auto mt-1 bg-muted"
                    dangerouslySetInnerHTML={{ __html: marked(markdownModalContent) as string }} 
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="button" onClick={handleMarkdownModalSave}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </TooltipProvider>
  );
}

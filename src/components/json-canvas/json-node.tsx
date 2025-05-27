
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { JsonValue, JsonPath, EditableJsonNodeProps } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Edit3, Trash2, PlusCircle, ChevronDown, ChevronRight, Wand2, Sparkles, ALargeSmall, Maximize2, CheckIcon, XIcon,
  MessageSquare, ClipboardCopy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { summarizeJsonSection } from '@/ai/flows/summarize-json-section';
import { EnhanceFieldDialog } from './enhance-field-dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { marked } from 'marked';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../ui/dialog';


const getNestingLevelClasses = (depth: number) => {
  const bgColors = [
    'bg-indigo-50/30 dark:bg-indigo-900/20',
    'bg-purple-50/30 dark:bg-purple-900/20',
    'bg-pink-50/30 dark:bg-pink-900/20',
    'bg-teal-50/30 dark:bg-teal-900/20',
    'bg-sky-50/30 dark:bg-sky-900/20',
  ];
  const borderColors = [
    'border-indigo-300 dark:border-indigo-700',
    'border-purple-300 dark:border-purple-700',
    'border-pink-300 dark:border-pink-700',
    'border-teal-300 dark:border-teal-700',
    'border-sky-300 dark:border-sky-700',
  ];
  const selectedBg = bgColors[depth % bgColors.length];
  const selectedBorder = borderColors[depth % borderColors.length];
  return `border-l-2 pl-3 ml-1 my-1 ${selectedBorder} ${selectedBg} rounded-r-md py-1 group/node-item`;
};

// Helper function to highlight search term in text
const getHighlightedText = (text: string, highlight: string): React.ReactNode => {
  if (!highlight.trim()) {
    return text;
  }
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};


export function JsonNode({ 
  path, 
  value, 
  nodeKey, 
  onUpdate, 
  onDelete, 
  onAddProperty, 
  onAddItem, 
  onRenameKey, 
  depth, 
  getApiKey,
  expansionTrigger,
  searchTerm,
  onSetHoveredPath
}: EditableJsonNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [editValue, setEditValue] = useState<string>(JSON.stringify(value));
  const [newKeyName, setNewKeyName] = useState<string>(nodeKey || '');
  const [isExpandedState, setIsExpandedState] = useState(true); 
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [isEnhanceDialogOpen, setIsEnhanceDialogOpen] = useState(false);
  const [isMarkdownModalOpen, setIsMarkdownModalOpen] = useState(false);
  const [markdownModalContent, setMarkdownModalContent] = useState('');


  const { toast } = useToast();

  // Memoize isExpanded to prevent unnecessary re-renders unless specific props change
  const isExpanded = useMemo(() => {
    if (expansionTrigger && (typeof value === 'object' && value !== null)) {
      return expansionTrigger.type === 'expand';
    }
    return isExpandedState;
  }, [expansionTrigger, value, isExpandedState]);

  // Effect to handle internal expansion state changes
  useEffect(() => {
    if (expansionTrigger && (typeof value === 'object' && value !== null)) {
      setIsExpandedState(expansionTrigger.type === 'expand');
    }
  }, [expansionTrigger, value]);

  // Toggle internal expansion state
  const toggleExpansion = () => {
    if (typeof value === 'object' && value !== null) {
      setIsExpandedState(prev => !prev);
    }
  };


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
      if (newKeyName.trim() === nodeKey) return; 
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
      toast({ title: 'API Key Missing', description: 'Please set your Google AI API key in settings.', variant: 'destructive' });
      return;
    }
    if (typeof value !== 'string') {
      toast({ title: 'Cannot Summarize', description: 'Summarization only works on string values.', variant: 'destructive' });
      return;
    }
    try {
      const result = await summarizeJsonSection({ jsonSection: value });
      onUpdate(path, result.summary); 
      toast({ title: 'Summary Generated', description: 'Content summarized by AI.' });
    } catch (error: any) {
      console.error("Summarization error:", error);
      toast({ title: 'Summarization Failed', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    }
  };
  
  const handleMarkdownModalSave = () => {
    onUpdate(path, markdownModalContent);
    setIsMarkdownModalOpen(false);
    toast({ title: 'Markdown Content Updated' });
  };

  const handleCopyToClipboard = useCallback(async () => {
    const valueToCopy = (typeof value === 'object' && value !== null) || typeof value === 'boolean'
        ? JSON.stringify(value, null, 2) 
        : String(value);
    try {
      await navigator.clipboard.writeText(valueToCopy);
      toast({ title: 'Copied to clipboard!', description: `Value: "${valueToCopy.substring(0,70)}${valueToCopy.length > 70 ? '...' : ''}"` });
    } catch (err) {
      toast({ title: 'Failed to copy', description: 'Could not copy text to clipboard.', variant: 'destructive' });
      console.error('Failed to copy text: ', err);
    }
  }, [value, toast]);

  const handleMouseEnter = () => {
    if (onSetHoveredPath) {
      onSetHoveredPath(path);
    }
  };

  const handleMouseLeave = () => {
    if (onSetHoveredPath) {
      onSetHoveredPath(null);
    }
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

    let displayValue: React.ReactNode;
    let valueStringForSearch = "";

    if (typeof value === 'string') {
       valueStringForSearch = value;
      if (showMarkdownPreview && value.length > 50) { 
        displayValue = <div className="prose dark:prose-invert max-w-none p-2 border rounded-md bg-background/50 my-1" dangerouslySetInnerHTML={{ __html: marked(value) as string }} />;
      } else {
        displayValue = <span className="font-mono text-sm text-green-600 dark:text-green-400 break-all">"{searchTerm ? getHighlightedText(value, searchTerm) : value}"</span>;
      }
    } else if (typeof value === 'number') {
      valueStringForSearch = String(value);
      displayValue = <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{searchTerm ? getHighlightedText(String(value), searchTerm) : value}</span>;
    } else if (typeof value === 'boolean') {
      valueStringForSearch = String(value);
      displayValue = <Checkbox checked={value} onCheckedChange={(checkedState) => handleBooleanChange(Boolean(checkedState))} className="ml-1" />;
      // Checkbox itself doesn't need text highlighting, but its string representation might match
    } else if (value === null) {
      valueStringForSearch = "null";
      displayValue = <span className="font-mono text-sm text-gray-500 dark:text-gray-400">{searchTerm ? getHighlightedText("null", searchTerm) : "null"}</span>;
    } else {
       return null; // Objects and arrays are handled by recursive rendering
    }
    
    // Add a general data attribute for easier selection if needed for search highlighting logic at parent level
    return <span data-searchable-value={valueStringForSearch}>{displayValue}</span>;
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
            case 'number': val = Number(newPropertyValue); if(isNaN(val as number) && newPropertyValue.trim() !== "") throw new Error("Invalid number"); if(newPropertyValue.trim() === "") val = 0; break;
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
        switch (newPropertyType) { 
            case 'string': val = newPropertyValue; break;
            case 'number': val = Number(newPropertyValue);  if(isNaN(val as number) && newPropertyValue.trim() !== "") throw new Error("Invalid number"); if(newPropertyValue.trim() === "") val = 0; break;
            case 'boolean': val = newPropertyValue.toLowerCase() === 'true'; break;
            case 'object': val = {}; break;
            case 'array': val = []; break;
            case 'null': val = null; break;
            default: val = newPropertyValue;
        }
        onAddItem(path, val);
        setNewPropertyValue(''); 
        setIsAddingProperty(false); 
        toast({title: "Item Added"});
    } catch (e: any) {
        toast({ title: 'Error adding item', description: e.message, variant: 'destructive' });
    }
  };

  let buttonRenderIndex = 0;
  const delayClasses = [
    "", 
    "delay-75",
    "delay-100",
    "delay-150",
    "delay-200",
    "delay-[250ms]",
    "delay-300",
    "delay-[350ms]",
    "delay-[400ms]",
    "delay-[450ms]",
  ];

  const getButtonAnimationClasses = () => {
    const delayClass = delayClasses[buttonRenderIndex] || delayClasses[delayClasses.length -1];
    buttonRenderIndex++;
    return `
      opacity-0 transform translate-x-2 
      group-hover/node-item-header:opacity-100 group-hover/node-item-header:translate-x-0 
      group-focus-within/node-item-header:opacity-100 group-focus-within/node-item-header:translate-x-0 
      transition-all ease-out duration-200 ${delayClass}
    `;
  };

  const isPrimitiveOrNull = typeof value !== 'object' || value === null;
  const displayKey = nodeKey !== undefined ? (searchTerm ? getHighlightedText(nodeKey, searchTerm) : nodeKey) : '';


  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className={cn("space-y-1", depth > 0 && getNestingLevelClasses(depth))}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center space-x-2 group/node-item-header min-h-[32px]">
          {(typeof value === 'object' && value !== null) && (
            <Button variant="ghost" size="icon" onClick={toggleExpansion} className="h-6 w-6 p-1 self-center">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </Button>
          )}

          {nodeKey !== undefined && (
            isEditingKey ? (
              <div className="flex items-center">
                <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="h-7 font-mono text-sm" autoFocus onBlur={handleKeyUpdate} onKeyDown={(e) => e.key === 'Enter' && handleKeyUpdate()} />
                <Button variant="ghost" size="icon" onClick={handleKeyUpdate} className="h-6 w-6 p-1"><CheckIcon size={16} /></Button>
                <Button variant="ghost" size="icon" onClick={() => setIsEditingKey(false)} className="h-6 w-6 p-1"><XIcon size={16} /></Button>
              </div>
            ) : (
              <span className="font-semibold text-sm text-primary group-hover/node-item:text-accent cursor-pointer py-1" onClick={() => setIsEditingKey(true)}>
                {displayKey}:
              </span>
            )
          )}
          
          {typeof value === 'object' && value !== null && (
             <span className="text-xs text-muted-foreground ml-1">
                {typeLabel}
                {isExpanded && ((Array.isArray(value) && value.length === 0) || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) ? ' (empty)' : ''}
                {!isExpanded && Array.isArray(value) ? ` [${value.length} items]` : ''}
                {!isExpanded && typeof value === 'object' && !Array.isArray(value) && value !== null ? ` {${Object.keys(value).length} keys}` : ''}
             </span>
          )}

          {isPrimitiveOrNull ? renderValue() : null}


          <div className="flex items-center space-x-1 ml-auto opacity-0 group-hover/node-item-header:opacity-100 group-focus-within/node-item-header:opacity-100 transition-opacity duration-100">
            {isEditing ? (
              <>
                <div className={getButtonAnimationClasses()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleValueUpdate} className="h-6 w-6 p-1"><CheckIcon size={16} /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Save Value</p></TooltipContent>
                  </Tooltip>
                </div>
                <div className={getButtonAnimationClasses()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="h-6 w-6 p-1"><XIcon size={16} /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Cancel Edit</p></TooltipContent>
                  </Tooltip>
                </div>
              </>
            ) : (
              typeof value !== 'object' && value !== null && typeof value !== 'boolean' && (
                <div className={getButtonAnimationClasses()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-6 w-6 p-1"><Edit3 size={16} /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Edit Value</p></TooltipContent>
                  </Tooltip>
                </div>
              )
            )}
             {nodeKey !== undefined && onRenameKey && (
                <div className={getButtonAnimationClasses()}>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setIsEditingKey(true)} className="h-6 w-6 p-1"><ALargeSmall size={16}/></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Rename Key</p></TooltipContent>
                  </Tooltip>
                </div>
            )}
            {isPrimitiveOrNull && ( // Only show copy for primitives and null, arrays/objects can be large
              <div className={getButtonAnimationClasses()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleCopyToClipboard} className="h-6 w-6 p-1">
                      <ClipboardCopy size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Copy Value</p></TooltipContent>
                </Tooltip>
              </div>
            )}
            {typeof value === 'string' && (
              <>
                <div className={getButtonAnimationClasses()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setShowMarkdownPreview(!showMarkdownPreview)} className="h-6 w-6 p-1">
                        <MessageSquare size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{showMarkdownPreview ? "Show Raw Text" : "Preview Markdown (for long text)"}</p></TooltipContent>
                  </Tooltip>
                </div>
                <div className={getButtonAnimationClasses()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => { setMarkdownModalContent(value); setIsMarkdownModalOpen(true);}} className="h-6 w-6 p-1">
                        <Maximize2 size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Expand Editor (Markdown)</p></TooltipContent>
                  </Tooltip>
                </div>
                <div className={getButtonAnimationClasses()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleSummarize} className="h-6 w-6 p-1"><Wand2 size={16} /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Summarize (AI)</p></TooltipContent>
                  </Tooltip>
                </div>
                <div className={getButtonAnimationClasses()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsEnhanceDialogOpen(true)} className="h-6 w-6 p-1"><Sparkles size={16} /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Enhance (AI)</p></TooltipContent>
                  </Tooltip>
                </div>
              </>
            )}
            <div className={getButtonAnimationClasses()}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(path, nodeKey)} className="h-6 w-6 p-1 text-destructive hover:text-destructive-foreground hover:bg-destructive"><Trash2 size={16} /></Button>
                </TooltipTrigger>
                <TooltipContent><p>Delete {nodeKey !==undefined ? 'Property' : 'Item'}</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        
        {isAddingProperty && isExpanded && (
            <div className="pl-6 my-2 space-y-2 border-l-2 border-dashed border-gray-300 dark:border-gray-600 ml-2 py-2 rounded-md">
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
                            <SelectItem value="object">Object {}</SelectItem>
                            <SelectItem value="array">Array []</SelectItem>
                            <SelectItem value="null">Null</SelectItem>
                        </SelectContent>
                    </Select>
                    {(newPropertyType === 'string' || newPropertyType === 'number' || newPropertyType === 'boolean') && (
                        <Input 
                            placeholder={newPropertyType === 'boolean' ? "true or false" : "Value (empty for default)"}
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


        {isExpanded && typeof value === 'object' && value !== null && (
          <div className={cn("pl-0", depth > 0 && "ml-0")}> 
            {Array.isArray(value)
              ? value.map((item, index) => (
                  <JsonNode
                    key={`${path.join('-')}-item-${index}-${typeof item === 'object' ? 'obj' : String(item).slice(0,5)}`} // More robust key
                    path={[...path, index]}
                    value={item}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onAddProperty={onAddProperty}
                    onAddItem={onAddItem}
                    onRenameKey={onRenameKey}
                    depth={depth + 1}
                    getApiKey={getApiKey}
                    expansionTrigger={expansionTrigger}
                    searchTerm={searchTerm}
                    onSetHoveredPath={onSetHoveredPath}
                  />
                ))
              : Object.entries(value).map(([key, val]) => (
                  <JsonNode
                    key={`${path.join('-')}-prop-${key}-${typeof val === 'object' ? 'obj' : String(val).slice(0,5)}`} // More robust key
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
                    expansionTrigger={expansionTrigger}
                    searchTerm={searchTerm}
                    onSetHoveredPath={onSetHoveredPath}
                  />
                ))}
             <Button variant="outline" size="sm" onClick={() => setIsAddingProperty(true)} className="mt-2 ml-4 h-7 text-xs">
                <PlusCircle size={14} className="mr-1" /> {Array.isArray(value) ? "Add Item" : "Add Property"}
            </Button>
          </div>
        )}

        {typeof value === 'string' && (
          <EnhanceFieldDialog
            open={isEnhanceDialogOpen}
            onOpenChange={setIsEnhanceDialogOpen}
            fieldContent={value}
            onEnhanced={(newContent) => onUpdate(path, newContent)}
            getApiKey={getApiKey}
          />
        )}
        
        {typeof value === 'string' && (
           <Dialog open={isMarkdownModalOpen} onOpenChange={setIsMarkdownModalOpen}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-card">
              <DialogHeader>
                <DialogTitle>Edit Markdown Content</DialogTitle>
              </DialogHeader>
              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden py-4">
                <div className="flex flex-col h-full">
                  <Label htmlFor="markdown-editor-modal" className="mb-1">Markdown</Label>
                  <Textarea
                    id="markdown-editor-modal"
                    value={markdownModalContent}
                    onChange={(e) => setMarkdownModalContent(e.target.value)}
                    className="flex-grow font-mono text-sm resize-none h-full"
                  />
                </div>
                <div className="flex flex-col h-full">
                  <Label className="mb-1">Preview</Label>
                  <div 
                    className="flex-grow prose dark:prose-invert max-w-none p-3 border rounded-md overflow-y-auto bg-muted h-full"
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

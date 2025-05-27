
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { JsonValue, JsonPath, EditableJsonNodeProps, ExpansionTrigger } from './types';
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
  if (!highlight || !text || !highlight.trim()) {
    return text;
  }
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = String(text).split(regex); // Ensure text is a string
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


const JsonNodeComponent: React.FC<EditableJsonNodeProps> = ({ 
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
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [editValue, setEditValue] = useState<string>(JSON.stringify(value));
  const [newKeyName, setNewKeyName] = useState<string>(nodeKey || '');
  
  // Default to expanded, global trigger can override this
  const [isExpandedState, setIsExpandedState] = useState(true); 
  
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [isEnhanceDialogOpen, setIsEnhanceDialogOpen] = useState(false);
  const [isMarkdownModalOpen, setIsMarkdownModalOpen] = useState(false);
  const [markdownModalContent, setMarkdownModalContent] = useState('');


  const { toast } = useToast();
  
  useEffect(() => {
    // This effect updates the local expansion state based on the global trigger
    if (expansionTrigger && (typeof value === 'object' && value !== null)) {
      setIsExpandedState(expansionTrigger.type === 'expand');
    }
    // If expansionTrigger becomes null (e.g. new data loaded), local state is maintained
    // or defaults to true if node is new.
  }, [expansionTrigger, value]); // Rerun if global trigger changes or node value changes


  const isExpanded = useMemo(() => {
    // If a global trigger is active for objects/arrays, it overrides local state.
    if (expansionTrigger && (typeof value === 'object' && value !== null)) {
      return expansionTrigger.type === 'expand';
    }
    // Otherwise, use the local state.
    return isExpandedState;
  }, [expansionTrigger, value, isExpandedState]);


  const toggleExpansion = useCallback(() => {
    if (typeof value === 'object' && value !== null) {
      setIsExpandedState(prev => !prev); // This updates the local state
    }
  }, [value]);


  useEffect(() => {
    setEditValue(typeof value === 'string' ? value : JSON.stringify(value));
    if (nodeKey) setNewKeyName(nodeKey);
  }, [value, nodeKey]);


  const handleValueUpdate = useCallback(() => {
    try {
      let parsedValue: JsonValue;
      if (typeof value === 'string') {
        parsedValue = editValue;
      } else if (typeof value === 'number') {
        parsedValue = parseFloat(editValue);
        if (isNaN(parsedValue)) throw new Error("Invalid number");
      } else if (typeof value === 'boolean') {
        // Boolean is handled by Checkbox, this path is for JSON text editing of a boolean
        if (editValue.toLowerCase() === 'true') parsedValue = true;
        else if (editValue.toLowerCase() === 'false') parsedValue = false;
        else throw new Error("Invalid boolean string");
      } else if (value === null) {
         if (editValue.toLowerCase() === 'null') parsedValue = null;
         else throw new Error("Invalid null string");
      }
      else { // object or array (or trying to parse a non-string as one)
        parsedValue = JSON.parse(editValue);
      }
      onUpdate(path, parsedValue);
      setIsEditing(false);
      toast({ title: 'Value Updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Invalid JSON value. For strings, edit directly. For other types, ensure valid JSON format.', variant: 'destructive' });
    }
  }, [editValue, onUpdate, path, value, toast]);

  const handleKeyUpdate = useCallback(() => {
    if (onRenameKey && nodeKey && newKeyName.trim() && newKeyName.trim() !== nodeKey) {
      onRenameKey(path.slice(0, -1), nodeKey, newKeyName.trim());
      setIsEditingKey(false);
      toast({title: "Key Renamed"});
    } else {
      setIsEditingKey(false); // Close editor even if no change or error
      if (newKeyName.trim() === nodeKey) return; // No actual change
      if (!newKeyName.trim()) {
        toast({ title: 'Error', description: 'Key name cannot be empty.', variant: 'destructive' });
      }
    }
  }, [newKeyName, nodeKey, onRenameKey, path, toast]);

  const handleBooleanChange = useCallback((checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      onUpdate(path, checked);
      toast({ title: 'Value Updated' });
    }
  }, [onUpdate, path, toast]);

  const handleSummarize = useCallback(async () => {
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
  }, [getApiKey, onUpdate, path, value, toast]);
  
  const handleMarkdownModalSave = useCallback(() => {
    onUpdate(path, markdownModalContent);
    setIsMarkdownModalOpen(false);
    toast({ title: 'Markdown Content Updated' });
  }, [markdownModalContent, onUpdate, path, toast]);

  const handleCopyToClipboard = useCallback(async () => {
    const valueToCopy = (typeof value === 'object' && value !== null) || typeof value === 'boolean'
        ? JSON.stringify(value, null, 2) 
        : String(value); // Handles string, number, null
    try {
      await navigator.clipboard.writeText(valueToCopy);
      toast({ title: 'Copied to clipboard!', description: `Value: "${valueToCopy.substring(0,70)}${valueToCopy.length > 70 ? '...' : ''}"` });
    } catch (err) {
      toast({ title: 'Failed to copy', description: 'Could not copy text to clipboard.', variant: 'destructive' });
      console.error('Failed to copy text: ', err);
    }
  }, [value, toast]);

  const handleMouseEnter = useCallback(() => {
    if (onSetHoveredPath) {
      onSetHoveredPath(path);
    }
  }, [onSetHoveredPath, path]);

  const handleMouseLeave = useCallback(() => {
    if (onSetHoveredPath) {
      onSetHoveredPath(null);
    }
  }, [onSetHoveredPath]);


  const renderValue = () => {
    if (isEditing) {
      if (typeof value === 'string') {
        return <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="font-mono text-sm w-full min-h-[60px]" />;
      }
      if (typeof value === 'number') {
        return <Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="font-mono text-sm w-full" />;
      }
       // For boolean or null, or if user wants to edit complex type as raw JSON
      return <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="font-mono text-sm w-full min-h-[60px]" placeholder="Enter valid JSON (e.g. true, null, or {...})"/>;
    }

    let displayValue: React.ReactNode;
    let valueStringForSearch = ""; // Used for data-attribute for easier DOM search if needed

    if (typeof value === 'string') {
       valueStringForSearch = value;
      if (showMarkdownPreview && value.length > 50) { 
        displayValue = <div className="prose dark:prose-invert max-w-none p-2 border rounded-md bg-background/50 my-1" dangerouslySetInnerHTML={{ __html: marked(value) as string }} />;
      } else {
        displayValue = <span className="font-mono text-sm text-green-600 dark:text-green-400 break-all">"{getHighlightedText(value, searchTerm || "")}"</span>;
      }
    } else if (typeof value === 'number') {
      valueStringForSearch = String(value);
      displayValue = <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{getHighlightedText(String(value), searchTerm || "")}</span>;
    } else if (typeof value === 'boolean') {
      valueStringForSearch = String(value);
      displayValue = <Checkbox checked={value} onCheckedChange={handleBooleanChange} className="ml-1" aria-label={`Value ${value}, toggle boolean`}/>;
    } else if (value === null) {
      valueStringForSearch = "null";
      displayValue = <span className="font-mono text-sm text-gray-500 dark:text-gray-400">{getHighlightedText("null", searchTerm || "")}</span>;
    } else {
       // This case should not be reached if JsonNode is used for primitives only when value is not object/array.
       // If value is object/array, JsonNode renders children, not this renderValue().
       return null; 
    }
    
    return <span data-searchable-value={valueStringForSearch}>{displayValue}</span>;
  };

  const typeLabel = Array.isArray(value) ? 'Array' : typeof value === 'object' && value !== null ? 'Object' : '';

  const [newPropertyKey, setNewPropertyKey] = useState('');
  const [newPropertyValue, setNewPropertyValue] = useState('');
  const [newPropertyType, setNewPropertyType] = useState<'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'>('string');
  const [isAddingProperty, setIsAddingProperty] = useState(false);


  const handleAddPropertyConfirm = useCallback(() => {
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
  }, [newPropertyKey, newPropertyValue, newPropertyType, onAddProperty, path, toast]);
  
  const handleAddItemConfirm = useCallback(() => {
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
  }, [newPropertyValue, newPropertyType, onAddItem, path, toast]);

  // For staggered button animation
  const buttonRenderIndex = React.useRef(0);
  useEffect(() => {
    buttonRenderIndex.current = 0; // Reset for each render pass of the node header
  });

  const delayClasses = [
    "", "delay-75", "delay-100", "delay-150", "delay-200", 
    "delay-[250ms]", "delay-300", "delay-[350ms]", "delay-[400ms]", "delay-[450ms]",
  ];

  const getButtonAnimationClasses = useCallback(() => {
    const delayClass = delayClasses[buttonRenderIndex.current] || delayClasses[delayClasses.length -1];
    buttonRenderIndex.current++;
    return `
      opacity-0 transform translate-x-2 
      group-hover/node-item-header:opacity-100 group-hover/node-item-header:translate-x-0 
      group-focus-within/node-item-header:opacity-100 group-focus-within/node-item-header:translate-x-0 
      transition-all ease-out duration-200 ${delayClass}
    `;
  }, []); 


  const isPrimitiveOrNull = typeof value !== 'object' || value === null;
  const displayKey = nodeKey !== undefined ? getHighlightedText(nodeKey, searchTerm || "") : '';


  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className={cn("space-y-1", depth > 0 && getNestingLevelClasses(depth))}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center space-x-2 group/node-item-header min-h-[32px]">
          {(typeof value === 'object' && value !== null) && (
            <Button variant="ghost" size="icon" onClick={toggleExpansion} className="h-6 w-6 p-1 self-center" aria-label={isExpanded ? "Collapse" : "Expand"}>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </Button>
          )}

          {nodeKey !== undefined && ( // nodeKey is present for object properties and potentially for root if titled
            isEditingKey ? (
              <div className="flex items-center">
                <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="h-7 font-mono text-sm" autoFocus onBlur={handleKeyUpdate} onKeyDown={(e) => e.key === 'Enter' && handleKeyUpdate()} />
                <Button variant="ghost" size="icon" onClick={handleKeyUpdate} className="h-6 w-6 p-1" aria-label="Save key"><CheckIcon size={16} /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setIsEditingKey(false); setNewKeyName(nodeKey);}} className="h-6 w-6 p-1" aria-label="Cancel rename"><XIcon size={16} /></Button>
              </div>
            ) : (
              <span className="font-semibold text-sm text-primary group-hover/node-item:text-accent cursor-pointer py-1" onClick={() => setIsEditingKey(true)}>
                {displayKey}:
              </span>
            )
          )}
          
          {typeof value === 'object' && value !== null && ( // For objects and arrays, show type label
             <span className="text-xs text-muted-foreground ml-1">
                {typeLabel}
                {isExpanded && ((Array.isArray(value) && value.length === 0) || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) ? ' (empty)' : ''}
                {!isExpanded && Array.isArray(value) ? ` [${value.length} item${value.length === 1 ? '' : 's'}]` : ''}
                {!isExpanded && typeof value === 'object' && !Array.isArray(value) && value !== null ? ` {${Object.keys(value).length} key${Object.keys(value).length === 1 ? '' : 's'}}` : ''}
             </span>
          )}

          {isPrimitiveOrNull ? renderValue() : null}


          <div className="flex items-center space-x-1 ml-auto opacity-0 group-hover/node-item-header:opacity-100 group-focus-within/node-item-header:opacity-100 transition-opacity duration-100">
            {isEditing ? (
              <>
                <div className={getButtonAnimationClasses()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleValueUpdate} className="h-6 w-6 p-1" aria-label="Save value"><CheckIcon size={16} /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Save Value</p></TooltipContent>
                  </Tooltip>
                </div>
                <div className={getButtonAnimationClasses()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="h-6 w-6 p-1" aria-label="Cancel edit value"><XIcon size={16} /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Cancel Edit</p></TooltipContent>
                  </Tooltip>
                </div>
              </>
            ) : (
              typeof value !== 'object' && value !== null && typeof value !== 'boolean' && ( // Don't show edit button for booleans (handled by checkbox) or complex types (handled by children)
                <div className={getButtonAnimationClasses()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => { setEditValue(typeof value === 'string' ? value : JSON.stringify(value)); setIsEditing(true);}} className="h-6 w-6 p-1" aria-label="Edit value"><Edit3 size={16} /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Edit Value</p></TooltipContent>
                  </Tooltip>
                </div>
              )
            )}
             {nodeKey !== undefined && onRenameKey && ( // Only show rename if it's a property of an object (has nodeKey and onRenameKey)
                <div className={getButtonAnimationClasses()}>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setIsEditingKey(true)} className="h-6 w-6 p-1" aria-label="Rename key"><ALargeSmall size={16}/></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Rename Key</p></TooltipContent>
                  </Tooltip>
                </div>
            )}
            {(isPrimitiveOrNull || Array.isArray(value) || typeof value === 'object') && value !== undefined && ( // Copy works for all types
              <div className={getButtonAnimationClasses()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleCopyToClipboard} className="h-6 w-6 p-1" aria-label="Copy value">
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
                      <Button variant="ghost" size="icon" onClick={() => setShowMarkdownPreview(!showMarkdownPreview)} className="h-6 w-6 p-1" aria-label={showMarkdownPreview ? "Show raw text" : "Preview markdown"}>
                        <MessageSquare size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{showMarkdownPreview ? "Show Raw Text" : "Preview Markdown (for long text)"}</p></TooltipContent>
                  </Tooltip>
                </div>
                <div className={getButtonAnimationClasses()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => { setMarkdownModalContent(value); setIsMarkdownModalOpen(true);}} className="h-6 w-6 p-1" aria-label="Expand markdown editor">
                        <Maximize2 size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Expand Editor (Markdown)</p></TooltipContent>
                  </Tooltip>
                </div>
                <div className={getButtonAnimationClasses()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleSummarize} className="h-6 w-6 p-1" aria-label="Summarize with AI"><Wand2 size={16} /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Summarize (AI)</p></TooltipContent>
                  </Tooltip>
                </div>
                <div className={getButtonAnimationClasses()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsEnhanceDialogOpen(true)} className="h-6 w-6 p-1" aria-label="Enhance with AI"><Sparkles size={16} /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Enhance (AI)</p></TooltipContent>
                  </Tooltip>
                </div>
              </>
            )}
            {onDelete && ( // Conditionally render delete button
              <div className={getButtonAnimationClasses()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(path, nodeKey)} className="h-6 w-6 p-1 text-destructive hover:text-destructive-foreground hover:bg-destructive" aria-label={`Delete ${nodeKey !==undefined ? 'property' : 'item'}`}><Trash2 size={16} /></Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Delete {nodeKey !==undefined ? 'Property' : 'Item'}</p></TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
        
        {isAddingProperty && isExpanded && (
            <div className="pl-6 my-2 space-y-2 border-l-2 border-dashed border-gray-300 dark:border-gray-600 ml-2 py-2 rounded-md">
                {typeof value === 'object' && !Array.isArray(value) && value !== null && onAddProperty && ( // Check onAddProperty for objects
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
                    key={`${path.join('-')}-item-${index}`} // Simplified key
                    path={[...path, index]}
                    value={item}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onAddProperty={onAddProperty} // Pass down for nested objects
                    onAddItem={onAddItem}       // Pass down for nested arrays
                    onRenameKey={onRenameKey}   // Pass down for nested objects
                    depth={depth + 1}
                    getApiKey={getApiKey}
                    expansionTrigger={expansionTrigger}
                    searchTerm={searchTerm}
                    onSetHoveredPath={onSetHoveredPath}
                  />
                ))
              : Object.entries(value).map(([key, val]) => (
                  <JsonNode
                    key={`${path.join('-')}-prop-${key}`} // Simplified key
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
            {(onAddProperty && typeof value === 'object' && !Array.isArray(value)) || (onAddItem && Array.isArray(value)) ? (
             <Button variant="outline" size="sm" onClick={() => setIsAddingProperty(true)} className="mt-2 ml-4 h-7 text-xs">
                <PlusCircle size={14} className="mr-1" /> {Array.isArray(value) ? "Add Item" : "Add Property"}
            </Button>
            ) : null}
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
                    aria-label="Markdown Editor"
                  />
                </div>
                <div className="flex flex-col h-full">
                  <Label className="mb-1">Preview</Label>
                  <div 
                    className="flex-grow prose dark:prose-invert max-w-none p-3 border rounded-md overflow-y-auto bg-muted h-full"
                    dangerouslySetInnerHTML={{ __html: marked(markdownModalContent) as string }}
                    aria-label="Markdown Preview"
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
};

export const JsonNode = React.memo(JsonNodeComponent);

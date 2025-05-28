
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { JsonValue, JsonPath, EditableJsonNodeProps, ExpansionTrigger, JsonPrimitive } from './types';
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
  return `border-l-2 pl-3 ml-1 py-0.5 ${selectedBorder} ${selectedBg} rounded-r-md group/node-item`;
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
  onSetHoveredPath,
  isInCardViewTopLevel = false,
}) => {
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [newPropertyKey, setNewPropertyKey] = useState('');
  const [newPropertyValue, setNewPropertyValue] = useState('');
  const [newPropertyType, setNewPropertyType] = useState<'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'>('string');

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [editValue, setEditValue] = useState<string>(JSON.stringify(value));
  const [originalValueForEdit, setOriginalValueForEdit] = useState<JsonPrimitive | null>(null);
  const [newKeyName, setNewKeyName] = useState<string>(nodeKey || '');

  const [isLocallyExpanded, setIsLocallyExpanded] = useState(true);

  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [isEnhanceDialogOpen, setIsEnhanceDialogOpen] = useState(false);
  const [isMarkdownModalOpen, setIsMarkdownModalOpen] = useState(false);
  const [markdownModalContent, setMarkdownModalContent] = useState('');


  const keyInputRef = useRef<HTMLInputElement>(null);
  const valueStringInputRef = useRef<HTMLTextAreaElement>(null);
  const valueNumericInputRef = useRef<HTMLInputElement>(null);
  const valueGenericInputRef = useRef<HTMLTextAreaElement>(null);
  const newPropertyKeyInputRef = useRef<HTMLInputElement>(null);
  const newItemValueInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

 const isEffectivelyExpanded = useMemo(() => {
    if (!(typeof value === 'object' && value !== null)) {
      return false; // Primitives are never "expanded" in terms of showing children
    }
    const triggerPath = expansionTrigger?.path;
    if (expansionTrigger) {
      if (triggerPath === null || (Array.isArray(triggerPath) && triggerPath.length === 0 && path.length === 0) ) { // Global trigger, or specifically root for root
         return expansionTrigger.type === 'expand';
      }
      if (Array.isArray(triggerPath) &&
          path.length === triggerPath.length &&
          triggerPath.every((pVal, i) => path[i] === pVal)) {
        return expansionTrigger.type === 'expand';
      }
    }
    return isLocallyExpanded;
  }, [expansionTrigger, path, value, isLocallyExpanded]);


  const toggleExpansion = useCallback(() => {
    if (typeof value === 'object' && value !== null) {
      setIsLocallyExpanded(prev => !prev);
    }
  }, [value]);


  useEffect(() => {
    setEditValue(typeof value === 'string' ? value : JSON.stringify(value));
    if (nodeKey) setNewKeyName(nodeKey);
  }, [value, nodeKey]);

  useEffect(() => {
    if (isEditingKey && keyInputRef.current) {
      requestAnimationFrame(() => {
        keyInputRef.current?.focus();
        keyInputRef.current?.select();
      });
    }
  }, [isEditingKey]);

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        if (typeof value === 'string' && valueStringInputRef.current) {
          valueStringInputRef.current.focus();
          valueStringInputRef.current.select();
        } else if (typeof value === 'number' && valueNumericInputRef.current) {
          valueNumericInputRef.current.focus();
          valueNumericInputRef.current.select();
        } else if (valueGenericInputRef.current) { // for boolean/null or other JSON values
          valueGenericInputRef.current.focus();
          valueGenericInputRef.current.select();
        }
      });
    }
  }, [isEditing, value]);

  useEffect(() => {
    if (isAddingProperty) {
      requestAnimationFrame(() => {
        if (newPropertyKeyInputRef.current && typeof value === 'object' && !Array.isArray(value) && value !== null) {
          newPropertyKeyInputRef.current.focus();
        } else if (newItemValueInputRef.current && Array.isArray(value) && (newPropertyType === 'string' || newPropertyType === 'number' || newPropertyType === 'boolean')) {
          newItemValueInputRef.current.focus();
        }
      });
    }
  }, [isAddingProperty, value, newPropertyType]);


  const handleValueUpdate = useCallback(() => {
    try {
      let parsedValue: JsonValue;
      if (typeof value === 'string') {
        parsedValue = editValue;
      } else if (typeof value === 'number') {
        parsedValue = parseFloat(editValue);
        if (isNaN(parsedValue)) throw new Error("Invalid number");
      } else if (typeof value === 'boolean') {
        if (editValue.toLowerCase() === 'true') parsedValue = true;
        else if (editValue.toLowerCase() === 'false') parsedValue = false;
        else throw new Error("Invalid boolean string");
      } else if (value === null) {
         if (editValue.toLowerCase() === 'null') parsedValue = null;
         else throw new Error("Invalid null string");
      }
      else { // Should not happen for primitives, but for safety if logic changes
        parsedValue = JSON.parse(editValue);
      }
      onUpdate(path, parsedValue);
      setIsEditing(false);
      setOriginalValueForEdit(null);
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
      setIsEditingKey(false);
      if (newKeyName.trim() === nodeKey) return; // No change
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
        : String(value); // Covers string, number, null
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

  const isPrimitiveOrNull = typeof value !== 'object' || value === null;

  const isStackedDisplayContext =
    isInCardViewTopLevel &&
    nodeKey !== undefined &&
    isPrimitiveOrNull;

  const isSummaryDisplayContext =
    isInCardViewTopLevel &&
    nodeKey !== undefined &&
    typeof value === 'object' &&
    value !== null;


  const renderValue = () => {
    if (isEditing) {
      const commonInputClass = "font-mono text-sm";
      const stackedOrFullWidthClass = isStackedDisplayContext ? "w-full mt-1" : "w-auto";
      const stackedOrFullWidthTextAreaClass = isStackedDisplayContext ? "w-full mt-1" : "min-w-[200px]";

      let originalValueDisplay = null;
      if (originalValueForEdit !== null) {
        originalValueDisplay = (
          <div className="text-xs text-muted-foreground mb-1">
            Original: {typeof originalValueForEdit === 'string' ? `"${originalValueForEdit}"` : String(originalValueForEdit)}
          </div>
        );
      }

      if (typeof value === 'string') {
        return (
          <div className={cn(isStackedDisplayContext ? "w-full" : "")}>
            {originalValueDisplay}
            <Textarea ref={valueStringInputRef} value={editValue} onChange={(e) => setEditValue(e.target.value)} className={cn(commonInputClass, "min-h-[60px]", stackedOrFullWidthTextAreaClass)} />
          </div>
        );
      }
      if (typeof value === 'number') {
        return (
           <div className={cn(isStackedDisplayContext ? "w-full" : "")}>
            {originalValueDisplay}
            <Input ref={valueNumericInputRef} type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className={cn(commonInputClass, stackedOrFullWidthClass)} />
          </div>
        );
      }
      // For boolean, null, or other non-string/non-number primitives
      // We use a textarea to allow for `true`, `false`, `null` or even malformed JSON for correction
      return (
        <div className={cn(isStackedDisplayContext ? "w-full" : "")}>
          {originalValueDisplay}
          <Textarea ref={valueGenericInputRef} value={editValue} onChange={(e) => setEditValue(e.target.value)} className={cn(commonInputClass, "min-h-[60px]", stackedOrFullWidthTextAreaClass)} placeholder="Enter valid JSON (e.g. true, null, or {...})"/>
        </div>
      );
    }

    let displayValueNode: React.ReactNode;
    let valueStringForSearch = "";

    if (typeof value === 'string') {
       valueStringForSearch = value;
      if (showMarkdownPreview && value.length > 50 && !isStackedDisplayContext) { // Don't use prose in stacked cards
        displayValueNode = <div className="prose dark:prose-invert max-w-none p-2 border rounded-md bg-background/50 my-1 w-full" dangerouslySetInnerHTML={{ __html: marked(value) as string }} />;
      } else {
        const Tag = isStackedDisplayContext ? 'div' : 'span';
        displayValueNode = <Tag className={cn("font-mono text-sm text-green-600 dark:text-green-400 break-words min-w-0", isStackedDisplayContext ? "w-full pt-0.5" : "")}>"{getHighlightedText(value, searchTerm || "")}"</Tag>;
      }
    } else if (typeof value === 'number') {
      valueStringForSearch = String(value);
      const Tag = isStackedDisplayContext ? 'div' : 'span';
      displayValueNode = <Tag className={cn("font-mono text-sm text-blue-600 dark:text-blue-400", isStackedDisplayContext ? "w-full pt-0.5" : "")}>{getHighlightedText(String(value), searchTerm || "")}</Tag>;
    } else if (typeof value === 'boolean') {
      valueStringForSearch = String(value);
      const Tag = isStackedDisplayContext ? 'div' : 'span'; // Checkbox might not fit well when stacked directly
      displayValueNode = isStackedDisplayContext ?
        <Tag className={cn("font-mono text-sm text-purple-600 dark:text-purple-400", "w-full pt-0.5")}>{String(value)}</Tag>
        : <Checkbox checked={value} onCheckedChange={handleBooleanChange} className="ml-1" aria-label={`Value ${value}, toggle boolean`}/>;
    } else if (value === null) {
      valueStringForSearch = "null";
      const Tag = isStackedDisplayContext ? 'div' : 'span';
      displayValueNode = <Tag className={cn("font-mono text-sm text-gray-500 dark:text-gray-400", isStackedDisplayContext ? "w-full pt-0.5" : "")}>{getHighlightedText("null", searchTerm || "")}</Tag>;
    } else {
       return null; // Should not be reached for primitives, object/array summary handled below
    }

    return isStackedDisplayContext ? displayValueNode : <span data-searchable-value={valueStringForSearch}>{displayValueNode}</span>;
  };

  const typeLabel = Array.isArray(value) ? 'Array' : typeof value === 'object' && value !== null ? 'Object' : '';

  const buttonRenderIndex = React.useRef(0);
  useEffect(() => {
    buttonRenderIndex.current = 0;
  });

  const delayClasses = [
    "", "delay-75", "delay-100", "delay-150", "delay-200",
    "delay-[250ms]", "delay-300", "delay-[350ms]", "delay-[400ms]", "delay-[450ms]",
  ];

  const getButtonAnimationClasses = useCallback(() => {
    if (isStackedDisplayContext) return ""; // No animation for persistent buttons in cards
    const delayClass = delayClasses[buttonRenderIndex.current] || delayClasses[delayClasses.length -1];
    buttonRenderIndex.current++;
    return `
      opacity-0 transform translate-x-2
      group-hover/node-item-header:opacity-100 group-hover/node-item-header:translate-x-0
      group-focus-within/node-item-header:opacity-100 group-focus-within/node-item-header:translate-x-0
      transition-all ease-out duration-200 ${delayClass}
    `;
  }, [isStackedDisplayContext]);


  const displayKey = nodeKey !== undefined ? getHighlightedText(nodeKey, searchTerm || "") : '';


  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
            (depth > 0 || (depth === 0 && nodeKey === undefined && !isInCardViewTopLevel)) && getNestingLevelClasses(depth)
          )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={cn(
          "group/node-item-header min-h-[32px] w-full",
           isStackedDisplayContext
            ? "flex flex-col items-start py-1"
            : "flex items-center space-x-2"
        )}>
          <div className={cn(
              "flex items-center w-full",
              isStackedDisplayContext && "mb-0.5"
            )}>
            {(typeof value === 'object' && value !== null && !isSummaryDisplayContext && !isStackedDisplayContext) && (
              <Button variant="ghost" size="icon" onClick={toggleExpansion} className="h-6 w-6 p-1 self-center flex-shrink-0" aria-label={isEffectivelyExpanded ? "Collapse" : "Expand"}>
                {isEffectivelyExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </Button>
            )}

            {nodeKey !== undefined && (
              isEditingKey ? (
                <div className="flex items-center flex-shrink-0">
                  <Input
                    ref={keyInputRef}
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="h-7 font-mono text-sm"
                    onBlur={handleKeyUpdate}
                    onKeyDown={(e) => e.key === 'Enter' && handleKeyUpdate()}
                  />
                  <Button variant="ghost" size="icon" onClick={handleKeyUpdate} className="h-6 w-6 p-1" aria-label="Save key"><CheckIcon size={16} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { setIsEditingKey(false); setNewKeyName(nodeKey || '');}} className="h-6 w-6 p-1" aria-label="Cancel rename"><XIcon size={16} /></Button>
                </div>
              ) : (
                <span
                  className={cn(
                    "font-semibold text-sm group-hover/node-item:text-accent py-1 flex-shrink-0",
                     isStackedDisplayContext ? "text-card-foreground cursor-pointer" : "text-primary cursor-pointer",
                     isSummaryDisplayContext && "text-primary cursor-default"
                  )}
                  onClick={() => { if (nodeKey && onRenameKey && !(isSummaryDisplayContext || isStackedDisplayContext && !onRenameKey)) { setNewKeyName(nodeKey || ''); setIsEditingKey(true); } else if (isStackedDisplayContext && nodeKey && onRenameKey) { setNewKeyName(nodeKey || ''); setIsEditingKey(true); } }}
                >
                  {displayKey}:
                </span>
              )
            )}
            
            <div className="flex items-center flex-grow min-w-0">
                {typeof value === 'object' && value !== null && !isSummaryDisplayContext && !isStackedDisplayContext && (
                   <span className="text-xs text-muted-foreground ml-1">
                      {typeLabel}
                      {isEffectivelyExpanded && ((Array.isArray(value) && value.length === 0) || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) ? ' (empty)' : ''}
                      {!isEffectivelyExpanded && Array.isArray(value) ? ` [${value.length} item${value.length === 1 ? '' : 's'}]` : ''}
                      {!isEffectivelyExpanded && typeof value === 'object' && !Array.isArray(value) && value !== null ? ` {${Object.keys(value).length} key${Object.keys(value).length === 1 ? '' : 's'}}` : ''}
                   </span>
                )}
                {isPrimitiveOrNull && !isStackedDisplayContext && !isSummaryDisplayContext && nodeKey === undefined && !isEditing && renderValue()}
                {isPrimitiveOrNull && !isStackedDisplayContext && !isSummaryDisplayContext && nodeKey !== undefined && !isEditing && (
                    <span className="ml-1 min-w-0 break-words">{renderValue()}</span>
                )}
            </div>

            <div className={cn(
              "flex items-center space-x-1 ml-auto pl-2 flex-shrink-0",
              !isStackedDisplayContext && "opacity-0 group-hover/node-item-header:opacity-100 group-focus-within/node-item-header:opacity-100 transition-opacity duration-100"
              )}>
              {isEditing && !isStackedDisplayContext ? (
                <>
                  <div className={getButtonAnimationClasses()}>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleValueUpdate} className="h-6 w-6 p-1"><CheckIcon size={16} /></Button></TooltipTrigger><TooltipContent><p>Save Value</p></TooltipContent></Tooltip>
                  </div>
                  <div className={getButtonAnimationClasses()}>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => {setIsEditing(false); setOriginalValueForEdit(null);}} className="h-6 w-6 p-1"><XIcon size={16} /></Button></TooltipTrigger><TooltipContent><p>Cancel Edit</p></TooltipContent></Tooltip>
                  </div>
                </>
              ) : null}

              {!isEditing && typeof value !== 'object' && value !== null && typeof value !== 'boolean' && !isSummaryDisplayContext && (
                <div className={getButtonAnimationClasses()}>
                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => { setOriginalValueForEdit(value as JsonPrimitive); setEditValue(typeof value === 'string' ? value : JSON.stringify(value)); setIsEditing(true);}} className="h-6 w-6 p-1"><Edit3 size={16} /></Button></TooltipTrigger><TooltipContent><p>Edit Value</p></TooltipContent></Tooltip>
                </div>
              )}
               {nodeKey !== undefined && onRenameKey && !isSummaryDisplayContext && !isStackedDisplayContext && (
                  <div className={getButtonAnimationClasses()}>
                   <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => { setNewKeyName(nodeKey || ''); setIsEditingKey(true); }} className="h-6 w-6 p-1"><ALargeSmall size={16}/></Button></TooltipTrigger><TooltipContent><p>Rename Key</p></TooltipContent></Tooltip>
                  </div>
              )}
              {(isPrimitiveOrNull || (typeof value === 'object' && value !== null)) && (
                <div className={getButtonAnimationClasses()}>
                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleCopyToClipboard} className="h-6 w-6 p-1"><ClipboardCopy size={16} /></Button></TooltipTrigger><TooltipContent><p>Copy Value</p></TooltipContent></Tooltip>
                </div>
              )}
              {typeof value === 'string' && !isSummaryDisplayContext && (
                <>
                  {!isStackedDisplayContext && ( // Markdown preview not ideal for stacked display
                    <div className={getButtonAnimationClasses()}>
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setShowMarkdownPreview(!showMarkdownPreview)} className="h-6 w-6 p-1"><MessageSquare size={16} /></Button></TooltipTrigger><TooltipContent><p>{showMarkdownPreview ? "Show Raw Text" : "Preview Markdown (for long text)"}</p></TooltipContent></Tooltip>
                    </div>
                  )}
                  <div className={getButtonAnimationClasses()}>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => { setMarkdownModalContent(value); setIsMarkdownModalOpen(true);}} className="h-6 w-6 p-1"><Maximize2 size={16} /></Button></TooltipTrigger><TooltipContent><p>Expand Editor (Markdown)</p></TooltipContent></Tooltip>
                  </div>
                  <div className={getButtonAnimationClasses()}>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleSummarize} className="h-6 w-6 p-1"><Wand2 size={16} /></Button></TooltipTrigger><TooltipContent><p>Summarize (AI)</p></TooltipContent></Tooltip>
                  </div>
                  <div className={getButtonAnimationClasses()}>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setIsEnhanceDialogOpen(true)} className="h-6 w-6 p-1"><Sparkles size={16} /></Button></TooltipTrigger><TooltipContent><p>Enhance (AI)</p></TooltipContent></Tooltip>
                  </div>
                </>
              )}
              {onDelete && (
                <div className={getButtonAnimationClasses()}>
                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => onDelete(path, nodeKey)} className="h-6 w-6 p-1 text-destructive hover:text-destructive-foreground hover:bg-destructive"><Trash2 size={16} /></Button></TooltipTrigger><TooltipContent><p>Delete {nodeKey !==undefined ? 'Property' : 'Item'}</p></TooltipContent></Tooltip>
                </div>
              )}
            </div>
          </div>

          {isStackedDisplayContext && (
            <div className="w-full pl-1 mt-0.5">
              {isEditing ? (
                 renderValue()
              ) : (
                renderValue()
              )}
               {isEditing && (
                <div className="flex space-x-2 mt-2">
                  <Button variant="default" size="sm" onClick={handleValueUpdate} className="h-7">Save</Button>
                  <Button variant="outline" size="sm" onClick={() => {setIsEditing(false); setOriginalValueForEdit(null);}} className="h-7">Cancel</Button>
                </div>
              )}
            </div>
          )}

          {isSummaryDisplayContext && !isEditing && (
             <div className="w-full pl-1 mt-0.5">
                <span className="font-mono text-sm text-muted-foreground">
                {Array.isArray(value)
                    ? `Array [${value.length} item${value.length === 1 ? '' : 's'}]`
                    : `Object {${Object.keys(value).length} key${Object.keys(value).length === 1 ? '' : 's'}}`}
                </span>
            </div>
          )}
        </div>

        {isAddingProperty && isEffectivelyExpanded && !isSummaryDisplayContext && !isInCardViewTopLevel && (
            <div className="pl-6 my-2 space-y-2 border-l-2 border-dashed border-gray-300 dark:border-gray-600 ml-2 py-2 rounded-md">
                {typeof value === 'object' && !Array.isArray(value) && value !== null && onAddProperty && (
                     <Input
                        ref={newPropertyKeyInputRef}
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
                            ref={newItemValueInputRef}
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


        {isEffectivelyExpanded && typeof value === 'object' && value !== null && !isSummaryDisplayContext && (
          <div className={cn("pl-0", depth > 0 && !isInCardViewTopLevel && "ml-0")}>
            {Array.isArray(value)
              ? value.map((item, index) => (
                  <JsonNode
                    key={path.length > 0 ? `${path.join('.')}-item-${index}` : `item-${index}`}
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
                    isInCardViewTopLevel={false} 
                  />
                ))
              : Object.entries(value).map(([key, val]) => (
                  <JsonNode
                    key={path.length > 0 ? `${path.join('.')}-prop-${key}` : `prop-${key}`}
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
                    isInCardViewTopLevel={false} 
                  />
                ))}
            {((onAddProperty && typeof value === 'object' && !Array.isArray(value)) || (onAddItem && Array.isArray(value))) && !isSummaryDisplayContext && !isInCardViewTopLevel && (
             <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    setNewPropertyKey('');
                    setNewPropertyValue('');
                    setNewPropertyType('string');
                    setIsAddingProperty(true);
                }}
                className="mt-2 ml-4 h-7 text-xs"
              >
                <PlusCircle size={14} className="mr-1" /> {Array.isArray(value) ? "Add Item" : "Add Property"}
            </Button>
            )}
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


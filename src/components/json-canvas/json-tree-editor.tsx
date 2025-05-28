
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import type { JsonValue, JsonPath, ExpansionTrigger, JsonObject, JsonArray } from './types';
import { JsonNode } from './json-node';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UnfoldVertical, FoldVertical, Search, Info, ListTree, LayoutGrid, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


interface JsonTreeEditorProps {
  jsonData: JsonValue;
  onJsonChange: (newJson: JsonValue) => void;
  title?: string; 
  getApiKey: () => string | null;
}

export function JsonTreeEditor({ jsonData, onJsonChange, title, getApiKey }: JsonTreeEditorProps) {
  const [expansionTrigger, setExpansionTrigger] = useState<ExpansionTrigger>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredPath, setHoveredPath] = useState<JsonPath | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'cards'>('tree');
  const [cardViewPath, setCardViewPath] = useState<JsonPath>([]);
  const { toast } = useToast();

  const getCurrentCardData = useCallback((): JsonValue => {
    let current = jsonData;
    if (!cardViewPath.length) return current;
    try {
        for (const segment of cardViewPath) {
            if (typeof current !== 'object' || current === null) return undefined; 
            current = (current as JsonObject | JsonArray)[segment as any];
        }
        return current;
    } catch (e) {
        return undefined; 
    }
  }, [jsonData, cardViewPath]);

  const currentCardData = getCurrentCardData();

  useEffect(() => {
    setExpansionTrigger(null);
    // When jsonData changes (e.g. new file import or tab switch), reset cardViewPath for the new section
    if (viewMode === 'cards') {
      setCardViewPath([]);
    }
  }, [jsonData, viewMode]);
  
  const handleUpdate = useCallback((path: JsonPath, newValue: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData)); 
    let current = newJson;
    if (path.length === 0) { 
      onJsonChange(newValue);
      return;
    }
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = newValue;
    onJsonChange(newJson);
  }, [jsonData, onJsonChange]);

  const handleDelete = useCallback((path: JsonPath, keyOrIndex?: string | number) => {
    const newJson = JSON.parse(JSON.stringify(jsonData)); 
    let current = newJson;
    let parent = null;
    let lastSegmentInParent: string | number | null = null;

    if (path.length === 0) { 
      if (typeof jsonData === 'object' && jsonData !== null) {
        onJsonChange(Array.isArray(jsonData) ? [] : {});
      } else {
        onJsonChange(null);
      }
      return;
    }
    
    for (let i = 0; i < path.length - 1; i++) {
      parent = current;
      current = current[path[i]];
      lastSegmentInParent = path[i];
    }

    const targetKeyOrIndex = path[path.length - 1];
    
    if (Array.isArray(current)) {
      current.splice(Number(targetKeyOrIndex), 1);
    } else if (typeof current === 'object' && current !== null) {
      delete current[targetKeyOrIndex as string];
    } else if (parent && lastSegmentInParent !== null) { 
        if (Array.isArray(parent)) {
            parent.splice(Number(lastSegmentInParent), 1);
        } else {
            delete parent[targetKeyOrIndex as string]; // This was path[path.length-1], should be targetKeyOrIndex
        }
    }
    onJsonChange(newJson);
  }, [jsonData, onJsonChange]);
  
  const handleAddProperty = useCallback((path: JsonPath, key: string, value: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    let current = newJson;
    if (path.length === 0 && typeof current === 'object' && !Array.isArray(current) && current !== null) {
      current[key] = value;
      onJsonChange(newJson);
      return;
    }
    for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
    }
    if (typeof current === 'object' && !Array.isArray(current) && current !== null) {
        current[key] = value;
        onJsonChange(newJson);
    } else {
      toast({ title: "Cannot Add Property", description: "Can only add properties to objects.", variant: "destructive"});
    }
  }, [jsonData, onJsonChange, toast]);

  const handleAddItem = useCallback((path: JsonPath, value: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    let current = newJson;
    if (path.length === 0 && Array.isArray(current)) {
      current.push(value);
      onJsonChange(newJson);
      return;
    }
    for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
    }
    if (Array.isArray(current)) {
        current.push(value);
        onJsonChange(newJson);
    } else {
      toast({ title: "Cannot Add Item", description: "Can only add items to arrays.", variant: "destructive"});
    }
  }, [jsonData, onJsonChange, toast]);

  const handleRenameKey = useCallback((path: JsonPath, oldKey: string, newKey: string) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    let current = newJson;
    if (path.length === 0 && typeof current === 'object' && !Array.isArray(current) && current !== null) {
       if (oldKey in current && oldKey !== newKey) {
        if (newKey in current) {
            toast({title: "Rename Error", description: `Key "${newKey}" already exists at root.`, variant: "destructive"});
            return;
        }
        const value = current[oldKey];
        delete current[oldKey];
        current[newKey] = value;
        onJsonChange(newJson);
      }
      return;
    }

    for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
    }
    if (typeof current === 'object' && !Array.isArray(current) && current !== null && oldKey in current) {
        if (newKey in current && oldKey !== newKey) {
            toast({title: "Rename Error", description: `New key "${newKey}" already exists in object.`, variant: "destructive"});
            return;
        }
        if (oldKey === newKey) return; 

        const value = current[oldKey];
        delete current[oldKey];
        current[newKey] = value;
        onJsonChange(newJson);
    }
  }, [jsonData, onJsonChange, toast]);

  const handleExpandAll = useCallback(() => {
    setExpansionTrigger({ type: 'expand', timestamp: Date.now() });
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpansionTrigger({ type: 'collapse', timestamp: Date.now() });
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    if(event.target.value && viewMode === 'tree') { 
        handleExpandAll(); 
    }
  };

  const handleSetHoveredPath = useCallback((path: JsonPath | null) => {
    setHoveredPath(path);
  }, []);

  const handleExploreCard = useCallback((keyOrIndex: string | number) => {
    setCardViewPath(prev => [...prev, keyOrIndex]);
  }, []);

  const handleCardViewBack = useCallback(() => {
    setCardViewPath(prev => prev.slice(0, -1));
  }, []);


  const formatPathForBreadcrumbs = (path: JsonPath | null, isCardView: boolean): string => {
    const rootSegment = title || (Array.isArray(jsonData) ? 'Section Root' : 'Section Root');
    
    if (!path || path.length === 0) {
      if (isCardView) return `${rootSegment} (Card View Root)`;
      return `Hover over a tree node or view card path`;
    }
    
    if(path.length === 0 && (typeof jsonData !== 'object' || jsonData === null)){
        return `${rootSegment} (Primitive Value)`
    }
    
    const displayPath = path.map(segment => 
        typeof segment === 'number' ? `[${segment}]` : `.${segment}`
    ).join('');

    // Ensure the root segment correctly joins with the path
    let base = rootSegment;
    if (displayPath) {
        if (displayPath.startsWith('[')) { // Array index
            base += displayPath;
        } else if (displayPath.startsWith('.')) { // Object key, remove leading dot
            base += displayPath;
        } else { // Should be an object key without a leading dot
             base += `.${displayPath}`;
        }
    }
    
    return isCardView ? `${base} (Card View)` : base;
  };

  const isRootObject = typeof jsonData === 'object' && !Array.isArray(jsonData) && jsonData !== null;
  const isRootArray = Array.isArray(jsonData);
  const canHaveChildren = isRootObject || isRootArray;

  // Determine what to display in Card View Header
  const cardViewHeaderText = cardViewPath.length > 0 
    ? `Viewing: ${formatPathForBreadcrumbs(cardViewPath, true)}`
    : (title ? `${title} (Card View)`: `Section Root (Card View)`);

  return (
    <TooltipProvider>
      <Card className="my-4 shadow-lg bg-card">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center mb-2">
            {viewMode === 'tree' && title && <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>}
             {viewMode === 'cards' && (
                <CardTitle className="text-lg font-semibold text-primary flex items-center">
                  {cardViewPath.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={handleCardViewBack} className="h-7 w-7 mr-2">
                          <ArrowLeft size={18} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Back to Parent</p></TooltipContent>
                    </Tooltip>
                  )}
                  <span className="truncate" title={cardViewHeaderText}>{cardViewHeaderText}</span>
                </CardTitle>
             )}
            <div className="flex space-x-1 items-center">
              
              {canHaveChildren && viewMode === 'tree' && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleExpandAll} className="h-7 w-7">
                        <UnfoldVertical size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Expand All</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleCollapseAll} className="h-7 w-7">
                        <FoldVertical size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Collapse All</p></TooltipContent>
                  </Tooltip>
                </>
              )}
              {canHaveChildren && ( 
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setViewMode(viewMode === 'tree' ? 'cards' : 'tree')} className="h-7 w-7">
                      {viewMode === 'tree' ? <LayoutGrid size={18} /> : <ListTree size={18} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{viewMode === 'tree' ? 'Switch to Card View' : 'Switch to Tree View'}</p></TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
           <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Search in ${title || 'this section'}...`}
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8 h-9 bg-input"
            />
          </div>
          {viewMode === 'tree' && (
            <div className="mt-2 text-xs text-muted-foreground min-h-[1.25rem] flex items-center">
              <Info size={12} className="mr-1.5 flex-shrink-0" />
              <span className="truncate">
                {formatPathForBreadcrumbs(hoveredPath, false)}
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-2">
          {viewMode === 'tree' ? (
            <JsonNode
                path={[]} 
                value={jsonData} 
                nodeKey={title || (typeof jsonData !== 'object' || jsonData === null ? "Root Value" : undefined)} 
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onAddProperty={isRootObject ? handleAddProperty : undefined} 
                onAddItem={isRootArray ? handleAddItem : undefined} 
                onRenameKey={isRootObject ? handleRenameKey : undefined} 
                depth={0}
                getApiKey={getApiKey}
                expansionTrigger={expansionTrigger}
                searchTerm={searchTerm}
                onSetHoveredPath={handleSetHoveredPath}
              />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {typeof currentCardData === 'object' && currentCardData !== null ? (
                !Array.isArray(currentCardData) ? ( // It's an object
                  Object.entries(currentCardData).length > 0 ? (
                    Object.entries(currentCardData).map(([key, value]) => (
                      <Card key={key} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
                        <CardHeader className="pb-2">
                           <div className="flex justify-between items-start">
                            <CardTitle className="text-lg truncate" title={key}>{key}</CardTitle>
                            {(typeof value === 'object' && value !== null) && (
                                <Button variant="outline" size="sm" className="ml-2 h-7 text-xs px-2 py-1" onClick={() => handleExploreCard(key)}>
                                Explore
                                </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <JsonNode
                            path={[...cardViewPath, key]}
                            value={value}
                            nodeKey={key}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            onAddProperty={handleAddProperty}
                            onAddItem={handleAddItem}
                            onRenameKey={handleRenameKey}
                            depth={0} // Keep depth shallow for cards, or manage carefully
                            getApiKey={getApiKey}
                            expansionTrigger={null} // Cards don't use global expand/collapse trigger
                            searchTerm={searchTerm}
                            // onSetHoveredPath is not relevant for nodes inside cards
                          />
                        </CardContent>
                      </Card>
                    ))
                  ) : ( <p className="col-span-full text-center text-muted-foreground py-4">This object is empty.</p> )
                ) : ( // It's an array
                  currentCardData.length > 0 ? (
                    currentCardData.map((item, index) => (
                      <Card key={index} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">Item {index}</CardTitle>
                             {(typeof item === 'object' && item !== null) && (
                                <Button variant="outline" size="sm" className="ml-2 h-7 text-xs px-2 py-1" onClick={() => handleExploreCard(index)}>
                                Explore
                                </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                           <JsonNode
                            path={[...cardViewPath, index]}
                            value={item}
                            // nodeKey is not needed for array items, JsonNode handles index display
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            onAddProperty={handleAddProperty} // Will only work if item is an object
                            onAddItem={handleAddItem}       // Will only work if item is an array
                            onRenameKey={handleRenameKey}   // Will only work if item is an object
                            depth={0} // Keep depth shallow for cards
                            getApiKey={getApiKey}
                            expansionTrigger={null}
                            searchTerm={searchTerm}
                          />
                        </CardContent>
                      </Card>
                    ))
                  ) : ( <p className="col-span-full text-center text-muted-foreground py-4">This array is empty.</p> )
                )
              ) : (
                <Card className="col-span-full">
                    <CardHeader>
                        <CardTitle>Empty or Non-iterable</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                        {currentCardData === undefined ?
                            "Path leads to an invalid or non-existent value." :
                            (currentCardData === null ? "The current value is null." : `The current value is: ${String(currentCardData)}`)
                        }
                        {(cardViewPath.length > 0 && (typeof currentCardData !== 'object' || currentCardData === null)) && " Cannot explore further."}
                        {(cardViewPath.length === 0 && (typeof jsonData !== 'object' || jsonData === null)) && " This section's root value cannot be displayed as cards."}
                        </p>
                    </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

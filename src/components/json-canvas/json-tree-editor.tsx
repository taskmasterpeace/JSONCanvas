
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import type { JsonValue, JsonPath, ExpansionTrigger, JsonObject, JsonArray } from './types';
import { JsonNode } from './json-node';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    let currentData = jsonData;
    if (!cardViewPath.length) return currentData;
    try {
        for (const segment of cardViewPath) {
            if (typeof currentData !== 'object' || currentData === null) return undefined;
            currentData = (currentData as JsonObject | JsonArray)[segment as any];
        }
        return currentData;
    } catch (e) {
        console.error("Error getting card data for path:", cardViewPath, e);
        return undefined;
    }
  }, [jsonData, cardViewPath]);

  const currentCardData = getCurrentCardData();

  useEffect(() => {
    if (viewMode === 'cards') {
      setCardViewPath([]);
    }
    setExpansionTrigger(null); 
    setSearchTerm(''); // Clear search on data/view mode change
  }, [jsonData, viewMode]);

  const handleUpdate = useCallback((path: JsonPath, newValue: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    let current = newJson;
    
    const fullPath = viewMode === 'cards' ? [...cardViewPath, ...path] : path;

    if (fullPath.length === 0) {
      onJsonChange(newValue);
      return;
    }

    let target = newJson;
    for (let i = 0; i < fullPath.length - 1; i++) {
      if (typeof target[fullPath[i]] === 'undefined') {
         console.error("Invalid path for update:", fullPath, "at segment", fullPath[i]);
         toast({title: "Update Error", description: "Cannot update data at invalid path.", variant: "destructive"});
         return;
      }
      target = target[fullPath[i]];
    }
    target[fullPath[fullPath.length - 1]] = newValue;
    onJsonChange(newJson);
  }, [jsonData, onJsonChange, cardViewPath, viewMode, toast]);

  const handleDelete = useCallback((path: JsonPath, keyOrIndex?: string | number) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    const fullPath = viewMode === 'cards' ? [...cardViewPath, ...path] : path;
    
    if (fullPath.length === 0) { // Deleting the root of current view
        if (viewMode === 'cards' && cardViewPath.length > 0) {
            // Deleting the item that cardViewPath points to
            let parent = newJson;
            for (let i = 0; i < cardViewPath.length - 1; i++) {
                parent = parent[cardViewPath[i]];
            }
            const lastSegment = cardViewPath[cardViewPath.length - 1];
            if (Array.isArray(parent) && typeof lastSegment === 'number') {
                parent.splice(lastSegment, 1);
            } else if (typeof parent === 'object' && parent !== null && typeof lastSegment === 'string') {
                delete parent[lastSegment];
            }
            setCardViewPath(prev => prev.slice(0, -1)); // Go back one level
        } else { // Deleting the root of the whole section
            onJsonChange(Array.isArray(jsonData) ? [] : {});
        }
        onJsonChange(newJson);
        return;
    }
    
    let parent = newJson;
    for (let i = 0; i < fullPath.length - 1; i++) {
      if (typeof parent[fullPath[i]] === 'undefined') {
         console.error("Invalid path for delete:", fullPath, "at segment", fullPath[i]);
         toast({title: "Delete Error", description: "Cannot delete data at invalid path.", variant: "destructive"});
         return;
      }
      parent = parent[fullPath[i]];
    }

    const targetKeyOrIndex = fullPath[fullPath.length - 1];

    if (Array.isArray(parent)) {
      parent.splice(Number(targetKeyOrIndex), 1);
    } else if (typeof parent === 'object' && parent !== null) {
      delete parent[targetKeyOrIndex as string];
    }
    onJsonChange(newJson);
  }, [jsonData, onJsonChange, cardViewPath, viewMode, toast]);

  const handleAddProperty = useCallback((path: JsonPath, key: string, value: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    const fullPath = viewMode === 'cards' ? [...cardViewPath, ...path] : path;
    let current = newJson;

    for (let i = 0; i < fullPath.length; i++) {
       if (typeof current[fullPath[i]] === 'undefined' && i < fullPath.length) { // path might be empty [] for root
            if (fullPath.length === 0 && typeof current === 'object' && !Array.isArray(current)) {
                // Adding to root object, current is already the target
            } else {
                console.error("Invalid path for add property:", fullPath, "at segment", fullPath[i]);
                toast({title: "Add Error", description: "Cannot add property at invalid path.", variant: "destructive"});
                return;
            }
        }
        current = current[fullPath[i]];
    }

    if (typeof current === 'object' && !Array.isArray(current) && current !== null) {
        current[key] = value;
        onJsonChange(newJson);
    } else if (fullPath.length === 0 && typeof newJson === 'object' && !Array.isArray(newJson) && newJson !== null) {
        // Adding to the root object itself if path is empty
        newJson[key] = value;
        onJsonChange(newJson);
    }
     else {
      toast({ title: "Cannot Add Property", description: "Can only add properties to objects.", variant: "destructive"});
    }
  }, [jsonData, onJsonChange, cardViewPath, viewMode, toast]);

  const handleAddItem = useCallback((path: JsonPath, value: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    const fullPath = viewMode === 'cards' ? [...cardViewPath, ...path] : path;
    let current = newJson;

    for (let i = 0; i < fullPath.length; i++) {
         if (typeof current[fullPath[i]] === 'undefined' && i < fullPath.length) {
             if (fullPath.length === 0 && Array.isArray(current)) {
                // Adding to root array, current is already the target
            } else {
                console.error("Invalid path for add item:", fullPath, "at segment", fullPath[i]);
                toast({title: "Add Error", description: "Cannot add item at invalid path.", variant: "destructive"});
                return;
            }
        }
        current = current[fullPath[i]];
    }
    if (Array.isArray(current)) {
        current.push(value);
        onJsonChange(newJson);
    } else if (fullPath.length === 0 && Array.isArray(newJson)) {
        newJson.push(value);
        onJsonChange(newJson);
    }
    else {
      toast({ title: "Cannot Add Item", description: "Can only add items to arrays.", variant: "destructive"});
    }
  }, [jsonData, onJsonChange, cardViewPath, viewMode, toast]);

  const handleRenameKey = useCallback((path: JsonPath, oldKey: string, newKey: string) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    const fullPath = viewMode === 'cards' ? [...cardViewPath, ...path] : path;
    let current = newJson;

    for (let i = 0; i < fullPath.length; i++) {
       if (typeof current[fullPath[i]] === 'undefined' && i < fullPath.length) {
             if (fullPath.length === 0 && typeof current === 'object' && !Array.isArray(current)) {
                // Operating on root object
            } else {
                console.error("Invalid path for rename key:", fullPath, "at segment", fullPath[i]);
                toast({title: "Rename Error", description: "Cannot rename key at invalid path.", variant: "destructive"});
                return;
            }
        }
        current = current[fullPath[i]];
    }
    if (typeof current === 'object' && !Array.isArray(current) && current !== null && oldKey in current) {
        if (newKey.trim() === "") {
            toast({title: "Rename Error", description: "New key name cannot be empty.", variant: "destructive"});
            return;
        }
        if (newKey in current && oldKey !== newKey) {
            toast({title: "Rename Error", description: `New key "${newKey}" already exists in object.`, variant: "destructive"});
            return;
        }
        if (oldKey === newKey) return;

        const value = current[oldKey];
        delete current[oldKey];
        current[newKey] = value;
        onJsonChange(newJson);
    } else if (fullPath.length === 0 && typeof newJson === 'object' && !Array.isArray(newJson) && newJson !== null && oldKey in newJson) {
         if (newKey.trim() === "") {
            toast({title: "Rename Error", description: "New key name cannot be empty.", variant: "destructive"});
            return;
        }
        if (newKey in newJson && oldKey !== newKey) {
            toast({title: "Rename Error", description: `New key "${newKey}" already exists in object.`, variant: "destructive"});
            return;
        }
        if (oldKey === newKey) return;
        const value = newJson[oldKey];
        delete newJson[oldKey];
        newJson[newKey] = value;
        onJsonChange(newJson);
    }
  }, [jsonData, onJsonChange, cardViewPath, viewMode, toast]);


  const handleExpandAll = useCallback(() => {
    setExpansionTrigger({ type: 'expand', path: viewMode === 'cards' ? cardViewPath : null, timestamp: Date.now() });
  }, [viewMode, cardViewPath]);

  const handleCollapseAll = useCallback(() => {
    setExpansionTrigger({ type: 'collapse', path: viewMode === 'cards' ? cardViewPath : null, timestamp: Date.now() });
  }, [viewMode, cardViewPath]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    if(event.target.value && viewMode === 'tree') {
        handleExpandAll(); // Expand tree view on search to show matches
    }
  };

  const handleSetHoveredPath = useCallback((path: JsonPath | null) => {
    setHoveredPath(path);
  }, []);

  const handleExploreCard = useCallback((keyOrIndex: string | number) => {
    setCardViewPath(prev => [...prev, keyOrIndex]);
    setSearchTerm(''); 
  }, []);

  const handleCardViewBack = useCallback(() => {
    setCardViewPath(prev => prev.slice(0, -1));
    setSearchTerm(''); 
  }, []);


  const formatPathForBreadcrumbs = (currentPath: JsonPath | null, isCardContext: boolean): string => {
    const rootSegment = title || 'Section Root';

    if (!currentPath || currentPath.length === 0) {
      if(isCardContext && cardViewPath.length === 0) return `${rootSegment} (Card View Root)`;
      if(isCardContext && cardViewPath.length > 0) return `${rootSegment}${cardViewPath.map(s => typeof s === 'number' ? `[${s}]` : `.${s}`).join('')} (Card View)`;
      return `Hover over a tree node or explore cards`;
    }
    
    const displayPath = currentPath.map(segment =>
        typeof segment === 'number' ? `[${segment}]` : `.${segment}`
    ).join('');

    let base = rootSegment;
     if (displayPath) {
        if (displayPath.startsWith('[') || displayPath.startsWith('.')) {
            base += displayPath;
        } else {
             base += `.${displayPath}`;
        }
    }
    return base;
  };
  
  const isRootObject = typeof jsonData === 'object' && !Array.isArray(jsonData) && jsonData !== null;
  const isRootArray = Array.isArray(jsonData);
  const canHaveChildren = typeof currentCardData === 'object' && currentCardData !== null;

  let cardViewHeaderText = title || 'Section Root';
  if (cardViewPath.length > 0) {
      cardViewHeaderText = `Viewing: ${formatPathForBreadcrumbs(cardViewPath, true)}`;
  } else if (title) {
      cardViewHeaderText = `${title} (Card View)`;
  } else {
      cardViewHeaderText = 'Section Root (Card View)';
  }

  return (
    <TooltipProvider>
      <Card className="my-4 shadow-lg bg-card">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center mb-2">
            <CardTitle className="text-lg font-semibold text-primary flex items-center">
              {viewMode === 'cards' && cardViewPath.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleCardViewBack} className="h-7 w-7 mr-2">
                      <ArrowLeft size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Back to Parent</p></TooltipContent>
                </Tooltip>
              )}
              <span className="truncate" title={viewMode === 'cards' ? cardViewHeaderText : title}>
                {viewMode === 'cards' ? cardViewHeaderText : title}
              </span>
            </CardTitle>
            <div className="flex space-x-1 items-center">
              {(viewMode === 'tree' || (viewMode === 'cards' && canHaveChildren)) && (
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
              {(typeof jsonData === 'object' && jsonData !== null) && ( 
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => { setViewMode(viewMode === 'tree' ? 'cards' : 'tree'); setSearchTerm(''); setCardViewPath([]); }} className="h-7 w-7">
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
          <div className="mt-2 text-xs text-muted-foreground min-h-[1.25rem] flex items-center">
              <Info size={12} className="mr-1.5 flex-shrink-0" />
              <span className="truncate">
                {viewMode === 'tree'
                    ? formatPathForBreadcrumbs(hoveredPath, false)
                    : (cardViewPath.length > 0 ? `Path: ${formatPathForBreadcrumbs(cardViewPath, true)}` : "Top level of cards")
                }
              </span>
            </div>
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
                isInCardViewTopLevel={false}
              />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {typeof currentCardData === 'object' && currentCardData !== null ? (
                !Array.isArray(currentCardData) ? ( 
                  Object.entries(currentCardData).length > 0 ? (
                    Object.entries(currentCardData).filter(([key, value]) => {
                        if (!searchTerm) return true;
                        const searchTermLower = searchTerm.toLowerCase();
                        return key.toLowerCase().includes(searchTermLower) ||
                               (typeof value === 'string' && value.toLowerCase().includes(searchTermLower)) ||
                               (typeof value === 'number' && String(value).toLowerCase().includes(searchTermLower));
                    }).map(([key, value]) => (
                      <Card key={key} className="shadow-md hover:shadow-lg transition-shadow flex flex-col bg-card border">
                        <CardHeader className="pb-2 pt-3 px-4">
                           <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-md font-semibold text-primary truncate" title={key}>{key}</CardTitle>
                            {(typeof value === 'object' && value !== null) && (
                                <Button variant="outline" size="sm" className="ml-auto h-7 text-xs px-2 py-1 flex-shrink-0" onClick={() => handleExploreCard(key)}>
                                Explore
                                </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow px-4 pb-3 pt-1">
                          <JsonNode
                            path={[key]} 
                            value={value}
                            nodeKey={key} 
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            onAddProperty={handleAddProperty}
                            onAddItem={handleAddItem}
                            onRenameKey={handleRenameKey}
                            depth={0} 
                            getApiKey={getApiKey}
                            expansionTrigger={expansionTrigger}
                            searchTerm={searchTerm}
                            // onSetHoveredPath intentionally omitted for card items
                            isInCardViewTopLevel={true} 
                          />
                        </CardContent>
                      </Card>
                    ))
                  ) : ( <p className="col-span-full text-center text-muted-foreground py-4">This object is empty. {cardViewPath.length > 0 && <Button variant="link" onClick={handleCardViewBack}>Go back.</Button>}</p> )
                ) : ( 
                  currentCardData.length > 0 ? (
                    currentCardData.filter((item, index) => {
                        if (!searchTerm) return true;
                        const searchTermLower = searchTerm.toLowerCase();
                        return (String(index).toLowerCase().includes(searchTermLower)) ||
                               (typeof item === 'string' && item.toLowerCase().includes(searchTermLower)) ||
                               (typeof item === 'number' && String(item).toLowerCase().includes(searchTermLower));
                    }).map((item, index) => (
                      <Card key={index} className="shadow-md hover:shadow-lg transition-shadow flex flex-col bg-card border">
                        <CardHeader className="pb-2 pt-3 px-4">
                          <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-md font-semibold text-primary">Item {index}</CardTitle>
                             {(typeof item === 'object' && item !== null) && (
                                <Button variant="outline" size="sm" className="ml-auto h-7 text-xs px-2 py-1 flex-shrink-0" onClick={() => handleExploreCard(index)}>
                                Explore
                                </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow px-4 pb-3 pt-1">
                           <JsonNode
                            path={[index]} 
                            value={item}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            onAddProperty={handleAddProperty}
                            onAddItem={handleAddItem}
                            onRenameKey={handleRenameKey}
                            depth={0} 
                            getApiKey={getApiKey}
                            expansionTrigger={expansionTrigger}
                            searchTerm={searchTerm}
                            // onSetHoveredPath intentionally omitted for card items
                            isInCardViewTopLevel={true} 
                          />
                        </CardContent>
                      </Card>
                    ))
                  ) : ( <p className="col-span-full text-center text-muted-foreground py-4">This array is empty. {cardViewPath.length > 0 && <Button variant="link" onClick={handleCardViewBack}>Go back.</Button>}</p> )
                )
              ) : (
                <Card className="col-span-full">
                    <CardHeader>
                        <CardTitle>
                            {currentCardData === undefined ? "Invalid Path" : (currentCardData === null ? "Null Value" : "Primitive Value")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                        {currentCardData === undefined ?
                            "The navigation path leads to an invalid or non-existent value." :
                            `The current value is: ${String(currentCardData)}.`
                        }
                        {(cardViewPath.length > 0 && (typeof currentCardData !== 'object' || currentCardData === null)) && " Cannot explore further."}
                        {(cardViewPath.length === 0 && (typeof jsonData !== 'object' || jsonData === null)) && " This section's root value cannot be displayed as cards."}
                        </p>
                        {cardViewPath.length > 0 && <Button variant="link" onClick={handleCardViewBack} className="mt-2">Go back to parent</Button>}
                         {(cardViewPath.length === 0 && (typeof jsonData !== 'object' || jsonData === null) && jsonData !== undefined) && (
                           <JsonNode
                                path={[]}
                                value={jsonData}
                                nodeKey={title || "Root Value"}
                                onUpdate={handleUpdate}
                                onDelete={handleDelete}
                                depth={0}
                                getApiKey={getApiKey}
                                isInCardViewTopLevel={true} // Treat as card content for styling
                            />
                        )}
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

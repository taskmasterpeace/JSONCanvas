
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
    // When jsonData changes (e.g. new file import or tab switch), reset cardViewPath and expansion trigger.
    if (viewMode === 'cards') {
      setCardViewPath([]);
    }
    setExpansionTrigger(null); // Reset global expand/collapse on data change
  }, [jsonData, viewMode]);

  const handleUpdate = useCallback((path: JsonPath, newValue: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    let current = newJson;
    // If path is for an item within the card view's current scope
    const fullPath = [...cardViewPath, ...path];

    if (fullPath.length === 0) {
      onJsonChange(newValue);
      return;
    }

    let target = newJson;
    for (let i = 0; i < fullPath.length - 1; i++) {
      target = target[fullPath[i]];
    }
    target[fullPath[fullPath.length - 1]] = newValue;
    onJsonChange(newJson);
  }, [jsonData, onJsonChange, cardViewPath]);

  const handleDelete = useCallback((path: JsonPath, keyOrIndex?: string | number) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    const fullPath = [...cardViewPath, ...path];

    if (fullPath.length === 0) {
      if (typeof jsonData === 'object' && jsonData !== null) {
        onJsonChange(Array.isArray(jsonData) ? [] : {});
      } else {
        onJsonChange(null);
      }
      return;
    }

    let parent = null;
    let current = newJson;
    for (let i = 0; i < fullPath.length - 1; i++) {
      parent = current;
      current = current[fullPath[i]];
    }

    const targetKeyOrIndex = fullPath[fullPath.length - 1];

    if (Array.isArray(current)) {
      current.splice(Number(targetKeyOrIndex), 1);
    } else if (typeof current === 'object' && current !== null) {
      delete current[targetKeyOrIndex as string];
    } else if (parent) { // Deleting the root of the current card view path
        let rootSegment = cardViewPath.length > 0 ? cardViewPath[cardViewPath.length-1] : (title || (Array.isArray(jsonData) ? 0 : Object.keys(jsonData)[0]));
        let parentOfRoot = newJson;
        for (let i = 0; i < cardViewPath.length -1; i++){
            parentOfRoot = parentOfRoot[cardViewPath[i]];
        }
        if (Array.isArray(parentOfRoot) && typeof rootSegment === 'number') {
            parentOfRoot.splice(rootSegment,1)
        } else if(typeof parentOfRoot === 'object' && parentOfRoot !== null && typeof rootSegment === 'string') {
            delete parentOfRoot[rootSegment];
        }
    }
    onJsonChange(newJson);
  }, [jsonData, onJsonChange, cardViewPath, title]);

  const handleAddProperty = useCallback((path: JsonPath, key: string, value: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    const fullPath = [...cardViewPath, ...path];
    let current = newJson;

    for (let i = 0; i < fullPath.length; i++) {
        current = current[fullPath[i]];
    }
    if (typeof current === 'object' && !Array.isArray(current) && current !== null) {
        current[key] = value;
        onJsonChange(newJson);
    } else {
      toast({ title: "Cannot Add Property", description: "Can only add properties to objects.", variant: "destructive"});
    }
  }, [jsonData, onJsonChange, cardViewPath, toast]);

  const handleAddItem = useCallback((path: JsonPath, value: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    const fullPath = [...cardViewPath, ...path];
    let current = newJson;

    for (let i = 0; i < fullPath.length; i++) {
        current = current[fullPath[i]];
    }
    if (Array.isArray(current)) {
        current.push(value);
        onJsonChange(newJson);
    } else {
      toast({ title: "Cannot Add Item", description: "Can only add items to arrays.", variant: "destructive"});
    }
  }, [jsonData, onJsonChange, cardViewPath, toast]);

  const handleRenameKey = useCallback((path: JsonPath, oldKey: string, newKey: string) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    const fullPath = [...cardViewPath, ...path];
    let current = newJson;

    for (let i = 0; i < fullPath.length; i++) {
        current = current[fullPath[i]];
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
  }, [jsonData, onJsonChange, cardViewPath, toast]);


  const handleExpandAll = useCallback(() => {
    setExpansionTrigger({ type: 'expand', path: viewMode === 'cards' ? cardViewPath : null, timestamp: Date.now() });
  }, [viewMode, cardViewPath]);

  const handleCollapseAll = useCallback(() => {
    setExpansionTrigger({ type: 'collapse', path: viewMode === 'cards' ? cardViewPath : null, timestamp: Date.now() });
  }, [viewMode, cardViewPath]);

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
    setSearchTerm(''); // Clear search when exploring
  }, []);

  const handleCardViewBack = useCallback(() => {
    setCardViewPath(prev => prev.slice(0, -1));
    setSearchTerm(''); // Clear search when going back
  }, []);


  const formatPathForBreadcrumbs = (currentPath: JsonPath, isCardContext: boolean): string => {
    const rootSegment = title || (Array.isArray(jsonData) && cardViewPath.length === 0 ? 'Section Root' : 'Section Root');

    if (!currentPath || currentPath.length === 0) {
      if(isCardContext) return `${rootSegment} (Card View Root)`;
      return `Hover over a tree node or view card path`;
    }

    const displayPath = currentPath.map(segment =>
        typeof segment === 'number' ? `[${segment}]` : `.${segment}`
    ).join('');

    let base = rootSegment;
     if (displayPath) {
        if (displayPath.startsWith('[')) {
            base += displayPath;
        } else if (displayPath.startsWith('.')) {
            base += displayPath;
        } else {
             base += `.${displayPath}`;
        }
    }

    return isCardContext ? `${base} (Card View)` : base;
  };

  const isRootObject = typeof jsonData === 'object' && !Array.isArray(jsonData) && jsonData !== null;
  const isRootArray = Array.isArray(jsonData);
  const canHaveChildren = typeof currentCardData === 'object' && currentCardData !== null; // For expand/collapse in card view context

  const cardViewDisplayPath = cardViewPath.length > 0 ? cardViewPath : (title ? [] : []);
  const cardViewHeaderText = cardViewPath.length > 0
    ? `Viewing: ${formatPathForBreadcrumbs(cardViewPath, true)}`
    : (title ? `${title} (Card View)`: `Section Root (Card View)`);

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
              {(isRootObject || isRootArray) && ( // Only show toggle if root can be viewed as cards
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
                    : (cardViewPath.length > 0 ? `Current card path: ${formatPathForBreadcrumbs(cardViewPath, true)}` : "Top level of cards")
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
                isInCardViewTopLevel={false} // Explicitly false for tree view root
              />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {typeof currentCardData === 'object' && currentCardData !== null ? (
                !Array.isArray(currentCardData) ? ( // It's an object
                  Object.entries(currentCardData).length > 0 ? (
                    Object.entries(currentCardData).filter(([key, value]) => {
                        if (!searchTerm) return true;
                        return key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               (typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())) ||
                               (typeof value === 'number' && String(value).toLowerCase().includes(searchTerm.toLowerCase()));
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
                            path={[]} // Path is relative to this card's context, will be combined by handlers
                            value={value}
                            nodeKey={key} // Pass the key so JsonNode knows its context
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            onAddProperty={handleAddProperty}
                            onAddItem={handleAddItem}
                            onRenameKey={handleRenameKey}
                            depth={0} // Depth is 0 for the content within the card
                            getApiKey={getApiKey}
                            expansionTrigger={expansionTrigger}
                            searchTerm={searchTerm}
                            onSetHoveredPath={onSetHoveredPath} // For consistency, though less critical in card items
                            isInCardViewTopLevel={true} // True, as this is top-level content of a card
                          />
                        </CardContent>
                      </Card>
                    ))
                  ) : ( <p className="col-span-full text-center text-muted-foreground py-4">This object is empty. {cardViewPath.length > 0 && <Button variant="link" onClick={handleCardViewBack}>Go back.</Button>}</p> )
                ) : ( // It's an array
                  currentCardData.length > 0 ? (
                    currentCardData.filter((item, index) => {
                        if (!searchTerm) return true;
                        return (String(index).toLowerCase().includes(searchTerm.toLowerCase())) ||
                               (typeof item === 'string' && item.toLowerCase().includes(searchTerm.toLowerCase())) ||
                               (typeof item === 'number' && String(item).toLowerCase().includes(searchTerm.toLowerCase()));
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
                            path={[]} // Path relative to this card's context
                            value={item}
                            // nodeKey is not needed for array items, JsonNode handles index display
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            onAddProperty={handleAddProperty}
                            onAddItem={handleAddItem}
                            onRenameKey={handleRenameKey}
                            depth={0} // Depth is 0 for content within the card
                            getApiKey={getApiKey}
                            expansionTrigger={expansionTrigger}
                            searchTerm={searchTerm}
                            isInCardViewTopLevel={true} // True, as this is top-level content of a card
                          />
                        </CardContent>
                      </Card>
                    ))
                  ) : ( <p className="col-span-full text-center text-muted-foreground py-4">This array is empty. {cardViewPath.length > 0 && <Button variant="link" onClick={handleCardViewBack}>Go back.</Button>}</p> )
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
                        {cardViewPath.length > 0 && <Button variant="link" onClick={handleCardViewBack}>Go back.</Button>}
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


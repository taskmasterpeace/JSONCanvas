
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
            if (typeof currentData !== 'object' || currentData === null || !(segment in (currentData as any))) {
                 return undefined; 
            }
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
    setSearchTerm(''); 
  }, [jsonData, viewMode]);

   useEffect(() => {
    setExpansionTrigger(null);
  }, [jsonData]);


  const handleUpdate = useCallback((path: JsonPath, newValue: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData)); // Deep copy
    
    let baseDataRef = newJson;

    if (viewMode === 'cards' && cardViewPath.length > 0) {
      let currentLevel = baseDataRef;
      for (const segment of cardViewPath) {
        if (typeof currentLevel !== 'object' || currentLevel === null || !(segment in (currentLevel as any))) {
          toast({title: "Update Error", description: "Cannot update data at invalid card path.", variant: "destructive"});
          return;
        }
        currentLevel = (currentLevel as any)[segment];
      }
      baseDataRef = currentLevel; 
    }
    
    if (path.length === 0) {
        if (viewMode === 'cards' && cardViewPath.length > 0) {
            let parent = newJson;
            for (let i = 0; i < cardViewPath.length - 1; i++) {
                parent = parent[cardViewPath[i]];
            }
            parent[cardViewPath[cardViewPath.length -1]] = newValue;
            onJsonChange(newJson);
        } else {
             onJsonChange(newValue); 
        }
        return;
    }

    let target = baseDataRef;
    for (let i = 0; i < path.length - 1; i++) {
      if (typeof target !== 'object' || target === null || !(path[i] in (target as any))) {
         toast({title: "Update Error", description: "Cannot update data at invalid path.", variant: "destructive"});
         return;
      }
      target = (target as any)[path[i]];
    }
    
    (target as any)[path[path.length - 1]] = newValue;
    
    onJsonChange(newJson);
  }, [jsonData, onJsonChange, cardViewPath, viewMode, toast]);

  const handleDelete = useCallback((path: JsonPath, keyOrIndex?: string | number) => {
    const newJson = JSON.parse(JSON.stringify(jsonData)); // Deep copy
    
    let baseDataParentRef = null;
    let lastSegmentOfBase = null;
    let baseDataRef = newJson;


    if (viewMode === 'cards' && cardViewPath.length > 0) {
        let currentLevel = newJson; // Start from the root of the entire section's JSON data
        let parentLevel = null;
        let lastSeg = null;

        // Navigate to the parent of the current card view context
        for (let i = 0; i < cardViewPath.length; i++) {
            const segment = cardViewPath[i];
            if (typeof currentLevel !== 'object' || currentLevel === null || !(segment in (currentLevel as any))) {
                toast({ title: "Delete Error", description: "Cannot delete data at invalid card path.", variant: "destructive" });
                return;
            }
            parentLevel = currentLevel;
            lastSeg = segment;
            currentLevel = (currentLevel as any)[segment];
        }
        baseDataRef = currentLevel; // This is the actual data object/array of the current card view
        baseDataParentRef = parentLevel; // This is the parent of baseDataRef in the overall jsonData
        lastSegmentOfBase = lastSeg; // This is the key/index of baseDataRef within baseDataParentRef
    }
    
    if (path.length === 0) { 
        if (viewMode === 'cards' && cardViewPath.length > 0 && baseDataParentRef && lastSegmentOfBase !== null) {
             if (Array.isArray(baseDataParentRef) && typeof lastSegmentOfBase === 'number') {
                (baseDataParentRef as JsonArray).splice(lastSegmentOfBase, 1);
            } else if (typeof baseDataParentRef === 'object' && baseDataParentRef !== null && typeof lastSegmentOfBase === 'string') {
                delete (baseDataParentRef as JsonObject)[lastSegmentOfBase];
            }
            setCardViewPath(prev => prev.slice(0, -1)); 
            onJsonChange(newJson);
        } else if (viewMode === 'tree' || (viewMode === 'cards' && cardViewPath.length === 0)) { 
            onJsonChange(Array.isArray(jsonData) ? [] : {});
        }
        return;
    }
    
    let parentInCurrentContext = baseDataRef; // Start from the current card view's data or the section's root data
    for (let i = 0; i < path.length - 1; i++) {
      if (typeof parentInCurrentContext !== 'object' || parentInCurrentContext === null || !(path[i] in (parentInCurrentContext as any))) {
         toast({title: "Delete Error", description: "Cannot delete data at invalid path.", variant: "destructive"});
         return;
      }
      parentInCurrentContext = (parentInCurrentContext as any)[path[i]];
    }

    const targetKeyOrIndex = path[path.length - 1];

    if (Array.isArray(parentInCurrentContext)) {
      parentInCurrentContext.splice(Number(targetKeyOrIndex), 1);
    } else if (typeof parentInCurrentContext === 'object' && parentInCurrentContext !== null) {
      delete (parentInCurrentContext as JsonObject)[targetKeyOrIndex as string];
    }
    onJsonChange(newJson);
  }, [jsonData, onJsonChange, cardViewPath, viewMode, toast]);

  const handleAddProperty = useCallback((path: JsonPath, key: string, value: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData)); 
    let baseDataRef = newJson;

    if (viewMode === 'cards' && cardViewPath.length > 0) {
      let currentLevel = baseDataRef;
      for (const segment of cardViewPath) {
         if (typeof currentLevel !== 'object' || currentLevel === null || !(segment in (currentLevel as any))) {
          toast({title: "Add Error", description: "Cannot add property at invalid card path.", variant: "destructive"});
          return;
        }
        currentLevel = (currentLevel as any)[segment];
      }
      baseDataRef = currentLevel;
    }

    let current = baseDataRef;
    for (let i = 0; i < path.length; i++) {
       if (typeof current !== 'object' || current === null || !(path[i] in (current as any))) {
            toast({title: "Add Error", description: "Cannot add property at invalid path.", variant: "destructive"});
            return;
        }
        current = (current as any)[path[i]];
    }

    if (typeof current === 'object' && !Array.isArray(current) && current !== null) {
        current[key] = value;
        onJsonChange(newJson);
    } else {
      toast({ title: "Cannot Add Property", description: "Can only add properties to objects.", variant: "destructive"});
    }
  }, [jsonData, onJsonChange, cardViewPath, viewMode, toast]);

  const handleAddItem = useCallback((path: JsonPath, value: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData)); 
    let baseDataRef = newJson;

     if (viewMode === 'cards' && cardViewPath.length > 0) {
      let currentLevel = baseDataRef;
      for (const segment of cardViewPath) {
         if (typeof currentLevel !== 'object' || currentLevel === null || !(segment in (currentLevel as any))) {
          toast({title: "Add Error", description: "Cannot add item at invalid card path.", variant: "destructive"});
          return;
        }
        currentLevel = (currentLevel as any)[segment];
      }
      baseDataRef = currentLevel;
    }

    let current = baseDataRef;
    for (let i = 0; i < path.length; i++) {
        if (typeof current !== 'object' || current === null || !(path[i] in (current as any))) {
            toast({title: "Add Error", description: "Cannot add item at invalid path.", variant: "destructive"});
            return;
        }
        current = (current as any)[path[i]];
    }
    if (Array.isArray(current)) {
        current.push(value);
        onJsonChange(newJson);
    }
    else {
      toast({ title: "Cannot Add Item", description: "Can only add items to arrays.", variant: "destructive"});
    }
  }, [jsonData, onJsonChange, cardViewPath, viewMode, toast]);

  const handleRenameKey = useCallback((path: JsonPath, oldKey: string, newKey: string) => {
    const newJson = JSON.parse(JSON.stringify(jsonData)); 
    let baseDataRef = newJson;

    if (viewMode === 'cards' && cardViewPath.length > 0) {
      let currentLevel = baseDataRef;
      for (const segment of cardViewPath) {
        if (typeof currentLevel !== 'object' || currentLevel === null || !(segment in (currentLevel as any))) {
          toast({title: "Rename Error", description: "Cannot rename key at invalid card path.", variant: "destructive"});
          return;
        }
        currentLevel = (currentLevel as any)[segment];
      }
      baseDataRef = currentLevel;
    }
    
    let current = baseDataRef;
    for (let i = 0; i < path.length; i++) {
       if (typeof current !== 'object' || current === null || !(path[i] in (current as any))) {
            toast({title: "Rename Error", description: "Cannot rename key at invalid path.", variant: "destructive"});
            return;
        }
        current = (current as any)[path[i]];
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
    }
  }, [jsonData, onJsonChange, cardViewPath, viewMode, toast]);


  const handleExpandAll = useCallback(() => {
    const currentContextPath = viewMode === 'cards' ? cardViewPath : [];
    setExpansionTrigger({ type: 'expand', path: currentContextPath.length > 0 ? currentContextPath : null, timestamp: Date.now() });
  }, [viewMode, cardViewPath]);

  const handleCollapseAll = useCallback(() => {
    const currentContextPath = viewMode === 'cards' ? cardViewPath : [];
    setExpansionTrigger({ type: 'collapse', path: currentContextPath.length > 0 ? currentContextPath : null, timestamp: Date.now() });
  }, [viewMode, cardViewPath]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    if(newSearchTerm && viewMode === 'tree') {
        handleExpandAll(); 
    }
  };

  const handleSetHoveredPath = useCallback((path: JsonPath | null) => {
    setHoveredPath(path);
  }, []);

  const handleExploreCard = useCallback((keyOrIndex: string | number) => {
    setCardViewPath(prev => [...prev, keyOrIndex]);
    setSearchTerm(''); 
    setExpansionTrigger(null); 
  }, []);

  const handleCardViewBack = useCallback(() => {
    setCardViewPath(prev => prev.slice(0, -1));
    setSearchTerm(''); 
    setExpansionTrigger(null); 
  }, []);


  const formatPathForBreadcrumbs = (currentPathSegments: JsonPath | null, isCardContext: boolean): string => {
    const rootSegment = title || 'Section Root';
    
    if (isCardContext) {
        if (!cardViewPath || cardViewPath.length === 0) return `${rootSegment} (Card View Root)`;
        const displayPath = cardViewPath.map(s => typeof s === 'number' ? `[${s}]` : `.${s}`).join('');
        return `Viewing: ${rootSegment}${displayPath} (Card View)`;
    }

    if (!currentPathSegments || currentPathSegments.length === 0) {
      return `Hover over a tree node`;
    }
    
    const displayPath = currentPathSegments.map(segment =>
        typeof segment === 'number' ? `[${segment}]` : `.${String(segment)}`
    ).join('');

    return `${rootSegment}${displayPath}`;
  };
  
  const isRootObject = typeof jsonData === 'object' && !Array.isArray(jsonData) && jsonData !== null;
  const isRootArray = Array.isArray(jsonData);
  const dataForCurrentView = viewMode === 'cards' ? currentCardData : jsonData;
  const canHaveChildren = typeof dataForCurrentView === 'object' && dataForCurrentView !== null;


  let cardViewHeaderText = title || 'Section Root';
  if (viewMode === 'cards' && cardViewPath.length > 0) {
    cardViewHeaderText = formatPathForBreadcrumbs(null, true);
  } else if (viewMode === 'cards') {
    cardViewHeaderText = `${title || 'Section Root'} (Card View Root)`;
  } else if (title) {
    cardViewHeaderText = title;
  }


  return (
    <TooltipProvider>
      <Card className="my-4 shadow-lg bg-card">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center mb-2">
            <CardTitle className="text-lg font-semibold text-primary flex items-center min-w-0">
              {viewMode === 'cards' && cardViewPath.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleCardViewBack} className="h-7 w-7 mr-2 flex-shrink-0">
                      <ArrowLeft size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Back to Parent</p></TooltipContent>
                </Tooltip>
              )}
              <span className="truncate" title={cardViewHeaderText}>
                {cardViewHeaderText}
              </span>
            </CardTitle>
            <div className="flex space-x-1 items-center flex-shrink-0">
              {(viewMode === 'tree' || (viewMode === 'cards' && canHaveChildren)) && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleExpandAll} className="h-7 w-7">
                        <UnfoldVertical size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Expand All</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleCollapseAll} className="h-7 w-7">
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
                    <Button variant="outline" size="icon" onClick={() => { setViewMode(viewMode === 'tree' ? 'cards' : 'tree'); setSearchTerm(''); setCardViewPath([]); }} className="h-7 w-7">
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
              placeholder={`Search in ${viewMode === 'cards' ? cardViewHeaderText.replace('Viewing: ', '').replace(' (Card View Root)','').replace(' (Card View)','') : (title || 'this section')}...`}
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
                    : (cardViewPath.length > 0 ? `Path: ${formatPathForBreadcrumbs(null, true).replace("Viewing: ","").replace(" (Card View)","")}` : "Top level of cards")
                }
              </span>
            </div>
        </CardHeader>
        <CardContent className="pt-2">
          {viewMode === 'tree' ? (
            <JsonNode
                path={[]}
                value={jsonData}
                nodeKey={ (typeof jsonData !== 'object' || jsonData === null) ? (title || "Root Value") : undefined }
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
              {typeof dataForCurrentView === 'object' && dataForCurrentView !== null ? (
                !Array.isArray(dataForCurrentView) ? ( 
                  Object.entries(dataForCurrentView).length > 0 ? (
                    Object.entries(dataForCurrentView).filter(([key, value]) => {
                        if (!searchTerm) return true;
                        const searchTermLower = searchTerm.toLowerCase();
                        return key.toLowerCase().includes(searchTermLower) ||
                               (typeof value === 'string' && value.toLowerCase().includes(searchTermLower)) ||
                               (typeof value === 'number' && String(value).toLowerCase().includes(searchTermLower)) ||
                               (value === null && "null".includes(searchTermLower)) ||
                               (typeof value === 'boolean' && String(value).toLowerCase().includes(searchTermLower));
                    }).map(([key, value]) => (
                      <Card key={key} className="shadow-md hover:shadow-lg transition-shadow flex flex-col bg-card border">
                         <CardContent className="flex-grow px-4 py-3 min-h-[7rem] flex flex-col justify-center">
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
                            isInCardViewTopLevel={true} 
                          />
                        </CardContent>
                         {(typeof value === 'object' && value !== null) && (
                            <CardHeader className="pt-0 pb-3 px-4 border-t">
                                <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => handleExploreCard(key)}>
                                Explore {Array.isArray(value) ? `Array (${value.length})` : `Object (${Object.keys(value).length})`}
                                </Button>
                            </CardHeader>
                        )}
                      </Card>
                    ))
                  ) : ( <p className="col-span-full text-center text-muted-foreground py-4">This object is empty. {cardViewPath.length > 0 && <Button variant="link" onClick={handleCardViewBack}>Go back.</Button>}</p> )
                ) : ( 
                  dataForCurrentView.length > 0 ? (
                    dataForCurrentView.filter((item, index) => {
                        if (!searchTerm) return true;
                        const searchTermLower = searchTerm.toLowerCase();
                        return (String(index).toLowerCase().includes(searchTermLower)) ||
                               (typeof item === 'string' && item.toLowerCase().includes(searchTermLower)) ||
                               (typeof item === 'number' && String(item).toLowerCase().includes(searchTermLower)) ||
                               (item === null && "null".includes(searchTermLower)) ||
                               (typeof item === 'boolean' && String(item).toLowerCase().includes(searchTermLower));
                    }).map((item, index) => (
                      <Card key={index} className="shadow-md hover:shadow-lg transition-shadow flex flex-col bg-card border">
                         <CardContent className="flex-grow px-4 py-3 min-h-[7rem] flex flex-col justify-center">
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
                            isInCardViewTopLevel={true} 
                          />
                        </CardContent>
                         {(typeof item === 'object' && item !== null) && (
                             <CardHeader className="pt-0 pb-3 px-4 border-t">
                                <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => handleExploreCard(index)}>
                                Explore {Array.isArray(item) ? `Array (${item.length})` : `Object (${Object.keys(item).length})`}
                                </Button>
                            </CardHeader>
                        )}
                      </Card>
                    ))
                  ) : ( <p className="col-span-full text-center text-muted-foreground py-4">This array is empty. {cardViewPath.length > 0 && <Button variant="link" onClick={handleCardViewBack}>Go back.</Button>}</p> )
                )
              ) : ( 
                <Card className="col-span-full">
                    <CardHeader>
                        <CardTitle>
                            {dataForCurrentView === undefined ? "Invalid Path" : (dataForCurrentView === null ? "Null Value" : "Primitive Value")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[6rem]">
                        <p className="text-muted-foreground">
                        {dataForCurrentView === undefined ?
                            "The navigation path leads to an invalid or non-existent value." :
                            `The current value is: ${String(dataForCurrentView)}.`
                        }
                        {(cardViewPath.length > 0 && (typeof dataForCurrentView !== 'object' || dataForCurrentView === null)) && " Cannot explore further."}
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
                                isInCardViewTopLevel={true} 
                                expansionTrigger={expansionTrigger}
                                searchTerm={searchTerm}
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


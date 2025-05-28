
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import type { JsonValue, JsonPath, ExpansionTrigger } from './types';
import { JsonNode } from './json-node';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UnfoldVertical, FoldVertical, Search, Info, ListTree, LayoutGrid } from 'lucide-react';
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
  const { toast } = useToast();

  useEffect(() => {
    setExpansionTrigger(null);
    // setViewMode('tree'); // Optionally reset view mode when data changes
  }, [jsonData]);
  
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
            delete parent[targetKeyOrIndex as string];
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
    }
  }, [jsonData, onJsonChange]);

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
    }
  }, [jsonData, onJsonChange]);

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
    if(event.target.value) {
        handleExpandAll(); 
    }
  };

  const handleSetHoveredPath = useCallback((path: JsonPath | null) => {
    setHoveredPath(path);
  }, []);

  const formatPathForBreadcrumbs = (path: JsonPath | null): string => {
    if (!path && viewMode === 'tree') return 'Hover over a tree node to see its path';
    if (!path && viewMode === 'cards') return 'Card view for top-level items';
    if (!path) return '';

    const rootSegment = title || (Array.isArray(jsonData) ? 'Root Array' : 'Root Object');
    
    if(path.length === 0 && (typeof jsonData !== 'object' || jsonData === null)){
        return `${rootSegment} (Primitive Value)`
    }
     if(path.length === 0){
        return `${rootSegment}`
    }

    const displayPath = path.map(segment => 
        typeof segment === 'number' ? `[${segment}]` : `.${segment}`
    ).join('');
    return `${rootSegment}${displayPath.startsWith('.') ? '' : '.'}${displayPath.startsWith('.') ? displayPath.substring(1) : displayPath}`;
  };

  const isRootObject = typeof jsonData === 'object' && !Array.isArray(jsonData) && jsonData !== null;
  const isRootArray = Array.isArray(jsonData);
  const canHaveChildren = isRootObject || isRootArray;

  return (
    <TooltipProvider>
      <Card className="my-4 shadow-lg bg-card">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center mb-2">
            {title && <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>}
            <div className="flex space-x-1">
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
          <div className="mt-2 text-xs text-muted-foreground min-h-[1.25rem] flex items-center">
            <Info size={12} className="mr-1.5 flex-shrink-0" />
            <span className="truncate">{formatPathForBreadcrumbs(hoveredPath)}</span>
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
              />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {typeof jsonData === 'object' && jsonData !== null && !Array.isArray(jsonData) ? (
                Object.entries(jsonData).length > 0 ? (
                  Object.entries(jsonData).map(([key, value]) => (
                    <Card key={key} className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg truncate" title={key}>{key}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-32 whitespace-pre-wrap break-all">
                          {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                        </pre>
                        {(typeof value === 'object' && value !== null) && (
                          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => {
                            toast({title: "Explore (Not Implemented)", description: `Future: Drill down into '${key}'`});
                          }}>
                            Explore
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="col-span-full text-center text-muted-foreground">This object is empty.</p>
                )
              ) : Array.isArray(jsonData) ? (
                jsonData.length > 0 ? (
                  jsonData.map((item, index) => (
                    <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Item {index}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-32 whitespace-pre-wrap break-all">
                          {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
                        </pre>
                        {(typeof item === 'object' && item !== null) && (
                          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => {
                            toast({title: "Explore (Not Implemented)", description: `Future: Drill down into item ${index}`});
                          }}>
                            Explore
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="col-span-full text-center text-muted-foreground">This array is empty.</p>
                )
              ) : (
                <p className="col-span-full text-center text-muted-foreground">
                  { jsonData === null ? "Value is null." : `Primitive value: ${String(jsonData)}.`} This cannot be displayed as cards.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}


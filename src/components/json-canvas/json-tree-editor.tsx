
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import type { JsonValue, JsonPath, ExpansionTrigger } from './types';
import { JsonNode } from './json-node';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UnfoldVertical, FoldVertical, Search, Info } from 'lucide-react';


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

  useEffect(() => {
    // When jsonData prop changes (e.g., new file imported or tab switched),
    // reset the expansion trigger. This ensures the new tree renders with
    // default expansion (all nodes expanded initially via JsonNode's local state)
    // and is not affected by a previous global expand/collapse on different data.
    setExpansionTrigger(null);
    // Optionally, reset search term as well for a new document/section.
    // setSearchTerm(''); 
  }, [jsonData]);
  
  const handleUpdate = useCallback((path: JsonPath, newValue: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData)); 
    let current = newJson;
    if (path.length === 0) { // Editing the root primitive value
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
      // Deleting the root. Determine what a sensible "empty" state is.
      // If original jsonData was an object, set to {}. If array, []. Otherwise null.
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
    } else if (parent && lastSegmentInParent !== null) { // Deleting a primitive value that has a parent
        if (Array.isArray(parent)) {
            parent.splice(Number(lastSegmentInParent), 1);
        } else {
             // This case means `current` is a primitive, and `targetKeyOrIndex` is its key in `parent`.
            delete parent[targetKeyOrIndex as string];
        }
    }


    onJsonChange(newJson);
  }, [jsonData, onJsonChange]);
  
  const handleAddProperty = useCallback((path: JsonPath, key: string, value: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    let current = newJson;
    // For root-level addition if jsonData is an object
    if (path.length === 0 && typeof current === 'object' && !Array.isArray(current) && current !== null) {
      current[key] = value;
      onJsonChange(newJson);
      return;
    }
    // For nested additions
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
     // For root-level addition if jsonData is an array
    if (path.length === 0 && Array.isArray(current)) {
      current.push(value);
      onJsonChange(newJson);
      return;
    }
    // For nested additions
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
    // For root-level key rename (if path is empty, target is newJson itself)
    if (path.length === 0 && typeof current === 'object' && !Array.isArray(current) && current !== null) {
       if (oldKey in current && oldKey !== newKey) {
        if (newKey in current) {
            console.warn("New key already exists at root. Not renaming.");
            // Optionally, add a toast message here
            return;
        }
        const value = current[oldKey];
        delete current[oldKey];
        current[newKey] = value;
        onJsonChange(newJson);
      }
      return;
    }

    // For nested key rename
    for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
    }
    if (typeof current === 'object' && !Array.isArray(current) && current !== null && oldKey in current) {
        if (newKey in current && oldKey !== newKey) {
            console.warn(`New key "${newKey}" already exists in object. Not renaming.`);
            // Optionally, add a toast message here
            return;
        }
        if (oldKey === newKey) return; // No change needed

        const value = current[oldKey];
        delete current[oldKey];
        current[newKey] = value;
        onJsonChange(newJson);
    }
  }, [jsonData, onJsonChange]);

  const handleExpandAll = useCallback(() => {
    setExpansionTrigger({ type: 'expand', timestamp: Date.now() });
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpansionTrigger({ type: 'collapse', timestamp: Date.now() });
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // If user clears search, perhaps reset expansion? Or leave as is.
    // For now, leave as is. If search term is present, it implies user wants to see matches.
    if(event.target.value) {
        handleExpandAll(); // Expand all to make sure search results are visible
    }
  };

  const handleSetHoveredPath = useCallback((path: JsonPath | null) => {
    setHoveredPath(path);
  }, []);

  const formatPathForBreadcrumbs = (path: JsonPath | null): string => {
    if (!path) return 'Hover over a node to see its path';
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


  // Determine if root is an object or array to decide if add property/item is possible at root
  const isRootObject = typeof jsonData === 'object' && !Array.isArray(jsonData) && jsonData !== null;
  const isRootArray = Array.isArray(jsonData);


  return (
    <TooltipProvider>
      <Card className="my-4 shadow-lg bg-card">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center mb-2">
            {title && <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>}
            {(typeof jsonData === 'object' && jsonData !== null && Object.keys(jsonData).length > 0) || Array.isArray(jsonData) && jsonData.length > 0 ? (
              <div className="flex space-x-1">
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
              </div>
            ) : null}
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
          <JsonNode
              path={[]} 
              value={jsonData} 
              nodeKey={title || (typeof jsonData !== 'object' || jsonData === null ? "Root Value" : undefined)} 
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAddProperty={isRootObject ? handleAddProperty : undefined} // only allow add prop if root is obj
              onAddItem={isRootArray ? handleAddItem : undefined} // only allow add item if root is array
              onRenameKey={isRootObject ? handleRenameKey : undefined} // only allow rename key if root is obj
              depth={0}
              getApiKey={getApiKey}
              expansionTrigger={expansionTrigger}
              searchTerm={searchTerm}
              onSetHoveredPath={handleSetHoveredPath}
            />
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

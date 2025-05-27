
"use client";

import React, { useState, useCallback } from 'react';
import type { JsonValue, JsonPath } from './types';
import { JsonNode } from './json-node';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UnfoldVertical, FoldVertical, Search, Info } from 'lucide-react';


interface JsonTreeEditorProps {
  jsonData: JsonValue;
  onJsonChange: (newJson: JsonValue) => void;
  title?: string; // Optional title for the section/tab
  getApiKey: () => string | null;
}

export function JsonTreeEditor({ jsonData, onJsonChange, title, getApiKey }: JsonTreeEditorProps) {
  const [expansionTrigger, setExpansionTrigger] = useState<{ type: 'expand' | 'collapse', timestamp: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredPath, setHoveredPath] = useState<JsonPath | null>(null);
  
  const handleUpdate = (path: JsonPath, newValue: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData)); // Deep clone
    let current = newJson;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = newValue;
    onJsonChange(newJson);
  };

  const handleDelete = (path: JsonPath, keyOrIndex?: string | number) => {
    const newJson = JSON.parse(JSON.stringify(jsonData)); // Deep clone
    let current = newJson;
    let parent = null;
    let lastSegment = null;

    if (path.length === 0) { 
      onJsonChange({}); 
      return;
    }
    
    for (let i = 0; i < path.length - 1; i++) {
      parent = current;
      current = current[path[i]];
      lastSegment = path[i];
    }

    const targetKeyOrIndex = path[path.length - 1];
    
    if (Array.isArray(current)) {
      current.splice(Number(targetKeyOrIndex), 1);
    } else if (typeof current === 'object' && current !== null) {
      delete current[targetKeyOrIndex as string];
    } else if (parent && lastSegment !== null) { 
        if (Array.isArray(parent)) {
            parent.splice(Number(lastSegment), 1);
        } else {
            delete parent[lastSegment as string]; // Ensure lastSegment is treated as string for object keys
        }
    }

    if (path.length === 1 && (typeof newJson === 'object' && newJson !== null && !Array.isArray(newJson))) {
      delete (newJson as any)[path[0]];
    }

    onJsonChange(newJson);
  };
  
  const handleAddProperty = (path: JsonPath, key: string, value: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    let current = newJson;
    for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
    }
    if (typeof current === 'object' && !Array.isArray(current) && current !== null) {
        current[key] = value;
        onJsonChange(newJson);
    }
  };

  const handleAddItem = (path: JsonPath, value: JsonValue) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    let current = newJson;
    for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
    }
    if (Array.isArray(current)) {
        current.push(value);
        onJsonChange(newJson);
    }
  };

  const handleRenameKey = (path: JsonPath, oldKey: string, newKey: string) => {
    const newJson = JSON.parse(JSON.stringify(jsonData));
    let current = newJson;
    for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
    }
    if (typeof current === 'object' && !Array.isArray(current) && current !== null && oldKey in current) {
        if (newKey in current) {
            console.error("New key already exists");
            return;
        }
        const value = current[oldKey];
        delete current[oldKey];
        current[newKey] = value;
        onJsonChange(newJson);
    }
  };

  const handleExpandAll = useCallback(() => {
    setExpansionTrigger({ type: 'expand', timestamp: Date.now() });
  }, []);

  const handleCollapseAll = useCallback(() => {
    setExpansionTrigger({ type: 'collapse', timestamp: Date.now() });
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSetHoveredPath = useCallback((path: JsonPath | null) => {
    setHoveredPath(path);
  }, []);

  const formatPathForBreadcrumbs = (path: JsonPath | null): string => {
    if (!path || path.length === 0) return 'Hover over a node to see its path';
    // If the first segment is the title itself, and it's an object/array root, 
    // we might not need to show it if it's redundant with the CardTitle.
    // For now, keep it simple.
    const rootSegment = title || 'root';
    const displayPath = path.map(segment => 
        typeof segment === 'number' ? `[${segment}]` : `.${segment}`
    ).join('');
    return `${rootSegment}${displayPath.startsWith('.') ? '' : '.'}${displayPath.startsWith('.') ? displayPath.substring(1) : displayPath}`;
  };


  if (typeof jsonData !== 'object' || jsonData === null) {
    return (
      <Card className="my-4 shadow-lg bg-card">
        <CardHeader>
          {title && <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>}
        </CardHeader>
        <CardContent>
          <JsonNode
            path={[]} 
            value={jsonData}
            onUpdate={(path, newValue) => onJsonChange(newValue)} 
            onDelete={() => onJsonChange(null)} 
            depth={0}
            getApiKey={getApiKey}
            expansionTrigger={expansionTrigger}
            searchTerm={searchTerm}
            onSetHoveredPath={handleSetHoveredPath}
          />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <TooltipProvider>
      <Card className="my-4 shadow-lg bg-card">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center mb-2">
            {title && <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>}
            {(typeof jsonData === 'object' && jsonData !== null && Object.keys(jsonData).length > 0) && (
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
            )}
          </div>
           <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search in this section..."
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
              nodeKey={title} // This might be confusing if jsonData is an array at root of section
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAddProperty={handleAddProperty}
              onAddItem={handleAddItem}
              onRenameKey={handleRenameKey}
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

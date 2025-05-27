"use client";

import React from 'react';
import type { JsonValue, JsonPath } from './types';
import { JsonNode } from './json-node';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface JsonTreeEditorProps {
  jsonData: JsonValue;
  onJsonChange: (newJson: JsonValue) => void;
  title?: string; // Optional title for the section/tab
  getApiKey: () => string | null;
}

export function JsonTreeEditor({ jsonData, onJsonChange, title, getApiKey }: JsonTreeEditorProps) {
  
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

    if (path.length === 0) { // Deleting the root (not typical for this component structure)
      onJsonChange({}); // Or null, depending on desired behavior
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
    } else if (parent && lastSegment !== null) { // Deleting a top-level property from the perspective of this editor
        if (Array.isArray(parent)) {
            parent.splice(Number(lastSegment), 1);
        } else {
            delete parent[lastSegment];
        }
    }


    // If path is empty, it means we are operating on jsonData directly.
    // This case should be handled if a top-level key/item is deleted from a tab.
    // For now, assuming path always has at least one element.
    if (path.length === 1 && (typeof jsonData === 'object' && jsonData !== null && !Array.isArray(jsonData))) {
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
            // Handle key collision if necessary, e.g., toast error
            console.error("New key already exists");
            return;
        }
        const value = current[oldKey];
        delete current[oldKey];
        current[newKey] = value;
        onJsonChange(newJson);
    }
  };


  if (typeof jsonData !== 'object' || jsonData === null) {
    return (
      <Card className="my-4 shadow-lg">
        <CardHeader>
          {title && <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>}
        </CardHeader>
        <CardContent>
          <JsonNode
            path={[]} // Path is to the root value itself
            value={jsonData}
            onUpdate={(path, newValue) => onJsonChange(newValue)} // Root update
            onDelete={() => onJsonChange(null)} // Deleting root
            depth={0}
            getApiKey={getApiKey}
          />
        </CardContent>
      </Card>
    );
  }
  
  // If jsonData is an object or array, render its contents
  return (
    <Card className="my-4 shadow-lg bg-card">
      {title && (
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-4">
         <JsonNode
            path={[]} // Represents the root of the current `jsonData` being edited
            value={jsonData} // Pass the whole object/array
            nodeKey={title} // Pass the title as nodeKey if it's the root of a section
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onAddProperty={handleAddProperty}
            onAddItem={handleAddItem}
            onRenameKey={handleRenameKey}
            depth={0}
            getApiKey={getApiKey}
          />
      </CardContent>
    </Card>
  );
}

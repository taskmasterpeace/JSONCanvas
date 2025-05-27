
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type JsonPath = (string | number)[];

export interface EditableJsonNodeProps {
  path: JsonPath;
  value: JsonValue;
  nodeKey?: string; // Only for object properties
  onUpdate: (path: JsonPath, newValue: JsonValue) => void;
  onDelete: (path: JsonPath, keyOrIndex?: string | number) => void;
  onAddProperty?: (path: JsonPath, key: string, value: JsonValue) => void; // For objects
  onAddItem?: (path: JsonPath, value: JsonValue) => void; // For arrays
  onRenameKey?: (path: JsonPath, oldKey: string, newKey: string) => void; // For object keys
  depth: number;
  getApiKey: () => string | null;
  expansionTrigger?: { type: 'expand' | 'collapse', timestamp: number } | null;
  searchTerm?: string; // For highlighting search matches
  onSetHoveredPath?: (path: JsonPath | null) => void; // For breadcrumbs
}


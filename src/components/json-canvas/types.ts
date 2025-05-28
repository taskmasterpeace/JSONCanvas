
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type JsonPath = (string | number)[];

export type ExpansionTrigger = { type: 'expand' | 'collapse', path: JsonPath | null, timestamp: number } | null;

export interface EditableJsonNodeProps {
  path: JsonPath;
  value: JsonValue;
  nodeKey?: string; 
  onUpdate: (path: JsonPath, newValue: JsonValue) => void;
  onDelete: (path: JsonPath, keyOrIndex?: string | number) => void;
  onAddProperty?: (path: JsonPath, key: string, value: JsonValue) => void; 
  onAddItem?: (path: JsonPath, value: JsonValue) => void; 
  onRenameKey?: (path: JsonPath, oldKey: string, newKey: string) => void; 
  depth: number;
  getApiKey: () => string | null;
  expansionTrigger?: ExpansionTrigger;
  searchTerm?: string; 
  onSetHoveredPath?: (path: JsonPath | null) => void; 
  isInCardViewTopLevel?: boolean; 
}

export interface Document {
  id: string;
  name: string;
  data: JsonValue;
  history: JsonValue[];
  currentHistoryIndex: number;
}

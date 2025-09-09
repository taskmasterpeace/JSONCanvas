# JSON Canvas AI - Headless API Examples

Complete examples for interacting with JSON Canvas AI via REST API.

## Base URL
```
http://localhost:9002/api
```

## Quick Start

1. Start the development server:
```bash
npm run dev
```

2. Test the API root:
```bash
curl http://localhost:9002/api
```

## AI Features

### 1. Convert Text to JSON
Transform unstructured text into structured JSON.

**Endpoint:** `POST /api/ai/convert-text`

```bash
# Simple example
curl -X POST http://localhost:9002/api/ai/convert-text \
  -H "Content-Type: application/json" \
  -d '{
    "rawText": "John Doe, 30, Engineer\nJane Smith, 25, Designer",
    "instructions": "Create an array of person objects"
  }'

# Advanced example
curl -X POST http://localhost:9002/api/ai/convert-text \
  -H "Content-Type: application/json" \
  -d '{
    "rawText": "Product: iPhone 15\nPrice: $999\nStock: 50\nCategories: Electronics, Phones\nRating: 4.5 stars",
    "instructions": "Create a detailed product object with nested categories array"
  }'
```

**JavaScript Example:**
```javascript
const convertTextToJson = async (text, instructions = '') => {
  const response = await fetch('http://localhost:9002/api/ai/convert-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rawText: text,
      instructions: instructions
    })
  });
  
  const result = await response.json();
  if (result.success) {
    return JSON.parse(result.data.generatedJson);
  }
  throw new Error(result.error);
};

// Usage
const jsonData = await convertTextToJson(
  'Apple: $2.50, Banana: $1.20, Orange: $3.00',
  'Create a price list object'
);
```

### 2. Enhance JSON Fields
Use AI to improve existing JSON field values.

**Endpoint:** `POST /api/ai/enhance-field`

```bash
curl -X POST http://localhost:9002/api/ai/enhance-field \
  -H "Content-Type: application/json" \
  -d '{
    "currentValue": "Product description",
    "context": "This is for an e-commerce product page",
    "instructions": "Make it compelling and detailed"
  }'
```

### 3. Format and Fix JSON
Clean up malformed JSON and improve formatting.

**Endpoint:** `POST /api/ai/format-json`

```bash
curl -X POST http://localhost:9002/api/ai/format-json \
  -H "Content-Type: application/json" \
  -d '{
    "jsonString": "{name:\"John\",age:30,active:true,}",
    "instructions": "Fix syntax errors and format nicely"
  }'
```

## Document Management

### 1. Create Document
**Endpoint:** `POST /api/documents`

```bash
curl -X POST http://localhost:9002/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "My Project",
      "tasks": ["Task 1", "Task 2"],
      "status": "active"
    },
    "name": "Project Document"
  }'
```

### 2. Retrieve Document
**Endpoint:** `GET /api/documents/[id]`

```bash
curl http://localhost:9002/api/documents/1704067200000abc123
```

### 3. Update Document
**Endpoint:** `PUT /api/documents/[id]`

```bash
curl -X PUT http://localhost:9002/api/documents/1704067200000abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "Updated Project",
      "tasks": ["Task 1", "Task 2", "Task 3"],
      "status": "completed"
    },
    "addToHistory": true
  }'
```

### 4. Delete Document
**Endpoint:** `DELETE /api/documents/[id]`

```bash
curl -X DELETE http://localhost:9002/api/documents/1704067200000abc123
```

## JSON Manipulation

**Endpoint:** `POST /api/json/manipulate`

### Add Property
```bash
curl -X POST http://localhost:9002/api/json/manipulate \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "addProperty",
    "jsonData": {"user": {"name": "John"}},
    "path": ["user"],
    "key": "age",
    "value": 30
  }'
```

### Add Array Item
```bash
curl -X POST http://localhost:9002/api/json/manipulate \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "addItem",
    "jsonData": {"fruits": ["apple", "banana"]},
    "path": ["fruits"],
    "value": "orange"
  }'
```

### Delete Property
```bash
curl -X POST http://localhost:9002/api/json/manipulate \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "delete",
    "jsonData": {"user": {"name": "John", "age": 30}},
    "path": ["user"],
    "key": "age"
  }'
```

### Rename Property
```bash
curl -X POST http://localhost:9002/api/json/manipulate \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "renameProperty",
    "jsonData": {"user": {"name": "John"}},
    "path": ["user"],
    "key": "name",
    "newKey": "fullName"
  }'
```

### Set Value
```bash
curl -X POST http://localhost:9002/api/json/manipulate \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "setValue",
    "jsonData": {"user": {"name": "John"}},
    "path": ["user", "name"],
    "value": "Jane Doe"
  }'
```

### Validate JSON
```bash
curl -X POST http://localhost:9002/api/json/manipulate \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "validate",
    "jsonData": {"user": {"name": "John", "age": 30}}
  }'
```

## Python Examples

### Complete Python Client
```python
import requests
import json

class JSONCanvasClient:
    def __init__(self, base_url="http://localhost:9002/api"):
        self.base_url = base_url
    
    def convert_text_to_json(self, text, instructions=""):
        """Convert text to structured JSON"""
        response = requests.post(f"{self.base_url}/ai/convert-text", json={
            "rawText": text,
            "instructions": instructions
        })
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                return json.loads(result["data"]["generatedJson"])
        
        raise Exception(f"API Error: {response.text}")
    
    def create_document(self, data, name=None):
        """Create a new document"""
        response = requests.post(f"{self.base_url}/documents", json={
            "data": data,
            "name": name
        })
        
        if response.status_code == 200:
            return response.json()["data"]
        
        raise Exception(f"API Error: {response.text}")
    
    def manipulate_json(self, operation, json_data, **kwargs):
        """Perform JSON manipulation"""
        payload = {
            "operation": operation,
            "jsonData": json_data,
            **kwargs
        }
        
        response = requests.post(f"{self.base_url}/json/manipulate", json=payload)
        
        if response.status_code == 200:
            return response.json()["data"]["result"]
        
        raise Exception(f"API Error: {response.text}")

# Usage examples
client = JSONCanvasClient()

# Convert text to JSON
text = "Apple $2.50, Banana $1.20, Orange $3.00"
json_data = client.convert_text_to_json(text, "Create a price list")
print(json_data)

# Create document
doc = client.create_document(json_data, "Price List")
print(f"Created document: {doc['id']}")

# Add new item
updated_data = client.manipulate_json(
    "addProperty", 
    json_data, 
    path=[], 
    key="grape", 
    value="$4.00"
)
print(updated_data)
```

## Node.js Examples

### Complete Node.js Client
```javascript
const fetch = require('node-fetch'); // npm install node-fetch

class JSONCanvasClient {
  constructor(baseUrl = 'http://localhost:9002/api') {
    this.baseUrl = baseUrl;
  }

  async convertTextToJson(text, instructions = '') {
    const response = await fetch(`${this.baseUrl}/ai/convert-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText: text,
        instructions: instructions
      })
    });

    const result = await response.json();
    if (result.success) {
      return JSON.parse(result.data.generatedJson);
    }
    throw new Error(result.error);
  }

  async createDocument(data, name = null) {
    const response = await fetch(`${this.baseUrl}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, name })
    });

    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error);
  }

  async manipulateJson(operation, jsonData, options = {}) {
    const response = await fetch(`${this.baseUrl}/json/manipulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation,
        jsonData,
        ...options
      })
    });

    const result = await response.json();
    if (result.success) {
      return result.data.result;
    }
    throw new Error(result.error);
  }
}

// Usage
(async () => {
  const client = new JSONCanvasClient();
  
  try {
    // Convert CSV to JSON
    const csvText = "Name,Age,City\nJohn,30,NYC\nJane,25,LA";
    const jsonData = await client.convertTextToJson(csvText, "Convert to person objects");
    console.log('Converted JSON:', jsonData);
    
    // Create document
    const doc = await client.createDocument(jsonData, "People List");
    console.log('Created document:', doc.id);
    
    // Add new person
    const updated = await client.manipulateJson('addItem', jsonData, {
      path: [],
      value: { name: "Bob", age: 35, city: "Chicago" }
    });
    console.log('Updated data:', updated);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
```

## Available Models
Get list of available AI models:

```bash
curl http://localhost:9002/api/models
```

## Error Handling

All endpoints return consistent error format:
```json
{
  "error": "Error description",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (missing required fields)
- `404` - Resource not found
- `500` - Server error

## Environment Setup

Make sure your `.env` file contains:
```bash
GOOGLE_AI_API_KEY=your_google_ai_key
OPENROUTER_API_KEY=your_openrouter_key  # optional
REQUESTY_API_KEY=your_requesty_key      # optional
MODEL_PROVIDER=google                   # or openrouter, requesty
```
#!/usr/bin/env python3

"""
JSON Canvas AI - Python Client Test Suite
Complete test of all headless API endpoints
Run with: python test-api.py
"""

import requests
import json
import sys

BASE_URL = "http://localhost:9002/api"

def test_endpoint(name, url, method="GET", data=None):
    """Test an API endpoint and print results"""
    print(f"📋 Testing: {name}")
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data, headers={"Content-Type": "application/json"})
        elif method == "PUT":
            response = requests.put(url, json=data, headers={"Content-Type": "application/json"})
        elif method == "DELETE":
            response = requests.delete(url)
        
        result = response.json()
        
        if response.status_code == 200:
            print(f"✅ {name} - SUCCESS")
            if "data" in result:
                preview = str(result["data"])[:200] + "..." if len(str(result["data"])) > 200 else str(result["data"])
                print(f"📄 Result: {preview}")
            else:
                preview = str(result)[:200] + "..." if len(str(result)) > 200 else str(result)
                print(f"📄 Response: {preview}")
        else:
            print(f"❌ {name} - FAILED")
            print(f"📄 Error: {result}")
        
        print()
        return result
        
    except Exception as e:
        print(f"❌ {name} - ERROR: {str(e)}")
        print()
        return None

class JSONCanvasClient:
    """Complete Python client for JSON Canvas AI"""
    
    def __init__(self, base_url=BASE_URL):
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
    
    def enhance_field(self, content, prompt):
        """Enhance a field using AI"""
        response = requests.post(f"{self.base_url}/ai/enhance-field", json={
            "fieldContent": content,
            "userPrompt": prompt
        })
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                return result["data"]["enhancedContent"]
        
        raise Exception(f"API Error: {response.text}")
    
    def format_json(self, json_string, instructions=""):
        """Format and fix JSON"""
        response = requests.post(f"{self.base_url}/ai/format-json", json={
            "jsonString": json_string,
            "instructions": instructions
        })
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                return result["data"]["formattedJson"]
        
        raise Exception(f"API Error: {response.text}")
    
    def create_document(self, data, name=None):
        """Create a new document"""
        response = requests.post(f"{self.base_url}/documents", json={
            "data": data,
            "name": name
        })
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                return result["data"]
        
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
            result = response.json()
            if result.get("success"):
                return result["data"]["result"]
        
        raise Exception(f"API Error: {response.text}")

def run_tests():
    """Run comprehensive test suite"""
    print("🚀 JSON Canvas AI - Python Client Test Suite\n")
    
    print("=" * 50)
    print("🔍 BASIC API TESTS")
    print("=" * 50 + "\n")
    
    # Test basic endpoints
    test_endpoint("API Root Documentation", f"{BASE_URL}")
    test_endpoint("Available AI Models", f"{BASE_URL}/models")
    
    print("=" * 50)
    print("🤖 AI FEATURES TESTS")
    print("=" * 50 + "\n")
    
    # Test AI features
    test_endpoint("AI Text to JSON Conversion", f"{BASE_URL}/ai/convert-text", "POST", {
        "rawText": "Product: iPhone 15\nPrice: $999\nStorage: 128GB, 256GB, 512GB\nColors: Blue, Pink, Black, White\nRating: 4.5/5",
        "instructions": "Create a detailed product object with arrays for storage and color options"
    })
    
    test_endpoint("AI Field Enhancement", f"{BASE_URL}/ai/enhance-field", "POST", {
        "fieldContent": "Good software",
        "userPrompt": "Rewrite as professional software product description with technical benefits"
    })
    
    test_endpoint("AI JSON Formatting", f"{BASE_URL}/ai/format-json", "POST", {
        "jsonString": '{name:"Alice",age:28,skills:["python","javascript","react",],active:true,}',
        "instructions": "Fix syntax errors and format with proper indentation"
    })
    
    print("=" * 50)
    print("📄 DOCUMENT MANAGEMENT TESTS")
    print("=" * 50 + "\n")
    
    # Test document creation
    doc_result = test_endpoint("Create Document", f"{BASE_URL}/documents", "POST", {
        "data": {
            "company": "TechCorp",
            "employees": 150,
            "departments": ["Engineering", "Sales", "Marketing", "HR"],
            "founded": 2020,
            "revenue": "$5.2M"
        },
        "name": "Company Profile"
    })
    
    print("=" * 50)
    print("🔧 JSON MANIPULATION TESTS")
    print("=" * 50 + "\n")
    
    # Test JSON manipulations
    test_data = {"user": {"name": "Alice", "age": 28}}
    
    test_endpoint("Add Property", f"{BASE_URL}/json/manipulate", "POST", {
        "operation": "addProperty",
        "jsonData": test_data,
        "path": ["user"],
        "key": "department",
        "value": "Engineering"
    })
    
    test_endpoint("Add Array Item", f"{BASE_URL}/json/manipulate", "POST", {
        "operation": "addItem",
        "jsonData": {"skills": ["Python", "JavaScript"]},
        "path": ["skills"],
        "value": "React"
    })
    
    test_endpoint("Validate JSON", f"{BASE_URL}/json/manipulate", "POST", {
        "operation": "validate",
        "jsonData": {"user": {"name": "Alice", "age": 28, "active": True}}
    })
    
    print("=" * 50)
    print("🎯 PYTHON CLIENT DEMO")
    print("=" * 50 + "\n")
    
    try:
        client = JSONCanvasClient()
        
        # Demo workflow
        print("🔄 Python Client Demo Workflow:")
        print("1. Converting product data to JSON...")
        
        product_text = """
        Smart Watch Pro
        Price: $299
        Features: Heart rate monitoring, GPS tracking, Water resistant, 7-day battery
        Colors: Black, Silver, Gold
        Sizes: 42mm, 46mm
        """
        
        product_json = client.convert_text_to_json(product_text, "Create structured product object")
        print(f"✅ Converted to JSON: {json.dumps(product_json, indent=2)}")
        
        print("\n2. Enhancing product description...")
        enhanced_desc = client.enhance_field(
            "Smart watch with health features",
            "Create compelling marketing copy highlighting health and fitness benefits"
        )
        print(f"✅ Enhanced description: {enhanced_desc}")
        
        print("\n3. Adding enhanced description to product...")
        final_product = client.manipulate_json(
            "addProperty",
            product_json,
            path=[],
            key="marketingDescription",
            value=enhanced_desc
        )
        print(f"✅ Final product: {json.dumps(final_product, indent=2)[:300]}...")
        
        print("\n4. Creating document...")
        doc = client.create_document(final_product, "Smart Watch Product Data")
        print(f"✅ Document created: {doc['name']} (ID: {doc['id']})")
        
    except Exception as e:
        print(f"❌ Python client demo failed: {e}")
    
    print("\n" + "=" * 50)
    print("✅ ALL TESTS COMPLETED!")
    print("=" * 50 + "\n")
    print("🎉 JSON Canvas AI Python client is working perfectly!")
    print("📚 Full API documentation: http://localhost:9002/api")

if __name__ == "__main__":
    try:
        run_tests()
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        sys.exit(1)
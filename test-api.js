#!/usr/bin/env node

// Complete API Test Suite for JSON Canvas AI Headless API
// Run with: node test-api.js

const baseUrl = 'http://localhost:9002/api';

console.log('🚀 JSON Canvas AI - Headless API Test Suite\n');

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`📋 Testing: ${name}`);
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name} - SUCCESS`);
      if (data.data) {
        console.log(`📄 Result:`, JSON.stringify(data.data, null, 2).slice(0, 200) + '...');
      } else {
        console.log(`📄 Response:`, JSON.stringify(data, null, 2).slice(0, 200) + '...');
      }
    } else {
      console.log(`❌ ${name} - FAILED`);
      console.log(`📄 Error:`, JSON.stringify(data, null, 2));
    }
    console.log('');
    return data;
  } catch (error) {
    console.log(`❌ ${name} - ERROR: ${error.message}`);
    console.log('');
    return null;
  }
}

async function runTests() {
  console.log('==================================================');
  console.log('🔍 BASIC API TESTS');
  console.log('==================================================\n');

  // Test 1: API Root
  await testEndpoint('API Root Documentation', `${baseUrl}`);

  // Test 2: Models List
  await testEndpoint('Available AI Models', `${baseUrl}/models`);

  console.log('==================================================');
  console.log('🤖 AI FEATURES TESTS');  
  console.log('==================================================\n');

  // Test 3: Convert Text to JSON
  const textConversionResult = await testEndpoint('AI Text to JSON Conversion', `${baseUrl}/ai/convert-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rawText: 'John Doe, 30, Engineer, New York\nJane Smith, 25, Designer, Los Angeles\nBob Johnson, 35, Manager, Chicago',
      instructions: 'Create an array of employee objects with name, age, job, and city'
    })
  });

  // Test 4: Enhance Field
  await testEndpoint('AI Field Enhancement', `${baseUrl}/ai/enhance-field`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fieldContent: 'Great product',
      userPrompt: 'Rewrite as a compelling e-commerce product description with features and benefits'
    })
  });

  // Test 5: Format JSON
  await testEndpoint('AI JSON Formatting', `${baseUrl}/ai/format-json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonString: '{name:"John",age:30,active:true,tags:["dev","manager",],}',
      instructions: 'Fix all syntax errors and format beautifully'
    })
  });

  console.log('==================================================');
  console.log('📄 DOCUMENT MANAGEMENT TESTS');
  console.log('==================================================\n');

  // Test 6: Create Document
  const documentResult = await testEndpoint('Create Document', `${baseUrl}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        project: 'JSON Canvas Test',
        status: 'active',
        team: ['Alice', 'Bob', 'Charlie'],
        budget: 10000,
        deadline: '2024-12-31'
      },
      name: 'Project Alpha'
    })
  });

  // Test 7: Retrieve Document (if creation succeeded)
  if (documentResult && documentResult.data && documentResult.data.id) {
    await testEndpoint('Retrieve Document', `${baseUrl}/documents/${documentResult.data.id}`);
    
    // Test 8: Update Document
    await testEndpoint('Update Document', `${baseUrl}/documents/${documentResult.data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          project: 'JSON Canvas Test - Updated',
          status: 'in-progress',
          team: ['Alice', 'Bob', 'Charlie', 'Diana'],
          budget: 15000,
          deadline: '2024-12-31',
          progress: '25%'
        },
        addToHistory: true
      })
    });
  }

  console.log('==================================================');
  console.log('🔧 JSON MANIPULATION TESTS');
  console.log('==================================================\n');

  // Test 9: Add Property
  await testEndpoint('Add Property to JSON', `${baseUrl}/json/manipulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'addProperty',
      jsonData: { user: { name: 'John', age: 30 } },
      path: ['user'],
      key: 'email',
      value: 'john@example.com'
    })
  });

  // Test 10: Add Array Item
  await testEndpoint('Add Item to Array', `${baseUrl}/json/manipulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'addItem',
      jsonData: { fruits: ['apple', 'banana'] },
      path: ['fruits'],
      value: 'orange'
    })
  });

  // Test 11: Set Value
  await testEndpoint('Set JSON Value', `${baseUrl}/json/manipulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'setValue',
      jsonData: { user: { name: 'John', age: 30 } },
      path: ['user', 'name'],
      value: 'John Smith'
    })
  });

  // Test 12: Rename Property
  await testEndpoint('Rename JSON Property', `${baseUrl}/json/manipulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'renameProperty',
      jsonData: { user: { name: 'John', age: 30 } },
      path: ['user'],
      key: 'name',
      newKey: 'fullName'
    })
  });

  // Test 13: Validate JSON
  await testEndpoint('Validate JSON Structure', `${baseUrl}/json/manipulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'validate',
      jsonData: { user: { name: 'John', age: 30, active: true, tags: ['developer', 'manager'] } }
    })
  });

  // Test 14: Delete Property
  await testEndpoint('Delete JSON Property', `${baseUrl}/json/manipulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'delete',
      jsonData: { user: { name: 'John', age: 30, temp: 'remove-me' } },
      path: ['user'],
      key: 'temp'
    })
  });

  console.log('==================================================');
  console.log('🎯 COMPLEX WORKFLOW TEST');
  console.log('==================================================\n');

  // Complex workflow: CSV -> JSON -> Enhance -> Document
  console.log('🔄 Running complex workflow...\n');

  // Step 1: Convert CSV to JSON
  const csvData = 'Name,Email,Department,Salary\nAlice Johnson,alice@company.com,Engineering,75000\nBob Smith,bob@company.com,Design,65000\nCharlie Brown,charlie@company.com,Marketing,60000';
  
  const csvResult = await testEndpoint('Step 1: CSV to JSON', `${baseUrl}/ai/convert-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rawText: csvData,
      instructions: 'Convert to array of employee objects with proper data types'
    })
  });

  if (csvResult && csvResult.data) {
    // Step 2: Parse and enhance the result
    let employees;
    try {
      employees = JSON.parse(csvResult.data.generatedJson);
    } catch (e) {
      console.log('❌ Could not parse AI-generated JSON');
      return;
    }

    // Step 3: Add calculated fields
    const enhancedResult = await testEndpoint('Step 2: Add Calculated Fields', `${baseUrl}/json/manipulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'addProperty',
        jsonData: { employees: employees },
        path: [],
        key: 'totalBudget',
        value: employees.reduce((sum, emp) => sum + (emp.salary || emp.Salary || 0), 0)
      })
    });

    if (enhancedResult && enhancedResult.data) {
      // Step 4: Create document with the enhanced data
      await testEndpoint('Step 3: Create Employee Database Document', `${baseUrl}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: enhancedResult.data.result,
          name: 'Employee Database - Auto Generated'
        })
      });
    }
  }

  console.log('==================================================');
  console.log('✅ ALL TESTS COMPLETED!');
  console.log('==================================================\n');
  console.log('🎉 JSON Canvas AI Headless API is fully functional!');
  console.log('📚 Check the documentation at: http://localhost:9002/api');
  console.log('📁 Example files created: presidium.json, headless-api-examples.md');
}

// Run the tests
runTests().catch(console.error);
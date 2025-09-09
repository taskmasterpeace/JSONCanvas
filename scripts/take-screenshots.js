const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

async function takeScreenshots() {
  console.log('🚀 Starting automated screenshot capture...');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Ensure screenshots directory exists
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  await fs.mkdir(screenshotsDir, { recursive: true });

  try {
    console.log('📍 Navigating to application...');
    await page.goto('http://localhost:9002', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait for app to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📸 Taking screenshot 1: Main Interface');
    await page.screenshot({
      path: path.join(screenshotsDir, 'main-interface.png'),
      fullPage: false,
      type: 'png'
    });

    // Try to create some sample data first
    console.log('🎯 Setting up sample data...');
    await page.evaluate(() => {
      // Try to add sample JSON data if there's an interface for it
      const sampleData = {
        "users": [
          {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "profile": {
              "age": 30,
              "location": "New York",
              "preferences": ["technology", "travel", "reading"]
            }
          },
          {
            "id": 2,
            "name": "Jane Smith", 
            "email": "jane@example.com",
            "profile": {
              "age": 28,
              "location": "San Francisco",
              "preferences": ["design", "photography", "cooking"]
            }
          }
        ],
        "metadata": {
          "total": 2,
          "lastUpdated": new Date().toISOString(),
          "version": "2.0"
        }
      };
      
      // Try to set sample data in localStorage if the app uses it
      if (window.localStorage) {
        const documentData = {
          id: 'sample-users',
          name: 'Sample Users Data',
          data: sampleData,
          lastModified: new Date().toISOString()
        };
        
        try {
          window.localStorage.setItem('json-canvas-documents', JSON.stringify([documentData]));
          window.localStorage.setItem('json-canvas-active-document', 'sample-users');
          // Trigger a page reload to show the data
          window.location.reload();
        } catch (e) {
          console.log('Could not set sample data:', e);
        }
      }
    });

    // Wait for page reload and data to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('📸 Taking screenshot 2: Main Interface with Data');
    await page.screenshot({
      path: path.join(screenshotsDir, 'main-interface.png'),
      fullPage: false,
      type: 'png'
    });

    // Try to trigger AI features dialog
    console.log('📸 Attempting to capture AI features...');
    try {
      // Look for Quick Import or AI-related buttons
      const aiButton = await page.$('button[aria-label*="import"], button[title*="import"], button[title*="AI"], .quick-import, [data-testid*="import"]');
      if (aiButton) {
        await aiButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.screenshot({
          path: path.join(screenshotsDir, 'ai-features.png'),
          fullPage: false,
          type: 'png'
        });
        
        // Close dialog
        await page.keyboard.press('Escape');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log('⚠️ Could not find AI features button, taking general screenshot');
        await page.screenshot({
          path: path.join(screenshotsDir, 'ai-features.png'),
          fullPage: false,
          type: 'png'
        });
      }
    } catch (e) {
      console.log('⚠️ Error capturing AI features:', e.message);
    }

    // Try to capture document management
    console.log('📸 Capturing document management...');
    try {
      // Look for document sidebar
      const sidebar = await page.$('.document-sidebar, .sidebar, [data-testid*="sidebar"], nav');
      if (sidebar) {
        await sidebar.hover();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      await page.screenshot({
        path: path.join(screenshotsDir, 'document-management.png'),
        fullPage: false,
        type: 'png'
      });
    } catch (e) {
      console.log('⚠️ Error capturing document management:', e.message);
    }

    // Try to capture schema validation if available
    console.log('📸 Capturing schema validation...');
    try {
      // Look for validation or schema buttons
      const schemaButton = await page.$('button[title*="schema"], button[title*="valid"], .schema, .validation');
      if (schemaButton) {
        await schemaButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.screenshot({
          path: path.join(screenshotsDir, 'schema-validation.png'),
          fullPage: false,
          type: 'png'
        });
      } else {
        // Take a general screenshot showing any validation features
        await page.screenshot({
          path: path.join(screenshotsDir, 'schema-validation.png'),
          fullPage: false,
          type: 'png'
        });
      }
    } catch (e) {
      console.log('⚠️ Error capturing schema validation:', e.message);
    }

    // Try to capture quick import
    console.log('📸 Capturing quick import workflow...');
    try {
      const importButton = await page.$('button[title*="import"], .import-button, [data-testid*="import"]');
      if (importButton) {
        await importButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to add some sample text
        const textarea = await page.$('textarea, input[type="text"]');
        if (textarea) {
          await textarea.type('Name: John Doe\nAge: 30\nEmail: john@example.com\nSkills: JavaScript, React, Node.js');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        await page.screenshot({
          path: path.join(screenshotsDir, 'quick-import.png'),
          fullPage: false,
          type: 'png'
        });
      } else {
        await page.screenshot({
          path: path.join(screenshotsDir, 'quick-import.png'),
          fullPage: false,
          type: 'png'
        });
      }
    } catch (e) {
      console.log('⚠️ Error capturing quick import:', e.message);
    }

    console.log('✅ Screenshot capture completed successfully!');
    console.log('📁 Screenshots saved to:', screenshotsDir);
    
    // List the screenshots taken
    const files = await fs.readdir(screenshotsDir);
    console.log('📸 Screenshots captured:');
    files.filter(f => f.endsWith('.png')).forEach(file => {
      console.log(`   ✓ ${file}`);
    });

  } catch (error) {
    console.error('❌ Error during screenshot capture:', error);
  } finally {
    await browser.close();
  }
}

// Run the screenshot capture
if (require.main === module) {
  takeScreenshots().catch(console.error);
}

module.exports = { takeScreenshots };
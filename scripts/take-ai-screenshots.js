const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

async function takeAIScreenshots() {
  console.log('🤖 Starting AI-powered screenshot capture...');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser to see what's happening
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

    // Set up API key and sample data that will show AI in action
    console.log('🎯 Setting up AI-ready environment...');
    await page.evaluate(() => {
      // Set the real API key
      if (window.localStorage) {
        window.localStorage.setItem('google-ai-api-key', 'AIzaSyBVBblRduschpPUrKs6-vJrYq7r86PU0po');
        
        // Create basic JSON data that we'll enhance with AI
        const basicData = {
          "product": {
            "name": "Laptop",
            "price": 1000,
            "description": "A computer"
          },
          "user": {
            "name": "John",
            "email": "john@email.com"
          }
        };

        const documents = [{
          id: 'basic-product',
          name: '💻 Basic Product Data (Ready for AI Enhancement)',
          data: basicData,
          lastModified: new Date().toISOString()
        }];
        
        window.localStorage.setItem('json-canvas-documents', JSON.stringify(documents));
        window.localStorage.setItem('json-canvas-active-document', 'basic-product');
        
        // Reload to show the basic data
        window.location.reload();
      }
    });

    // Wait for page reload
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('📸 Screenshot 1: Main interface with basic data ready for enhancement');
    await page.screenshot({
      path: path.join(screenshotsDir, 'main-interface.png'),
      fullPage: false,
      type: 'png'
    });

    // Now let's try to trigger AI features
    console.log('🤖 Attempting to trigger AI enhancement features...');

    // Try to right-click on a JSON element to show AI context menu
    try {
      // Look for JSON elements to right-click
      const jsonElement = await page.$('.json-tree-node, .json-node, [data-testid*="json"], .tree-node, .json-value');
      if (jsonElement) {
        console.log('🎯 Found JSON element, right-clicking to show AI menu...');
        await jsonElement.click({ button: 'right' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.screenshot({
          path: path.join(screenshotsDir, 'ai-context-menu.png'),
          fullPage: false,
          type: 'png'
        });
      }
    } catch (e) {
      console.log('⚠️ Could not trigger right-click menu:', e.message);
    }

    // Try to find and click Quick Import button
    console.log('📋 Looking for Quick Import feature...');
    try {
      const importSelectors = [
        'button[title*="import"]',
        'button[aria-label*="import"]',
        '.quick-import',
        '[data-testid*="import"]',
        'button:contains("Import")',
        'button[title*="Quick"]',
        '.import-button'
      ];

      let importButton = null;
      for (const selector of importSelectors) {
        try {
          importButton = await page.$(selector);
          if (importButton) {
            console.log(`✅ Found import button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (importButton) {
        await importButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Try to add some text to convert
        const textInput = await page.$('textarea, input[type="text"], .text-input');
        if (textInput) {
          console.log('📝 Adding text for AI conversion...');
          const sampleText = `Product Name: Gaming Laptop Pro
Price: $2499.99
Features: RGB keyboard, 32GB RAM, RTX 4090, 144Hz display
Brand: TechnoCore
Category: Gaming Computers
Reviews: 4.8/5 stars
Availability: In Stock
Warranty: 3 years comprehensive`;

          await textInput.type(sampleText, { delay: 50 });
          await new Promise(resolve => setTimeout(resolve, 2000));

          console.log('📸 Screenshot: Quick Import with AI conversion in progress');
          await page.screenshot({
            path: path.join(screenshotsDir, 'quick-import.png'),
            fullPage: false,
            type: 'png'
          });

          // Try to click Convert or Process button
          const convertButton = await page.$('button:contains("Convert"), button:contains("Process"), button:contains("Generate"), .convert-button');
          if (convertButton) {
            console.log('🤖 Triggering AI conversion...');
            await convertButton.click();
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for AI processing

            await page.screenshot({
              path: path.join(screenshotsDir, 'ai-processing.png'),
              fullPage: false,
              type: 'png'
            });
          }
        }
      } else {
        console.log('⚠️ Could not find Quick Import button, trying alternative approach');
        
        // Take screenshot of current state anyway
        await page.screenshot({
          path: path.join(screenshotsDir, 'quick-import.png'),
          fullPage: false,
          type: 'png'
        });
      }
    } catch (e) {
      console.log('⚠️ Error with Quick Import:', e.message);
    }

    // Try to find AI enhancement features
    console.log('✨ Looking for AI enhancement features...');
    try {
      const aiSelectors = [
        'button[title*="AI"]',
        'button[title*="enhance"]',
        'button[title*="improve"]',
        '.ai-button',
        '.enhance-button',
        '[data-testid*="ai"]',
        'button:contains("Enhance")',
        'button:contains("AI")'
      ];

      let aiButton = null;
      for (const selector of aiSelectors) {
        try {
          aiButton = await page.$(selector);
          if (aiButton) {
            console.log(`✅ Found AI button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (aiButton) {
        await aiButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('📸 Screenshot: AI Enhancement Dialog');
        await page.screenshot({
          path: path.join(screenshotsDir, 'ai-features.png'),
          fullPage: false,
          type: 'png'
        });
      } else {
        // Try to use keyboard shortcut or find any dialog
        await page.keyboard.press('Escape'); // Close any open dialogs
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await page.screenshot({
          path: path.join(screenshotsDir, 'ai-features.png'),
          fullPage: false,
          type: 'png'
        });
      }
    } catch (e) {
      console.log('⚠️ Error with AI features:', e.message);
    }

    // Capture document management
    console.log('📁 Capturing document management...');
    try {
      // Make sure sidebar is visible
      const sidebar = await page.$('.document-sidebar, .sidebar, nav, .document-list');
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

    // Try to show schema validation
    console.log('🔍 Looking for schema validation features...');
    try {
      const schemaSelectors = [
        'button[title*="schema"]',
        'button[title*="valid"]',
        '.schema-button',
        '.validation',
        '[data-testid*="schema"]'
      ];

      let schemaButton = null;
      for (const selector of schemaSelectors) {
        try {
          schemaButton = await page.$(selector);
          if (schemaButton) break;
        } catch (e) {
          continue;
        }
      }

      if (schemaButton) {
        await schemaButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      await page.screenshot({
        path: path.join(screenshotsDir, 'schema-validation.png'),
        fullPage: false,
        type: 'png'
      });
    } catch (e) {
      console.log('⚠️ Error with schema validation:', e.message);
    }

    console.log('✅ AI-powered screenshot capture completed!');
    console.log('📁 Screenshots saved to:', screenshotsDir);
    
    // List the screenshots taken
    const files = await fs.readdir(screenshotsDir);
    console.log('📸 AI Screenshots captured:');
    files.filter(f => f.endsWith('.png')).forEach(file => {
      console.log(`   ✓ ${file}`);
    });

  } catch (error) {
    console.error('❌ Error during AI screenshot capture:', error);
  } finally {
    await browser.close();
  }
}

// Run the AI screenshot capture
if (require.main === module) {
  takeAIScreenshots().catch(console.error);
}

module.exports = { takeAIScreenshots };
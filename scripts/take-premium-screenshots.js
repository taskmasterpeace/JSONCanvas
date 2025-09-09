const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

async function takePremiumScreenshots() {
  console.log('💎 Starting PREMIUM high-quality screenshot capture...');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser
    defaultViewport: {
      width: 2560,  // Higher resolution
      height: 1440
    },
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--force-device-scale-factor=2'  // Higher DPI for crisp images
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 2560, height: 1440, deviceScaleFactor: 2 });
  
  // Ensure screenshots directory exists
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  await fs.mkdir(screenshotsDir, { recursive: true });

  try {
    console.log('📍 Navigating to application...');
    await page.goto('http://localhost:9002', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    await new Promise(resolve => setTimeout(resolve, 4000));

    // Set up premium data showcase
    console.log('🎯 Setting up PREMIUM data showcase...');
    await page.evaluate(() => {
      if (window.localStorage) {
        window.localStorage.setItem('google-ai-api-key', 'AIzaSyBVBblRduschpPUrKs6-vJrYq7r86PU0po');
        
        // Create multiple impressive documents
        const documents = [
          {
            id: 'enterprise-saas',
            name: '🏢 Enterprise SaaS Platform Analytics',
            data: {
              "platform_metrics": {
                "monthly_recurring_revenue": 4567890.00,
                "annual_run_rate": 54814680.00,
                "customer_acquisition_cost": 1247.50,
                "lifetime_value": 18950.00,
                "churn_rate": 0.023,
                "net_promoter_score": 67
              },
              "feature_usage": {
                "dashboard_views": 156780,
                "api_calls_daily": 2456789,
                "active_integrations": 847,
                "custom_workflows": 1205
              },
              "customer_segments": [
                {
                  "segment": "Enterprise",
                  "customers": 156,
                  "avg_deal_size": 89500.00,
                  "retention_rate": 0.97
                },
                {
                  "segment": "Mid-Market", 
                  "customers": 892,
                  "avg_deal_size": 23400.00,
                  "retention_rate": 0.89
                }
              ],
              "infrastructure": {
                "servers": 247,
                "uptime": 99.97,
                "response_time_p99": "89ms",
                "data_processed_daily": "47.2TB"
              }
            },
            lastModified: new Date().toISOString()
          },
          {
            id: 'ai-research-lab',
            name: '🧠 AI Research Lab - Model Performance Data',
            data: {
              "model_benchmarks": {
                "gpt4_comparison": {
                  "accuracy": 0.847,
                  "processing_speed": "2.3x faster",
                  "cost_efficiency": "67% reduction",
                  "hallucination_rate": 0.008
                },
                "training_metrics": {
                  "epochs_completed": 847,
                  "loss_function": 0.00234,
                  "validation_accuracy": 0.923,
                  "compute_hours": 156789
                }
              },
              "research_projects": [
                {
                  "name": "Neural Architecture Search",
                  "status": "production",
                  "team_size": 12,
                  "budget": 2400000,
                  "publications": 7
                },
                {
                  "name": "Quantum ML Integration",
                  "status": "research",
                  "team_size": 8,
                  "budget": 1800000,
                  "publications": 3
                }
              ],
              "hardware_cluster": {
                "gpu_nodes": 156,
                "total_vram": "4.7TB",
                "peak_performance": "847 petaFLOPS",
                "energy_consumption": "2.4MW"
              }
            },
            lastModified: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'financial-dashboard',
            name: '💰 Real-Time Financial Dashboard',
            data: {
              "portfolio_performance": {
                "total_assets": 156780000.00,
                "ytd_return": 0.247,
                "sharpe_ratio": 1.89,
                "max_drawdown": 0.087,
                "volatility": 0.156
              },
              "trading_activity": {
                "daily_volume": 45670000.00,
                "transactions_count": 15678,
                "avg_trade_size": 2890.00,
                "success_rate": 0.734
              },
              "risk_metrics": {
                "var_95": 234000.00,
                "beta": 1.23,
                "correlation_sp500": 0.67,
                "leverage_ratio": 2.1
              }
            },
            lastModified: new Date(Date.now() - 7200000).toISOString()
          }
        ];
        
        window.localStorage.setItem('json-canvas-documents', JSON.stringify(documents));
        window.localStorage.setItem('json-canvas-active-document', 'enterprise-saas');
        window.location.reload();
      }
    });

    await new Promise(resolve => setTimeout(resolve, 6000));

    // Screenshot 1: Main Interface - Full view with rich data
    console.log('📸 Premium Screenshot 1: Main Interface Full View');
    await page.screenshot({
      path: path.join(screenshotsDir, 'main-interface.png'),
      fullPage: false,
      type: 'png',
    });

    // Screenshot 2: Zoomed JSON Tree View
    console.log('📸 Premium Screenshot 2: Detailed JSON Tree View');
    try {
      // Find and zoom in on the JSON tree area
      const jsonTree = await page.$('.json-tree, .tree-container, .json-editor, main');
      if (jsonTree) {
        const boundingBox = await jsonTree.boundingBox();
        if (boundingBox) {
          await page.screenshot({
            path: path.join(screenshotsDir, 'json-tree-detail.png'),
            type: 'png',
            quality: 100,
            clip: {
              x: boundingBox.x,
              y: boundingBox.y,
              width: Math.min(boundingBox.width, 1600),
              height: Math.min(boundingBox.height, 1000)
            }
          });
        }
      }
    } catch (e) {
      console.log('⚠️ Could not capture detailed JSON tree, using full view');
    }

    // Screenshot 3: Document Management Sidebar Focus
    console.log('📸 Premium Screenshot 3: Document Management Focus');
    try {
      const sidebar = await page.$('.document-sidebar, .sidebar, nav');
      if (sidebar) {
        await sidebar.hover();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const boundingBox = await sidebar.boundingBox();
        if (boundingBox) {
          // Capture sidebar + some main content
          await page.screenshot({
            path: path.join(screenshotsDir, 'document-management.png'),
            type: 'png', 
            quality: 100,
            clip: {
              x: boundingBox.x - 50,
              y: boundingBox.y - 50,
              width: Math.min(boundingBox.width + 800, 1400),
              height: Math.min(boundingBox.height + 100, 1000)
            }
          });
        }
      } else {
        await page.screenshot({
          path: path.join(screenshotsDir, 'document-management.png'),
          fullPage: false,
          type: 'png',
            });
      }
    } catch (e) {
      console.log('⚠️ Error with document management focus');
    }

    // Screenshot 4: AI Quick Import in Action
    console.log('📸 Premium Screenshot 4: AI Quick Import Interactive');
    try {
      // Find and click Quick Import
      const importButton = await page.$('button[aria-label*="import"], button[title*="import"]');
      if (importButton) {
        await importButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Add premium financial data for conversion
        const textInputs = await page.$$('textarea, input[type="text"], .text-area');
        if (textInputs.length > 0) {
          const premiumData = `Company: Machine King Labs
Valuation: $2.5B (Series D)
Revenue: $156M ARR
Growth: 340% YoY
Employees: 1,247 globally
Founded: 2019 by AI Research Team
Headquarters: San Francisco & Tokyo
Key Product: Neural Processing Architecture
Market Cap: $15.6B (projected IPO)
Customers: Google, Tesla, OpenAI, Microsoft
Recent Funding: $250M led by a16z
Burn Rate: $8M/month
Runway: 31 months
Key Metrics: 97% retention, 67 NPS
AI Patents: 156 filed, 89 granted`;

          await textInputs[0].focus();
          await textInputs[0].type(premiumData, { delay: 20 });
          await new Promise(resolve => setTimeout(resolve, 2000));

          await page.screenshot({
            path: path.join(screenshotsDir, 'quick-import.png'),
            fullPage: false,
            type: 'png',
                });

          // Try to trigger conversion
          const buttons = await page.$$('button');
          for (const button of buttons) {
            try {
              const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
              if (text.includes('convert') || text.includes('generate') || text.includes('process')) {
                await button.click();
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                await page.screenshot({
                  path: path.join(screenshotsDir, 'ai-conversion-result.png'),
                  fullPage: false,
                  type: 'png',
                            });
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
    } catch (e) {
      console.log('⚠️ Error with AI Quick Import:', e.message);
    }

    // Screenshot 5: AI Enhancement Context Menu
    console.log('📸 Premium Screenshot 5: AI Enhancement Features');
    try {
      await page.keyboard.press('Escape'); // Close any dialogs
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Right-click on a JSON value to show AI context menu
      const jsonValues = await page.$$('.json-value, .tree-node, .json-node, [data-key]');
      if (jsonValues.length > 0) {
        await jsonValues[2].click({ button: 'right' }); // Right-click third element
        await new Promise(resolve => setTimeout(resolve, 2000));

        await page.screenshot({
          path: path.join(screenshotsDir, 'ai-features.png'),
          fullPage: false,
          type: 'png',
            });
      }
    } catch (e) {
      console.log('⚠️ Error with AI enhancement menu');
      await page.screenshot({
        path: path.join(screenshotsDir, 'ai-features.png'),
        fullPage: false,
        type: 'png',
        });
    }

    // Screenshot 6: Schema Validation (if available)
    console.log('📸 Premium Screenshot 6: Schema Validation');
    await page.screenshot({
      path: path.join(screenshotsDir, 'schema-validation.png'),
      fullPage: false,
      type: 'png',
    });

    console.log('💎 PREMIUM screenshot capture completed!');
    
    const files = await fs.readdir(screenshotsDir);
    console.log('🔥 PREMIUM Screenshots captured:');
    files.filter(f => f.endsWith('.png')).forEach(file => {
      console.log(`   ✓ ${file}`);
    });

  } catch (error) {
    console.error('❌ Error during PREMIUM screenshot capture:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  takePremiumScreenshots().catch(console.error);
}

module.exports = { takePremiumScreenshots };
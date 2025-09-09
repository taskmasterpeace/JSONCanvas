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
    console.log('🎯 Setting up gorgeous sample data...');
    await page.evaluate(() => {
      // Create comprehensive, realistic JSON data that looks professional
      const sampleData = {
        "e_commerce_platform": {
          "store_info": {
            "name": "TechnoMart Pro",
            "established": "2019-03-15",
            "domain": "technomart-pro.com",
            "headquarters": {
              "address": "123 Innovation Drive, Suite 400",
              "city": "San Francisco",
              "state": "CA",
              "zipcode": "94105",
              "country": "United States",
              "coordinates": {
                "latitude": 37.7749,
                "longitude": -122.4194
              }
            },
            "contact": {
              "phone": "+1-555-TECH-PRO",
              "email": "hello@technomart-pro.com",
              "support": "support@technomart-pro.com"
            },
            "social_media": {
              "twitter": "@TechnoMartPro",
              "linkedin": "/company/technomart-pro",
              "instagram": "@technomartpro_official"
            }
          },
          "products": [
            {
              "id": "TMP-001",
              "name": "UltraBook Pro X1",
              "category": "Laptops",
              "brand": "TechnoCore",
              "model": "X1-2024",
              "specifications": {
                "processor": "Intel Core i9-13900H",
                "memory": "32GB DDR5",
                "storage": "2TB NVMe SSD",
                "display": "15.6\" 4K OLED TouchScreen",
                "graphics": "NVIDIA RTX 4080 8GB",
                "battery": "99Wh Li-Polymer",
                "weight": "1.8kg",
                "dimensions": {
                  "width": "356mm",
                  "depth": "243mm", 
                  "height": "17.9mm"
                }
              },
              "pricing": {
                "msrp": 3499.99,
                "current_price": 2999.99,
                "discount_percentage": 14.3,
                "currency": "USD",
                "payment_options": ["credit_card", "paypal", "financing"]
              },
              "inventory": {
                "stock_quantity": 47,
                "warehouse_locations": ["CA-SF", "TX-DAL", "NY-NYC"],
                "reorder_level": 15,
                "supplier": "TechnoCore Manufacturing"
              },
              "reviews": {
                "average_rating": 4.8,
                "total_reviews": 1247,
                "rating_breakdown": {
                  "5_star": 1038,
                  "4_star": 156,
                  "3_star": 31,
                  "2_star": 15,
                  "1_star": 7
                }
              },
              "features": [
                "Thunderbolt 4 ports",
                "Wi-Fi 6E",
                "Biometric fingerprint reader",
                "Backlit RGB keyboard",
                "Advanced cooling system",
                "Military-grade durability"
              ],
              "warranty": {
                "duration": "3 years",
                "type": "comprehensive",
                "extended_options": true
              }
            },
            {
              "id": "TMP-002", 
              "name": "SmartWatch Elite Series 5",
              "category": "Wearables",
              "brand": "ConnectTech",
              "model": "Elite-S5-2024",
              "specifications": {
                "display": "1.9\" Always-On AMOLED",
                "resolution": "484 x 396 pixels",
                "processor": "Dual-core ARM Cortex-A78",
                "memory": "4GB RAM",
                "storage": "64GB internal",
                "battery_life": "7 days typical usage",
                "water_resistance": "50 ATM",
                "connectivity": ["5G", "WiFi 6", "Bluetooth 5.3", "NFC"],
                "sensors": [
                  "Heart rate monitor",
                  "Blood oxygen sensor",
                  "GPS + GLONASS",
                  "Accelerometer",
                  "Gyroscope", 
                  "Ambient light sensor",
                  "Temperature sensor"
                ]
              },
              "pricing": {
                "msrp": 599.99,
                "current_price": 549.99,
                "discount_percentage": 8.3,
                "currency": "USD"
              },
              "inventory": {
                "stock_quantity": 156,
                "variants": [
                  {"color": "Space Black", "band": "Sport", "stock": 67},
                  {"color": "Silver", "band": "Milanese Loop", "stock": 45},
                  {"color": "Gold", "band": "Leather", "stock": 44}
                ]
              },
              "health_features": {
                "fitness_tracking": [
                  "Step counting",
                  "Calorie tracking", 
                  "Sleep monitoring",
                  "Workout detection",
                  "Heart rate zones"
                ],
                "health_monitoring": [
                  "ECG readings",
                  "Blood oxygen levels",
                  "Stress monitoring",
                  "Menstrual cycle tracking"
                ]
              }
            }
          ],
          "customers": [
            {
              "id": "CUST-789123",
              "profile": {
                "first_name": "Alexandra",
                "last_name": "Chen",
                "email": "alexandra.chen@email.com",
                "phone": "+1-555-0199",
                "date_of_birth": "1988-07-22",
                "gender": "female",
                "occupation": "Software Architect"
              },
              "address": {
                "type": "billing",
                "street": "456 Tech Valley Road",
                "apt": "Unit 12B",
                "city": "Palo Alto",
                "state": "CA",
                "zipcode": "94301",
                "country": "United States"
              },
              "purchase_history": {
                "total_orders": 12,
                "total_spent": 15847.34,
                "average_order_value": 1320.61,
                "first_purchase": "2021-09-15",
                "last_purchase": "2024-08-12",
                "favorite_categories": ["Laptops", "Accessories", "Gaming"]
              },
              "preferences": {
                "communication": ["email", "sms"],
                "newsletter_subscribed": true,
                "marketing_consent": true,
                "preferred_payment": "credit_card",
                "loyalty_tier": "Gold"
              }
            }
          ],
          "analytics": {
            "sales_metrics": {
              "daily_revenue": 89456.78,
              "monthly_target": 2500000,
              "current_month_progress": 67.8,
              "top_performing_category": "Laptops",
              "conversion_rate": 3.2,
              "average_cart_value": 892.15
            },
            "traffic_data": {
              "unique_visitors_today": 15847,
              "page_views": 67234,
              "bounce_rate": 28.5,
              "session_duration_avg": "4m 32s",
              "mobile_traffic_percentage": 64.2
            },
            "inventory_alerts": [
              {
                "product_id": "TMP-003",
                "product_name": "Gaming Mouse Pro",
                "current_stock": 8,
                "reorder_threshold": 25,
                "status": "critical_low",
                "supplier_eta": "2024-09-15"
              }
            ]
          },
          "configuration": {
            "api_settings": {
              "version": "v2.1",
              "rate_limit": 1000,
              "authentication": "OAuth 2.0",
              "endpoints": {
                "products": "/api/v2/products",
                "customers": "/api/v2/customers",
                "orders": "/api/v2/orders",
                "analytics": "/api/v2/analytics"
              }
            },
            "feature_flags": {
              "ai_recommendations": true,
              "real_time_inventory": true,
              "advanced_analytics": true,
              "multi_currency": false,
              "social_login": true
            },
            "integrations": {
              "payment_gateways": ["Stripe", "PayPal", "Square"],
              "shipping_carriers": ["FedEx", "UPS", "DHL"],
              "analytics_tools": ["Google Analytics", "Mixpanel"],
              "marketing_automation": ["Mailchimp", "HubSpot"]
            }
          }
        }
      };
      
      // Create multiple realistic documents
      const documents = [
        {
          id: 'ecommerce-platform',
          name: '🛒 E-commerce Platform Data',
          data: sampleData,
          lastModified: new Date().toISOString()
        },
        {
          id: 'user-profiles',
          name: '👥 User Profiles & Analytics',
          data: {
            "active_users": 15847,
            "user_demographics": {
              "age_groups": {
                "18-24": {"count": 3254, "percentage": 20.5},
                "25-34": {"count": 5892, "percentage": 37.2},
                "35-44": {"count": 4156, "percentage": 26.2},
                "45-54": {"count": 1876, "percentage": 11.8},
                "55+": {"count": 669, "percentage": 4.3}
              },
              "geographic_distribution": {
                "north_america": {"users": 8923, "percentage": 56.3},
                "europe": {"users": 4231, "percentage": 26.7},
                "asia_pacific": {"users": 2156, "percentage": 13.6},
                "others": {"users": 537, "percentage": 3.4}
              }
            }
          },
          lastModified: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'api-config',
          name: '⚙️ API Configuration',
          data: {
            "api_endpoints": {
              "authentication": {
                "login": "/auth/login",
                "refresh": "/auth/refresh",
                "logout": "/auth/logout"
              },
              "user_management": {
                "create_user": "/users",
                "get_user": "/users/{id}",
                "update_user": "/users/{id}",
                "delete_user": "/users/{id}"
              }
            },
            "rate_limiting": {
              "requests_per_minute": 100,
              "burst_limit": 200,
              "premium_tier_multiplier": 5
            }
          },
          lastModified: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      
      // Try to set sample data in localStorage if the app uses it
      if (window.localStorage) {
        try {
          window.localStorage.setItem('json-canvas-documents', JSON.stringify(documents));
          window.localStorage.setItem('json-canvas-active-document', 'ecommerce-platform');
          
          // Set the real API key to enable AI features
          window.localStorage.setItem('google-ai-api-key', 'AIzaSyBVBblRduschpPUrKs6-vJrYq7r86PU0po');
          
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
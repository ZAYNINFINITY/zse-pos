#!/usr/bin/env node

/**
 * ZSE POS - Branding Customization Script
 * Automatically customizes the POS system for different shops
 * 
 * Usage: node customize-branding.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(colors.green, `✅ ${message}`);
}

function logError(message) {
  log(colors.red, `❌ ${message}`);
}

function logInfo(message) {
  log(colors.cyan, `ℹ️  ${message}`);
}

function logStep(number, message) {
  log(colors.blue, `\n[${number}] ${message}`);
}

// Main function
async function customizeBranding() {
  console.log('\n' + colors.cyan + '═══════════════════════════════════════' + colors.reset);
  console.log(colors.cyan + '  ZSE POS - Branding Customization Tool' + colors.reset);
  console.log(colors.cyan + '═══════════════════════════════════════' + colors.reset + '\n');

  try {
    // Step 1: Check if branding.config.json exists
    logStep(1, 'Checking branding configuration...');
    
    const brandingPath = path.join(__dirname, 'branding.config.json');
    
    if (!fs.existsSync(brandingPath)) {
      logError('branding.config.json not found!');
      log(colors.yellow, '\nCreate a file named "branding.config.json" with this content:\n');
      
      const exampleConfig = {
        appName: "YOUR_SHOP_NAME POS System",
        appId: "com.yourshop.pos",
        author: "Your Shop Name",
        description: "Point of Sale System for YOUR_SHOP_NAME",
        appSlug: "your-shop-pos",
        companyName: "Your Shop Name"
      };
      
      console.log(JSON.stringify(exampleConfig, null, 2));
      log(colors.yellow, '\nThen run this script again.\n');
      process.exit(1);
    }

    const branding = JSON.parse(fs.readFileSync(brandingPath, 'utf8'));
    logSuccess('branding.config.json loaded');
    
    logInfo(`App Name: ${branding.appName}`);
    logInfo(`App ID: ${branding.appId}`);
    logInfo(`Author: ${branding.author}`);

    // Step 2: Update package.json
    logStep(2, 'Updating package.json');
    
    const packagePath = path.join(__dirname, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const oldName = pkg.name;
    const oldAppId = pkg.build.appId;
    const oldProductName = pkg.build.productName;
    
    pkg.name = branding.appSlug || branding.appName.toLowerCase().replace(/[^a-z0-9\-]/g, '-');
    pkg.version = branding.version || '1.0.0';
    pkg.description = branding.description;
    pkg.author = branding.author;
    pkg.build.appId = branding.appId;
    pkg.build.productName = branding.appName;
    
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
    
    logSuccess('package.json updated');
    logInfo(`  name: "${oldName}" → "${pkg.name}"`);
    logInfo(`  appId: "${oldAppId}" → "${branding.appId}"`);
    logInfo(`  productName: "${oldProductName}" → "${branding.appName}"`);

    // Step 3: Update main.js
    logStep(3, 'Updating main.js');
    
    const mainJsPath = path.join(__dirname, 'main.js');
    let mainJs = fs.readFileSync(mainJsPath, 'utf8');
    
    // Update window title
    mainJs = mainJs.replace(
      /mainWindow\.setTitle\(['"`].*?['"`]\)/g,
      `mainWindow.setTitle('${branding.appName}')`
    );
    
    // Update about menu
    mainJs = mainJs.replace(
      /label:\s*['"`]About.*?['"`]/g,
      `label: 'About ${branding.appName}'`
    );
    
    fs.writeFileSync(mainJsPath, mainJs);
    logSuccess('main.js updated (window title & menu)');

    // Step 4: Update index.html
    logStep(4, 'Updating index.html');
    
    const indexPath = path.join(__dirname, 'index.html');
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    
    indexHtml = indexHtml.replace(
      /<title>.*?<\/title>/i,
      `<title>${branding.appName}</title>`
    );
    
    fs.writeFileSync(indexPath, indexHtml);
    logSuccess('index.html updated (browser title)');

    // Step 5: Create branding.json for React app
    logStep(5, 'Creating app branding configuration');
    
    const appConfigDir = path.join(__dirname, 'src');
    if (!fs.existsSync(appConfigDir)) {
      fs.mkdirSync(appConfigDir, { recursive: true });
    }
    
    const brandingJsonPath = path.join(appConfigDir, 'branding.json');
    const brandingAppConfig = {
      appName: branding.appName,
      companyName: branding.companyName || branding.author,
      appSlug: branding.appSlug,
      theme: branding.theme || { 
        primaryColor: '#0066cc',
        companyDisplayName: branding.companyName || branding.author
      }
    };
    
    fs.writeFileSync(brandingJsonPath, JSON.stringify(brandingAppConfig, null, 2));
    logSuccess('src/branding.json created');

    // Step 6: Summary
    logStep(6, 'Customization Summary');
    
    console.log('\n' + colors.green + '✅ CUSTOMIZATION COMPLETE!' + colors.reset);
    console.log('\nYour POS system is now branded as:');
    log(colors.cyan, `  📦 ${branding.appName}`);
    log(colors.cyan, `  🏢 ${branding.author}`);
    log(colors.cyan, `  📱 ${branding.appId}`);
    
    console.log('\n' + colors.yellow + '📝 Next Steps:' + colors.reset);
    console.log('  1. npm install');
    console.log('  2. npm run dev:electron        (test your customization)');
    console.log('  3. npm run build-win           (64-bit installer)');
    console.log('  4. npm run build-win32         (32-bit installer)');
    
    console.log('\n' + colors.green + 'Your installers will be in: dist-app/' + colors.reset);
    console.log(colors.green + `  • ${branding.appName} Setup 1.0.0.exe (64-bit)` + colors.reset);
    console.log(colors.green + `  • ${branding.appName} Setup 1.0.0-ia32.exe (32-bit)` + colors.reset);
    
    console.log('\n' + colors.cyan + '═══════════════════════════════════════' + colors.reset);
    console.log(colors.cyan + '   Ready to distribute your branded POS!' + colors.reset);
    console.log(colors.cyan + '═══════════════════════════════════════' + colors.reset + '\n');

  } catch (error) {
    logError(`An error occurred: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the customization
customizeBranding().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});

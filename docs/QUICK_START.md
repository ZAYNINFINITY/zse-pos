# ZSE POS System - Quick Start Guide

## ⚡ 5-Minute Setup

### For Customers (Just Want to Use It)

#### Step 1: Download

- Download `ZSE-POS-System-1.0.0.exe` from your provider
- Or use `ZSE-POS-System-1.0.0-ia32.exe` if on older Windows

#### Step 2: Install

1. Double-click the downloaded `.exe` file
2. Click "Next" → "Install" → "Finish"
3. App appears on Desktop and Start Menu

#### Step 3: Run

- Double-click desktop shortcut, OR
- Search for "ZSE POS" in Windows Start Menu

#### Step 4: First Launch

- App auto-creates database (takes 10-30 seconds first time)
- Complete the Setup Wizard (creates your first admin account)

✅ **Done!** Your POS system is ready to use.

---

### For Developers (Want to Build It Yourself)

#### Prerequisites Setup (One-time Only)

1. **Install Node.js**:
   - Go to https://nodejs.org/
   - Download the LTS version
   - Run installer, click "Next" through all steps
   - Restart your computer

2. **Verify Installation**:
   - Open PowerShell (right-click Start Menu → PowerShell)
   - Type: `node --version` (should show a version number)
   - Type: `npm --version` (should show a version number)

#### Build Steps

```powershell
# Step 1: Navigate to project
cd "d:\WORK - ARCHIVE\IMPORTANT CODING DATA AND PROJECTS\PROJECTS\zse-pos"

# Step 2: Run automatic build script (EASIEST)
.\build-installers.bat
# OR
.\build-installers.ps1

# DONE! Your installers are in the 'dist-app' folder
```

**That's it!** The script does everything automatically (includes Vite bundling).

#### Alternative: Manual Build (If Script Fails)

```powershell
# Step 1: Install packages
npm install

# Step 2: Rebuild Electron
npx electron-rebuild

# Step 3: Create 64-bit installer
npm run build-win

# Step 4: Create 32-bit installer (optional)
npm run build-win32

# Find your installers in: dist-app/
```

Note: Vite bundling is now automatic as part of npm run build-win/build-win32 (no separate npm run build step needed).

---

## 🎯 Choose Your Installer

### For Most Users: **64-bit Version**

```
ZSE-POS-System-1.0.0.exe
```

- Works on: Windows 10, Windows 11, Modern Windows 8.1
- Size: ~180 MB
- Performance: Best

### For Older Computers: **32-bit Version**

```
ZSE-POS-System-1.0.0-ia32.exe
```

- Works on: Windows 7, Windows 8, Older hardware
- Size: ~160 MB (slightly smaller)
- Performance: Still great on low-end machines

### For USB/No Installation: **Portable Versions**

```
ZSE-POS-System 1.0.0.exe        (64-bit portable)
ZSE-POS-System 1.0.0-ia32.exe   (32-bit portable)
```

- No installation needed
- Copy to USB and run anywhere
- Perfect for testing

---

## 📊 Features & Compatibility

### Works Best On

- ✅ Windows 7 SP1 and newer
- ✅ Windows 8 / 8.1
- ✅ Windows 10 (all versions)
- ✅ Windows 11
- ✅ Even with only 512 MB RAM (though 1 GB recommended)

### What You Get

- 📱 Full POS system with products, sales, customers
- 💰 Discount codes and multiple payment methods
- 📊 Reports and analytics (best sellers, profit/loss)
- 🤖 AI-powered product recommendations
- 💾 Automatic daily database backups
- 📄 PDF receipt generation
- 🔒 Secure local database (no internet needed)

---

## 🆘 Common Issues & Fixes

### "Windows Defender blocked the file"

- Right-click installer → Properties → Click "Unblock"
- Or disable Defender temporarily during install

### "Microsoft Visual C++ error"

- Download: https://support.microsoft.com/en-us/help/2977003/
- Install it, then retry

### "App won't start"

- Try 32-bit version instead
- Right-click → "Run as Administrator"

### "Database locked / errors"

- Restart the app completely
- Check Windows Task Manager (make sure no other instance running)

### "Very slow on old computer"

- Use 32-bit version (`-ia32`)
- Close other programs
- Be patient on first startup (30-60 seconds normal)

---

## 💾 Your Data

### Where is My Data Stored?

```
C:\Users\[YourUsername]\AppData\Roaming\zse-pos\
```

- Database file: `zse-pos.db`
- Backups: `backups/` folder (daily automatic)

### Backup Your Data

```
# Copy to external drive:
C:\Users\[YourUsername]\AppData\Roaming\zse-pos\
```

### Uninstall

1. Control Panel → Programs → Uninstall
2. Find "ZSE POS System" → Uninstall
3. Data stays (safe to reinstall later)

### Remove Data Completely

Delete folder:

```
C:\Users\[YourUsername]\AppData\Roaming\zse-pos\
```

⚠️ **Warning**: This deletes all sales history!

---

## 📞 Troubleshooting Reference

| Issue                                | Solution                                    |
| ------------------------------------ | ------------------------------------------- |
| "Cannot find module sqlite3"         | Reinstall using 32-bit version              |
| App crashes on startup               | Try running as Administrator                |
| Very slow performance                | Close other apps, use 32-bit version        |
| Database locked error                | Restart app completely                      |
| Windows 7 won't run it               | Ensure Service Pack 1 installed, use 32-bit |
| Can't in install (permission denied) | Run installer as Administrator              |
| Antivirus blocks installation        | Temporarily disable, then reinstall         |

---

## 🚀 Next Steps

### To Start Using:

1. ✅ Install the app
2. ✅ Login with default credentials
3. ✅ Add your products
4. ✅ Start processing sales!

### To Deploy to Multiple Machines:

1. Create installers using build script
2. Copy `.exe` files to USB drives or share on network
3. Users run installer on their machines
4. All data is local on each machine

### To Build Your Own Version:

1. Follow "For Developers" section above
2. Customize colors, branding, features as needed
3. Run build script to create installers
4. Distribute to your customers

---

## 📝 Accounts
The first admin account is created during the Setup Wizard. Add cashier/staff accounts from **User Management** after login.

---

## ✨ Performance Tips

- **Startup**: Wait 30-60 seconds on first launch (normal)
- **Adding Products**: Consider batch import from CSV
- **Database**: Backups create daily (you can delete old ones to save space)
- **Reports**: Limited to reasonable date ranges for speed

---

## 📖 Full Documentation

- **Installation Guide**: See `INSTALLATION_GUIDE.md`
- **Build Guide**: See `BUILD_STANDALONE_GUIDE.md`
- **Features & Fixes**: See `FIXES_AND_FEATURES.md`

---

**Version**: 1.0.0  
**Platform**: Windows 7, 8, 10, 11  
**Architecture**: 32-bit (32-bit version) & 64-bit (x64 version)  
**Support**: Local offline application

**Need help?** Check the documentation files or rebuild using the scripts provided.

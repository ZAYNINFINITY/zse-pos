# ZSE POS System - Installation & Setup Guide

## 📦 System Requirements

### Minimum Requirements (Low-End Hardware)

- **OS**: Windows 7 SP1, Windows 8, Windows 10, Windows 11
- **Processor**: Intel Pentium 4 or equivalent (1 GHz+)
- **RAM**: 512 MB minimum, 1 GB recommended
- **Storage**: 300 MB free space
- **Display**: 1024x768 resolution minimum

### Recommended Requirements

- **OS**: Windows 10 or Windows 11 (Latest)
- **Processor**: Intel Core i3 or equivalent
- **RAM**: 4 GB
- **Storage**: SSD (faster startup)
- **Display**: 1366x768 or higher

---

## 🚀 Installation Methods

### Method 1: Using Installer (Easiest) ⭐ Recommended

#### Option A: 64-bit Windows (Most Common)

1. Download `ZSE-POS-System-1.0.0.exe` from the `dist/` folder
2. Double-click the installer
3. Follow the installation wizard
4. Choose installation directory (default: `C:\Program Files\ZSE POS System`)
5. Click "Install"
6. Launch from Start Menu or Desktop shortcut

#### Option B: 32-bit Windows or Low-End Machines

1. Download `ZSE-POS-System-1.0.0-ia32.exe` from the `dist/` folder
2. Double-click the installer
3. Follow the installation wizard
4. Click "Install"
5. Launch from Start Menu shortcut

### Method 2: Portable Version (No Installation)

1. Download `ZSE-POS-System-1.0.0.exe` (portable version) from `dist/` folder
2. Copy to USB drive or desired location
3. Double-click to run immediately (no installation needed)
4. Perfect for testing or running from USB/removable media

### Method 3: Manual Installation (Advanced Users)

#### Windows 7/8 Compatibility Setup

```bash
# Install .NET Framework 4.5+ (if not present)
# Download from: https://www.microsoft.com/en-us/download/details.aspx?id=30653

# Install Visual C++ Redistributable 2019
# Download: https://support.microsoft.com/en-us/help/2977003
```

#### Manual Setup

1. Extract the application package to any folder
2. Double-click `ZSE-POS-System.exe`
3. App will create user database on first run

---

## 🔧 Building Your Own Installer

### Prerequisites

- Node.js 16+ (Download from https://nodejs.org/)
- npm (comes with Node.js)

### Build Steps

```bash
# 1. Navigate to project directory
cd "d:\WORK - ARCHIVE\IMPORTANT CODING DATA AND PROJECTS\PROJECTS\zse-pos"

# 2. Clean previous build (recommended)
npm run clean  # or: rmdir /s /q dist dist-app node_modules

# 3. Install all dependencies (Vite + Electron + other packages)
npm install

# 4. Rebuild native modules for current system
npx electron-rebuild

# 5. Build with Vite and Create Installers
# Option A: 64-bit installer only
npm run build-win

# Option B: 32-bit installer only
npm run build-win32

# Option C: Both 64-bit and 32-bit installers
npm run build-win && npm run build-win32
```

**Note:** Vite automatically runs as part of the build scripts (5x faster than the previous Create React App build system).

### Output Files

After building, installers are created in the `dist-app/` folder:

- **64-bit Installer**: `ZSE-POS-System-1.0.0.exe` (~180 MB)
- **32-bit Installer**: `ZSE-POS-System-1.0.0-ia32.exe` (~160 MB)
- **64-bit Portable**: `ZSE-POS-System 1.0.0.exe` (standalone, no install)
- **32-bit Portable**: `ZSE-POS-System 1.0.0-ia32.exe` (standalone, no install)

---

## 💾 Data & Configuration

### Database Location

```
C:\Users\{YourUsername}\AppData\Roaming\zse-pos\zse-pos.db
```

### Backup Location

```
C:\Users\{YourUsername}\AppData\Roaming\zse-pos\backups\
```

- Daily automatic backups are created
- Keep safe copies on external storage

### Uninstalling

1. Go to Control Panel → Programs → Programs and Features
2. Find "ZSE POS System"
3. Click "Uninstall"
4. Follow the wizard
5. To remove data, manually delete the AppData folder above

---

## ⚡ Performance Optimization for Low-End Hardware

### Auto-Optimizations (Already Enabled)

- ✅ GPU acceleration disabled (better CPU utilization)
- ✅ Sandbox mode enabled (security)
- ✅ Asset compression enabled (.asar packaging)
- ✅ Minimal startup splash

### Manual Optimizations

1. Close unnecessary background programs
2. Disable visual effects: Windows Settings → System → Display → Advanced
3. Increase virtual memory (if RAM < 1GB)
4. Regular database maintenance

### Troubleshooting Low-End Systems

**Slow Startup:**

- First launch may take 30-60 seconds
- Subsequent launches are faster
- Disable Windows search indexing on the app folder

**Out of Memory:**

- Use 32-bit version (`-ia32`)
- Close other applications
- Check Windows Task Manager for memory leaks

**Database Errors:**

- Ensure install directory has write permissions
- Check disk space (need at least 100MB free)
- Try reinstalling with admin privileges

---

## 🔒 Security & Permissions

### Required Permissions

- File system read/write (for database)
- Network not required (fully offline)

### Running with Admin Privileges

Right-click `ZSE-POS-System.exe` → Select "Run as administrator" if you encounter permission issues

### Windows Defender/Antivirus

- First time: App may take longer to launch (scanning)
- Whitelist app after first run for faster startup:
  - Defender → Virus & threat protection → Manage settings → Add exceptions

---

## 📋 Uninstall & Clean Removal

### Complete Uninstall Steps

```batch
REM 1. Uninstall from Programs
Control panel → Programs and Features → Uninstall

REM 2. Delete user data (optional - keeps settings/sales data)
rmdir /S "%APPDATA%\zse-pos"

REM 3. Delete shortcuts (if not removed by installer)
del "%USERPROFILE%\Desktop\ZSE POS System.lnk"
del "%USERPROFILE%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\ZSE POS System.lnk"
```

---

## 🆘 Troubleshooting

### Issue: "Cannot find module 'sqlite3'" or "App won't start"

**Solution:**

- Reinstall using 32-bit version (`-ia32`)
- Ensure Administrator permissions
- Check Windows 7: Install Service Pack 1

### Issue: "Visual C++ Runtime Error"

**Solution:**

- Download Visual C++ Redistributable 2019 from Microsoft
- Install it, then restart the app

### Issue: Installer won't run

**Solution:**

- Right-click → "Run as administrator"
- Disable antivirus temporarily during install
- Download latest installer again

### Issue: "SQLite database locked"

**Solution:**

- Close the application completely
- Restart the POS system
- Check disk space is sufficient

### Issue: Slow performance on Windows 7

**Solution:**

- Use 32-bit version
- Disable hardware acceleration (already done)
- Update chipset drivers from manufacturer

---

## 📞 Support Resources

- **Database**: SQLite 3 (offline, no internet required)
- **Security**: Context isolation enabled, sandbox mode
- **Backup**: Daily automatic backups to AppData\Roaming\zse-pos\backups\

---

## 🔄 Updates

When new versions are available:

1. Go to Settings → Check for Updates
2. Or manually download new installer and run it
3. All your sales data is preserved

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Windows Compatibility**: 7, 8, 10, 11  
**Architecture**: 32-bit (ia32) & 64-bit (x64)

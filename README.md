<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=700&size=28&duration=2600&pause=900&color=0E9F6E&center=true&vCenter=true&width=900&lines=ZSE+POS+System;Professional+Offline+Point+of+Sale;Electron+%2B+React+%2B+Vite" alt="Typing banner" />
</p>

<p align="center">
  <a href="https://github.com/ZAYNINFINITY/zse-pos/stargazers"><img src="https://img.shields.io/github/stars/ZAYNINFINITY/zse-pos?style=for-the-badge" alt="Stars" /></a>
  <a href="https://github.com/ZAYNINFINITY/zse-pos/network/members"><img src="https://img.shields.io/github/forks/ZAYNINFINITY/zse-pos?style=for-the-badge" alt="Forks" /></a>
  <a href="https://github.com/ZAYNINFINITY/zse-pos/issues"><img src="https://img.shields.io/github/issues/ZAYNINFINITY/zse-pos?style=for-the-badge" alt="Issues" /></a>
  <img src="https://img.shields.io/badge/platform-Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/Electron-28.x-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=111" alt="React" />
</p>

## Overview

ZSE POS System is a desktop-first, offline Point of Sale application built with Electron, React, and Vite.

It is designed for Windows retail environments with local database storage, PDF receipts, analytics, backup support, and practical day-to-day checkout workflows.

## Features

- Offline-first POS workflow
- Product, customer, and sales management
- Discount handling and multi-payment support
- Report and analytics dashboards
- PDF receipt generation
- Local SQLite-backed persistence
- Automatic backup support

## Tech Stack

- Electron (`main.js`, `preload.js`)
- React + Vite frontend
- Better SQLite3 for local data
- Tailwind CSS for UI styling

## Quick Start (Development)

### Prerequisites

- Node.js LTS
- npm
- Windows environment

### Install

```powershell
npm install
```

### Run (Vite + Electron)

```powershell
npm run dev:electron
```

### Build Desktop App

```powershell
npm run build-win
```

Build outputs are generated in `dist-app/`.

## Alternate Build Commands

```powershell
npm run build-win32
npm run build-all
npm run start
```

## Project Structure

```text
src/               React application source
main.js            Electron main process
preload.js         Electron preload bridge
assets/            Build resources/icons
docs/              Project docs and guides
dist-app/          Packaged app output
```

## Accounts

Accounts are created during the first-run Setup Wizard (no default credentials are shipped).

## Data Location (Windows)

```text
C:\Users\<YourUser>\AppData\Roaming\zse-pos\
```

## Documentation

- [Quick Start](docs/QUICK_START.md)
- [Installation Guide](docs/INSTALLATION_GUIDE.md)

## Roadmap Ideas

- Cloud sync option
- Multi-branch inventory sync
- Hardware integration hardening (printers/scanners)
- Enhanced audit and role-based controls

## Contributing

1. Fork the repo
2. Create a feature branch
3. Commit changes with clear messages
4. Open a pull request

## License

Use your preferred license file here (MIT/Proprietary/etc.).

---

Built for practical retail operations with a local-first architecture.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 💰 Smart Financial Copilot

A personal finance manager with Moroccan Dirham (MAD) currency support.

**Features:**
- 📊 **Dashboard** - Real-time financial overview
- 💳 **Multi-Account Support** - Manage multiple accounts
- 🎯 **Budget Tracking** - Set and monitor monthly spending limits
- 💡 **Savings Goals** - Track financial objectives
- 💱 **Multi-Currency** - Support for MAD, USD, EUR with Moroccan Dirham as default
- 📱 **Android PWA** - Install as native app on Android/iOS
- 🌐 **Offline Support** - Service Worker for offline functionality
- 📥 **CSV Export** - Export transaction history

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hakunnna2/tracker-money.git
   cd tracker-money
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

4. **Build for production:**
   ```bash
   npm run build
   ```

## Deployment

### Deploy on Netlify

**Option 1: Connect GitHub Repository**
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub account
4. Select `https://github.com/hakunnna2/tracker-money.git`
5. Netlify will auto-detect the build settings from `netlify.toml`
6. Click "Deploy"

**Option 2: Manual Deploy with Netlify CLI**
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### Environment Variables
No external API keys required! The app stores all data locally in the browser.

## Project Structure

```
src/
├── components/
│   ├── AddTransactionModal.tsx
│   ├── charts/
│   └── tabs/
├── lib/
│   ├── currency.ts           # Currency formatting
│   └── database.ts           # LocalStorage wrapper
├── App.tsx                   # Main app component
├── types.ts                  # TypeScript interfaces
├── main.tsx                  # Entry point
└── index.css                 # Tailwind CSS
public/
├── manifest.webmanifest      # PWA manifest
└── sw.js                     # Service Worker
```

## Features in Detail

### 🔐 Security
- **Local Storage**: All data stays on device
- **No Backend**: Zero server communication

### 📱 Mobile PWA
- Install on home screen (Android/iOS)
- Works offline with Service Worker
- Native app-like experience
- App shortcuts for quick actions

### 💱 Currency Support
- **Default**: Moroccan Dirham (د.م.)
- **Alternative**: US Dollar ($), Euro (€)
- Settings tab to change currency anytime
- Proper localization for each currency

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build**: Vite 6
- **Animations**: Motion (Framer Motion)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Storage**: Browser LocalStorage
- **PWA**: Service Worker, Web Manifest

## Scripts

```bash
npm run dev      # Start development server on port 3000
npm run build    # Build for production (dist/)
npm run preview  # Preview production build
npm run clean    # Remove dist folder
npm run lint     # Type check with TypeScript
```

## Data Privacy

✅ **100% Private**
- No external API calls
- No tracking
- No user registration
- All data stored locally
- Open source codebase

## Contributing

Feel free to submit issues and enhancement requests!

## License

Apache-2.0

## Support

For issues or questions, visit the [GitHub repository](https://github.com/hakunnna2/tracker-money)

---

**Made with ❤️ for personal finance management**

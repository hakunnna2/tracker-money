# Netlify Deployment Guide

## Quick Deploy Steps

### Step 1: Create Netlify Account
1. Go to https://netlify.com
2. Sign up with GitHub, GitLab, Bitbucket, or email

### Step 2: Connect Your Repository
1. Click "New site from Git"
2. Choose "GitHub" (or your Git provider)
3. Authorize Netlify to access your GitHub account
4. Select the repository: `hakunnna2/tracker-money`
5. Choose branch: `main`

### Step 3: Configure Build Settings
Netlify will automatically detect settings from `netlify.toml`:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 20

No additional configuration needed! ✅

### Step 4: Deploy
Click "Deploy site" and wait for the build to complete.

**Your site will be live at**: `https://[your-site-name].netlify.app`

---

## Manual Deployment (CLI)

If you prefer command-line deployment:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy to production
netlify deploy --prod --dir=dist
```

---

## Environment Setup

No environment variables needed! The app uses browser LocalStorage for all data.

If you need to set environment variables in Netlify:
1. Go to Site settings → Build & deploy → Environment
2. Add any variables needed (currently none required)

---

## Custom Domain

After deployment:
1. Go to your Netlify site settings
2. Domain management → Custom domain
3. Follow the DNS instructions to point your domain

---

## PWA Installation on Netlify

The app is fully PWA-compatible on Netlify!

**Android:**
1. Open the site in Chrome
2. Menu → "Install app"
3. Confirm installation

**iOS:**
1. Open in Safari
2. Share → "Add to Home Screen"
3. Enter app name

---

## Monitoring & Logs

- **Build logs**: Click on your deployment to see build output
- **Analytics**: Site analytics available in Netlify dashboard
- **Performance**: Netlify automatically optimizes assets

---

## Troubleshooting

### Build Fails
- Check `npm run build` works locally
- Verify all dependencies are in `package.json`
- Check build logs in Netlify dashboard

### Service Worker Issues
- Netlify properly serves the Service Worker
- Clear browser cache if experiencing issues
- Service Worker caches assets for offline access

### Cache Issues
- Cached assets expire after 1 year (immutable)
- Root files cache for 1 hour
- Service Worker never cached (must-revalidate)

---

## After Deployment

1. **Test the app**: Visit your live URL
2. **Create PIN**: First-time setup
3. **Enable Biometric**: On supported devices
4. **Share the link**: Your app is now live!

---

## Support

For Netlify support: https://netlify.com/support
For app issues: https://github.com/hakunnna2/tracker-money

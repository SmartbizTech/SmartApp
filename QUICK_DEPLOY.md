# Quick Deployment Guide - GitHub Pages

## 🚀 Quick Start (5 Minutes)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for GitHub Pages deployment"
git push origin main
```

### Step 2: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save

### Step 3: Configure Backend API (If Needed)

If your backend is deployed separately:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `VITE_API_URL`
4. Value: Your backend URL (e.g., `https://your-backend.herokuapp.com/api`)
5. Save

### Step 4: Deploy

**Automatic**: Just push to `main` branch - deployment happens automatically!

**Manual**: 
1. Go to **Actions** tab
2. Click **Deploy to GitHub Pages**
3. Click **Run workflow**

### Step 5: Access Your Site

Your site will be available at:
- `https://yourusername.github.io/repository-name/`

## ⚙️ Configuration

### For Custom Domain
Update `.github/workflows/deploy.yml`:
```yaml
VITE_BASE_PATH: /
```

### For Repository Subdirectory (Default)
Already configured! Uses: `/${{ github.event.repository.name }}/`

## 🔧 Troubleshooting

**Build fails?**
- Check Actions tab for errors
- Ensure Node.js version is 18+

**404 on refresh?**
- Normal for SPAs - routing handled client-side
- 404.html is included for fallback

**API not working?**
- Check `VITE_API_URL` secret is set
- Verify backend CORS settings
- Check browser console for errors

## 📝 Next Steps

1. Deploy backend separately (Heroku, Railway, etc.)
2. Set `VITE_API_URL` secret with backend URL
3. Test the deployed application
4. Configure custom domain (optional)

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)


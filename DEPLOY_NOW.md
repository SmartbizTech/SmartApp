# 🚀 Deploy Now - Step by Step Guide

## ⚠️ Prerequisites

**Git must be installed first!** If you see "git is not recognized", install Git:

- Download: https://git-scm.com/download/win
- See [INSTALL_GIT.md](./INSTALL_GIT.md) for detailed instructions
- Or use [DEPLOY_WITHOUT_GIT.md](./DEPLOY_WITHOUT_GIT.md) for alternative methods

## Quick Deployment (5 minutes)

### Option 1: Using PowerShell Script (Easiest)

1. **Open PowerShell in the project root**

   ```powershell
   cd C:\SmartApp
   ```

2. **Run the deployment script**

   ```powershell
   .\deploy.ps1
   ```

3. **Follow the prompts** - The script will:
   - Check if Git is installed
   - Initialize repository if needed
   - Stage all files
   - Commit changes
   - Push to GitHub

### Option 2: Manual Deployment

#### Step 1: Initialize Git (if not already done)

```powershell
git init
git checkout -b main
```

#### Step 2: Add All Files

```powershell
git add .
```

#### Step 3: Commit Changes

```powershell
git commit -m "Deploy to GitHub Pages"
```

#### Step 4: Add GitHub Remote

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

_(Replace YOUR_USERNAME and YOUR_REPO_NAME with your actual GitHub username and repository name)_

#### Step 5: Push to GitHub

```powershell
git push -u origin main
```

### Step 6: Enable GitHub Pages

1. **Go to your repository on GitHub**

   - Visit: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`

2. **Click on Settings** (top menu)

3. **Click on Pages** (left sidebar)

4. **Under Source**, select **GitHub Actions** (NOT "Deploy from a branch")

5. **Click Save**

### Step 7: Wait for Deployment

1. **Go to Actions tab** in your repository
2. **You should see "Deploy to GitHub Pages" workflow running**
3. **Wait for it to complete** (usually 2-3 minutes)
4. **Once green checkmark appears**, your site is live!

### Step 8: Access Your Site

Your site will be available at:

```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

## ⚙️ Configure Backend API (Important!)

If your backend is deployed separately:

1. **Go to Settings → Secrets and variables → Actions**
2. **Click "New repository secret"**
3. **Name:** `VITE_API_URL`
4. **Value:** Your backend URL (e.g., `https://your-backend.herokuapp.com/api`)
5. **Click "Add secret"**
6. **Re-run the workflow** (Actions → Deploy to GitHub Pages → Run workflow)

## 🔍 Troubleshooting

### Git not found?

- Install Git: https://git-scm.com/download/win
- Restart PowerShell after installation

### "Repository not found" error?

- Check your repository URL is correct
- Make sure the repository exists on GitHub
- Verify you have push access

### Build fails in Actions?

- Check the Actions tab for error details
- Ensure all files are committed
- Verify Node.js version compatibility

### 404 errors on site?

- This is normal for SPAs - routing is handled client-side
- The 404.html file is included for fallback

### API calls not working?

- Set the `VITE_API_URL` secret
- Check backend CORS settings
- Verify backend is accessible

## 📝 What Gets Deployed?

- ✅ Frontend React application
- ✅ All static assets
- ✅ Optimized production build
- ✅ SPA routing support

## ⚠️ Important Notes

1. **Backend must be deployed separately** - GitHub Pages only hosts static files
2. **First deployment may take 5-10 minutes**
3. **Subsequent deployments** happen automatically on every push to `main`
4. **Custom domain** can be configured in Settings → Pages

## 🎉 Success!

Once deployed, you'll have:

- ✅ Automatic deployments on every push
- ✅ Free hosting on GitHub Pages
- ✅ HTTPS enabled by default
- ✅ Custom domain support (optional)

Need help? Check the detailed guide in [DEPLOYMENT.md](./DEPLOYMENT.md)

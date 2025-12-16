# GitHub Pages Deployment Guide

This guide will help you deploy the frontend of this application to GitHub Pages.

## Prerequisites

1. A GitHub account
2. A GitHub repository (this repository)
3. Backend API deployed somewhere (Heroku, Railway, Render, etc.) or running locally for development

## Step 1: Prepare Your Repository

1. Make sure your code is pushed to GitHub
2. Ensure your default branch is `main` (or `master` - update the workflow file accordingly)

## Step 2: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
4. Save the settings

## Step 3: Configure Base Path (Important!)

### Option A: Deploy to Repository Subdirectory (e.g., `username.github.io/SmartApp/`)

1. Open `.github/workflows/deploy.yml`
2. The base path is already configured as: `/${{ github.event.repository.name }}/`
3. This will automatically use your repository name as the base path

### Option B: Deploy to Root Domain (Custom Domain)

1. If you're using a custom domain or deploying to `username.github.io` (not a project page):
2. Update `.github/workflows/deploy.yml`:
   ```yaml
   VITE_BASE_PATH: /
   ```

## Step 4: Configure Backend API URL

### For Development (Local Backend)

- Leave `VITE_API_URL` empty in the workflow
- The app will use relative paths (`/api`)

### For Production (Deployed Backend)

1. Deploy your backend to a hosting service (Heroku, Railway, Render, etc.)
2. Get your backend URL (e.g., `https://your-app.herokuapp.com`)
3. Update `.github/workflows/deploy.yml`:
   ```yaml
   VITE_API_URL: https://your-app.herokuapp.com/api
   ```

Or set it as a GitHub Secret:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `VITE_API_URL`
4. Value: `https://your-backend-url.com/api`
5. Update the workflow to use the secret:
   ```yaml
   VITE_API_URL: ${{ secrets.VITE_API_URL }}
   ```

## Step 5: Deploy

### Automatic Deployment

1. Push your code to the `main` branch
2. GitHub Actions will automatically build and deploy
3. Check the **Actions** tab to see the deployment progress
4. Once complete, your site will be available at:
   - `https://username.github.io/repository-name/` (for project pages)
   - `https://username.github.io/` (for user/organization pages)

### Manual Deployment

1. Go to **Actions** tab
2. Click **Deploy to GitHub Pages** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## Step 6: Verify Deployment

1. Visit your GitHub Pages URL
2. Check browser console for any errors
3. Test the login functionality
4. Verify API calls are working

## Troubleshooting

### Issue: 404 errors on page refresh

**Solution**: This is normal for SPAs on GitHub Pages. The app uses client-side routing which should handle this.

### Issue: API calls failing

**Solution**:

- Check that `VITE_API_URL` is set correctly
- Ensure CORS is enabled on your backend
- Check browser console for specific error messages

### Issue: Assets not loading

**Solution**:

- Verify `VITE_BASE_PATH` matches your repository structure
- Check that paths in `vite.config.ts` are correct

### Issue: Build fails

**Solution**:

- Check the Actions tab for error details
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

## Backend Deployment Options

Since GitHub Pages only hosts static files, you need to deploy your backend separately:

### Option 1: Heroku

```bash
cd backend
heroku create your-app-name
git subtree push --prefix backend heroku main
```

### Option 2: Railway

1. Connect your GitHub repository
2. Set root directory to `backend`
3. Configure environment variables
4. Deploy

### Option 3: Render

1. Create a new Web Service
2. Connect your repository
3. Set root directory to `backend`
4. Configure build and start commands

### Option 4: Vercel/Netlify Functions

- Convert API routes to serverless functions
- More complex but can be cost-effective

## Environment Variables

Create a `.env` file in the `frontend` directory for local development:

```env
VITE_BASE_PATH=/
VITE_API_URL=http://localhost:4000/api
```

**Note**: Never commit `.env` files with sensitive data. Use GitHub Secrets for production.

## Custom Domain (Optional)

1. In your repository **Settings** → **Pages**
2. Enter your custom domain
3. Update DNS records as instructed
4. GitHub will provide SSL certificate automatically

## Continuous Deployment

Once set up, every push to `main` will automatically:

1. Build the frontend
2. Deploy to GitHub Pages
3. Make your changes live

## Support

If you encounter issues:

1. Check GitHub Actions logs
2. Review browser console errors
3. Verify environment variables
4. Ensure backend is accessible and CORS is configured

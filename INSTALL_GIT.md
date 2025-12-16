# Install Git for Windows

## Quick Installation

### Option 1: Download Git for Windows (Recommended)

1. **Download Git:**
   - Visit: https://git-scm.com/download/win
   - The download will start automatically

2. **Run the installer:**
   - Double-click the downloaded `.exe` file
   - Click "Next" through the installation wizard
   - **Important:** Keep default options (especially "Git from the command line and also from 3rd-party software")
   - Click "Install"

3. **Restart PowerShell:**
   - Close your current PowerShell window
   - Open a new PowerShell window
   - Navigate back to your project:
     ```powershell
     cd C:\SmartApp
     ```

4. **Verify installation:**
   ```powershell
   git --version
   ```
   You should see something like: `git version 2.x.x`

### Option 2: Install via Winget (Windows Package Manager)

If you have Windows 10/11 with winget:

```powershell
winget install --id Git.Git -e --source winget
```

Then restart PowerShell.

### Option 3: Install via Chocolatey

If you have Chocolatey installed:

```powershell
choco install git
```

## After Installing Git

Once Git is installed, you can:

1. **Run the deployment script:**
   ```powershell
   .\deploy.ps1
   ```

2. **Or deploy manually:**
   ```powershell
   git init
   git checkout -b main
   git add .
   git commit -m "Deploy to GitHub Pages"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

## Need Help?

- Git download: https://git-scm.com/download/win
- Git documentation: https://git-scm.com/doc


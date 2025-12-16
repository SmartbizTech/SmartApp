# GitHub Pages Deployment Script for Windows PowerShell
# Run this script to prepare and deploy your application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub Pages Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "✓ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
}

# Check current branch
$currentBranch = git branch --show-current 2>$null
if (-not $currentBranch) {
    Write-Host "Creating main branch..." -ForegroundColor Yellow
    git checkout -b main
    $currentBranch = "main"
}

Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan

# Add all files
Write-Host ""
Write-Host "Staging files..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "Files to commit:" -ForegroundColor Cyan
    git status --short
    
    Write-Host ""
    $commit = Read-Host "Enter commit message (or press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($commit)) {
        $commit = "Deploy to GitHub Pages"
    }
    
    git commit -m $commit
    Write-Host "✓ Changes committed" -ForegroundColor Green
} else {
    Write-Host "✓ No changes to commit" -ForegroundColor Green
}

# Check for remote
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host ""
    Write-Host "No remote repository configured." -ForegroundColor Yellow
    $repoUrl = Read-Host "Enter your GitHub repository URL (e.g., https://github.com/username/repo.git)"
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "✓ Remote added" -ForegroundColor Green
    } else {
        Write-Host "Skipping remote setup. You can add it later with:" -ForegroundColor Yellow
        Write-Host "  git remote add origin <your-repo-url>" -ForegroundColor Cyan
    }
} else {
    Write-Host "Remote repository: $remote" -ForegroundColor Cyan
}

# Push to GitHub
Write-Host ""
$push = Read-Host "Push to GitHub? (y/n)"
if ($push -eq "y" -or $push -eq "Y") {
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push -u origin $currentBranch
    Write-Host "✓ Pushed to GitHub" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to your repository on GitHub" -ForegroundColor White
    Write-Host "2. Settings → Pages" -ForegroundColor White
    Write-Host "3. Source: GitHub Actions" -ForegroundColor White
    Write-Host "4. Save and wait for deployment" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Cyan
} else {
    Write-Host "Skipping push. Run manually with:" -ForegroundColor Yellow
    Write-Host "  git push -u origin $currentBranch" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Deployment preparation complete!" -ForegroundColor Green


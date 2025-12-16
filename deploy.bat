@echo off
echo ========================================
echo GitHub Pages Deployment
echo ========================================
echo.

REM Check if git is available
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git is not installed or not in PATH
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo Git found!
echo.

REM Initialize git if needed
if not exist .git (
    echo Initializing git repository...
    git init
    git checkout -b main
)

REM Add all files
echo.
echo Staging files...
git add .

REM Commit
echo.
set /p commit="Enter commit message (or press Enter for default): "
if "%commit%"=="" set commit=Deploy to GitHub Pages
git commit -m "%commit%"

REM Check remote
echo.
git remote get-url origin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    set /p repo="Enter GitHub repository URL: "
    if not "%repo%"=="" git remote add origin %repo%
)

REM Push
echo.
set /p push="Push to GitHub? (y/n): "
if /i "%push%"=="y" (
    echo Pushing to GitHub...
    git push -u origin main
    echo.
    echo ========================================
    echo Next Steps:
    echo 1. Go to your repository on GitHub
    echo 2. Settings -^> Pages
    echo 3. Source: GitHub Actions
    echo 4. Save and wait for deployment
    echo ========================================
)

echo.
echo Done!
pause


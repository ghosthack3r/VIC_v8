# VIC v5 - Windows Quickstart Script
# Run this in PowerShell from the vic5 folder

Write-Host "VIC v5 Windows Quickstart" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check for Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check for npm
try {
    $npmVersion = npm --version
    Write-Host "npm found: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm not found. Please reinstall Node.js." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies (this may take 2-5 minutes)..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed. Check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Rebuilding native modules (serialport, etc.)..." -ForegroundColor Yellow
Write-Host "   If this fails, you need Visual Studio Build Tools 2022 with 'Desktop development with C++' workload." -ForegroundColor DarkYellow

npx electron-rebuild -f

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "WARNING: Rebuild failed. This is almost always because Visual Studio Build Tools are missing." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please install them now:" -ForegroundColor Cyan
    Write-Host "   1. Download: https://aka.ms/vs/17/release/vs_buildtools.exe" -ForegroundColor White
    Write-Host "   2. Select workload: 'Desktop development with C++'" -ForegroundColor White
    Write-Host "   3. Restart this PowerShell and run this script again." -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Native modules rebuilt successfully!" -ForegroundColor Green

# Setup .env if it doesn't exist
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Created .env from .env.example" -ForegroundColor Green
        Write-Host "   -> Please edit .env and add your Google Maps API key (and optional Gemini project ID)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Edit .env and add your VITE_GOOGLE_MAPS_API_KEY" -ForegroundColor White
Write-Host "  2. (Optional) Set GOOGLE_CLOUD_PROJECT for real Gemini voice" -ForegroundColor White
Write-Host "  3. Run the app:" -ForegroundColor White
Write-Host "     npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "For more help, see QUICKSTART.md" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Drive safe. VIC is standing by." -ForegroundColor Magenta

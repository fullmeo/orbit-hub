#############################################################################
# ORBIT Hub - Initialize New Artist Site (PowerShell Version)
#
# Usage:
#   .\init-new-artist-site.ps1
#
# This script scaffolds a new artist Orbit Hub site from a template
#############################################################################

param(
    [switch]$NonInteractive = $false,
    [string]$ArtistName = "",
    [string]$ArtistSlug = "",
    [string]$Genre = "",
    [string]$Bio = "",
    [string]$Tone = "",
    [string]$Instagram = "",
    [string]$Spotify = "",
    [string]$GA4ID = ""
)

# Colors
$Info = "Cyan"
$Success = "Green"
$Warning = "Yellow"
$Error = "Red"

# Header
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        ORBIT Hub - New Artist Site Initialization          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Interactive input if not in non-interactive mode
if (-not $NonInteractive) {
    if ([string]::IsNullOrWhiteSpace($ArtistName)) {
        $ArtistName = Read-Host "Artist Name (e.g., Allyson Glado)"
    }
    if ([string]::IsNullOrWhiteSpace($ArtistSlug)) {
        $ArtistSlug = Read-Host "Artist Slug (e.g., allyson-glado)"
    }
    if ([string]::IsNullOrWhiteSpace($Genre)) {
        $Genre = Read-Host "Genre (e.g., Reggae-Pop)"
    }
    if ([string]::IsNullOrWhiteSpace($Bio)) {
        $Bio = Read-Host "Short Bio"
    }
    if ([string]::IsNullOrWhiteSpace($Tone)) {
        $Tone = Read-Host "Tone/Vibe (e.g., chaleureux, inspirant, accessible)"
    }
    if ([string]::IsNullOrWhiteSpace($Instagram)) {
        $Instagram = Read-Host "Instagram URL (optional)"
    }
    if ([string]::IsNullOrWhiteSpace($Spotify)) {
        $Spotify = Read-Host "Spotify URL (optional)"
    }
    if ([string]::IsNullOrWhiteSpace($GA4ID)) {
        $GA4ID = Read-Host "GA4 Property ID (e.g., G-XXXXXXXXXX)"
    }
}

# Validate inputs
if ([string]::IsNullOrWhiteSpace($ArtistName) -or [string]::IsNullOrWhiteSpace($ArtistSlug)) {
    Write-Host "Error: Artist name and slug are required" -ForegroundColor $Error
    exit 1
}

# Directory name
$DirName = ($ArtistName -replace ' ', '_') + "_orbit-hub"
$FullDir = Join-Path (Get-Location) $DirName

# Check if directory exists
if (Test-Path $FullDir) {
    Write-Host "Error: Directory already exists: $DirName" -ForegroundColor $Error
    exit 1
}

Write-Host "Creating new site:" -ForegroundColor $Warning
Write-Host "  Name: $ArtistName"
Write-Host "  Slug: $ArtistSlug"
Write-Host "  Directory: $DirName`n"

# Find template
$TemplateDir = "orbit-allysonglado"
if (-not (Test-Path $TemplateDir)) {
    Write-Host "Error: Template directory not found: $TemplateDir" -ForegroundColor $Error
    exit 1
}

Write-Host "✓ Creating directory..." -ForegroundColor $Success
New-Item -ItemType Directory -Path $FullDir | Out-Null

Write-Host "✓ Copying template files..." -ForegroundColor $Success
Copy-Item -Path "$TemplateDir\*" -Destination $FullDir -Recurse -Force
Copy-Item -Path "$TemplateDir\.env.example" -Destination $FullDir -Force -ErrorAction SilentlyContinue

# Create artist-data.json
Write-Host "✓ Creating artist-data.json..." -ForegroundColor $Success
$artistData = @{
    nom = $ArtistName
    slug = $ArtistSlug
    genre = $Genre
    bioCourte = $Bio
    instagram = $Instagram
    spotify = $Spotify
} | ConvertTo-Json

$artistData | Set-Content -Path "$FullDir\artist-data.json"

# Update netlify.toml
Write-Host "✓ Updating netlify.toml..." -ForegroundColor $Success
$netlifyConfig = @"
# Netlify configuration - $ArtistName
[build]
  base = "."
  publish = "."
  functions = "netlify/functions"

[build.environment]
  GA4_PROPERTY_ID = "$GA4ID"
  ARTIST_NAME = "$ArtistName"
  ARTIST_TONE = "$Tone"
  ARTIST_BIO = "$Bio"
  NODE_ENV = "production"
"@

$netlifyConfig | Set-Content -Path "$FullDir\netlify.toml"

# Update .env.example
Write-Host "✓ Updating .env.example..." -ForegroundColor $Success
$envFile = Get-Content -Path "$FullDir\.env.example" -Raw
$envFile = $envFile -replace 'ARTIST_NAME=.*', "ARTIST_NAME=$ArtistName"
$envFile = $envFile -replace 'ALLOWED_ORIGIN=.*', "ALLOWED_ORIGIN=https://$ArtistSlug.netlify.app"
$envFile = $envFile -replace 'ARTIST_BIO=.*', "ARTIST_BIO=$Bio"
$envFile = $envFile -replace 'ARTIST_TONE=.*', "ARTIST_TONE=$Tone"

$envFile | Set-Content -Path "$FullDir\.env.example"

Write-Host "`n✓ New site created successfully!`n" -ForegroundColor $Success

Write-Host "Next steps:" -ForegroundColor $Warning
Write-Host ""
Write-Host "1. Add to orbit-sites.config.json:" -ForegroundColor $Info
@"
   {
     "id": "$ArtistSlug",
     "name": "$ArtistName",
     "domain": "$ArtistSlug.netlify.app",
     "directory": "$DirName",
     "status": "staging",
     "artist": {
       "name": "$ArtistName",
       "genre": "$Genre",
       "bio": "$Bio",
       "tone": "$Tone",
       "instagram": "$Instagram",
       "spotify": "$Spotify"
     },
     "analytics": {
       "ga4PropertyId": "$GA4ID"
     },
     "features": ["fan-chat", "music-streaming", "social-integration"]
   }
"@ | Write-Host -ForegroundColor Cyan

Write-Host ""
Write-Host "2. Customize content:" -ForegroundColor $Info
Write-Host "   cd $DirName" -ForegroundColor Cyan
Write-Host "   # Edit index.html, assets, etc." -ForegroundColor Cyan

Write-Host ""
Write-Host "3. Install dependencies:" -ForegroundColor $Info
Write-Host "   cd $DirName" -ForegroundColor Cyan
Write-Host "   npm install" -ForegroundColor Cyan

Write-Host ""
Write-Host "4. Test locally:" -ForegroundColor $Info
Write-Host "   npm run start" -ForegroundColor Cyan

Write-Host ""
Write-Host "5. Deploy to Netlify:" -ForegroundColor $Info
Write-Host "   netlify init" -ForegroundColor Cyan
Write-Host "   netlify deploy --prod" -ForegroundColor Cyan

Write-Host ""
Write-Host "6. Commit to git:" -ForegroundColor $Info
Write-Host "   git add ." -ForegroundColor Cyan
Write-Host "   git commit -m `"feat: add $ArtistName Orbit Hub site`"" -ForegroundColor Cyan
Write-Host "   git push origin main" -ForegroundColor Cyan

Write-Host ""
Write-Host "For more information, see:" -ForegroundColor $Warning
Write-Host "  MULTI-SITE-ARCHITECTURE.md"
Write-Host ""

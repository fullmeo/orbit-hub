#!/bin/bash

################################################################################
# ORBIT Hub - Initialize New Artist Site
#
# Usage:
#   ./init-new-artist-site.sh
#
# This script scaffolds a new artist Orbit Hub site from a template
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        ORBIT Hub - New Artist Site Initialization          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get artist information
echo -e "${YELLOW}Please provide artist information:${NC}\n"

read -p "Artist Name (e.g., Allyson Glado): " ARTIST_NAME
read -p "Artist Slug (e.g., allyson-glado): " ARTIST_SLUG
read -p "Genre (e.g., Reggae-Pop): " GENRE
read -p "Short Bio: " BIO_SHORT
read -p "Tone/Vibe (e.g., chaleureux, inspirant, accessible): " TONE
read -p "Instagram URL (optional): " INSTAGRAM
read -p "Spotify URL (optional): " SPOTIFY
read -p "GA4 Property ID (e.g., G-XXXXXXXXXX): " GA4_ID

# Validate inputs
if [[ -z "$ARTIST_NAME" ]] || [[ -z "$ARTIST_SLUG" ]]; then
    echo -e "${RED}Error: Artist name and slug are required${NC}"
    exit 1
fi

# Directory name
DIR_NAME="${ARTIST_NAME// /_}_orbit-hub"
FULL_DIR=$(pwd)/$DIR_NAME

# Check if directory exists
if [[ -d "$FULL_DIR" ]]; then
    echo -e "${RED}Error: Directory already exists: $DIR_NAME${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Creating new site:${NC}"
echo "  Name: $ARTIST_NAME"
echo "  Slug: $ARTIST_SLUG"
echo "  Directory: $DIR_NAME"
echo ""

# Find template (use orbit-allysonglado as template)
TEMPLATE_DIR="orbit-allysonglado"
if [[ ! -d "$TEMPLATE_DIR" ]]; then
    echo -e "${RED}Error: Template directory not found: $TEMPLATE_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}→${NC} Creating directory..."
mkdir -p "$FULL_DIR"

echo -e "${GREEN}→${NC} Copying template files..."
cp -r "$TEMPLATE_DIR"/* "$FULL_DIR/"
cp "$TEMPLATE_DIR"/.env.example "$FULL_DIR/" 2>/dev/null || true

# Create artist-data.json
echo -e "${GREEN}→${NC} Creating artist-data.json..."
cat > "$FULL_DIR/artist-data.json" << EOF
{
  "nom": "$ARTIST_NAME",
  "slug": "$ARTIST_SLUG",
  "genre": "$GENRE",
  "bioCourte": "$BIO_SHORT",
  "instagram": "$INSTAGRAM",
  "spotify": "$SPOTIFY"
}
EOF

# Update netlify.toml
echo -e "${GREEN}→${NC} Updating netlify.toml..."
cat > "$FULL_DIR/netlify.toml" << EOF
# Netlify configuration - $ARTIST_NAME
[build]
  base = "."
  publish = "."
  functions = "netlify/functions"

[build.environment]
  GA4_PROPERTY_ID = "$GA4_ID"
  ARTIST_NAME = "$ARTIST_NAME"
  ARTIST_TONE = "$TONE"
  ARTIST_BIO = "$BIO_SHORT"
  NODE_ENV = "production"
EOF

# Update .env.example
echo -e "${GREEN}→${NC} Updating .env.example..."
sed -i "s/ARTIST_NAME=.*/ARTIST_NAME=$ARTIST_NAME/" "$FULL_DIR/.env.example"
sed -i "s|ALLOWED_ORIGIN=.*|ALLOWED_ORIGIN=https://$ARTIST_SLUG.netlify.app|" "$FULL_DIR/.env.example"
sed -i "s/ARTIST_BIO=.*/ARTIST_BIO=$BIO_SHORT/" "$FULL_DIR/.env.example"
sed -i "s/ARTIST_TONE=.*/ARTIST_TONE=$TONE/" "$FULL_DIR/.env.example"

echo -e "\n${GREEN}✓ New site created successfully!${NC}\n"

echo -e "${YELLOW}Next steps:${NC}\n"

echo "1. Add to orbit-sites.config.json:"
echo -e "${BLUE}   {${NC}"
echo -e "${BLUE}     \"id\": \"$ARTIST_SLUG\",${NC}"
echo -e "${BLUE}     \"name\": \"$ARTIST_NAME\",${NC}"
echo -e "${BLUE}     \"domain\": \"$ARTIST_SLUG.netlify.app\",${NC}"
echo -e "${BLUE}     \"directory\": \"$DIR_NAME\",${NC}"
echo -e "${BLUE}     \"status\": \"staging\",${NC}"
echo -e "${BLUE}     \"artist\": {${NC}"
echo -e "${BLUE}       \"name\": \"$ARTIST_NAME\",${NC}"
echo -e "${BLUE}       \"genre\": \"$GENRE\",${NC}"
echo -e "${BLUE}       \"bio\": \"$BIO_SHORT\",${NC}"
echo -e "${BLUE}       \"tone\": \"$TONE\",${NC}"
echo -e "${BLUE}       \"instagram\": \"$INSTAGRAM\",${NC}"
echo -e "${BLUE}       \"spotify\": \"$SPOTIFY\"${NC}"
echo -e "${BLUE}     },${NC}"
echo -e "${BLUE}     \"analytics\": {${NC}"
echo -e "${BLUE}       \"ga4PropertyId\": \"$GA4_ID\"${NC}"
echo -e "${BLUE}     },${NC}"
echo -e "${BLUE}     \"features\": [\"fan-chat\", \"music-streaming\", \"social-integration\"]${NC}"
echo -e "${BLUE}   }${NC}"

echo ""
echo "2. Customize content:"
echo -e "${BLUE}   cd $DIR_NAME${NC}"
echo -e "${BLUE}   # Edit index.html, assets, etc.${NC}"

echo ""
echo "3. Install dependencies:"
echo -e "${BLUE}   cd $DIR_NAME${NC}"
echo -e "${BLUE}   npm install${NC}"

echo ""
echo "4. Test locally:"
echo -e "${BLUE}   npm run start${NC}"

echo ""
echo "5. Deploy to Netlify:"
echo -e "${BLUE}   netlify init${NC}"
echo -e "${BLUE}   netlify deploy --prod${NC}"

echo ""
echo "6. Commit to git:"
echo -e "${BLUE}   git add .${NC}"
echo -e "${BLUE}   git commit -m \"feat: add $ARTIST_NAME Orbit Hub site\"${NC}"
echo -e "${BLUE}   git push origin main${NC}"

echo ""
echo -e "${YELLOW}For more information, see:${NC}"
echo "  MULTI-SITE-ARCHITECTURE.md"
echo ""

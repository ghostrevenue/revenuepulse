#!/bin/bash
#
# RevenuePulse Setup Script
# Initializes the app: installs dependencies, sets up database, prints next steps
#

set -e

echo "================================================"
echo " RevenuePulse - Post-Purchase Upsell Engine"
echo "================================================"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "[1/4] Checking Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
echo "      Node.js version: $NODE_VERSION"

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is required but not installed."
    echo "Please install Node.js 20+ from https://nodejs.org"
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is required but not installed."
    exit 1
fi

echo ""
echo "[2/4] Installing dependencies..."
npm install 2>&1 | tail -10

echo ""
echo "[3/4] Creating data directory..."
mkdir -p "$PROJECT_DIR/data"

echo ""
echo "[4/4] Creating environment file..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    cat > "$PROJECT_DIR/.env" << EOF
# RevenuePulse Environment Configuration
# Copy from .env.example and fill in your values

# Shopify API Credentials
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here

# App Configuration
APP_URL=https://your-app-url.ngrok.io
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=./data/revenuepulse.db

# Session Security (generate a random 32-byte hex string)
SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-me-to-random-32-char-string")
EOF
    echo "      Created .env file from template"
    echo "      Please update .env with your Shopify API credentials"
else
    echo "      .env already exists, skipping"
fi

echo ""
echo "================================================"
echo " Setup Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Update your .env file with Shopify API credentials:"
echo "   - SHOPIFY_API_KEY"
echo "   - SHOPIFY_API_SECRET"
echo "   - APP_URL (your public URL)"
echo ""
echo "2. Register your app in Shopify Partner Dashboard"
echo "   - Set App URL to: \${APP_URL}"
echo "   - Set Redirect URL to: \${APP_URL}/api/auth/callback"
echo "   - Enable these API scopes:"
echo "     * read_orders, write_orders"
echo "     * read_products"
echo "     * read_checkouts, write_checkouts"
echo ""
echo "3. Register webhooks in Shopify:"
echo "   - orders/create"
echo "   - orders/updated"
echo "   - app/uninstalled"
echo ""
echo "4. Start the development server:"
echo "   npm start"
echo ""
echo "5. Install the app on your test store:"
echo "   https://\${SHOPIFY_API_KEY}:\${SHOPIFY_API_SECRET}@apps.shopify.com"
echo ""
echo "For checkout extension development:"
echo "   - Run: npm run dev (in another terminal)"
echo "   - Use Shopify CLI to publish extension"
echo ""
echo "================================================"

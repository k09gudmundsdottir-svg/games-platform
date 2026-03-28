#!/bin/bash
# AzureNexus Games — Deployment Script
# Run on Hetzner server: bash deploy.sh

set -e

echo "=== AzureNexus Games — Deployment ==="
echo ""

# 1. DNS Setup reminder
echo "[1] DNS Setup (do this in your DNS provider):"
echo "    games.azurenexus.com      → A → 204.168.189.51"
echo "    video.games.azurenexus.com → A → 204.168.189.51"
echo ""

# 2. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "[2] Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo "[2] Docker already installed"
fi

# 3. Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    echo "[3] Installing Docker Compose..."
    apt-get install -y docker-compose-plugin
else
    echo "[3] Docker Compose already installed"
fi

# 4. Create .env if not exists
if [ ! -f .env ]; then
    echo "[4] Creating .env from example..."
    cp .env.example .env
    echo "    EDIT .env with your actual keys before proceeding!"
    echo "    nano .env"
    exit 1
else
    echo "[4] .env exists"
fi

# 5. Get SSL certificates (first time only)
if [ ! -d nginx/ssl/live/games.azurenexus.com ]; then
    echo "[5] Getting SSL certificates..."

    # Start nginx with HTTP only first (for certbot challenge)
    # Create temporary nginx config without SSL
    mkdir -p nginx/ssl

    # Get certs
    docker run --rm \
        -v $(pwd)/nginx/ssl:/etc/letsencrypt \
        -v certbot-webroot:/var/www/certbot \
        -p 80:80 \
        certbot/certbot certonly --standalone \
        -d games.azurenexus.com \
        -d video.games.azurenexus.com \
        --non-interactive --agree-tos \
        --email admin@azurenexus.com

    echo "    SSL certificates obtained!"
else
    echo "[5] SSL certificates exist"
fi

# 6. Build and start services
echo "[6] Building and starting services..."
docker compose build
docker compose up -d

echo ""
echo "=== Deployment Complete ==="
echo "    Frontend: https://games.azurenexus.com"
echo "    API:      https://games.azurenexus.com/api/health"
echo "    Jitsi:    https://video.games.azurenexus.com"
echo ""
echo "Run 'docker compose logs -f' to view logs"

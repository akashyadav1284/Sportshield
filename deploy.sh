#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SportShield AI - AWS EC2 Bootstrapping Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Usage:
#   1. Provision a fresh Ubuntu 22.04 LTS instance on AWS EC2
#   2. SSH into the instance
#   3. Run: curl -sSL https://raw.githubusercontent.com/<YOUR_USER>/<REPO>/main/deploy.sh | bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}SportShield AI Enterprise - Remote Bootstrapper${NC}"
echo -e "${BLUE}================================================${NC}"

# 1. Update system
echo -e "\n${BLUE}[1/5] Updating base system packages...${NC}"
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git unzip ntp fail2ban ufw

# 2. Configure Firewall (UFW)
echo -e "\n${BLUE}[2/5] Hardening firewall (UFW)...${NC}"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 3. Install Docker Engine
echo -e "\n${BLUE}[3/5] Installing Docker Engine & Compose...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "Docker is already installed."
fi

# 4. Clone / Pull Repository
REPO_DIR="$HOME/sportshield-ai"
if [ ! -d "$REPO_DIR" ]; then
    echo -e "\n${BLUE}[4/5] Preparing environment...${NC}"
    echo -e "${RED}Please clone the repository manually or provide a valid Git URL in this script if private.${NC}"
    # Example: git clone https://github.com/YourOrg/sportshield-ai.git "$REPO_DIR"
    mkdir -p "$REPO_DIR"
else
    echo -e "\n${BLUE}[4/5] Repository directory found. Skipping clone.${NC}"
fi

# 5. Instructions for environment & start
echo -e "\n${BLUE}[5/5] Bootstrapping Complete!${NC}"
echo -e "Follow these steps to launch SportShield:"
echo -e "  1. Exit and reconnect to your SSH session to apply Docker permissions."
echo -e "  2. cd sportshield-ai"
echo -e "  3. cp .env.example .env (Edit the secrets inside!)"
echo -e "  4. docker compose -f docker-compose.prod.yml up -d --build"
echo -e "\n${GREEN}SportShield AI is ready for deployment.${NC}"

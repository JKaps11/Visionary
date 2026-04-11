#!/usr/bin/env bash
# Allow Expo dev server through UFW firewall

set -euo pipefail

EXPO_PORT=8081

echo "Allowing Expo dev server (port $EXPO_PORT) through UFW..."
sudo ufw allow "$EXPO_PORT"/tcp comment "Expo dev server"
sudo ufw allow "$EXPO_PORT" comment "Expo dev server test"
echo "Done. Current UFW status:"
sudo ufw status verbose

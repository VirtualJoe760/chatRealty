#!/bin/bash

# ChatRealty Documentation Sync Script
# Syncs memory-files/ from ChatRealty to agent repositories

set -e

echo "🔄 ChatRealty Documentation Sync"
echo "=================================="
echo ""

# Configuration
CHATREALTY_DIR="F:/web-clients/joseph-sardella/chatRealty"
JPSREALTOR_DIR="F:/web-clients/joseph-sardella/jpsrealtor"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Sync to jpsrealtor
echo -e "${YELLOW}Syncing to jpsrealtor...${NC}"
mkdir -p "$JPSREALTOR_DIR/docs/platform"
cp -r "$CHATREALTY_DIR/memory-files/"* "$JPSREALTOR_DIR/docs/platform/"
echo -e "${GREEN}✓ Synced to jpsrealtor/docs/platform/${NC}"
echo ""

# Commit in jpsrealtor (optional)
read -p "Commit changes in jpsrealtor? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    cd "$JPSREALTOR_DIR"
    git add docs/platform/
    git commit -m "📚 docs: sync from ChatRealty platform" || echo "No changes to commit"
    echo -e "${GREEN}✓ Committed in jpsrealtor${NC}"
fi

echo ""
echo -e "${GREEN}✅ Sync complete!${NC}"
echo ""
echo "Documentation synced to:"
echo "  - jpsrealtor/docs/platform/"
echo ""
echo "Don't forget to push changes:"
echo "  cd jpsrealtor && git push"

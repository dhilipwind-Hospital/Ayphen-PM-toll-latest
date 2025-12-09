#!/bin/bash

echo "🚀 Rebuilding and Restarting Ayphen Jira Application"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend
echo -e "${BLUE}📦 BACKEND: Installing dependencies...${NC}"
cd "/Users/dhilipelango/VS Jira 2/ayphen-jira-backend"
npm install socket.io --save

echo -e "${BLUE}🧹 BACKEND: Cleaning build...${NC}"
rm -rf dist

echo -e "${BLUE}🔨 BACKEND: Building TypeScript...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ BACKEND: Build successful!${NC}"
    echo ""
    echo -e "${YELLOW}Starting backend server...${NC}"
    echo -e "${YELLOW}Run: npm run dev${NC}"
    echo ""
else
    echo -e "${RED}❌ BACKEND: Build failed!${NC}"
    exit 1
fi

# Frontend
echo -e "${BLUE}📦 FRONTEND: Installing dependencies...${NC}"
cd "/Users/dhilipelango/VS Jira 2/ayphen-jira"
npm install socket.io-client --save

echo -e "${BLUE}🧹 FRONTEND: Clearing cache...${NC}"
rm -rf node_modules/.vite

echo -e "${GREEN}✅ FRONTEND: Ready to start!${NC}"
echo ""
echo -e "${YELLOW}Starting frontend dev server...${NC}"
echo -e "${YELLOW}Run: npm run dev${NC}"
echo ""

echo "=================================================="
echo -e "${GREEN}🎉 REBUILD COMPLETE!${NC}"
echo ""
echo "Next steps:"
echo "1. Terminal 1: cd ayphen-jira-backend && npm run dev"
echo "2. Terminal 2: cd ayphen-jira && npm run dev"
echo "3. Open http://localhost:1600 in your browser"
echo ""
echo "Features available:"
echo "✅ Voice Assistant (microphone button on issues)"
echo "✅ AI-Powered Intelligence (natural language, sprint planning)"
echo "✅ Command Palette (Cmd+K or Ctrl+K)"
echo "✅ Inline Editing (click any field to edit)"
echo "✅ Dark Mode (theme toggle in settings)"
echo "✅ Real-Time Collaboration (live editing, presence)"
echo ""
echo "Happy coding! 🚀"

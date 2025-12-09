#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Ayphen Jira Development Environment...${NC}"

# Kill running processes
echo -e "${GREEN}🧹 Cleaning up old processes...${NC}"
pkill -f "ts-node-dev" || true
pkill -f "vite" || true
lsof -ti:8500 | xargs kill -9 2>/dev/null || true
lsof -ti:1600 | xargs kill -9 2>/dev/null || true

# Start Backend
echo -e "${GREEN}backend...${NC}"
cd ayphen-jira-backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
echo -e "${GREEN}⏳ Waiting for backend to be ready...${NC}"
sleep 5

# Start Frontend
echo -e "${GREEN}frontend...${NC}"
cd ../ayphen-jira
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

echo -e "${GREEN}✨ All services started!${NC}"
echo -e "   Backend: http://localhost:8500"
echo -e "   Frontend: http://localhost:1600"
echo -e ""
echo -e "📝 Logs are being written to backend.log and frontend.log"
echo -e "Press Ctrl+C to stop all services"

# Handle script termination
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

# Keep script running
wait

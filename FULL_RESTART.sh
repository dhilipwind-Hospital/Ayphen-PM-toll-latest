#!/bin/bash

# Kill existing node processes to free up ports
echo "Killing existing node processes..."
pkill -f "node" || true

# Backend
echo "Setting up Backend..."
cd "/Users/dhilipelango/VS Jira 2/ayphen-jira-backend"
npm install
npm run build
# Start Backend in background and log to file
nohup npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
echo "Backend started with PID $BACKEND_PID"

# Frontend
echo "Setting up Frontend..."
cd "/Users/dhilipelango/VS Jira 2/ayphen-jira"
npm install
# Start Frontend in background and log to file
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
echo "Frontend started with PID $FRONTEND_PID"

echo "Waiting for servers to stabilize..."
sleep 10

echo "Checking logs..."
tail -n 10 ../backend.log
tail -n 10 ../frontend.log

echo "Done!"

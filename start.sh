#!/bin/bash

# 🎯 Professional Trading System - Quick Start Script

echo "🚀 Starting Professional Trading System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if admin dashboard exists
if [ ! -d "mukulah-ai-admin" ]; then
    echo -e "${RED}❌ Error: mukulah-ai-admin directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Project structure validated${NC}"
echo ""

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠ Warning: Port $1 is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✓ Port $1 is available${NC}"
        return 0
    fi
}

# Check ports
echo "🔍 Checking ports..."
check_port 4000  # Backend
check_port 3001  # Frontend
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
    echo ""
fi

if [ ! -d "mukulah-ai-admin/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd mukulah-ai-admin
    npm install
    cd ..
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
    echo ""
fi

# Check environment variables
echo "🔐 Checking environment variables..."

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ Warning: .env file not found in backend${NC}"
    echo "  Create .env with your API keys (see .env.example)"
fi

if [ ! -f "mukulah-ai-admin/.env.local" ]; then
    echo -e "${YELLOW}⚠ Warning: .env.local not found in frontend${NC}"
    echo "  Creating default .env.local..."
    cat > mukulah-ai-admin/.env.local << EOL
NEXT_PUBLIC_TRADING_API_BASE=http://localhost:4000
NEXT_PUBLIC_DEFAULT_ACCOUNT_ID=1
EOL
    echo -e "${GREEN}✓ Created mukulah-ai-admin/.env.local${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 PROFESSIONAL TRADING SYSTEM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Starting services..."
echo ""
echo "📊 Backend API:       http://localhost:4000"
echo "💻 Admin Dashboard:   http://localhost:3001"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create tmux session
if command -v tmux &> /dev/null; then
    echo "Using tmux for session management..."
    
    # Kill existing session if it exists
    tmux kill-session -t trading 2>/dev/null
    
    # Create new session
    tmux new-session -d -s trading -n backend
    tmux send-keys -t trading:backend "npm run server:dev" C-m
    
    # Create frontend window
    tmux new-window -t trading -n frontend
    tmux send-keys -t trading:frontend "cd mukulah-ai-admin && npm run dev" C-m
    
    echo ""
    echo -e "${GREEN}✓ Started in tmux session 'trading'${NC}"
    echo ""
    echo "📋 Useful commands:"
    echo "  tmux attach -t trading    # Attach to session"
    echo "  tmux kill-session -t trading  # Stop all services"
    echo "  Ctrl+B then D            # Detach from session"
    echo "  Ctrl+B then W            # Switch windows"
    echo ""
    echo "🌐 Opening dashboard in 10 seconds..."
    sleep 10
    
    # Try to open browser
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3001/dashboard
    elif command -v open &> /dev/null; then
        open http://localhost:3001/dashboard
    fi
    
    # Attach to tmux session
    tmux attach -t trading
    
else
    echo -e "${YELLOW}⚠ tmux not found. Starting services directly...${NC}"
    echo ""
    echo "🔧 Install tmux for better session management:"
    echo "  Ubuntu/Debian: sudo apt-get install tmux"
    echo "  MacOS: brew install tmux"
    echo ""
    echo "Starting backend..."
    npm run server:dev &
    BACKEND_PID=$!
    
    echo "Starting frontend..."
    cd mukulah-ai-admin
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo ""
    echo -e "${GREEN}✓ Services started${NC}"
    echo "  Backend PID: $BACKEND_PID"
    echo "  Frontend PID: $FRONTEND_PID"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for both processes
    wait $BACKEND_PID $FRONTEND_PID
fi

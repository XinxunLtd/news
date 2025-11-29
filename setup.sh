#!/bin/bash

echo "=========================================="
echo "Xinxun News - Automated Setup Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Docker
echo -e "${YELLOW}Step 1: Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"
echo ""

# Step 2: Setup environment files
echo -e "${YELLOW}Step 2: Setting up environment files...${NC}"
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓ Created backend/.env${NC}"
else
    echo -e "${GREEN}✓ backend/.env already exists${NC}"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local
    echo -e "${GREEN}✓ Created frontend/.env.local${NC}"
else
    echo -e "${GREEN}✓ frontend/.env.local already exists${NC}"
fi
echo ""

# Step 3: Build and start Docker containers
echo -e "${YELLOW}Step 3: Building and starting Docker containers...${NC}"
docker-compose down
docker-compose build
docker-compose up -d
echo -e "${GREEN}✓ Docker containers started${NC}"
echo ""

# Step 4: Wait for database to be ready
echo -e "${YELLOW}Step 4: Waiting for database to be ready...${NC}"
sleep 10
echo -e "${GREEN}✓ Database should be ready${NC}"
echo ""

# Step 5: Run migrations and seed (automatic via backend startup)
echo -e "${YELLOW}Step 5: Database will be automatically migrated and seeded on first startup...${NC}"
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "=========================================="
echo "Services are starting up:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8080"
echo "  - MySQL: localhost:3306"
echo ""
echo "Default Admin Credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo "=========================================="


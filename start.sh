#!/bin/bash

echo "Starting FlashCard Generator..."
echo ""
echo "This will start:"
echo "  - PostgreSQL database on port 5432"
echo "  - Backend API on port 8000"
echo "  - Frontend on port 3000"
echo ""

docker-compose up --build

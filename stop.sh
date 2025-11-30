#!/bin/bash

echo "Stopping FlashCard Generator..."
docker-compose down

echo ""
echo "To remove all data (including database), run:"
echo "  docker-compose down -v"

#!/bin/bash

# Simple Docker run command for Insurance Platform
# Usage: OPENROUTER_API_KEY=your-key ./run-simple.sh

if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "Please provide your OpenRouter API key:"
    echo "OPENROUTER_API_KEY=your-key ./run-simple.sh"
    exit 1
fi

echo "Building insurance platform..."
docker build -t insurance-platform .

echo "Starting insurance platform with PostgreSQL..."
docker run -d \
  --name insurance-platform \
  -p 5000:5000 \
  -e OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
  insurance-platform

echo "Platform is starting..."
echo "Access your insurance platform at: http://localhost:5000"
echo ""
echo "To view logs: docker logs -f insurance-platform"
echo "To stop: docker stop insurance-platform"
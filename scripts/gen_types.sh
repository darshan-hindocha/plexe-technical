#!/bin/bash
"""Generate TypeScript types from OpenAPI schema."""

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Generating TypeScript types from OpenAPI schema...${NC}"

# Export OpenAPI schema
echo -e "${YELLOW}Step 1: Exporting OpenAPI schema...${NC}"
cd "$(dirname "$0")/.."
python scripts/export_openapi.py

# Check if schema was created
if [ ! -f "backend/openapi.json" ]; then
    echo -e "${RED}Error: OpenAPI schema not found at backend/openapi.json${NC}"
    exit 1
fi

# Generate TypeScript types
echo -e "${YELLOW}Step 2: Generating TypeScript types...${NC}"
cd frontend

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js and npm.${NC}"
    exit 1
fi

# Generate types
npx openapi-typescript ../backend/openapi.json --output src/app/lib/api.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ TypeScript types generated successfully at frontend/src/app/lib/api.ts${NC}"
else
    echo -e "${RED}Error: Failed to generate TypeScript types${NC}"
    exit 1
fi

echo -e "${GREEN}Type generation complete!${NC}" 
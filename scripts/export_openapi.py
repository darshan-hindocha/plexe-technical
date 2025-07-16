#!/usr/bin/env python3
"""Export OpenAPI schema from FastAPI application."""

import json
import sys
import os
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app


def export_openapi_schema():
    """Export OpenAPI schema to JSON file."""
    try:
        # Get OpenAPI schema
        openapi_schema = app.openapi()
        
        # Ensure output directory exists
        output_dir = backend_dir
        output_dir.mkdir(exist_ok=True)
        
        # Write schema to file
        output_file = output_dir / "openapi.json"
        with open(output_file, "w") as f:
            json.dump(openapi_schema, f, indent=2)
        
        print(f"OpenAPI schema exported to: {output_file}")
        return str(output_file)
        
    except Exception as e:
        print(f"Error exporting OpenAPI schema: {e}")
        sys.exit(1)


if __name__ == "__main__":
    export_openapi_schema() 
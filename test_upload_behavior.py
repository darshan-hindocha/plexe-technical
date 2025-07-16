#!/usr/bin/env python3
"""
Test script to verify chat agent behavior with upload requests.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the app directory to the Python path
app_dir = Path(__file__).parent / "backend" / "app"
sys.path.insert(0, str(app_dir))

# Set environment variables for testing
os.environ["DEFAULT_AI_PROVIDER"] = "openai/gpt-4o-mini"
os.environ["OPENAI_API_KEY"] = "test-key"  # You'll need to set a real key


async def test_upload_behavior():
    """Test chat agent behavior with upload requests."""
    print("Testing chat agent upload behavior...")
    
    try:
        from app.services.chat_agent import get_chat_agent
        
        # Create chat agent
        agent = get_chat_agent(verbose=True)
        
        # Test upload request
        print("\n🧪 Testing: 'I want to upload a model'")
        response = await agent.chat("I want to upload a model")
        print(f"Response: {response}")
        
        # Test another upload variation
        print("\n🧪 Testing: 'How do I upload a model file?'")
        response = await agent.chat("How do I upload a model file?")
        print(f"Response: {response}")
        
        print("\n✅ Upload behavior test completed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_upload_behavior()) 
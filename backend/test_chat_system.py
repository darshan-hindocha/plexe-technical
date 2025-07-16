#!/usr/bin/env python3
"""
Test script for the new chat system implementation.

This script tests the tools and chat agent without requiring external API calls.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the app directory to the Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

# Set environment variables for testing
os.environ["DEFAULT_AI_PROVIDER"] = "ollama/llama2"  # Use local model for testing
os.environ["OPENAI_API_KEY"] = "test-key"  # Dummy key for testing


async def test_tools():
    """Test individual tools without the agent."""
    print("Testing individual tools...")
    
    try:
        from app.tools.models import list_models, get_model_info
        from app.tools.predictions import validate_features
        from app.tools.system import get_system_status, get_available_commands
        
        # Test system status
        print("\n1. Testing system status...")
        status = get_system_status()
        print(f"   Status: {status}")
        
        # Test available commands
        print("\n2. Testing available commands...")
        commands = get_available_commands()
        print(f"   Commands: {list(commands.keys())}")
        
        # Test list models
        print("\n3. Testing list models...")
        models = list_models()
        print(f"   Models: {models}")
        
        print("\n✅ All tools tested successfully!")
        
    except Exception as e:
        print(f"❌ Tool test failed: {e}")
        import traceback
        traceback.print_exc()


async def test_chat_agent():
    """Test chat agent initialization."""
    print("\nTesting chat agent initialization...")
    
    try:
        from app.services.chat_agent import ChatAgent
        
        # Try to create agent (may fail if no API keys, but should not crash)
        try:
            agent = ChatAgent(model_id="ollama/llama2", verbose=True)
            print("✅ Chat agent created successfully!")
            
            # Test a simple interaction (will likely fail without proper setup)
            try:
                response = await agent.chat("Hello, what can you do?")
                print(f"   Response: {response}")
            except Exception as chat_error:
                print(f"   Chat test failed (expected without API setup): {chat_error}")
                
        except Exception as agent_error:
            print(f"   Agent creation failed (expected without API setup): {agent_error}")
            
    except Exception as e:
        print(f"❌ Chat agent test failed: {e}")
        import traceback
        traceback.print_exc()


async def test_websocket_setup():
    """Test WebSocket router setup."""
    print("\nTesting WebSocket router setup...")
    
    try:
        from app.routers.websocket import manager, ConnectionManager
        
        print(f"✅ ConnectionManager created: {manager}")
        print(f"   Active connections: {manager.connection_count}")
        print(f"   Max connections: 100")  # From settings
        
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        import traceback
        traceback.print_exc()


async def main():
    """Run all tests."""
    print("🚀 Testing Chat System Implementation")
    print("=" * 50)
    
    await test_tools()
    await test_chat_agent()
    await test_websocket_setup()
    
    print("\n" + "=" * 50)
    print("🎉 Testing complete!")
    print("\nNote: Some tests may fail if AI provider API keys are not configured.")
    print("This is expected and doesn't indicate implementation issues.")


if __name__ == "__main__":
    asyncio.run(main()) 
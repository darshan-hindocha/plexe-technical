"""
WebSocket router for real-time chat communication.

Handles WebSocket connections, message routing, and chat processing.
"""

import json
import logging
from datetime import datetime
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from fastapi.websockets import WebSocketState

from ..services.chat_agent import get_chat_agent, ChatAgent
from ..core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])

# Connection manager to track active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.connection_count = 0
    
    async def connect(self, websocket: WebSocket, client_id: str) -> bool:
        """Accept a WebSocket connection if under limit."""
        if len(self.active_connections) >= settings.websocket_max_connections:
            await websocket.close(code=1008, reason="Too many connections")
            return False
        
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.connection_count += 1
        logger.info(f"WebSocket connected: {client_id} (total: {self.connection_count})")
        return True
    
    def disconnect(self, client_id: str):
        """Remove a WebSocket connection."""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            self.connection_count -= 1
            logger.info(f"WebSocket disconnected: {client_id} (total: {self.connection_count})")
    
    async def send_personal_message(self, message: dict, client_id: str):
        """Send a message to a specific client."""
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            if websocket.client_state == WebSocketState.CONNECTED:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Failed to send message to {client_id}: {e}")
                    self.disconnect(client_id)


# Global connection manager
manager = ConnectionManager()


async def handle_chat_message(websocket: WebSocket, client_id: str, message_data: dict, chat_agent: ChatAgent):
    """Handle incoming chat messages via WebSocket."""
    try:
        message_content = message_data.get("content", "")
        context = message_data.get("context", [])
        
        # Send typing indicator
        await manager.send_personal_message({
            "type": "typing",
            "timestamp": datetime.now().isoformat()
        }, client_id)
        
        # Process the message
        response = await chat_agent.chat(message_content, context=context)
        
        # Send response
        await manager.send_personal_message({
            "type": "message",
            "content": response,
            "timestamp": datetime.now().isoformat()
        }, client_id)
        
    except Exception as e:
        logger.error(f"Error handling chat message from {client_id}: {e}")
        await manager.send_personal_message({
            "type": "error", 
            "content": f"Failed to process message: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }, client_id)


@router.websocket("/ws/chat/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint for chat communication.
    
    Handles real-time messaging between frontend and chat agent.
    """
    # Initialize chat agent
    chat_agent = get_chat_agent(verbose=settings.debug)
    
    # Try to connect
    connected = await manager.connect(websocket, client_id)
    if not connected:
        return
    
    try:
        # Send welcome message
        await manager.send_personal_message({
            "type": "welcome",
            "content": (
                "Hi! I'm your ML assistant. I can help you manage models, make predictions, "
                "and navigate the ML workflow. What would you like to do?"
            ),
            "timestamp": datetime.now().isoformat()
        }, client_id)
        
        # Listen for messages
        while True:
            try:
                # Receive message with timeout
                raw_data = await websocket.receive_text()
                message_data = json.loads(raw_data)
                
                # Validate message structure
                if not isinstance(message_data, dict) or "type" not in message_data:
                    await manager.send_personal_message({
                        "type": "error",
                        "content": "Invalid message format. Expected JSON with 'type' field.",
                        "timestamp": datetime.now().isoformat()
                    }, client_id)
                    continue
                
                # Handle different message types
                message_type = message_data["type"]
                
                if message_type == "chat":
                    await handle_chat_message(websocket, client_id, message_data, chat_agent)
                elif message_type == "ping":
                    await manager.send_personal_message({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }, client_id)
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "content": f"Unknown message type: {message_type}",
                        "timestamp": datetime.now().isoformat()
                    }, client_id)
                    
            except json.JSONDecodeError:
                await manager.send_personal_message({
                    "type": "error",
                    "content": "Invalid JSON format",
                    "timestamp": datetime.now().isoformat()
                }, client_id)
            except Exception as e:
                logger.error(f"Error in WebSocket loop for {client_id}: {e}")
                break
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected normally: {client_id}")
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}")
    finally:
        manager.disconnect(client_id)


@router.get("/ws/status")
async def websocket_status():
    """Get WebSocket connection status."""
    return {
        "active_connections": manager.connection_count,
        "max_connections": settings.websocket_max_connections,
        "service": "WebSocket Chat Service",
        "timestamp": datetime.now().isoformat()
    } 
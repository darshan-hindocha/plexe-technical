"""
Chat Agent service for provider-agnostic ML model management.

This follows the same pattern as plexe's ConversationalAgent, using
decorated tool functions directly with the ToolCallingAgent.
"""

import logging
from typing import Optional, List, Dict, Any
import asyncio

from smolagents import ToolCallingAgent, LiteLLMModel
from ..tools import ALL_TOOLS
from ..core.config import settings
from ..utils.prompt_manager import get_prompt_templates

logger = logging.getLogger(__name__)


class ChatAgent:
    """
    Provider-agnostic conversational agent for ML model management.
    
    This follows the same pattern as plexe's ConversationalAgent, using
    decorated tool functions directly with the ToolCallingAgent.
    """
    
    def __init__(
        self, 
        model_id: Optional[str] = None, 
        verbose: bool = False
    ):
        self.model_id = model_id or settings.default_ai_provider
        self.verbose = verbose
        
        # Set verbosity level
        self.verbosity = 1 if verbose else 0
        
        # Configure API key based on provider
        api_key = None
        if self.model_id.startswith("openai/"):
            api_key = settings.openai_api_key
        elif self.model_id.startswith("anthropic/"):
            api_key = settings.anthropic_api_key
        
        if not api_key:
            raise ValueError(f"API key not configured for provider {self.model_id}")
        
        # Create the agent with all decorated tools and YAML prompt templates
        self.agent = ToolCallingAgent(
            name="MLModelAssistant",
            description=(
                "Expert ML assistant that helps users manage machine learning models, "
                "make predictions, and navigate the ML workflow. Provides guidance on "
                "model deployment, feature requirements, and prediction interpretation. "
                "Can list models, get model information, make predictions, validate features, "
                "check system status, and provide guidance on file uploads. Always provides helpful, "
                "clear responses and guides users through complex ML operations."
            ),
            model=LiteLLMModel(model_id=self.model_id, api_key=api_key),
            tools=ALL_TOOLS,  # Pass decorated functions directly
            add_base_tools=False,
            verbosity_level=self.verbosity,
            prompt_templates=get_prompt_templates(
                base_template_name="toolcalling_agent.yaml",
                override_template_name="conversational_prompt_templates.yaml",
                tools=ALL_TOOLS,
            ),
        )
    
    async def chat(self, message: str, context: Optional[List[Dict[str, Any]]] = None) -> str:
        """
        Process a chat message and return the response.
        
        Args:
            message: User message to process
            context: Optional conversation context (currently not used by smolagents)
            
        Returns:
            Assistant response string
        """
        try:
            # Run the synchronous agent.run in a thread pool since it's not async
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, self.agent.run, message)
            return str(response)
        except Exception as e:
            logger.error(f"Chat processing failed: {str(e)}")
            return f"I encountered an error processing your request: {str(e)}. Please try again or ask for help."


def get_chat_agent(verbose: bool = False) -> ChatAgent:
    """
    Create a chat agent with the configured provider.
    Includes fallback logic if primary provider fails.
    
    Args:
        verbose: Whether to enable verbose logging
        
    Returns:
        Configured ChatAgent instance
    """
    try:
        return ChatAgent(model_id=settings.default_ai_provider, verbose=verbose)
    except Exception as e:
        if settings.fallback_ai_provider:
            logger.warning(
                f"Primary provider {settings.default_ai_provider} failed: {e}. "
                f"Falling back to {settings.fallback_ai_provider}"
            )
            try:
                return ChatAgent(model_id=settings.fallback_ai_provider, verbose=verbose)
            except Exception as fallback_error:
                logger.error(f"Fallback provider also failed: {fallback_error}")
                raise Exception(f"Both primary and fallback providers failed. Primary: {e}, Fallback: {fallback_error}")
        else:
            logger.error(f"Primary provider failed and no fallback configured: {e}")
            raise 
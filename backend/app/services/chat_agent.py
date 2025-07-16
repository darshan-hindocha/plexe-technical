"""
Chat Agent service for provider-agnostic ML model management.

Provides conversational AI interface using smolagents + litellm for multi-provider support.
Implements tool calling pattern with decorated functions for ML operations.

Production TODOs:
- Add conversation memory/context persistence
- Implement user session management
- Add rate limiting per user/session
- Set up monitoring and analytics
- Add conversation logging for debugging
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

    def __init__(self, model_id: Optional[str] = None, verbose: bool = False):
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
            description="ML assistant for model management, predictions, and workflow guidance.",
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

    async def chat(
        self, message: str, context: Optional[List[Dict[str, Any]]] = None
    ) -> str:
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
            logger.error(f"Chat processing failed: {e}")
            return f"Error: {e}"


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
            logger.warning(f"Primary provider failed, using fallback: {e}")
            return ChatAgent(model_id=settings.fallback_ai_provider, verbose=verbose)
        raise

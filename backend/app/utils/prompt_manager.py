"""
Prompt Management Utility for YAML Template System.

This module provides the PromptManager class that handles loading, rendering,
and merging YAML prompt templates using Jinja2 templating.
"""

import yaml
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from jinja2 import Environment, FileSystemLoader, Template
from smolagents import PromptTemplates, PlanningPromptTemplate, ManagedAgentPromptTemplate, FinalAnswerPromptTemplate

logger = logging.getLogger(__name__)


class PromptManager:
    """
    Manager for loading and rendering YAML prompt templates.
    
    This class handles the loading of YAML template files and renders them
    using Jinja2 templating with dynamic context information.
    """
    
    def __init__(self, template_dir: str = "config/prompt_templates"):
        """
        Initialize the PromptManager.
        
        Args:
            template_dir: Directory containing YAML template files
        """
        # Make template_dir relative to the current file's directory
        if not Path(template_dir).is_absolute():
            # Get the directory containing this file (backend/app/utils)
            # Go up to backend/app/ and then to the template directory
            current_file_dir = Path(__file__).parent  # backend/app/utils
            app_dir = current_file_dir.parent  # backend/app
            self.template_dir = app_dir / template_dir
            
            # If that doesn't exist, try relative to current working directory
            if not self.template_dir.exists():
                fallback_dir = Path.cwd() / "backend/app" / template_dir
                if fallback_dir.exists():
                    self.template_dir = fallback_dir
                else:
                    # Final fallback - relative to current working directory
                    self.template_dir = Path.cwd() / template_dir
        else:
            self.template_dir = Path(template_dir)
            
        self.env = Environment(loader=FileSystemLoader(str(self.template_dir)))
        
        # Ensure template directory exists
        self.template_dir.mkdir(parents=True, exist_ok=True)
    
    def get_prompt_template(self, template_name: str) -> Dict[str, Any]:
        """
        Load a YAML template file.
        
        Args:
            template_name: Name of the template file (e.g., "conversational_prompt_templates.yaml")
            
        Returns:
            Dictionary containing the template content
            
        Raises:
            FileNotFoundError: If template file doesn't exist
            yaml.YAMLError: If template file is invalid YAML
        """
        template_path = self.template_dir / template_name
        
        if not template_path.exists():
            raise FileNotFoundError(f"Template file not found: {template_path}")
        
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                content = yaml.safe_load(f)
                if content is None:
                    return {}
                return content
        except yaml.YAMLError as e:
            logger.error(f"Error parsing YAML template {template_name}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error loading template {template_name}: {e}")
            raise
    
    def render_prompt(self, template_content: str, **kwargs) -> str:
        """
        Render a single prompt string with the given context.
        
        Args:
            template_content: The template string to render
            **kwargs: Context variables for template rendering
            
        Returns:
            Rendered template string
        """
        try:
            template = self.env.from_string(template_content)
            return template.render(**kwargs)
        except Exception as e:
            logger.error(f"Error rendering template: {e}")
            raise
    
    def get_prompt_templates(
        self, 
        base_template_name: str = "toolcalling_agent.yaml",
        override_template_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Load and merge base and override templates.
        
        This method follows the plexe pattern of loading a base template
        and optionally merging it with an override template.
        
        Args:
            base_template_name: Name of the base template file
            override_template_name: Name of the override template file
            
        Returns:
            Merged template dictionary
        """
        # Load base template
        try:
            base_template = self.get_prompt_template(base_template_name)
        except FileNotFoundError:
            logger.warning(f"Base template {base_template_name} not found, using empty base")
            base_template = {}
        
        # If no override template, return base template
        if not override_template_name:
            return base_template
        
        # Load override template
        try:
            override_template = self.get_prompt_template(override_template_name)
        except FileNotFoundError:
            logger.warning(f"Override template {override_template_name} not found, using base only")
            return base_template
        
        # Merge templates (override takes precedence)
        merged_template = base_template.copy()
        merged_template.update(override_template)
        
        return merged_template
    
    def render_system_prompt(
        self, 
        template_name: str, 
        tools: list = None, 
        managed_agents: Optional[Dict] = None,
        **kwargs
    ) -> str:
        """
        Render the system prompt from a template with tool and agent context.
        
        Args:
            template_name: Name of the template file
            tools: List of available tools
            managed_agents: Dictionary of managed agents
            **kwargs: Additional context variables
            
        Returns:
            Rendered system prompt string
        """
        # Load template
        template_data = self.get_prompt_template(template_name)
        
        # Get system prompt template
        system_prompt_template = template_data.get('system_prompt', '')
        
        if not system_prompt_template:
            logger.warning(f"No system_prompt found in template {template_name}")
            return ""
        
        # Prepare context
        context = {
            'tools': {tool.name: tool for tool in (tools or [])},
            'managed_agents': managed_agents or {},
            **kwargs
        }
        
        # Render the system prompt
        return self.render_prompt(system_prompt_template, **context)


def get_prompt_templates(
    base_template_name: str = "toolcalling_agent.yaml",
    override_template_name: Optional[str] = None,
    template_dir: str = "config/prompt_templates",
    tools: list = None
) -> PromptTemplates:
    """
    Helper function to get prompt templates following the plexe pattern.
    
    Args:
        base_template_name: Name of the base template file
        override_template_name: Name of the override template file
        template_dir: Directory containing template files
        tools: List of tools to inject into templates
        
    Returns:
        PromptTemplates object for smolagents
    """
    manager = PromptManager(template_dir=template_dir)
    template_dict = manager.get_prompt_templates(base_template_name, override_template_name)
    
    # Render system prompt with tools if provided
    system_prompt = template_dict.get("system_prompt", "")
    if tools and system_prompt:
        # Prepare context for Jinja2 rendering
        context = {
            'tools': {tool.name: tool for tool in tools},
            'managed_agents': {},
        }
        system_prompt = manager.render_prompt(system_prompt, **context)
    
    # Convert to PromptTemplates object expected by smolagents
    planning_dict = template_dict.get("planning", {})
    managed_agent_dict = template_dict.get("managed_agent", {})
    final_answer_dict = template_dict.get("final_answer", {})
    
    return PromptTemplates(
        system_prompt=system_prompt,
        planning=PlanningPromptTemplate(
            initial_plan=planning_dict.get("initial_plan", "Think through the problem step by step."),
            update_plan_pre_messages=planning_dict.get("update_plan_pre_messages", "Let's update the plan."),
            update_plan_post_messages=planning_dict.get("update_plan_post_messages", "Plan updated.")
        ),
        managed_agent=ManagedAgentPromptTemplate(
            task=managed_agent_dict.get("task", "You are working with a team member."),
            report=managed_agent_dict.get("report", "Provide a comprehensive summary.")
        ),
        final_answer=FinalAnswerPromptTemplate(
            pre_messages=final_answer_dict.get("pre_messages", "Let me provide the final answer."),
            post_messages=final_answer_dict.get("post_messages", "This completes the task.")
        )
    ) 
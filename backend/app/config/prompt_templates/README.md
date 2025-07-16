# YAML Template System for Dynamic Agent Prompting

This directory contains the YAML template system implementation for dynamic agent prompting, allowing rapid iteration on agent behavior without code changes.

## Overview

The YAML template system decouples agent instructional logic (personality, rules, and operational guidelines) from the Python application code. This approach enables:

- **Rapid Iteration**: Modify agent behavior by editing YAML files instead of code
- **Version Control**: Track prompt changes alongside code changes
- **Dynamic Context**: Inject runtime information (tools, agents) into prompts
- **Template Inheritance**: Base templates with specific overrides

## Architecture

```
backend/app/config/prompt_templates/
├── toolcalling_agent.yaml              # Base template for any tool-calling agent
├── conversational_prompt_templates.yaml # ML-specific conversational agent
└── README.md                           # This documentation
```

## Files

### `toolcalling_agent.yaml`
Base template containing generic instructions for any tool-calling agent:
- Basic tool calling instructions
- Action/Observation flow
- Tool listing with Jinja2 templating
- Managed agent delegation
- Core rules and guidelines

### `conversational_prompt_templates.yaml`
ML-specific override template with:
- ML model definition assistant personality
- Requirements gathering conversation strategy
- Mandatory requirements before model building
- Domain-specific examples and heuristics

## Template Structure

Each YAML file contains prompt components as keys:

```yaml
system_prompt: |-
  Your main system prompt with Jinja2 templating
  
  Available tools:
  {%- for tool in tools.values() %}
  - {{ tool.name }}: {{ tool.description }}
  {%- endfor %}

managed_agent: |-
  Instructions for working with team members

planning: |-
  Instructions for planning and thinking

final_answer: |-
  Instructions for providing final answers
```

## Jinja2 Templating

Templates support Jinja2 syntax for dynamic content:

### Available Variables
- `tools`: Dictionary of available tools with metadata
- `managed_agents`: Dictionary of managed agents (if any)
- Custom variables passed during rendering

### Example Usage
```yaml
system_prompt: |-
  You have access to these tools:
  {%- for tool in tools.values() %}
  - {{ tool.name }}: {{ tool.description }}
      Inputs: {{ tool.inputs }}
      Output: {{ tool.output_type }}
  {%- endfor %}
  
  {%- if managed_agents %}
  You can also delegate to:
  {%- for agent in managed_agents.values() %}
  - {{ agent.name }}: {{ agent.description }}
  {%- endfor %}
  {%- endif %}
```

## Usage

### In Python Code

```python
from app.utils.prompt_manager import PromptManager, get_prompt_templates

# Method 1: Using PromptManager directly
pm = PromptManager()
templates = pm.get_prompt_templates(
    base_template_name="toolcalling_agent.yaml",
    override_template_name="conversational_prompt_templates.yaml"
)

# Method 2: Using helper function
templates = get_prompt_templates(
    base_template_name="toolcalling_agent.yaml",
    override_template_name="conversational_prompt_templates.yaml"
)

# Method 3: Render system prompt with tools
rendered_prompt = pm.render_system_prompt(
    template_name="conversational_prompt_templates.yaml",
    tools=ALL_TOOLS
)
```

### In ChatAgent Integration

```python
from smolagents import ToolCallingAgent, LiteLLMModel
from app.utils.prompt_manager import get_prompt_templates

agent = ToolCallingAgent(
    name="MLModelAssistant",
    model=LiteLLMModel(model_id="openai/gpt-4o-mini"),
    tools=ALL_TOOLS,
    prompt_templates=get_prompt_templates(
        base_template_name="toolcalling_agent.yaml",
        override_template_name="conversational_prompt_templates.yaml",
    ),
)
```

## Template Inheritance

The system supports template inheritance where:

1. **Base template** (`toolcalling_agent.yaml`) provides common instructions
2. **Override template** (`conversational_prompt_templates.yaml`) provides specific instructions
3. **Merging** combines templates with override taking precedence

```python
# Base template
{
    "system_prompt": "Generic tool calling instructions...",
    "managed_agent": "Generic delegation instructions...",
    "planning": "Generic planning instructions...",
    "final_answer": "Generic final answer instructions..."
}

# Override template
{
    "system_prompt": "ML-specific instructions with personality..."
}

# Merged result
{
    "system_prompt": "ML-specific instructions with personality...",  # Overridden
    "managed_agent": "Generic delegation instructions...",            # From base
    "planning": "Generic planning instructions...",                   # From base
    "final_answer": "Generic final answer instructions..."            # From base
}
```

## Best Practices

### Template Design
1. **Keep base templates generic** - Common instructions for any agent
2. **Make overrides specific** - Domain-specific personality and rules
3. **Use clear section headers** - `## CRITICAL:`, `### MANDATORY:`, etc.
4. **Include examples** - Show expected behavior patterns

### Jinja2 Templating
1. **Use safe filters** - `{{ variable | default('') }}`
2. **Check for existence** - `{% if variable %}...{% endif %}`
3. **Iterate safely** - `{% for item in items %}...{% endfor %}`
4. **Format consistently** - Proper indentation and spacing

### Content Organization
1. **Logical flow** - Preamble → Tools → Role → Rules → Examples
2. **Numbered rules** - Clear, actionable instructions
3. **Explicit constraints** - "NEVER do X", "ALWAYS do Y"
4. **Context-aware** - Adjust behavior based on available tools

## Troubleshooting

### Common Issues

1. **Template not found**
   ```
   FileNotFoundError: Template file not found: path/to/template.yaml
   ```
   - Check file path and name
   - Ensure template directory exists

2. **YAML parsing error**
   ```
   yaml.YAMLError: Error parsing YAML template
   ```
   - Validate YAML syntax
   - Check indentation and special characters

3. **Jinja2 rendering error**
   ```
   jinja2.exceptions.TemplateError: Error rendering template
   ```
   - Check variable names and syntax
   - Ensure all referenced variables exist

4. **Missing prompt templates**
   ```
   Some prompt templates are missing: {'managed_agent', 'planning', 'final_answer'}
   ```
   - Add missing template keys to base template
   - Ensure all required templates are defined

### Testing

Run the template system tests:
```bash
cd backend
python -c "
from app.utils.prompt_manager import PromptManager
from app.tools import ALL_TOOLS
pm = PromptManager()
rendered = pm.render_system_prompt('conversational_prompt_templates.yaml', tools=ALL_TOOLS)
print('Template system working:', len(rendered) > 0)
"
```

## Extending the System

### Adding New Templates

1. Create new YAML file in this directory
2. Define required prompt components
3. Use Jinja2 templating for dynamic content
4. Test with PromptManager

### Adding New Variables

1. Modify the rendering context in `PromptManager.render_system_prompt()`
2. Update template files to use new variables
3. Test rendering with new context

### Custom Template Loaders

Extend `PromptManager` to support:
- Remote template loading
- Database-stored templates
- Encrypted templates
- Template versioning

## Integration with Plexe Architecture

This implementation follows the plexe pattern:

1. **ToolCallingAgent** - Uses smolagents for core intelligence
2. **Template System** - YAML-based prompt management
3. **Tool Integration** - Dynamic tool listing and descriptions
4. **Provider Agnostic** - Works with any LiteLLM-supported provider

The system is designed to be compatible with existing plexe workflows while providing the flexibility needed for rapid agent development and iteration. 
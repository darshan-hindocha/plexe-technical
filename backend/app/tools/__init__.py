"""Import all tools for easy registration with agents."""

from .models import list_models, get_model_info, delete_model, find_model_by_name, get_model_versions
from .predictions import make_prediction, validate_features, predict_with_model_name
from .files import get_upload_guidance, validate_file_for_upload
from .system import get_system_status, get_available_commands, get_usage_examples

# List of all available tools for agent registration
ALL_TOOLS = [
    list_models,
    get_model_info, 
    delete_model,
    find_model_by_name,
    get_model_versions,
    make_prediction,
    predict_with_model_name,
    validate_features,
    get_upload_guidance,
    validate_file_for_upload,
    get_system_status,
    get_available_commands,
    get_usage_examples,
] 
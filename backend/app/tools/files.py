"""
File management tools for the chat system.

These tools handle file guidance and validation, directing users to proper upload interfaces.
"""

import logging
from smolagents import tool

logger = logging.getLogger(__name__)


@tool
def get_upload_guidance() -> dict:
    """
    Provide guidance on how to upload model files to the system.
    
    Returns:
        Information about the upload process and interface
    """
    return {
        "message": "To upload a model file, please use the Upload tab in the web interface. The system supports .pkl and .joblib files up to the configured size limit.",
        "supported_formats": [".pkl", ".joblib"],
        "upload_interface": "Use the Upload tab in the web interface - it supports drag-and-drop and file selection",
        "requirements": "Model files must be trained scikit-learn models saved as .pkl or .joblib files"
    }


@tool
def validate_file_for_upload(file_name: str, file_size: int) -> dict:
    """
    Validate a file before upload to check if it meets requirements.
    NOTE: This only validates - it does not perform actual uploads.
    
    Args:
        file_name: Name of the file to validate
        file_size: Size of the file in bytes
        
    Returns:
        Validation result with any issues or requirements
    """
    try:
        from ..core.config import settings
        
        # Check file extension
        allowed_extensions = settings.allowed_extensions
        file_extension = f".{file_name.split('.')[-1].lower()}"
        
        if file_extension not in allowed_extensions:
            return {
                "valid": False,
                "message": f"File type '{file_extension}' not supported. Allowed types: {allowed_extensions}",
                "file_name": file_name,
                "upload_guidance": "Use the Upload tab in the web interface to upload supported files"
            }
        
        # Check file size
        if file_size > settings.max_file_size:
            return {
                "valid": False,
                "message": f"File too large ({file_size} bytes). Maximum size: {settings.max_file_size} bytes",
                "file_name": file_name,
                "upload_guidance": "Use the Upload tab in the web interface to upload smaller files"
            }
        
        return {
            "valid": True,
            "message": "File meets requirements and can be uploaded via the Upload tab",
            "file_name": file_name,
            "file_size": file_size,
            "upload_guidance": "Use the Upload tab in the web interface to complete the upload"
        }
    except Exception as e:
        logger.error(f"File validation failed for {file_name}: {str(e)}")
        return {
            "valid": False,
            "message": f"Validation failed: {str(e)}",
            "file_name": file_name,
            "upload_guidance": "Use the Upload tab in the web interface to upload files"
        } 
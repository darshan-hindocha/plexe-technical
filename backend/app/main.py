from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .core.config import settings
from .routers import models, predict, websocket

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI instance
app = FastAPI(
    title=settings.app_name,
    description="ML Model Management and Prediction Service",
    version="1.0.0",
    debug=settings.debug,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(models.router, prefix=settings.api_v1_prefix)
app.include_router(predict.router, prefix=settings.api_v1_prefix)
app.include_router(websocket.router, prefix=settings.api_v1_prefix)


@app.on_event("startup")
async def startup_event():
    """Log startup information and API key status."""
    logger.info("🚀 Starting Plexe ML Model Service")
    logger.info("📊 Frontend: http://localhost:3000")
    logger.info("🔗 Backend API: http://localhost:8000")
    logger.info("📚 API Docs: http://localhost:8000/docs")

    # Check API key configuration
    api_keys_configured = []
    if settings.openai_api_key:
        api_keys_configured.append("OpenAI")
    if settings.anthropic_api_key:
        api_keys_configured.append("Anthropic")

    if api_keys_configured:
        logger.info(f"✅ API Keys configured: {', '.join(api_keys_configured)}")
        logger.info("💬 Chat functionality is available")
    else:
        logger.warning("⚠️  No API keys configured!")
        logger.warning("💬 Chat functionality will not work without API keys")
        logger.warning("📖 See README.md for setup instructions")
        logger.warning(
            "🔑 Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable"
        )
        logger.warning("🆓 Or use Ollama locally (see README.md)")

    logger.info("✨ Core features available without API keys:")
    logger.info("   • Model upload and management")
    logger.info("   • REST API predictions")
    logger.info("   • Swagger UI testing")


@app.get("/")
async def root():
    """Root endpoint with service information."""
    api_key_status = (
        "configured"
        if (settings.openai_api_key or settings.anthropic_api_key)
        else "not configured"
    )

    return {
        "message": "Plexe ML Model Service",
        "version": "1.0.0",
        "docs": "/docs",
        "api_prefix": settings.api_v1_prefix,
        "chat_available": api_key_status == "configured",
        "api_key_status": api_key_status,
        "setup_info": {
            "core_features": "Available without API keys (upload, predict, API)",
            "chat_features": f"API keys {api_key_status} - see README.md for setup",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": settings.app_name}

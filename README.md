# Plexe ML Model Service

A conversational AI interface for ML model management that lets users upload XGBoost models and request predictions through a chat interface.

## tldr

copy over `backend/env.example` to `backend/.env`, then add anthropic api and open ai api in that .env file

then run

`make dev`

from project root dir

example XGBoost models available at `backend/sample_models/`, generated from a script (instructions below)

## Product Showcase
#### Chat example

<img width="900" height="887" alt="Chat" src="https://github.com/user-attachments/assets/d030e64b-4a2c-4697-afdc-06478ace8a65" />

#### Posthog dashboard example

<img width="900" height="937" alt="posthog" src="https://github.com/user-attachments/assets/cdd68405-dd71-49ea-9e78-ef8674ed03a3" />

#### Model Card example

<img width="900" height="876" alt="Model Cards" src="https://github.com/user-attachments/assets/eaf48c63-a8e6-47d7-8e05-adf5888c0321" />

#### Model API Docs example

<img width="900" height="860" alt="Model API Docs" src="https://github.com/user-attachments/assets/899bb429-3821-4479-8ff4-687fe4afbcc4" />

#### Model Details Page

<img width="900" height="891" alt="Model Details" src="https://github.com/user-attachments/assets/a08937f6-cbe5-4b80-b132-fddbfdfb0d27" />

Model Upload Flow

<img width="900" height="855" alt="Model Upload Flow" src="https://github.com/user-attachments/assets/f09a1a56-86dd-4689-ad0a-f8d355ada631" />


## 🚀 Quick Evaluation (for Reviewers)

**Core functionality works immediately without setup:**
```bash
docker-compose up  # Start the service
make verify        # Test upload → predict workflow
```
**Chat requires API keys** (OpenAI/Anthropic) - see setup below.

## 🚀 Features

- **Chat Interface**: Natural language interaction for model management and predictions
- **Model Upload**: Drag-and-drop upload for XGBoost models (.pkl, .joblib)
- **Real-time Predictions**: Make predictions through chat or direct API calls
- **Model Management**: View, deploy, and manage multiple models
- **Auto-discovery**: Automatic feature detection and model type identification
- **REST API**: Full RESTful API with OpenAPI documentation
- **Type Safety**: Generated TypeScript types for frontend-backend communication

## 🏗️ Architecture

```
plexe-inference/
├── backend/              # FastAPI service
│   ├── app/
│   │   ├── main.py      # FastAPI instance
│   │   ├── core/        # Configuration and dependencies
│   │   ├── schemas/     # Pydantic models
│   │   ├── services/    # Business logic
│   │   ├── routers/     # API endpoints
│   │   └── tests/       # Test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/            # Next.js application
│   ├── src/app/
│   │   ├── components/  # React components
│   │   ├── lib/         # API client and types
│   │   └── page.tsx     # Main page
│   ├── Dockerfile
│   └── package.json
├── scripts/             # Utility scripts
├── docker-compose.yml   # Container orchestration
└── Makefile            # Development commands
```

## 📋 Prerequisites

- **Docker & Docker Compose** (recommended)
- **Python 3.10+** (for local development)
- **Node.js 18+** (for local development)

## ⚠️ **IMPORTANT: API Key Requirement**

**The chat functionality requires AI provider API keys to work properly.**

You have three options:

### Option 1: OpenAI (Recommended)
```bash
export OPENAI_API_KEY="sk-your-openai-api-key-here"
```

### Option 2: Anthropic (Alternative)
```bash
export ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key-here"
```

### Option 3: Local Ollama (Free, requires setup)
```bash
# Install Ollama first: https://ollama.ai/
ollama pull llama2
export DEFAULT_AI_PROVIDER="ollama/llama2"
```

**Without API keys:**
- ✅ Model upload and management works fully
- ✅ Predictions via API work fully  
- ✅ Web interface works fully
- ❌ Chat functionality will show "API key not configured" errors

## 🚀 Quick Start

### Step 1: Set up API Keys (Required for Chat)

Choose one option and set the environment variable:

```bash
# Option A: OpenAI (Recommended)
export OPENAI_API_KEY="sk-your-openai-api-key-here"

# Option B: Anthropic (Alternative)  
export ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key-here"

# Option C: Local Ollama (Free but requires local setup)
# First install Ollama from https://ollama.ai/
ollama pull llama2
export DEFAULT_AI_PROVIDER="ollama/llama2"
```

### Step 2: Start the Application

#### Option 1: Docker (Recommended)

```bash
# Clone and start the application
git clone <repository-url>
cd plexe-inference

# Start with Docker Compose (includes your environment variables)
make dev
# or: docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

**⚠️ If you see "API key not configured" errors:**
1. Stop the application (Ctrl+C)
2. Set up API keys as shown in Step 1
3. Restart with `make dev`

### Step 3: Verify Setup (Optional)

Test that core functionality works without API keys:

```bash
# In a new terminal (keep the app running)
make verify
# or: python verify_setup.py
```

This verifies:
- ✅ Model upload and deployment  
- ✅ REST API predictions
- ✅ Model management
- ✅ End-to-end workflow

**Note:** Chat functionality requires API keys from Step 1.

#### Option 2: Local Development

```bash
# Set up API keys (same as Step 1 above)
export OPENAI_API_KEY="sk-your-openai-api-key-here"
# or your preferred provider

# Install dependencies
make install

# Start backend (Terminal 1)
make backend

# Start frontend (Terminal 2)
make frontend
```

## 🔧 Development Commands

```bash
make help            # Show all available commands
make dev             # Start development environment with Docker
make install         # Install all dependencies
make backend         # Start only backend service
make frontend        # Start only frontend service
make gen-types       # Generate TypeScript types from OpenAPI
make test            # Run all tests
make lint            # Run linting
make clean           # Clean up generated files
```

## 📝 Usage Examples

### 1. Upload a Model

**Via Chat:**
```
User: "I want to deploy my customer churn model"
Assistant: "Great! Please upload your model file..."
```

**Via Upload Interface:**
- Navigate to Upload tab
- Drag & drop your .pkl or .joblib file
- Add name and description
- Click "Upload Model"

### 2. Make Predictions

**Via Chat:**
```
User: "Make a prediction using customer_churn with {tenure: 24, monthly_charges: 70, total_charges: 1680}"
Assistant: "Prediction for customer_churn:
• Prediction: 0
• Probability: 23.4%
• Confidence: Low"
```

**Via API:**
```bash
curl -X POST "http://localhost:8000/api/v1/models/{model_id}/predict" \
  -H "Content-Type: application/json" \
  -d '{"features": {"tenure": 24, "monthly_charges": 70, "total_charges": 1680}}'
```

### 3. List Available Models

**Via Chat:**
```
User: "Show me available models"
Assistant: "Available models:
• customer_churn (ID: a1b2c3d4...) - deployed
• price_model (ID: e5f6g7h8...) - deployed"
```

**Via API:**
```bash
curl http://localhost:8000/api/v1/models
```

## 🧪 Sample Models

Create sample models for testing:

```bash
# Generate sample XGBoost models
cd backend && source .venv/bin/activate
python ../scripts/create_sample_model.py
```

This creates three sample models:
1. **Customer Churn** (classifier): `tenure`, `monthly_charges`, `total_charges`
2. **Price Prediction** (regressor): `quality_score`, `brand_value`, `market_demand`
3. **Sentiment Analysis** (classifier): `word_count`, `positive_words`, `negative_words`

## 📡 API Documentation

### Core Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/v1/models/upload` | POST | Upload model file |
| `/api/v1/models` | GET | List all models |
| `/api/v1/models/{id}` | GET | Get model details |
| `/api/v1/models/{id}/predict` | POST | Make prediction |
| `/api/v1/models/chat` | POST | Chat for model management |
| `/api/v1/predict/chat` | POST | Chat for predictions |

### Model Upload

```bash
curl -X POST "http://localhost:8000/api/v1/models/upload" \
  -F "file=@model.pkl" \
  -F "name=my_model" \
  -F "description=My awesome model"
```

### Prediction Request

```bash
curl -X POST "http://localhost:8000/api/v1/models/{model_id}/predict" \
  -H "Content-Type: application/json" \
  -d '{"features": {"feature1": 1.0, "feature2": 2.0}}'
```

### Chat Interface

```bash
curl -X POST "http://localhost:8000/api/v1/models/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me available models"}'
```

## 🧪 Testing

### Run Tests
```bash
make test
```

### Manual Testing Workflow

1. **Start the application**:
   ```bash
   make dev
   ```

2. **Upload a model**:
   - Go to http://localhost:3000
   - Navigate to Upload tab
   - Upload a sample model

3. **Test core functionality (works without API keys)**:
   - Model upload and preview
   - Model list and details
   - Direct API predictions via Swagger UI
   - All REST API endpoints

4. **Test chat interface (requires API keys)**:
   - Go to Chat tab
   - Try: "Show me available models"
   - Try: "Make a prediction using [model_name] with {feature1: value1}"

5. **Test API directly**:
   - Visit http://localhost:8000/docs
   - Use Swagger UI to test endpoints

### Testing Without API Keys

**Core functionality works fully without API keys:**
- ✅ Model upload, preview, and management
- ✅ REST API predictions  
- ✅ Swagger UI testing
- ✅ All non-chat features

**To test everything:**
1. Test upload → predict workflow via API first
2. Set up API keys to test chat functionality
3. Run automated tests: `make test`

## 🔧 Configuration

### Environment Variables

**Backend (.env in backend/ directory):**
```env
DEBUG=true
MODELS_STORAGE_PATH=./storage/models
MAX_FILE_SIZE=104857600  # 100MB
```

**Frontend (.env.local in frontend/ directory):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Model Requirements

- **Format**: `.pkl` or `.joblib` files
- **Library**: XGBoost models (XGBClassifier, XGBRegressor)
- **Size**: Max 100MB
- **Features**: Must have consistent feature names

## 🏗️ Deployment

### Production Build
```bash
make build
```

### Docker Deployment
```bash
# Build production images
docker-compose -f docker-compose.yml build

# Start in production mode
docker-compose -f docker-compose.yml up -d
```

## 🛠️ Development

### Project Structure
- **Backend**: FastAPI with Pydantic validation
- **Frontend**: Next.js 14 with Tailwind CSS
- **State Management**: React hooks
- **Type Safety**: Generated TypeScript types from OpenAPI
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

### Code Generation
```bash
# Generate TypeScript types from OpenAPI schema
make gen-types
```

### Adding New Features

1. **Backend**: Add routes in `backend/app/routers/`
2. **Frontend**: Add components in `frontend/src/app/components/`
3. **Types**: Run `make gen-types` to update TypeScript types
4. **Tests**: Add tests in respective `tests/` directories

## 🤝 Example Interactions

### Natural Language Examples

```
User: "Deploy the customer churn model"
→ Guides user to upload interface

User: "Show me available models"
→ Lists all deployed models with status

User: "What inputs does the sentiment model need?"
→ Shows required features for the model

User: "Make a prediction using price_model with {quality_score: 8.5, brand_value: 3.2, market_demand: 0.7}"
→ Returns predicted price with confidence

User: "I want to predict customer churn for someone with 24 months tenure, $70 monthly charges, and $1680 total charges"
→ Parses request and returns churn probability
```

## 📈 Performance & Limitations

### Performance
- **Model Loading**: Cached in memory after first use
- **Prediction Latency**: < 100ms for typical XGBoost models
- **Concurrent Users**: Handles multiple users with shared model cache

### Limitations
- **Model Types**: Currently supports XGBoost only
- **File Size**: 100MB limit per model
- **Storage**: Local filesystem (can be extended to cloud storage)
- **Authentication**: Not implemented (add for production use)

## 🐛 Troubleshooting

### API Key Issues (Most Common)

1. **"API key not configured for provider" error**: 
   - Set your API key: `export OPENAI_API_KEY="sk-your-key"`
   - Restart the application after setting the key
   - Check the key is valid and has credits/access

2. **Chat shows connection errors**:
   - Verify your API key has sufficient credits
   - Try switching providers: `export ANTHROPIC_API_KEY="sk-ant-your-key"`
   - For free option: Set up Ollama locally

3. **"Primary provider failed" messages**:
   - Check your internet connection
   - Verify API key is still valid
   - The system will try fallback providers automatically

### Other Common Issues

4. **"Model not found" error**: Ensure model is uploaded and deployed
5. **"Missing features" error**: Check feature names match exactly
6. **Upload fails**: Verify file format (.pkl or .joblib) and size < 100MB
7. **Backend won't start**: Check if port 8000 is already in use

### Logs
```bash
# View application logs
make docker-logs

# Backend logs only
docker logs plexe-api

# Frontend logs only
docker logs plexe-frontend
```

## 📄 License

This project is created for the Plexe technical assignment.

## 🙋‍♂️ Support

For questions or issues:
1. Check the API documentation at http://localhost:8000/docs
2. Review the console logs for error messages
3. Ensure all dependencies are installed correctly 

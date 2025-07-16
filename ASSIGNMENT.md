Plexe Technical Assignment
Overview
Build a service with a chat UI that lets the user (a) upload a machine learning model binary,
and (b) request predictions from the model. This assignment tests your ability to create
conversational AI interfaces for ML model management.
Task Description
Create a locally runnable web service with a chat user interface that:
1. 2. 3. Accepts model binary “uploads” for XGBoost models
Creates and runs a REST API endpoint for the model uploaded by the user
Makes predictions using the model when asked and presents the predictions in the
chat
Core Requirements
1. Basic Requirements
●
●
The application should be locally executable
The application should be structured as a web service that exposes a graphical UI
over HTTP
2. Chat Interface
●
●
●
●
Create a web-based conversational UI
Handle natural language requests for model “deployment” and predictions
Provide clear, helpful responses and error handling
Support commands like:
○
"Deploy the customer churn model"
○
"Make a prediction using the price model with [data]"
○
"Show me available models"
○
"What inputs does the sentiment model need?"
3. Model Upload & Storage
●
Accept serialized XGBoost model files (.pkl, .joblib)
4. Model Deployment
●
●
Deploy models to a REST API endpoint
API endpoint can be called to request model predictions
5. Prediction Interface
●
●
●
●
Accept prediction requests through chat
Parse input data from natural language or structured formats
Return predictions in a readable format
Handle edge cases and validation errors gracefully
Technical Specifications
Supported Model Types
●
●
XGBoost: XGBClassifier, XGBRegressor models
File formats: .pkl, .joblib
Expected Input/Output
●
●
Input: Model binary files, chat messages, prediction data
Output: Deployment confirmations, prediction results, model information
Deliverables
1. Source code with clear setup instructions
2. README with:
○
Setup and run instructions
○
Example usage scenarios
○
API documentation (if applicable)
○
Any assumptions or limitations
3. Sample models or instructions for testing
Example Interactions
None
User: "I want to deploy my customer churn model"
Assistant: "Great! Please upload your model file. I'll need to
know what input features it expects.
"
User: [uploads churn_model.pkl]
Assistant: "Perfect! I've loaded your XGBoost model. I can see
it expects features: tenure, monthly_charges, total_charges.
The model is now deployed at /api/predict/churn. How would you
like to test it?"
User: "Make a prediction for a customer with 24 months tenure,
$70 monthly charges, and $1680 total charges"
Assistant: "Running prediction... This customer has a 23%
probability of churning (Low Risk). The model confidence is
high based on the feature values.
"
Time Expectation
The assignment is designed to take about 6 hours - please don't feel you need to spend
longer than that. We are not expecting a production-grade application, we just want to see
how you approach the problem.
Bonus Features (Optional)
●
●
●
●
Model performance metrics display
Batch prediction support
Managing multiple models and handling model versioning/updates
Generate API documentation for deployed models
Submission
We kindly ask that you submit the assignment within 7 days of receiving it. Please include all
deliverables in a single zip file or Git repository.
Questions?
If you have any questions about the requirements or need clarification, please don't hesitate
to reach out.
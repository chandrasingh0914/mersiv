# mersiv FastAPI Backend

Backend API server for mersiv 3D Store Viewer built with FastAPI and Socket.IO.

## Features

- RESTful API for store management
- Socket.IO for real-time collaboration
- MongoDB integration with Motor (async)
- CORS support for frontend integration
- Automatic API documentation (Swagger/OpenAPI)

## Installation

1. Create virtual environment:
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
Create `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/mersiv
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
SECRET_KEY=your-secret-key
PORT=8000
```

4. Run the server:
```bash
uvicorn app.main:socket_app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### Stores
- `GET /api/stores` - List all stores
- `GET /api/stores/{id}` - Get store by ID
- `POST /api/stores` - Create new store
- `PATCH /api/stores/{id}` - Update model position
- `PUT /api/stores/{id}` - Update entire store
- `DELETE /api/stores/{id}` - Delete store

### Widget
- `GET /api/widget/config?domain=X` - Get widget config by domain

### Health
- `GET /` - API info
- `GET /health` - Health check

## Socket.IO Events

### Client → Server
- `join-store(storeId)` - Join store room
- `leave-store(storeId)` - Leave store room
- `model-position-update({storeId, modelId, position})` - Update position

### Server → Client
- `user-count({count})` - User count update
- `store-full({message})` - Store capacity reached
- `model-position-changed({modelId, position})` - Position updated by other user

## Documentation

Interactive API docs available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
mersiv-backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app & Socket.IO setup
│   ├── config.py            # Configuration settings
│   ├── database.py          # MongoDB connection
│   ├── models.py            # Pydantic models
│   ├── socket_manager.py    # Socket.IO event handlers
│   └── routes/
│       └── stores.py        # Store API routes
├── requirements.txt
├── .env
└── README.md
```

## Development

Run with auto-reload:
```bash
uvicorn app.main:socket_app --reload
```

## Production

Use gunicorn with uvicorn workers:
```bash
pip install gunicorn
gunicorn app.main:socket_app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```


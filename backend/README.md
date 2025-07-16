# Choosy FastAPI Backend

This is the FastAPI backend for Choosy, providing direct database access and better performance than the Supabase PostgREST API.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Get Database Connection String
1. Go to your Supabase dashboard
2. Settings → Database
3. Copy the connection string
4. Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://postgres.yyvfddsmunrsduihpegt:your_password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

### 3. Run the Backend
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Test the Backend
```bash
python test_fastapi.py
```

## API Endpoints

### Health Check
- `GET /` - Health check
- `GET /test` - Database connection test

### Users
- `POST /users` - Create user
- `GET /users` - Get all users

### Plans
- `POST /plans` - Create plan
- `GET /plans` - Get all plans

### Events
- `POST /events` - Create event

### Votes
- `POST /votes` - Create vote

## Benefits of FastAPI

1. **Better Performance** - Direct database access
2. **More Control** - Custom business logic
3. **Type Safety** - Pydantic models
4. **Auto Documentation** - Swagger UI at `/docs`
5. **Better Error Handling** - Custom error responses

## Next Steps

1. Update Next.js API routes to call FastAPI instead of Supabase
2. Add authentication middleware
3. Add real-time features with WebSockets
4. Add rate limiting and caching 
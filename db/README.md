# Database Tests for Choosy

Simple and efficient database tests for the Choosy app.

## Test Files

- `test/database-test.js` - Tests Supabase connection and basic CRUD operations
- `schemas/tables.sql` - Database table definitions
- `schemas/rls-policies.sql` - Row Level Security policies

## Running Tests

### Database Test Only
```bash
node db/test/database-test.js
```

### Backend Test Only
```bash
cd backend
python test_backend.py
```

### All Tests
```bash
python test_all.py
```

## What the Tests Check

### Database Test (`database-test.js`)
- ✅ Supabase connection
- ✅ Basic CRUD operations (Create, Read, Update, Delete)
- ✅ Frontend-backend integration
- ✅ Query performance

### Backend Test (`test_backend.py`)
- ✅ FastAPI server health
- ✅ Database connectivity through API
- ✅ Plan creation and retrieval
- ✅ Vote creation
- ✅ Results retrieval

### Full System Test (`test_all.py`)
- ✅ Backend functionality
- ✅ Database connectivity
- ✅ Frontend accessibility

## Requirements

- Node.js for database tests
- Python with httpx for backend tests
- Supabase credentials in environment variables
- FastAPI server running on port 8000
- Next.js frontend running on port 3000

## Quick Start

1. Start the backend: `cd backend && python main.py`
2. Start the frontend: `npm run dev`
3. Run tests: `python test_all.py` 
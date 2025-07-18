# Choosy

A social group decision-making app using Next.js, TypeScript, Tailwind CSS, FastAPI, and Supabase Postgres.

---

## ✅ Setup Checklist (Completed)
- [x] Set up Supabase Postgres database
- [x] Set up FastAPI backend with SQLAlchemy
- [x] Connected backend to Supabase DB
- [x] Automated backend tests (plan, event, vote, results)
- [x] Automated database and API health checks
- [x] Environment variables loaded from `.env`
- [x] All core backend happy-path tests pass
- [x] Location detection and auto-fill functionality
- [x] Real location-based event recommendations

---

## 🗺️ Location Services Setup

Choosy uses **completely free** location services - no API keys required!

### Free Services Used
- **OpenStreetMap Nominatim**: For geocoding (zip code ↔ coordinates)
- **OpenStreetMap Overpass API**: For finding real places and points of interest
- **Browser Geolocation API**: For detecting user's current location

### Features Enabled
- **Auto-location detection**: Users can click 📍 to auto-fill their zip code
- **City display**: Shows "Miami, FL" or "London, UK" under zip code input  
- **Real events**: Backend fetches actual places near the user's location
- **International support**: Works with postal codes from any country
- **No API costs**: Completely free to use with generous rate limits

---

## Running Tests

### Database Test Only
```bash
node db/test/database-test.js
```

### Backend Test Only
```bash
cd backend
python3 test_backend.py
```

### All Tests
```bash
python3 test_all.py
```

---

## What the Tests Check

### Database Test (`database-test.js`)
- Supabase connection
- Basic CRUD operations (Create, Read, Update, Delete)
- Frontend-backend integration
- Query performance

### Backend Test (`test_backend.py`)
- FastAPI server health
- Database connectivity through API
- Plan creation and retrieval
- Event creation (direct DB insert)
- Vote creation (with real plan/event IDs)
- Results retrieval

### Full System Test (`test_all.py`)
- Backend functionality
- Database connectivity
- Frontend accessibility

---

## Next Steps: Database Security, Safety, and Efficiency

To further improve the security, safety, and efficiency of the Choosy database, consider the following:

- Review and lock down Row Level Security (RLS) policies
    - Ensure only authorized users can read/write their own data
    - Test RLS with both valid and invalid tokens
- Enforce strict data validation at the DB level
    - Add CHECK constraints, NOT NULL, and foreign keys
    - Use ENUMs for fields like topic, vote_type, etc.
- Audit and minimize DB permissions
    - Remove public access, use service roles for backend
    - Rotate and store DB credentials securely
- Add automated tests for error/edge cases
    - Invalid input, duplicate votes, missing fields, unauthorized access
- Add tests for authentication and protected endpoints
    - `/token`, `/users/me`, etc.
- Add tests for reservation and admin endpoints
- Implement and test rate limiting/throttling
    - Prevent abuse of API endpoints
- Monitor and optimize query performance
    - Add indexes for frequent queries
    - Use EXPLAIN ANALYZE to find slow queries
- Automate test data cleanup
    - Remove test plans/events after tests
- Set up regular DB backups and monitoring
    - Use Supabase/Cloud tools for automated backups
    - Monitor for suspicious activity
- Document all DB schemas, policies, and test coverage

---

For more details or to contribute, see the code and documentation in each subdirectory.

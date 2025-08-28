# API Documentation

REST API for Choosy event planning platform.

## Base URL
```
http://localhost:8000
```

## Authentication
Include Bearer token in Authorization header:
```
Authorization: Bearer <token>
```

## Key Endpoints

### Plans
- `POST /api/plans/simple` - Create plan
- `GET /api/plans/{id}` - Get plan details
- `GET /api/plans/{id}/events` - Get plan events

### Events
- `GET /api/events` - Find events by location
- `POST /api/plans/{id}/events` - Set plan events

### Voting
- `POST /api/votes` - Cast vote
- `GET /api/plans/{id}/results` - Get results

## Interactive Documentation
Visit `http://localhost:8000/docs` for complete API documentation with interactive testing.
# Choosy API Documentation

## Overview

Choosy is an intelligent event planning platform that uses AI to provide personalized event recommendations. This API enables users to create plans, discover events, vote on options, and get AI-powered suggestions.

## Base URL

```
http://localhost:8000
```

## Authentication

Most endpoints require authentication via Bearer token. Include the token in the Authorization header:

```
Authorization: Bearer <session_token>
```

## Core Endpoints

### User Management

#### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "phone": "+1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

#### Login User
```http
POST /api/users/login
Content-Type: application/json

{
  "phone": "+1234567890"
}
```

Response:
```json
{
  "success": true,
  "session_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user_data": {
    "id": "user-uuid",
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "gamification": {
      "points": 0,
      "level": 1,
      "streak": 0,
      "achievements": []
    }
  }
}
```

### Plan Management

#### Create Plan
```http
POST /api/plans
Content-Type: application/json

{
  "topic": "adventure",
  "group_size": "group",
  "zip_code": "10001",
  "host_name": "John Doe",
  "host_phone": "+1234567890",
  "custom_events": []
}
```

Response:
```json
{
  "plan_id": "plan-uuid",
  "events": [
    {
      "id": "event-uuid",
      "name": "Escape Room Adventure",
      "image": "https://example.com/image.jpg",
      "venue": "Escape Room NYC",
      "address": "123 Main St, New York, NY",
      "phone": "+1234567890",
      "hours": "10:00 AM - 10:00 PM",
      "price": "$25 per person",
      "votes_count": 0
    }
  ]
}
```

#### Get Plan Events
```http
GET /api/plans/{plan_id}/events
```

#### Get Plan Results
```http
GET /api/plans/{plan_id}/results
```

### Voting

#### Cast Vote
```http
POST /api/votes
Content-Type: application/json

{
  "plan_id": "plan-uuid",
  "event_id": "event-uuid",
  "voter_id": "voter-phone",
  "vote_type": "like"
}
```

### AI Recommendations

#### Get Personalized Recommendations
```http
GET /api/users/recommendations?category=adventure&limit=10
Authorization: Bearer <session_token>
```

Response:
```json
{
  "success": true,
  "recommendations": [
    {
      "event_id": "event-uuid",
      "name": "VR Gaming Experience",
      "category": "adventure",
      "confidence_score": 0.85,
      "reasoning": "Loves adventure events | Has enjoyed VR before",
      "personalization_factors": [
        "Category preference: adventure (0.85)",
        "History: 3/4 positive interactions",
        "Popularity: 12 votes"
      ]
    }
  ]
}
```

#### Record Event Interaction
```http
POST /api/users/interactions
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "event_id": "event-uuid",
  "interaction_type": "liked",
  "interaction_data": {
    "context": "browsing_adventure"
  }
}
```

### Gamification

#### Get User Stats
```http
GET /api/users/stats
Authorization: Bearer <session_token>
```

Response:
```json
{
  "success": true,
  "stats": {
    "points": 150,
    "level": 3,
    "streak": 5,
    "achievements": ["first_plan", "adventure_seeker"],
    "total_plans_created": 8,
    "total_votes_cast": 25,
    "categories_explored": 6
  }
}
```

#### Get Achievements
```http
GET /api/users/achievements
Authorization: Bearer <session_token>
```

#### Get Leaderboard
```http
GET /api/users/leaderboard?limit=10
```

### Event Discovery

#### Get Events by Location
```http
GET /api/events?zip_code=10001&category=adventure
```

## Event Categories

- `adventure` - Escape rooms, VR gaming, axe throwing
- `foodie` - Restaurants, food tours, cooking classes
- `nightlife` - Bars, clubs, live music
- `sports` - Games, fitness, outdoor activities
- `art` - Museums, galleries, workshops
- `comedy` - Stand-up, improv, comedy clubs
- `family` - Kid-friendly activities
- `wellness` - Yoga, spa, meditation
- `shopping` - Malls, markets, boutiques
- `movies` - Theaters, drive-ins, film festivals

## AI Features

### Learning System
The AI learns from user interactions:
- **Likes/Dislikes**: Strong preference signals
- **Votes**: Moderate preference signals
- **Views**: Weak preference signals
- **Attendance**: Very strong positive signals
- **Sharing**: Social preference signals

### Personalization Factors
- Category preferences (40% weight)
- Historical interactions (30% weight)
- Event popularity (20% weight)
- Time-based factors (10% weight)

### Gamification System
- **Points**: Earned for all interactions
- **Levels**: Based on total points
- **Streaks**: Daily activity tracking
- **Achievements**: Milestone rewards

## Error Responses

```json
{
  "detail": "Error message",
  "status_code": 400
}
```

Common status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limits

- 100 requests per minute per user
- 1000 requests per hour per user

## Webhooks

Coming soon: Real-time notifications for plan updates and AI insights. 
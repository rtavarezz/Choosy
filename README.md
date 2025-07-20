# Choosy - Smart Event Planning Platform

## Overview

Choosy is an event planning platform that helps users discover, vote on, and plan events with personalized recommendations. Built with modern technologies and intelligent learning systems.

## 🏗️ Architecture

```
Choosy/
├── api/                    # API documentation & examples
│   ├── README.md          # Complete API documentation
│   └── examples.py        # Python API usage examples
├── backend/               # FastAPI backend
│   ├── core/              # Main application logic
│   │   ├── main.py        # FastAPI app & core endpoints
│   │   ├── user_endpoints.py  # User management endpoints
│   │   └── auth_system.py # Authentication system
│   ├── engines/           # Recommendation & gamification engines
│   │   ├── ai_recommendation_engine.py  # Personalized recommendations
│   │   └── gamification_engine.py       # Points & achievements
│   ├── services/          # External service integrations
│   │   ├── global_event_apis.py  # Event discovery APIs
│   │   ├── location_services.py  # Location-based services
│   │   └── geocoding_service.py  # Address geocoding
│   ├── utils/             # Utility scripts & tools
│   └── requirements.txt   # Python dependencies
├── database/              # Database schema & migrations
│   ├── README.md          # Database documentation
│   ├── schemas/           # Table definitions
│   ├── migrations/        # Database migrations
│   └── queries/           # Common queries
├── frontend/              # Next.js frontend
│   ├── README.md          # Frontend documentation
│   ├── pages/             # Next.js pages
│   ├── styles/            # CSS & styling
│   ├── lib/               # Frontend utilities
│   └── package.json       # Node.js dependencies
├── docs/                  # Project documentation
├── scripts/               # Utility scripts
└── README.md              # This file
```

## 🚀 Features

### Core Functionality
- **Event Discovery**: Find events from multiple sources (Eventbrite, Ticketmaster, etc.)
- **Group Voting**: Tinder-like voting interface for group decisions
- **Real-time Results**: Live voting results and winner announcements
- **Location-based**: Events filtered by ZIP code and proximity

### Personalized Recommendations
- **Smart Suggestions**: Learn from user behavior and preferences
- **Preference Tracking**: Tracks likes, votes, and interactions
- **Smart Ranking**: Events ranked by personalization score
- **Context Awareness**: Considers time, location, and social factors

### Gamification System
- **Points System**: Earn points for all interactions
- **Level Progression**: Level up based on activity
- **Achievements**: Unlockable milestones and badges
- **Leaderboards**: Social competition and rankings
- **Daily Streaks**: Encourage consistent usage

### User Management
- **Phone-based Auth**: Simple phone number login
- **Session Management**: Secure 30-day sessions
- **Profile Management**: User preferences and settings
- **Data Privacy**: User-controlled data and deletion

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Primary database with Supabase
- **SQLAlchemy**: Database ORM
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server

### Frontend
- **Next.js**: React framework with SSR
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first styling
- **React Hooks**: State management

### Recommendation System
- **Personalization Engine**: User preference learning
- **Learning Algorithms**: Preference updating based on interactions
- **Pattern Recognition**: User behavior analysis
- **Smart Scoring**: Multi-factor event ranking

### External APIs
- **Eventbrite**: Event discovery
- **Ticketmaster**: Ticket sales and events
- **Google Places**: Venue information
- **OpenStreetMap**: Location data

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL database
- Supabase account

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn core.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Setup
```bash
# Apply migrations
cd database
psql $DATABASE_URL -f schemas/tables.sql
psql $DATABASE_URL -f migrations/add_user_features.sql
```

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost/choosy

# External APIs
EVENTBRITE_API_KEY=your_eventbrite_key
TICKETMASTER_API_KEY=your_ticketmaster_key
GOOGLE_PLACES_API_KEY=your_google_key

# Security
JWT_SECRET_KEY=your_jwt_secret
```

## 📚 Documentation

- **[API Documentation](api/README.md)**: Complete API reference
- **[Database Documentation](database/README.md)**: Schema and queries
- **[Frontend Documentation](frontend/README.md)**: Component architecture
- **[Development Guide](docs/DEVELOPMENT.md)**: Development setup

## 🧪 Testing

### Run All Tests
```bash
python scripts/test_all.py
```

### Backend Tests
```bash
cd backend
python -m pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment
```bash
# Build Docker image
docker build -t choosy-backend ./backend

# Deploy to cloud
docker run -p 8000:8000 choosy-backend
```

### Frontend Deployment
```bash
cd frontend
npm run build
npm run export
```

### Database Deployment
- Use Supabase for managed PostgreSQL
- Apply migrations via Supabase dashboard
- Configure RLS policies for security

## 🧠 Recommendation Features

### Personalization Engine
The recommendation system learns from user interactions:
- **Explicit Feedback**: Likes, dislikes, votes
- **Implicit Feedback**: Views, time spent, sharing
- **Contextual Learning**: Time, location, social factors
- **Continuous Improvement**: Real-time preference updates

### Learning Algorithm
```python
# Personalization scoring
score = (
    category_preference * 0.4 +
    historical_interactions * 0.3 +
    event_popularity * 0.2 +
    time_factors * 0.1
)
```

### Gamification System
- **Points**: 5-25 points per interaction
- **Levels**: Based on total points (100 points per level)
- **Achievements**: 10+ unlockable achievements
- **Streaks**: Daily activity tracking

## 📊 Analytics

### Key Metrics
- **User Engagement**: Daily active users, session duration
- **Event Discovery**: Events per plan, category distribution
- **Voting Patterns**: Vote distribution, participation rates
- **AI Performance**: Recommendation accuracy, user satisfaction
- **Gamification**: Achievement unlock rates, retention

### Data Collection
- User interactions and preferences
- Event performance and popularity
- AI learning effectiveness
- Gamification engagement

## 🔒 Security

### Data Protection
- **Encryption**: All data encrypted at rest and in transit
- **Authentication**: Secure session-based auth
- **Authorization**: Row-level security policies
- **Privacy**: User-controlled data and deletion

### API Security
- **Rate Limiting**: 100 requests/minute per user
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Secure error responses
- **CORS**: Configured for frontend access

## 🚀 Roadmap

### Phase 1: Core Platform ✅
- [x] Event discovery and voting
- [x] User authentication
- [x] Basic AI recommendations
- [x] Gamification system

### Phase 2: Advanced AI 🚧
- [ ] Collaborative filtering
- [ ] Real-time learning
- [ ] Predictive modeling
- [ ] Social recommendations

### Phase 3: Social Features 📋
- [ ] Friend connections
- [ ] Group planning
- [ ] Social sharing
- [ ] Community features

### Phase 4: Monetization 📋
- [ ] Premium features
- [ ] Event partnerships
- [ ] Data insights
- [ ] Advertising platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: Check the docs folder
- **Issues**: Create GitHub issues
- **Discussions**: Use GitHub discussions
- **Email**: support@choosy.app

---

Built with ❤️ for better event planning

# Choosy

A group decision-making platform for event planning. Discover events, vote as a group, and find the perfect activity together.

## Features

- **Event Discovery**: Find local events from multiple sources
- **Group Voting**: Swipe-style interface for group decisions  
- **Real-time Results**: Live voting with instant winners
- **Location-based**: Events filtered by your area

## Tech Stack

- **Backend**: FastAPI, PostgreSQL, SQLAlchemy
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **APIs**: Eventbrite, Ticketmaster, OpenStreetMap

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python start_server.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Setup
Copy `backend/main.env.example` to `backend/main.env` and add your API keys.

## Development

- Backend runs on `http://localhost:8000`
- Frontend runs on `http://localhost:3000`
- Uses SQLite for local development

## License

MIT License
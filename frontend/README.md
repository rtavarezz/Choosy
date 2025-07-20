# Choosy Frontend

## Overview

The Choosy frontend is built with Next.js, React, and TypeScript, providing a modern, responsive interface for event planning with AI-powered recommendations.

## Tech Stack

- **Framework**: Next.js 12
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + Context
- **Authentication**: Session-based with Bearer tokens
- **UI Components**: Custom components with Tailwind

## Project Structure

```
frontend/
├── pages/                 # Next.js pages
│   ├── _app.tsx          # App wrapper with providers
│   ├── index.tsx         # Landing page
│   ├── create.tsx        # Plan creation
│   ├── vote/
│   │   └── [planId].tsx  # Voting interface
│   ├── results/
│   │   └── [planId].tsx  # Results display
│   └── api/              # API routes
├── styles/
│   └── globals.css       # Global styles
├── lib/                  # Utilities and helpers
├── components/           # Reusable components
└── hooks/               # Custom React hooks
```

## Key Features

### 1. Plan Creation
- **Topic Selection**: 16 different event categories
- **Group Size**: Solo, date, friend, group
- **Location**: ZIP code based event discovery
- **Real-time Event Loading**: Instant event suggestions

### 2. Voting Interface
- **Swipe Cards**: Tinder-like voting experience
- **Event Details**: Rich event information display
- **Vote Tracking**: Real-time vote counting
- **Progress Indicators**: Visual voting progress

### 3. Results Display
- **Winner Announcement**: Clear winning event display
- **Vote Breakdown**: Detailed voting statistics
- **Contact Information**: Easy access to venue details
- **Sharing**: Social media integration

### 4. AI Integration
- **Personalized Recommendations**: AI-powered suggestions
- **Learning Feedback**: User interaction tracking
- **Confidence Scores**: AI reasoning display
- **Preference Learning**: Continuous improvement

### 5. Gamification
- **Points System**: Earn points for interactions
- **Achievements**: Unlockable milestones
- **Leaderboards**: Social competition
- **Progress Tracking**: Visual level progression

## Component Architecture

### Core Components

#### EventCard
```typescript
interface EventCardProps {
  event: Event;
  onVote: (vote: 'like' | 'dislike') => void;
  showVoteButtons?: boolean;
  isVoting?: boolean;
}
```

#### PlanCreator
```typescript
interface PlanCreatorProps {
  onSubmit: (plan: PlanData) => void;
  loading?: boolean;
}
```

#### VotingInterface
```typescript
interface VotingInterfaceProps {
  planId: string;
  events: Event[];
  onVoteComplete: () => void;
}
```

#### ResultsDisplay
```typescript
interface ResultsDisplayProps {
  planId: string;
  results: VotingResults;
}
```

### State Management

#### User Context
```typescript
interface UserContextType {
  user: User | null;
  login: (phone: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
```

#### Plan Context
```typescript
interface PlanContextType {
  currentPlan: Plan | null;
  events: Event[];
  votes: Vote[];
  createPlan: (data: PlanData) => Promise<void>;
  voteOnEvent: (eventId: string, vote: VoteType) => Promise<void>;
}
```

## API Integration

### Authentication
```typescript
// Login user
const loginUser = async (phone: string) => {
  const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  return response.json();
};
```

### Plan Management
```typescript
// Create plan
const createPlan = async (planData: PlanData) => {
  const response = await fetch('/api/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(planData)
  });
  return response.json();
};
```

### AI Recommendations
```typescript
// Get personalized recommendations
const getRecommendations = async (category?: string) => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  
  const response = await fetch(`/api/users/recommendations?${params}`, {
    headers: { 'Authorization': `Bearer ${sessionToken}` }
  });
  return response.json();
};
```

## Styling System

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B'
      },
      animation: {
        'swipe-left': 'swipeLeft 0.3s ease-out',
        'swipe-right': 'swipeRight 0.3s ease-out'
      }
    }
  }
};
```

### Component Styling
```typescript
// Example component with Tailwind
const EventCard: React.FC<EventCardProps> = ({ event, onVote }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <img 
        src={event.image} 
        alt={event.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-900">{event.name}</h3>
        <p className="text-gray-600 mt-2">{event.venue}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">{event.price}</span>
          <div className="flex space-x-2">
            <button 
              onClick={() => onVote('dislike')}
              className="px-4 py-2 bg-red-500 text-white rounded-lg"
            >
              👎
            </button>
            <button 
              onClick={() => onVote('like')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg"
            >
              👍
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Performance Optimizations

### Image Optimization
- Next.js Image component for automatic optimization
- Lazy loading for better performance
- Responsive images for different screen sizes

### Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting
- Component-level lazy loading

### Caching Strategy
- SWR for data fetching and caching
- Local storage for user preferences
- Session storage for temporary data

## Responsive Design

### Mobile-First Approach
```css
/* Base styles for mobile */
.event-card {
  @apply w-full max-w-sm mx-auto;
}

/* Tablet styles */
@media (min-width: 768px) {
  .event-card {
    @apply max-w-md;
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .event-card {
    @apply max-w-lg;
  }
}
```

### Touch Interactions
- Swipe gestures for voting
- Touch-friendly button sizes
- Haptic feedback on mobile

## Accessibility

### ARIA Labels
```typescript
<button 
  aria-label="Vote like for this event"
  onClick={() => onVote('like')}
>
  👍
</button>
```

### Keyboard Navigation
- Tab navigation support
- Keyboard shortcuts for voting
- Focus management

### Screen Reader Support
- Semantic HTML structure
- Descriptive alt text
- ARIA live regions for updates

## Testing Strategy

### Unit Tests
- Component testing with React Testing Library
- Hook testing with custom test utilities
- Utility function testing

### Integration Tests
- API integration testing
- User flow testing
- Cross-browser compatibility

### E2E Tests
- Critical user journeys
- Mobile responsiveness
- Performance testing

## Deployment

### Build Process
```bash
npm run build
npm run export  # Static export
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Choosy
```

### Deployment Platforms
- Vercel (recommended)
- Netlify
- AWS Amplify
- Custom server

## Future Enhancements

### Planned Features
- Real-time notifications
- Push notifications
- Offline support
- Progressive Web App (PWA)
- Social features
- Advanced AI insights

### Performance Goals
- Lighthouse score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Core Web Vitals compliance 
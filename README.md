# Choosy - Group Decision Making App

A social group decision-making app inspired by Tinder/Hinge swipe mechanics. Friends create plans, add activity options, and vote by swiping through curated local events.

## 🚀 Features

- **Smart Event Recommendations** - Location-based event suggestions per topic
- **Group Size Optimization** - Solo, date night (2 people), or group (3+ people) experiences
- **Swipe Interface** - Tinder-style card swiping for voting
- **Random Generators** - "Choose for me" buttons for topic and event selection
- **Contact Integration** - Direct phone calls and contact info for winning events
- **15-Minute Timer** - Creates urgency and time pressure
- **Anonymous Voting** - localStorage-based voter IDs

## 🛠️ Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Animations**: Framer Motion, React Spring
- **Swipe**: react-tinder-card
- **Backend**: Supabase (ready for integration)
- **Deployment**: Vercel

## 📱 Topics Available

- 🎤 Concerts
- 🌃 Nightlife  
- 🍽️ Foodie
- 💕 Date Night
- 🏀 Sports
- 🌳 Parks
- 🏎️ Go Karting
- 🏊 Swimming
- 🍹 Fun Drinks

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📁 Project Structure

```
Choosy/
├── pages/
│   ├── index.tsx          # Landing page
│   ├── create.tsx         # Plan creation flow
│   ├── vote/[planId].tsx  # Voting interface
│   ├── results/[planId].tsx # Results display
│   └── api/
│       ├── createPlan.ts  # Plan creation API
│       ├── getResults.ts  # Results fetching API
│       └── voteOption.ts  # Vote recording API
├── styles/
│   └── globals.css        # Global styles
└── lib/
    └── supabaseClient.ts  # Supabase configuration
```

## 🎯 Core Workflows

### 1. Plan Creation
- Select topic (concerts, nightlife, etc.)
- Choose group size (solo, date, group)
- Enter zip code for location
- Add phone number for sharing
- Optionally add custom events

### 2. Voting Interface
- Swipe right to vote ✅, left to skip ❌
- Manual buttons for precise control
- Random "Choose for me" generator
- 15-minute voting timer
- Real-time friend avatars with vote status

### 3. Results Display
- Winner announcement with trophy
- Complete contact information
- Direct "Call Now" button
- Share functionality
- Option to create new plans

## 🔧 Development

### Environment Setup
```bash
# Create .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Key Dependencies
```json
{
  "react-tinder-card": "^1.4.0",
  "framer-motion": "^10.16.4",
  "@react-spring/web": "^9.7.3"
}
```

## 🎨 UI/UX Features

- **Mobile-First Design** - Optimized for phone usage
- **Gradient Backgrounds** - Purple to blue gradients
- **Glass Morphism** - Backdrop blur effects
- **Smooth Animations** - Framer Motion transitions
- **Responsive Cards** - Swipeable event cards
- **Timer Display** - Countdown with urgency

## 🔮 Future Enhancements

- [ ] Supabase integration for real data
- [ ] Real-time voting updates
- [ ] Push notifications
- [ ] Event booking integration
- [ ] Social sharing features
- [ ] User authentication
- [ ] Event recommendations API

## 📊 Mock Data Structure

Events are organized by topic and group size:
```typescript
MOCK_EVENTS = {
  concerts: {
    solo: [...],
    date: [...],
    group: [...]
  },
  // ... other topics
}
```

## 🚀 Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## 📝 License

MIT License - feel free to use this code for your own projects!

---

**Built with ❤️ for making group decisions easier and more fun!**

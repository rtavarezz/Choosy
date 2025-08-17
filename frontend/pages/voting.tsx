import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import TinderCard from 'react-tinder-card';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneInput from 'react-phone-input-2/lib/lib';
import 'react-phone-input-2/lib/style.css';
import { Filter } from 'bad-words';
import { EventCard } from '@/components/EventCard';
import { Dialog, DialogTrigger, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

// Add CSS styles for swipe animations and gamification
const swipeStyles = `
  .swipe-right {
    transform: translateX(100px) rotate(15deg) scale(1.05) !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 20px 40px rgba(34, 197, 94, 0.3) !important;
  }
  
  .swipe-left {
    transform: translateX(-100px) rotate(-15deg) scale(0.95) !important;
    transition: all 0.3s ease !important;
    opacity: 0.7 !important;
  }
  
  .swipe-card-active {
    will-change: transform;
    transform-style: preserve-3d;
  }

  .trending-badge {
    background: linear-gradient(45deg, #ff6b6b, #ffa500);
    animation: pulse 2s infinite;
  }

  .social-hint {
    background: linear-gradient(45deg, #667eea, #764ba2);
    animation: fadeInOut 3s ease-in-out;
  }

  .lucky-spin {
    animation: spin 0.6s ease-in-out;
  }

  .voter-avatar {
    background: linear-gradient(45deg, #667eea, #764ba2);
    animation: bounce 2s infinite;
  }

  .group-progress {
    background: linear-gradient(90deg, #667eea, #764ba2);
    animation: shimmer 2s infinite;
  }

  .waiting-animation {
    animation: pulse 1.5s ease-in-out infinite;
  }

  .confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    background: #ff6b6b;
    animation: confetti-fall 3s linear infinite;
  }

  .personalized-badge {
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    animation: glow 2s ease-in-out infinite alternate;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translateY(-10px); }
    50% { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }

  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }

  @keyframes confetti-fall {
    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }

  @keyframes glow {
    from { box-shadow: 0 0 5px #ff6b6b, 0 0 10px #ff6b6b, 0 0 15px #ff6b6b; }
    to { box-shadow: 0 0 10px #4ecdc4, 0 0 20px #4ecdc4, 0 0 30px #4ecdc4; }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = swipeStyles;
  document.head.appendChild(style);
}

// Social hints for FOMO
const SOCIAL_HINTS = [
  "👀 Some friends liked this one...",
  "🔥 Getting good vibes here",
  "💫 This one's popular tonight",
  "✨ Hidden gem alert!",
  "🎯 Your group might love this",
  "🌟 Trending in your area"
];

// Trending badges
const TRENDING_BADGES = [
  "🔥 Hot Pick",
  "⭐ Top Rated", 
  "💎 Hidden Gem",
  "🎉 Popular Choice",
  "🌟 Trending"
];

// Topic-specific image collections
const TOPIC_IMAGES = {
  food: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1504674900240-9c69b0c9e763?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'
  ],
  drinks: [
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
  ],
  coffee: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&h=300&fit=crop'
  ],
  dessert: [
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'
  ],
  concerts: [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'
  ],
  movies: [
    'https://images.unsplash.com/photo-1489599839928-6745cdb1223a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1489599839928-6745cdb1223a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1489599839928-6745cdb1223a?w=400&h=300&fit=crop'
  ],
  sports: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
  ],
  outdoors: [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop'
  ],
  adventure: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop'
  ],
  shopping: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'
  ],
  comedy: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop'
  ],
  gaming: [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop'
  ],
  art: [
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8a?w=400&h=300&fit=crop'
  ],
  music: [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'
  ],
  wellness: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
  ],
  education: [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop'
  ],
  nightlife: [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop'
  ],
  culture: [
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8a?w=400&h=300&fit=crop'
  ],
  technology: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop'
  ],
  fitness: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
  ],
  pets: [
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=300&fit=crop'
  ],
  family: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop'
  ],
  romance: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop'
  ],
  solo: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop'
  ]
};

// Default images for unknown categories
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
];

const getTopicEmoji = (topic: string) => {
  const emojiMap: { [key: string]: string } = {
    food: '🍕',
    drinks: '🍹',
    coffee: '☕',
    dessert: '🍰',
    concerts: '🎵',
    movies: '🎬',
    sports: '⚽',
    outdoors: '🌲',
    adventure: '🏔️',
    shopping: '🛍️',
    comedy: '🎭',
    gaming: '🎮',
    art: '🎨',
    music: '🎵',
    wellness: '🧘',
    education: '📚',
    nightlife: '🌙',
    culture: '🏛️',
    technology: '💻',
    fitness: '💪',
    pets: '🐕',
    family: '👨‍👩‍👧‍👦',
    romance: '💕',
    solo: '🧍'
  };
  return emojiMap[topic] || '🎯';
};

// Get topic-specific image
const getTopicImage = (eventIndex: number, eventTopic?: string) => {
  const topicKey = eventTopic || 'comedy'; // Default to comedy if no topic
  const images = TOPIC_IMAGES[topicKey] || DEFAULT_IMAGES;
  return images[eventIndex % images.length];
};

interface Event {
  id: string;
  name: string; // Backend returns 'name' not 'title'
  description: string;
  image: string; // Backend returns 'image' not 'image_url'
  venue: string;
  address: string;
  price: string;
  external_url: string;
  source_type: string; // Backend returns 'source_type' not 'source'
  reviews: { count: number; stars: number }; // Backend returns object, not number
  metadata: any;
  topic: string;
  contact: { phone: string };
}

interface VotingStatus {
  plan_id: string;
  topic: string;
  group_size: string;
  host_name: string;
  max_voters: number;
  completed_voters: number;
  total_voters: number;
  total_events: number;
  voting_limit_reached: boolean;
  can_vote: boolean;
}

interface ActiveVoter {
  name: string;
  joined_at: string;
  time_remaining: number;
}

export default function VotingPage() {
  const router = useRouter();
  const { planId, creator } = router.query;
  
  // Redirect to new voting page
  useEffect(() => {
    if (router.isReady && planId) {
      const newRoute = `/vote/${planId}${creator ? '?creator=true' : ''}`;
      router.replace(newRoute);
      return;
    }
  }, [router.isReady, planId, creator, router]);

  // If redirecting, show loading
  if (router.isReady && planId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Redirecting to new voting interface...</p>
        </div>
      </div>
    );
  }

  // State
  const [deck, setDeck] = useState<Event[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voterName, setVoterName] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [votingLimitReached, setVotingLimitReached] = useState(false);
  const [expectedVoters, setExpectedVoters] = useState(2);
  const [completedVoters, setCompletedVoters] = useState(0);
  const [allVotersCompleted, setAllVotersCompleted] = useState(false);
  const [activeVoters, setActiveVoters] = useState<ActiveVoter[]>([]);
  const [currentVoterId, setCurrentVoterId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [allCardsSwiped, setAllCardsSwiped] = useState(false);
  const [topic, setTopic] = useState('comedy'); // Added state for topic
  const [nameError, setNameError] = useState(''); // Name validation error
  
  // Track form submission attempts
  const [submissionAttempts, setSubmissionAttempts] = useState(0);
  const [lastSubmittedName, setLastSubmittedName] = useState('');
  const [lastSubmittedPhone, setLastSubmittedPhone] = useState('');
  
  // Gamification state
  const [showSocialHint, setShowSocialHint] = useState(false);
  const [currentSocialHint, setCurrentSocialHint] = useState('');
  const [isLuckySpinning, setIsLuckySpinning] = useState(false);
  const [luckyMessage, setLuckyMessage] = useState('');
  const [showLuckyMessage, setShowLuckyMessage] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPersonalizedBadge, setShowPersonalizedBadge] = useState(false);
  const [showQuickFeedback, setShowQuickFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [waitingForFriends, setWaitingForFriends] = useState(false);
  const [availablePowerUps, setAvailablePowerUps] = useState({
    revealPopularity: true,
    luckyDraw: true
  });
  const [showPowerUpModal, setShowPowerUpModal] = useState(false);
  
  // Refs
  const childRefs = useRef<{ [key: number]: any }>({});
  const lastDirection = useRef<string>('');
  const canSwipe = useRef<boolean>(true);
  
  // Name validation function
  const validateName = (name: string): boolean => {
    const trimmedName = name.trim();
    
    // Check length (2-30 characters)
    if (trimmedName.length < 2 || trimmedName.length > 30) {
      setNameError('Name must be between 2 and 30 characters');
      return false;
    }
    
    // Check for only letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(trimmedName)) {
      setNameError('Name can only contain letters, spaces, hyphens, and apostrophes');
      return false;
    }
    
    // Check for system/test names
    const systemWords = [
      'admin', 'moderator', 'system', 'test', 'fake', 'spam', 'bot', 'robot',
      'anonymous', 'anon', 'unknown', 'nobody', 'someone', 'anyone', 'everyone'
    ];
    
    const lowerName = trimmedName.toLowerCase();
    for (const word of systemWords) {
      if (lowerName.includes(word)) {
        setNameError('Please choose an appropriate name');
        return false;
      }
    }
    
    // Use bad-words filter for comprehensive profanity detection
    const filter = new Filter();
    if (filter.isProfane(trimmedName)) {
      setNameError('Please choose an appropriate name');
      return false;
    }
    
    // Check for excessive repetition (like "aaaaaa")
    const repeatedChars = /(.)\1{4,}/;
    if (repeatedChars.test(trimmedName)) {
      setNameError('Name cannot contain excessive repeated characters');
      return false;
    }
    
    // Check for excessive spaces
    if (trimmedName.includes('  ')) {
      setNameError('Name cannot contain multiple consecutive spaces');
      return false;
    }
    
    setNameError('');
    return true;
  };

  // Generate unique voter ID
  useEffect(() => {
    if (!currentVoterId) {
      setCurrentVoterId(`voter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, [currentVoterId]);

  // Check if user is creator (from URL params)
  const isCreator = creator === 'true';
  
  // Check authentication status
  useEffect(() => {
    if (!router.isReady || !planId) return;
    
    const planIdStr = String(planId);
    const isFromCreate = isCreator;
    
    // Debug logging
    console.log('🔎 Plan ID:', planIdStr);
    console.log('🧠 isCreator:', isCreator);
    console.log('🧠 isFromCreate:', isFromCreate);
    
    // For shared link visitors, clear any existing voter data to force re-authentication
    if (!isFromCreate) {
      console.log('🧹 Clearing existing voter data for shared link visitor');
      localStorage.removeItem(`voter_${planIdStr}`);
    }
    
    // Check if user already voted in this plan
    // For creators, check localStorage; for visitors, check sessionStorage first
    let voterInfo = null;
    if (isFromCreate) {
      voterInfo = localStorage.getItem(`voter_${planIdStr}`);
    } else {
      // For shared link visitors, check sessionStorage first, then localStorage
      voterInfo = sessionStorage.getItem(`voter_${planIdStr}`) || localStorage.getItem(`voter_${planIdStr}`);
    }
    console.log('🧾 Voter Info:', voterInfo);
    
    // Get creator info from both storage methods
    const creatorName = sessionStorage.getItem('creator_name');
    const creatorPhone = sessionStorage.getItem('creator_phone');
    const creatorInfo = localStorage.getItem(`creator_${planIdStr}`);
    
    console.log('📦 Creator Info (session):', creatorName, creatorPhone);
    console.log('📦 Creator Info (local):', creatorInfo);
    
    // Function to auto-authenticate host
    const autoAuthenticateHost = async () => {
      try {
        // Fetch plan details to get host_phone
        const response = await fetch(`/api/plans/${planIdStr}/voting-status`);
        if (response.ok) {
          const planData = await response.json();
          const hostPhone = planData.host_phone || planData.host_phone_number;
          
          console.log('🏠 Host phone from plan:', hostPhone);
          
          // Get the creator's phone from storage
          const creatorPhoneFromStorage = creatorPhone || (creatorInfo ? JSON.parse(creatorInfo).phone : null);
          console.log('📱 Creator phone from storage:', creatorPhoneFromStorage);
          
          // Check if creator's phone matches host phone
          if (hostPhone && creatorPhoneFromStorage && creatorPhoneFromStorage.includes(hostPhone.replace('+', ''))) {
            console.log('✅ Auto-authenticating host based on phone match');
            setVoterName(planData.host_name || creatorName || 'Host');
            setVoterPhone(creatorPhoneFromStorage);
            setIsAuthenticated(true);
            setShowLogin(false);
            
            // Store as voter for consistency
            localStorage.setItem(`voter_${planIdStr}`, JSON.stringify({
              name: planData.host_name || creatorName || 'Host',
              phone: creatorPhoneFromStorage,
              timestamp: Date.now(),
              isCreator: true,
              userId: creatorPhoneFromStorage // Use phone as userId for creator to match host_phone
            }));
            
            return true; // Successfully auto-authenticated
          }
        }
      } catch (err) {
        console.error('Error auto-authenticating host:', err);
      }
      return false; // Not auto-authenticated
    };
    
    // Priority 1: Creator with sessionStorage data (immediate from plan creation)
    if (isFromCreate && creatorName && creatorPhone) {
      console.log('✅ Creator with sessionStorage, auto-authenticating:', creatorName);
      setVoterName(creatorName);
      setVoterPhone(creatorPhone);
      setIsAuthenticated(true);
      setShowLogin(false);
      
      // Store as voter for consistency - use phone number as voter ID for creator
      localStorage.setItem(`voter_${planIdStr}`, JSON.stringify({
        name: creatorName,
        phone: creatorPhone,
        timestamp: Date.now(),
        isCreator: true,
        userId: creatorPhone // Use phone as userId for creator to match host_phone
      }));
      
      // Add creator to active voters
      joinActiveVoters();
      
      // Clear session data
      sessionStorage.removeItem('creator_name');
      sessionStorage.removeItem('creator_phone');
      setIsLoading(false);
      return; // Exit early, don't continue with other logic
    }
    
    // Priority 2: Creator with localStorage fallback
    if (isFromCreate && creatorInfo) {
      const creator = JSON.parse(creatorInfo);
      console.log('✅ Creator with localStorage fallback, auto-authenticating:', creator.name);
      setVoterName(creator.name);
      setVoterPhone(creator.phone);
      setIsAuthenticated(true);
      setShowLogin(false);
      
      // Store as voter for consistency - use phone number as voter ID for creator
      localStorage.setItem(`voter_${planIdStr}`, JSON.stringify({
        name: creator.name,
        phone: creator.phone,
        timestamp: Date.now(),
        isCreator: true,
        userId: creator.phone // Use phone as userId for creator to match host_phone
      }));
      
      // Add creator to active voters
      joinActiveVoters();
      
      setIsLoading(false);
      return; // Exit early, don't continue with other logic
    }
    
    // Priority 3: Creator with existing voter info
    if (voterInfo && isFromCreate) {
      const voter = JSON.parse(voterInfo);
      console.log('✅ Creator with existing voter info, auto-authenticating:', voter.name);
      setVoterName(voter.name);
      setVoterPhone(voter.phone);
      setIsAuthenticated(true);
      setShowLogin(false);
      
      // Ensure creator flag is set
      if (!voter.isCreator) {
        voter.isCreator = true;
        localStorage.setItem(`voter_${planIdStr}`, JSON.stringify(voter));
      }
      
      // Add creator to active voters
      joinActiveVoters();
      
      setIsLoading(false);
      return; // Exit early, don't continue with other logic
    }
    
    // Priority 4: Non-creator with existing voter info (shared link)
    if (voterInfo && !isFromCreate) {
      const voter = JSON.parse(voterInfo);
      console.log('✅ Non-creator with existing voter info, auto-authenticating:', voter.name);
      setVoterName(voter.name);
      setVoterPhone(voter.phone);
      setIsAuthenticated(true);
      setShowLogin(false);
      
      // Add to active voters
      joinActiveVoters();
      
      setIsLoading(false);
      return; // Exit early, don't continue with other logic
    }
    
    // Priority 5: Try auto-authentication for host (for shared links)
    if (!isFromCreate && !voterInfo) {
      console.log('🔄 Trying auto-authentication for host...');
      autoAuthenticateHost().then((isHost) => {
        if (isHost) {
          console.log('✅ Host auto-authenticated successfully');
          setIsLoading(false);
        } else {
          // Priority 6: Show login form for new visitors (shared links)
          console.log('🚫 New visitor or not creator, showing login form');
          setShowLogin(true);
          setIsLoading(false);
        }
      });
      return; // Exit early, don't continue with other logic
    }
    
    // Priority 6: Show login form for new visitors (shared links)
    if (!isFromCreate && !voterInfo) {
      console.log('🚫 New visitor or not creator, showing login form');
      setShowLogin(true);
      setIsLoading(false);
      return; // Exit early, don't continue with other logic
    }
    
  }, [router.isReady, planId, isCreator]);

  // Load events
  const loadDeck = async () => {
    if (!planId) return;
    
    try {
      const response = await fetch(`/api/plans/${planId}/events`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      console.log('🔍 Events data received:', data);
      if (data.events && data.events.length > 0) {
        console.log('🔍 First event details:', data.events[0]);
        setDeck(data.events);
        setCurrentIndex(0); // Start at first card, not last card
      } else {
        setError('No events found for this plan');
      }
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events');
    }
  };

  // Check voting status
  const checkVotingStatus = async () => {
    if (!planId) return;
    
    try {
      const response = await fetch(`/api/plans/${planId}/voting-status`);
      if (response.ok) {
        const status: VotingStatus = await response.json();
        console.log('📊 Voting status:', status);
        
        setVotingLimitReached(status.voting_limit_reached);
        setExpectedVoters(status.max_voters);
        setCompletedVoters(status.completed_voters);
        
        // Show waiting animation if others are still voting
        if (status.completed_voters < status.max_voters && status.total_voters > 1) {
          setWaitingForFriends(true);
        } else {
          setWaitingForFriends(false);
        }
        
        // If voting is complete, trigger confetti
        if (status.voting_limit_reached && !votingLimitReached) {
          triggerConfetti();
        }
      }
    } catch (error) {
      console.error('❌ Error checking voting status:', error);
    }
  };

  // Load events when authenticated
  useEffect(() => {
    if (isAuthenticated && !showLogin && planId) {
      loadDeck();
      checkVotingStatus();
    }
  }, [isAuthenticated, showLogin, planId]);

  // Active voter tracking
  const joinActiveVoters = async () => {
    if (!planId || !voterName || !voterPhone) return;
    
    try {
      // Use consistent voter ID based on phone and name (not timestamp)
      const consistentVoterId = `${voterPhone}_${voterName.replace(/\s+/g, '_')}`;
      
      const response = await fetch(`/api/plans/${planId}/active-voters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter_id: consistentVoterId,
          name: voterName,
          action: 'join'
        })
      });
      
      if (response.ok) {
        console.log('✅ Joined active voters successfully');
        // Store the consistent voter ID for this session
        if (isCreator) {
          localStorage.setItem(`active_voter_id_${String(planId)}`, consistentVoterId);
        } else {
          sessionStorage.setItem(`active_voter_id_${String(planId)}`, consistentVoterId);
        }
      } else {
        console.error('❌ Failed to join active voters');
      }
    } catch (error) {
      console.error('❌ Error joining active voters:', error);
    }
  };

  const leaveActiveVoters = async () => {
    if (!planId) return;
    
    try {
      // Get the stored unique voter ID
      const planIdStr = String(planId);
      let uniqueVoterId = null;
      
      if (isCreator) {
        uniqueVoterId = localStorage.getItem(`active_voter_id_${planIdStr}`);
      } else {
        uniqueVoterId = sessionStorage.getItem(`active_voter_id_${planIdStr}`);
      }
      
      if (uniqueVoterId) {
        await fetch(`/api/plans/${planId}/active-voters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voter_id: uniqueVoterId,
            action: 'leave'
          })
        });
        
        // Clean up stored voter ID
        if (isCreator) {
          localStorage.removeItem(`active_voter_id_${planIdStr}`);
        } else {
          sessionStorage.removeItem(`active_voter_id_${planIdStr}`);
        }
        
        console.log('✅ Left active voters successfully');
      }
    } catch (error) {
      console.error('❌ Error leaving active voters:', error);
    }
  };

  const fetchActiveVoters = async () => {
    if (!planId) return;
    
    try {
      const response = await fetch(`/api/plans/${planId}/active-voters`);
      if (response.ok) {
        const data = await response.json();
        setActiveVoters(data.active_voters || []);
      }
    } catch (err) {
      console.error('Error fetching active voters:', err);
    }
  };

  // Join active voters when authenticated
  useEffect(() => {
    if (isAuthenticated && voterName) {
      joinActiveVoters();
    }
  }, [isAuthenticated, voterName, planId]);

  // Poll active voters
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(fetchActiveVoters, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated, planId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isAuthenticated && voterName) {
        leaveActiveVoters();
      }
    };
  }, [isAuthenticated, voterName, planId]);

  // Handle login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterName || !voterPhone || !planId) return;
    
    // Track submission attempt
    setSubmissionAttempts(prev => prev + 1);
    setLastSubmittedName(voterName);
    setLastSubmittedPhone(voterPhone);
    
    // Validate name before proceeding
    if (!validateName(voterName)) {
      return; // Stop if validation fails
    }
    
    console.log('🔐 Login submitted:', { voterName, voterPhone, planId });
    
    try {
      // Store voter info in appropriate storage based on whether they're creator or visitor
      const voterData = {
        name: voterName,
        phone: voterPhone,
        timestamp: Date.now(),
        isCreator: isCreator,
        userId: voterPhone
      };
      
      if (isCreator) {
        // Creator uses localStorage for persistence
        localStorage.setItem(`voter_${String(planId)}`, JSON.stringify(voterData));
      } else {
        // Shared link visitors use sessionStorage (clears when browser closes)
        sessionStorage.setItem(`voter_${String(planId)}`, JSON.stringify(voterData));
      }
      
      setIsAuthenticated(true);
      setShowLogin(false);
      
      // Join active voters
      await joinActiveVoters();
      
      console.log('✅ Login successful, joined active voters');
    } catch (error) {
      console.error('❌ Login error:', error);
      alert('Failed to join voting. Please try again.');
    }
  };

  // Refresh page only after failed submission and new input
  useEffect(() => {
    if (submissionAttempts > 0 && 
        (voterName !== lastSubmittedName || voterPhone !== lastSubmittedPhone) &&
        voterName && voterPhone) {
      console.log('🔄 Refreshing page after failed submission and new input');
      window.location.reload();
    }
  }, [voterName, voterPhone, submissionAttempts, lastSubmittedName, lastSubmittedPhone]);

  // Handle card swipe
  const swiped = async (direction: string, eventId: string) => {
    console.log('🔄 Swiped', direction, 'on event:', eventId);
    lastDirection.current = direction;

    try {
      const voterId = voterPhone;
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          event_id: eventId,
          voter_id: voterId,
          vote_type: direction === 'right' ? 'like' : 'dislike'
        })
      });

      if (response.ok) {
        console.log('✅ Vote recorded successfully');
        
        // Trigger confetti on right swipe (like)
        if (direction === 'right') {
          triggerConfetti();
        }

        // Show personalized badge for some events (20% chance)
        if (Math.random() < 0.2) {
          setShowPersonalizedBadge(true);
          setTimeout(() => setShowPersonalizedBadge(false), 3000);
        }

        // Show quick feedback after voting (30% chance)
        if (Math.random() < 0.3) {
          setTimeout(() => setShowQuickFeedback(true), 1000);
        }
      } else {
        console.error('❌ Failed to record vote:', response.status);
      }
    } catch (error) {
      console.error('❌ Error recording vote:', error);
    }

    setCurrentIndex(prev => {
      const newIndex = prev + 1;
      setTimeout(() => showRandomSocialHint(), 500); // Trigger social hint
      
      // Check if this was the last card
      if (newIndex >= deck.length) {
        console.log('🎉 All cards swiped!');
        setAllCardsSwiped(true);
        
        // Show quick feedback after completing all votes
        setTimeout(() => setShowQuickFeedback(true), 1000);
      }
      
      return newIndex;
    });
  };

  const outOfFrame = (name: string) => {
    console.log(name + ' left the screen!');
  };

  const renderStars = (stars: number) => {
    return '⭐'.repeat(Math.min(stars, 5));
  };

  const swipe = async (dir: string) => {
    if (canSwipe.current && currentIndex < deck.length && childRefs.current[currentIndex]) {
      console.log(`🎯 Swiping card ${currentIndex + 1} of ${deck.length} in direction: ${dir}`);
      await childRefs.current[currentIndex].swipe(dir);
    } else {
      console.log('❌ Cannot swipe - either disabled, no more cards, or no ref');
      console.log('Current state:', { canSwipe: canSwipe.current, currentIndex, deckLength: deck.length, hasRef: !!childRefs.current[currentIndex] });
    }
  };

  // Enhanced "Feeling Lucky" with animations and special events
  const handleFeelingLucky = async () => {
    console.log('🎲 Feeling Lucky clicked!');
    
    if (!canSwipe.current || currentIndex >= deck.length) {
      console.log('❌ Cannot swipe - either disabled or no more cards');
      return;
    }

    // Add spinning animation
    setIsLuckySpinning(true);
    
    // Show lucky message
    const luckyMessages = [
      "You just unlocked a hidden gem 💎",
      "This one's off the radar... 👀",
      "Lucky you! This is trending 🔥",
      "Special pick just for you ✨",
      "You found the secret sauce! 🎯"
    ];
    const randomMessage = luckyMessages[Math.floor(Math.random() * luckyMessages.length)];
    setLuckyMessage(randomMessage);
    setShowLuckyMessage(true);

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Find a highly-rated event or random one
    const currentEvent = deck[currentIndex];
    const isHighRated = currentEvent.reviews?.stars >= 4.5 || Math.random() < 0.3;
    
    // Bias towards liking high-rated events
    const direction = isHighRated ? 'right' : (Math.random() > 0.5 ? 'right' : 'left');
    
    console.log(`🎲 Lucky direction: ${direction} (high-rated: ${isHighRated})`);
    
    // Hide message after a delay
    setTimeout(() => setShowLuckyMessage(false), 2000);
    setIsLuckySpinning(false);
    
    swipe(direction);
  };

  // Show random social hints for FOMO
  const showRandomSocialHint = () => {
    if (Math.random() < 0.15 && !showSocialHint) { // 15% chance
      const hint = SOCIAL_HINTS[Math.floor(Math.random() * SOCIAL_HINTS.length)];
      setCurrentSocialHint(hint);
      setShowSocialHint(true);
      
      // Hide after 3 seconds
      setTimeout(() => setShowSocialHint(false), 3000);
    }
  };

  // Get trending badge for highly-rated events
  const getTrendingBadge = (event: Event) => {
    if (event.reviews?.stars >= 4.5 || Math.random() < 0.2) {
      return TRENDING_BADGES[Math.floor(Math.random() * TRENDING_BADGES.length)];
    }
    return null;
  };

  // Helper function to get voter avatar/initials
  const getVoterAvatar = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return initials;
  };

  // Helper function to get personalized suggestion
  const getPersonalizedSuggestion = (event: Event) => {
    const suggestions = [
      "✨ We think you'll love this!",
      "🎯 Perfect match for your vibe",
      "💫 Based on your preferences",
      "🌟 Recommended for you",
      "💎 Hidden gem alert!"
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  };

  // Confetti animation
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  // Quick feedback handler
  const handleQuickFeedback = async (isPositive: boolean) => {
    setFeedbackSubmitted(true);
    // In the future, this could send feedback to your backend
    console.log('User feedback:', isPositive ? 'positive' : 'negative');
    setTimeout(() => {
      setShowQuickFeedback(false);
      setFeedbackSubmitted(false);
    }, 2000);
  };

  // Generate shareable results card
  const generateShareableResults = () => {
    const shareText = `🎉 Our Choosy group is voting on ${deck.length} amazing ${topic} events! 
    
👥 ${activeVoters.length} people voting
📊 ${completedVoters}/${expectedVoters} completed
🎯 Topic: ${topic}

Join us: ${window.location.href}`;
    
    return shareText;
  };

  // Enhanced share function
  const shareResults = async () => {
    const shareText = generateShareableResults();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Choosy - Group Voting',
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled or failed');
        copyShareLink();
      }
    } else {
      copyShareLink();
    }
  };

  // Copy share link
  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/voting?planId=${planId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  // Navigate to results
  const goToResults = () => {
    router.push(`/results/${planId}`);
  };

  // Navigate to create new plan
  const createNewPlan = () => {
    router.push('/create');
  };

  // Go home
  const goHome = () => {
    router.push('/');
  };

  // Vote again
  const voteAgain = () => {
    window.location.reload();
  };

  // Power-up functions
  const useRevealPopularity = () => {
    if (!availablePowerUps.revealPopularity) return;
    
    setAvailablePowerUps(prev => ({ ...prev, revealPopularity: false }));
    setShowPowerUpModal(false);
    
    // Show a fun message about popularity
    const popularityMessages = [
      "🔥 This one's getting lots of love!",
      "💫 Popular choice among your group",
      "⭐ High rating from the community",
      "🎯 Trending in your area"
    ];
    
    const message = popularityMessages[Math.floor(Math.random() * popularityMessages.length)];
    setLuckyMessage(message);
    setShowLuckyMessage(true);
    setTimeout(() => setShowLuckyMessage(false), 3000);
  };

  const useLuckyDraw = () => {
    if (!availablePowerUps.luckyDraw) return;
    
    setAvailablePowerUps(prev => ({ ...prev, luckyDraw: false }));
    setShowPowerUpModal(false);
    
    // Add a surprise event to the deck
    const surpriseEvents = [
      { name: "🎲 Mystery Adventure", description: "A surprise activity chosen just for you!" },
      { name: "🌟 Hidden Gem", description: "A local favorite you might have missed" },
      { name: "🎉 Special Event", description: "Something unique happening tonight" }
    ];
    
    const surprise = surpriseEvents[Math.floor(Math.random() * surpriseEvents.length)];
    setLuckyMessage(`🎁 ${surprise.name}: ${surprise.description}`);
    setShowLuckyMessage(true);
    setTimeout(() => setShowLuckyMessage(false), 3000);
  };



  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 overflow-hidden">
      {/* Loading State */}
      {isLoading && (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-white text-xl">{error}</div>
        </div>
      )}

      {/* Voting Complete - Show first if completed */}
      {!isLoading && !error && (votingLimitReached || allCardsSwiped) && (
        <div className="flex items-center justify-center min-h-screen w-full p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Voting Complete!</h1>
            <p className="text-gray-600 mb-6">
              {allCardsSwiped ? `You've voted on all ${deck.length} events!` : `${completedVoters} out of ${expectedVoters} people have finished voting`}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Waiting for all {expectedVoters} people to finish voting before showing results...
            </p>
            <div className="space-y-3">
              <button
                onClick={goToResults}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                📊 View Results
              </button>
              <button
                onClick={shareResults}
                className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-500 hover:to-blue-600 transition-all duration-200"
              >
                📤 Share Results
              </button>
              <button
                onClick={createNewPlan}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200"
              >
                ✨ Create New Plan
              </button>
              <button
                onClick={goHome}
                className="w-full bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition-all duration-200"
              >
                🏠 Go Home
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Login Form */}
      {!isLoading && !error && !isAuthenticated && showLogin && !votingLimitReached && !allCardsSwiped && (
        <div className="flex items-center justify-center min-h-screen w-full p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Join the Vote!</h1>
              <p className="text-gray-600">Enter your info to start voting on events</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={voterName}
                  onChange={(e) => {
                    setVoterName(e.target.value);
                    if (nameError) setNameError(''); // Clear error on input
                  }}
                  placeholder="e.g., Sarah Johnson"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    nameError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {nameError && (
                  <p className="mt-1 text-sm text-red-600">{nameError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <PhoneInput
                  country={'us'}
                  value={voterPhone}
                  onChange={(phone) => setVoterPhone(phone)}
                  placeholder="Enter your phone number"
                  inputClass="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  containerClass="w-full"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                🎯 Start Voting
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              💡 Your vote will be anonymous to other participants
            </div>
          </motion.div>
        </div>
      )}

      {/* Voting Interface */}
      {!isLoading && !error && isAuthenticated && !showLogin && deck.length > 0 && !votingLimitReached && !allCardsSwiped && (
        <div className="min-h-screen w-full flex flex-col">
          {/* Header - Horizontal bar at top */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-lg mx-4 mt-4 mb-4 border border-white/20">
            <div className="flex items-center justify-between">
              {/* Left: Progress and Topic */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <span className="text-sm font-semibold text-white">
                    {Math.min(currentIndex + 1, deck.length)} of {deck.length} events
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  Voting for comedy vibes {getTopicEmoji('comedy')}
                </div>
              </div>
              {/* Right: Share and Feeling Lucky */}
              <div className="flex items-center gap-3">
                <Dialog open={showPowerUpModal} onOpenChange={setShowPowerUpModal}>
                  <DialogTrigger asChild>
                    <button
                      className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:from-pink-600 hover:to-purple-700 transition-all duration-300 text-xs font-medium"
                    >
                      <span>⚡</span>
                      <span>Power-ups</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm w-full">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">⚡ Choose Your Power-up!</h3>
                      <p className="text-sm text-gray-600 mb-4">Use these special abilities once per session</p>
                      <div className="space-y-3">
                        {availablePowerUps.revealPopularity && (
                          <button
                            onClick={useRevealPopularity}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                          >
                            🔍 Reveal Popularity
                          </button>
                        )}
                        {availablePowerUps.luckyDraw && (
                          <button
                            onClick={useLuckyDraw}
                            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200"
                          >
                            🎁 Lucky Draw
                          </button>
                        )}
                      </div>
                      <DialogClose asChild>
                        <button
                          className="mt-4 w-full bg-gray-300 text-gray-700 p-2 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-xs font-medium"
                    >
                      <span>📤</span>
                      <span>Share</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="text-sm text-gray-800 dark:text-gray-200">
                      Share this voting session with your friends!
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={shareResults}>Copy Link</button>
                      <button className="bg-green-500 text-white px-3 py-1 rounded">Invite</button>
                    </div>
                  </PopoverContent>
                </Popover>
                <button
                  onClick={handleFeelingLucky}
                  className={`text-white text-xs font-semibold px-3 py-1 rounded-full hover:scale-105 transition-all duration-200 bg-gradient-to-r from-yellow-400 to-orange-500 ${isLuckySpinning ? 'lucky-spin' : ''}`}
                >
                  {isLuckySpinning ? '🎲' : '🎲'} Feeling Lucky?
                </button>
              </div>
            </div>
          </div>

          {/* Active Voters Display - Only show when there are voters, grow dynamically */}
          {activeVoters.length > 0 && (
            <div className="mx-4 mb-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 inline-block">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">👥</span>
                  <span className="text-white text-sm">
                    {activeVoters.length} {activeVoters.length === 1 ? 'person' : 'people'} voting now
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {activeVoters.map((voter, index) => (
                    <div key={index} className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                      <div className="voter-avatar w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {getVoterAvatar(voter.name)}
                      </div>
                      <span className="text-white text-xs">{voter.name}</span>
                      <span className="text-yellow-400 text-xs">⏱️ {Math.max(0, voter.time_remaining)}s</span>
                    </div>
                  ))}
                </div>
                
                {/* Group Progress Bar */}
                {expectedVoters > 1 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-white mb-1">
                      <span>Group Progress</span>
                      <span>{completedVoters}/{expectedVoters} completed</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="group-progress h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((completedVoters / expectedVoters) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Waiting for Friends Animation */}
          {waitingForFriends && (
            <div className="mx-4 mb-4">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-3 text-center waiting-animation">
                <div className="text-white font-semibold text-sm">
                  ⏳ Waiting for friends to finish voting...
                </div>
                <div className="text-white text-xs mt-1">
                  {expectedVoters - completedVoters} more to go!
                </div>
              </div>
            </div>
          )}

          {/* Lucky Message Overlay */}
          {showLuckyMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-lg"
            >
              {luckyMessage}
            </motion.div>
          )}

          {/* Confetti Animation */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-40">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    background: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][Math.floor(Math.random() * 5)]
                  }}
                />
              ))}
            </div>
          )}

          {/* Quick Feedback Modal */}
          {showQuickFeedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4"
            >
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {feedbackSubmitted ? 'Thanks for your feedback!' : 'How were these suggestions?'}
                </h3>
                {!feedbackSubmitted ? (
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => handleQuickFeedback(true)}
                      className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-colors"
                    >
                      👍 Loved them!
                    </button>
                    <button
                      onClick={() => handleQuickFeedback(false)}
                      className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors"
                    >
                      👎 Not my vibe
                    </button>
                  </div>
                ) : (
                  <div className="text-green-600 text-2xl">🎉</div>
                )}
              </div>
            </motion.div>
          )}

          {/* Card Deck */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative w-full max-w-sm h-96 flex justify-center items-center">
              {deck[currentIndex] && (
                <TinderCard
                  ref={(el) => {
                    if (el) childRefs.current[currentIndex] = el;
                  }}
                  key={deck[currentIndex].id}
                  onSwipe={(dir) => swiped(dir, deck[currentIndex].id)}
                  onCardLeftScreen={() => outOfFrame(deck[currentIndex].name)}
                  preventSwipe={['up', 'down']}
                  className="absolute w-full max-w-sm"
                >
                  <EventCard event={deck[currentIndex]}>
                    {/* You can add voting buttons or actions here as children if needed */}
                  </EventCard>
                </TinderCard>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
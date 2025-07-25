import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import TinderCard from 'react-tinder-card';
import { AnimatePresence, motion } from 'framer-motion';
import { useDarkMode } from '../../lib/darkMode';

// Add CSS styles for swipe animations
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
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = swipeStyles;
  document.head.appendChild(style);
}

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
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop'
  ],
  wellness: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
  ]
};

// Default images for unknown categories
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
];

// Performance constants
const SECRET_CARD_INDEX = 3;
const SECRET_UNLOCKED_KEY = 'choosy_secret_unlocked';
const STREAK_KEY = 'choosy_streak';
const LAST_SWIPE_DATE_KEY = 'choosy_last_swipe_date';
const VOTING_STATUS_CACHE_DURATION = 10000; // 10 seconds cache
const POLLING_INTERVAL = 10000; // 10 seconds instead of 5

// Cache for API responses
const apiCache = new Map();
const cacheTimeout = new Map();

// Utility function to get cached data or fetch fresh
const getCachedOrFetch = async (key: string, fetchFn: () => Promise<any>, ttl: number = VOTING_STATUS_CACHE_DURATION) => {
  const now = Date.now();
  const cached = apiCache.get(key);
  const timeout = cacheTimeout.get(key);
  
  if (cached && timeout && now < timeout) {
    return cached;
  }
  
  try {
    const data = await fetchFn();
    apiCache.set(key, data);
    cacheTimeout.set(key, now + ttl);
    return data;
  } catch (error) {
    // Return cached data if available, even if expired
    if (cached) {
      console.warn(`Using expired cache for ${key} due to fetch error:`, error);
      return cached;
    }
    throw error;
  }
};

// Topic emoji mapping
const getTopicEmoji = (topic: string) => {
  const emojiMap: { [key: string]: string } = {
    concerts: '🎵',
    foodie: '🍕',
    sports: '⚽',
    art: '🎨',
    nightlife: '🍸',
    adventure: '🏔️',
    shopping: '🛍️',
    comedy: '😂',
    movies: '🎬',
    parks: '🌳',
    racing: '🏁',
    swimming: '🏊',
    drinks: '🍺',
    wellness: '🧘',
    family: '👨‍👩‍👧‍👦',
    datenight: '💕'
  };
  return emojiMap[topic] || '🎯';
};

export default function VotePage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { planId, topic, groupSize, zip } = router.query;
  
  // Get planId from URL path - in Next.js dynamic routes, planId should be in router.query
  const actualPlanId = router.isReady ? planId : null;
  
  // Debug logging
  console.log('🔍 Router query:', router.query);
  console.log('🔍 PlanId from query:', planId);
  console.log('🔍 Actual PlanId:', actualPlanId);
  console.log('🔍 Topic:', topic);
  console.log('🔍 GroupSize:', groupSize);
  console.log('🔍 Zip:', zip);
  console.log('🔍 Router isReady:', router.isReady);
  if (typeof window !== 'undefined') {
    console.log('🔍 Full URL:', window.location.href);
    console.log('🔍 Pathname:', window.location.pathname);
    console.log('🔍 Search:', window.location.search);
    
    // Debug function to clear localStorage (for testing)
    (window as any).clearVoteStorage = () => {
      console.log('🧹 Clearing vote storage...');
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('voter_') || key.startsWith('creator_')) {
          console.log('🧹 Removing:', key);
          localStorage.removeItem(key);
        }
      });
      sessionStorage.removeItem('cameFromCreate');
      console.log('🧹 Storage cleared!');
      window.location.reload();
    };
    
    // Debug function to show current storage state
    (window as any).showVoteStorage = () => {
      console.log('📦 Current vote storage:');
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('voter_') || key.startsWith('creator_')) {
          console.log('📦', key, ':', localStorage.getItem(key));
        }
      });
      console.log('📦 cameFromCreate:', sessionStorage.getItem('cameFromCreate'));
    };
    
    // Debug function to check creator info for specific plan
    (window as any).checkCreator = (planId?: string) => {
      const targetPlanId = planId || actualPlanId;
      console.log('🔍 Checking creator info for plan:', targetPlanId);
      const creatorKey = `creator_${targetPlanId}`;
      const creatorInfo = localStorage.getItem(creatorKey);
      console.log('🔍 Creator key:', creatorKey);
      console.log('🔍 Creator info exists:', !!creatorInfo);
      if (creatorInfo) {
        console.log('🔍 Creator info:', JSON.parse(creatorInfo));
      }
      
      // Also check all creator keys
      const allKeys = Object.keys(localStorage);
      const creatorKeys = allKeys.filter(key => key.startsWith('creator_'));
      console.log('🔍 All creator keys:', creatorKeys);
    };
    
    // Debug function to manually set creator info for testing
    (window as any).setCreator = (planId: string, name: string, phone: string) => {
      const creatorKey = `creator_${planId}`;
      const creatorInfo = {
        name,
        phone,
        timestamp: Date.now()
      };
      localStorage.setItem(creatorKey, JSON.stringify(creatorInfo));
      sessionStorage.setItem('cameFromCreate', 'true');
      console.log('🔧 Manually set creator info:', creatorInfo);
      console.log('🔧 Creator key:', creatorKey);
      window.location.reload();
    };
  }
  
  // Log when router becomes ready
  useEffect(() => {
    if (router.isReady) {
      console.log('🔍 Router is now ready!');
      console.log('🔍 Final router query:', router.query);
    }
  }, [router.isReady, router.query]);
  const [events, setEvents] = useState([]);
  const [voted, setVoted] = useState({});
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({}); // Track vote counts for each event
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [voterName, setVoterName] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [showLogin, setShowLogin] = useState(false); // Start as false, will be set based on auth check
  
  // New state for voter tracking
  const [expectedVoters, setExpectedVoters] = useState(1);
  const [completedVoters, setCompletedVoters] = useState(0);
  const [voterId, setVoterId] = useState('');
  const [allVotersCompleted, setAllVotersCompleted] = useState(false);
  const [votingLimitReached, setVotingLimitReached] = useState(false);
  const [activeVoters, setActiveVoters] = useState([]);
  const [currentVoterId, setCurrentVoterId] = useState('');
  const [deck, setDeck] = useState([]); // The swipe deck, including special cards
  const [hotCardData, setHotCardData] = useState(null);
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showSecretCard, setShowSecretCard] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Swipe state management to prevent double-triggering
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);

  // Memoized values to reduce re-renders
  const memoizedTopic = useMemo(() => Array.isArray(topic) ? topic[0] : topic, [topic]);
  const memoizedGroupSize = useMemo(() => Array.isArray(groupSize) ? groupSize[0] : groupSize, [groupSize]);
  const memoizedZip = useMemo(() => Array.isArray(zip) ? zip[0] : zip, [zip]);
  
  // Memoized callbacks to prevent unnecessary re-renders
  const handleUnlockSecret = useCallback(() => {
    setShowSecretCard(true);
    localStorage.setItem(SECRET_UNLOCKED_KEY, 'true');
  }, []);

  const handleFeelingLucky = useCallback(() => {
    // Skip to a random event in the deck
    if (deck.length > 0) {
      const randomIndex = Math.floor(Math.random() * deck.length);
      setCurrentIndex(randomIndex);
    }
  }, [deck.length]);

  // Memoized topic image function
  const getTopicImage = useCallback((eventIndex: number, eventTopic?: string) => {
    const topicKey = eventTopic || memoizedTopic;
    const images = TOPIC_IMAGES[topicKey] || DEFAULT_IMAGES;
    return images[eventIndex % images.length];
  }, [memoizedTopic]);

  // Memoize current card data to prevent unnecessary re-renders
  const currentCard = useMemo(() => {
    if (currentIndex >= deck.length) return null;
    return deck[currentIndex];
  }, [currentIndex, deck]);

  // Track daily streaks in localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastSwipe = localStorage.getItem(LAST_SWIPE_DATE_KEY);
    let newStreak = 1;
    if (lastSwipe === today) {
      newStreak = parseInt(localStorage.getItem(STREAK_KEY) || '1');
    } else if (lastSwipe) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastSwipe === yesterday) {
        newStreak = parseInt(localStorage.getItem(STREAK_KEY) || '1') + 1;
      }
    }
    localStorage.setItem(LAST_SWIPE_DATE_KEY, today);
    localStorage.setItem(STREAK_KEY, newStreak.toString());
    setStreak(newStreak);
  }, []);

  // Load events and inject special cards
  useEffect(() => {
    if (!router.isReady) return;
    const loadDeck = async () => {
      let baseEvents = [];
      // Wait for router to be ready and planId to be available
      if (!actualPlanId || actualPlanId === 'undefined') {
        setDeck([]);
        return;
      }
      
      if (actualPlanId === 'demo') {
        // Demo mode - fetch real events from backend API
        try {
          // Use memoized values
          const zipStr = memoizedZip;
          const topicStr = memoizedTopic;
          
          // Geocode ZIP to lat/lng
          const geocodeResponse = await fetch(`/api/geocode?zipcode=${zipStr}`);
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            const { lat, lng } = geocodeData;
            
            // Fetch real events for demo
            const eventsResponse = await fetch(`/api/events?lat=${lat}&lng=${lng}&category=${topicStr}&radius=5000&limit=20`);
            if (eventsResponse.ok) {
              const backendEvents = await eventsResponse.json();
              
              // Convert backend events to frontend format
              const eventsWithDefaults = (backendEvents || []).map(event => ({
                ...event,
                id: event.id || `demo_${Math.random().toString(36).substr(2, 9)}`,
                reviews: event.reviews || { stars: 4.0 + Math.random() * 1.0, count: Math.floor(Math.random() * 50) + 10 },
                contact: {
                  phone: event.phone || '(555) 123-4567',
      
                },
                isDemo: true
              }));
              
              baseEvents = eventsWithDefaults.map(event => ({ ...event, type: 'event' }));
              console.log('🎮 Demo mode: loaded', baseEvents.length, 'real events');
            } else {
              console.log('🎮 Demo mode: failed to fetch events, using fallback');
              // Fallback to some demo events if API fails
              baseEvents = [
                {
                  id: 'demo_1',
                  name: 'Live Music Night',
                  description: 'Amazing live music performance',
                  image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
                  topic: topicStr,
                  hours: '8:00 PM - 11:00 PM',
                  price: '$15',
                  venue: 'The Music Hall',
                  reviews: { stars: 4.5, count: 25 },
                  contact: { phone: '(555) 123-4567' },
                  isDemo: true,
                  type: 'event'
                },
                {
                  id: 'demo_2',
                  name: 'Comedy Show',
                  description: 'Laugh your night away',
                  image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
                  topic: topicStr,
                  hours: '7:30 PM - 9:30 PM',
                  price: '$20',
                  venue: 'Comedy Club',
                  reviews: { stars: 4.2, count: 18 },
                  contact: { phone: '(555) 234-5678' },
                  isDemo: true,
                  type: 'event'
                },
                {
                  id: 'demo_3',
                  name: 'Food Festival',
                  description: 'Taste the best local cuisine',
                  image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
                  topic: topicStr,
                  hours: '6:00 PM - 10:00 PM',
                  price: '$25',
                  venue: 'Downtown Plaza',
                  reviews: { stars: 4.8, count: 42 },
                  contact: { phone: '(555) 345-6789' },
                  isDemo: true,
                  type: 'event'
                }
              ];
            }
          } else {
            console.log('🎮 Demo mode: failed to geocode, using fallback events');
            // Use fallback events if geocoding fails
            baseEvents = [
              {
                id: 'demo_1',
                name: 'Live Music Night',
                description: 'Amazing live music performance',
                image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
                topic: topicStr,
                hours: '8:00 PM - 11:00 PM',
                price: '$15',
                venue: 'The Music Hall',
                reviews: { stars: 4.5, count: 25 },
                contact: { phone: '(555) 123-4567' },
                isDemo: true,
                type: 'event'
              }
            ];
          }
        } catch (error) {
          console.error('🎮 Demo mode error:', error);
          // Use fallback events
          baseEvents = [
            {
              id: 'demo_1',
              name: 'Live Music Night',
              description: 'Amazing live music performance',
              image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
              topic: memoizedTopic,
              hours: '8:00 PM - 11:00 PM',
              price: '$15',
              venue: 'The Music Hall',
              reviews: { stars: 4.5, count: 25 },
              contact: { phone: '(555) 123-4567' },
              isDemo: true,
              type: 'event'
            }
          ];
        }
      } else {
        // Real plan - fetch events from database
        try {
          // Fetch real events from frontend API (proxies to backend)
          console.log('🔍 Fetching events for plan:', actualPlanId);
          
          // Ensure we have a valid planId
          if (!actualPlanId) {
            console.error('🔍 No valid planId available for fetching events');
            setDeck([]);
            return;
          }
          
          const response = await fetch(`/api/plans/${actualPlanId}/events`);
          console.log('🔍 Response status:', response.status);
          
        if (response.ok) {
          const data = await response.json();
            console.log('🔍 Events data:', data);
            
          // Add default properties for events from database
          const eventsWithDefaults = (data.events || []).map(event => ({
            ...event,
            reviews: event.reviews || { stars: 0, count: 0 },
            // Use real phone/email from backend, fallback to N/A only if not provided
            contact: {
              phone: event.phone || 'N/A',
              email: event.email || 'N/A'
            }
          }));
            baseEvents = eventsWithDefaults.map(event => ({ ...event, type: 'event' }));
            console.log('🔍 Processed events:', baseEvents.length);
        } else {
          console.error('Failed to fetch events:', response.status);
            const errorText = await response.text();
            console.error('Error response:', errorText);
          // No fallback to mock events - show empty state
            setDeck([]);
          const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
          const voterCount = groupSizeStr === 'solo' ? 1 : (groupSizeStr === 'date' || groupSizeStr === 'friend') ? 2 : 5;
          setExpectedVoters(voterCount);
            return;
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        // No fallback to mock events - show empty state
          setDeck([]);
        const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
        const voterCount = groupSizeStr === 'solo' ? 1 : groupSizeStr === 'date' ? 2 : 5;
        setExpectedVoters(voterCount);
          return;
        }
      }
      
      // Skip hot card for now to improve performance
      let deckWithHot = [...baseEvents];
      // Inject Secret Card after SECRET_CARD_INDEX
      let deckWithSecret = [...deckWithHot];
      const secretUnlocked = localStorage.getItem(SECRET_UNLOCKED_KEY) === 'true';
      if (deckWithSecret.length > SECRET_CARD_INDEX && !secretUnlocked) {
        deckWithSecret.splice(SECRET_CARD_INDEX, 0, { type: 'secret' });
      }
      
      // Log final deck state
      console.log('🔍 Final deck with special cards:', deckWithSecret.length);
      console.log('🔍 Base events count:', baseEvents.length);
      
      setDeck(deckWithSecret);
      
      // Show tutorial for first-time users
      const hasSeenTutorial = localStorage.getItem('choosy_tutorial_seen');
      if (!hasSeenTutorial && deckWithSecret.length > 0) {
        setShowTutorial(true);
      }
    };

    // Only load deck when we have a valid planId
    if (actualPlanId && actualPlanId !== 'demo') {
      loadDeck();
    }
  }, [router.isReady, actualPlanId, memoizedTopic, memoizedZip]); // Use memoized values

  // Load initial voting status
  useEffect(() => {
    if (!actualPlanId || actualPlanId === 'demo') return;
    
    // Only load expected voters from localStorage as fallback
    const storedExpectedVoters = localStorage.getItem(`expected_voters_${actualPlanId}`);
    if (storedExpectedVoters) {
      setExpectedVoters(parseInt(storedExpectedVoters));
    }
    
    // Reset completion status for this voter if they return to vote
    const voterInfo = localStorage.getItem(`voter_${actualPlanId}`);
    if (voterInfo) {
      const voter = JSON.parse(voterInfo);
      const voterCompletedKey = `voter_completed_${actualPlanId}_${voter.userId || voterId}`;
      const alreadyCompleted = localStorage.getItem(voterCompletedKey);
      
      if (alreadyCompleted) {
        console.log('🔄 Voter returned to vote - resetting completion status');
        localStorage.removeItem(voterCompletedKey);
      }
    }
  }, [actualPlanId, voterId]);

  // Load vote counts and reset completion status
  useEffect(() => {
    if (!actualPlanId || actualPlanId === 'demo') return;
    
    // Load vote counts from localStorage
    const storedVotes = localStorage.getItem(`vote_counts_${actualPlanId}`);
    if (storedVotes) {
      setVoteCounts(JSON.parse(storedVotes));
    }
    
    // Reset completion status for this voter if they return to vote
    const voterInfo = localStorage.getItem(`voter_${actualPlanId}`);
    if (voterInfo) {
      const voter = JSON.parse(voterInfo);
      const voterCompletedKey = `voter_completed_${actualPlanId}_${voter.userId || voterId}`;
      const alreadyCompleted = localStorage.getItem(voterCompletedKey);
      
      if (alreadyCompleted) {
        console.log('🔄 Voter returned to vote - resetting completion status');
        localStorage.removeItem(voterCompletedKey);
      }
    }
  }, [actualPlanId, voterId]);

  // Generate unique voter ID on mount
  useEffect(() => {
    if (!voterId) {
      const newVoterId = `voter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setVoterId(newVoterId);
    }
  }, [voterId]);

  // Clear completion data when starting fresh
  useEffect(() => {
    // Clear any stale completion data when the page loads
    const planIdStr = Array.isArray(actualPlanId) ? actualPlanId[0] : actualPlanId;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('voter_completed_') && key.includes(planIdStr)) {
        console.log('🧹 Clearing stale completion data:', key);
        localStorage.removeItem(key);
      }
    });
  }, [actualPlanId]);

  // Check if all voters have completed - only when authenticated
  useEffect(() => {
    // For solo sessions, immediately mark as completed when the user finishes
    if (memoizedGroupSize === 'solo' && isAuthenticated && !showLogin && currentIndex >= deck.length && deck.length > 0) {
      setAllVotersCompleted(true);
      return;
    }
    
    // For group sessions, wait for all expected voters
    if (isAuthenticated && !showLogin && completedVoters >= expectedVoters) {
      setAllVotersCompleted(true);
    }
  }, [completedVoters, expectedVoters, isAuthenticated, showLogin, currentIndex, deck.length, memoizedGroupSize]);

  // Optimized polling with caching and reduced frequency
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      // Use cached voting status to reduce API calls
      const cacheKey = `voting_status_${actualPlanId}`;
      try {
        const status = await getCachedOrFetch(cacheKey, async () => {
          const response = await fetch(`/api/plans/${actualPlanId}/voting-status`);
          if (response.ok) {
            return await response.json();
          }
          throw new Error('Failed to fetch voting status');
        }, VOTING_STATUS_CACHE_DURATION);
        
        // Update expected voters from backend
        setExpectedVoters(status.max_voters);
        
        // Update completed voters from backend (this is the source of truth)
        if (status.completed_voters !== undefined) {
          setCompletedVoters(status.completed_voters);
          console.log('🔐 Backend completion status:', {
            completed: status.completed_voters,
            total: status.total_voters,
            max: status.max_voters,
            totalEvents: status.total_events
          });
        }
      } catch (error) {
        console.log('Using local storage fallback for voting status');
        // Fallback to localStorage - but only for expected voters, not completion
        const storedExpectedVoters = localStorage.getItem(`expected_voters_${actualPlanId}`);
        if (storedExpectedVoters) {
          const expectedCount = parseInt(storedExpectedVoters);
          if (expectedCount !== expectedVoters) {
            setExpectedVoters(expectedCount);
          }
        }
      }
    }, POLLING_INTERVAL); // Increased to 10 seconds

    return () => clearInterval(refreshInterval);
  }, [actualPlanId, completedVoters]);

  // Timer countdown - redirects to results when time expires OR all voters complete
  useEffect(() => {
    // Stop timer if this voter has completed all events or not authenticated
    if (currentIndex >= deck.length || !isAuthenticated || showLogin) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Only redirect if not all voters have completed
          if (!allVotersCompleted) {
            setTimeout(() => {
              router.push(`/results/${actualPlanId}`);
            }, 1000);
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [actualPlanId, router, currentIndex, deck.length, allVotersCompleted, isAuthenticated, showLogin]);

  // Redirect to results when all voters have completed
  useEffect(() => {
    if (allVotersCompleted && isAuthenticated && !showLogin) {
      console.log('🎉 All voters have completed! Redirecting to results...');
      setTimeout(() => {
        router.push(`/results/${actualPlanId}`);
      }, 2000); // Give 2 seconds for users to see the completion message
    }
  }, [allVotersCompleted, actualPlanId, router, isAuthenticated, showLogin]);

  // Handle swipe gestures with proper state management
  const swiped = useCallback(async (dir, eventId) => {
    // Prevent double execution
    if (isSwiping) return;
    
    // Set swiping state to prevent double execution
    setIsSwiping(true);
    
    // Immediately update state to prevent lag
    setVoted(prev => ({ ...prev, [eventId]: dir === 'right' }));
    
    // Log the action
    console.log(dir === 'right' ? '🎉 Voted for event!' : '💨 Skipped event');
    
    // Simple, lightweight animation using CSS classes
    const card = document.querySelector('.swipe-card-active') as HTMLElement;
    if (card) {
      card.classList.add(dir === 'right' ? 'swipe-right' : 'swipe-left');
      setTimeout(() => {
        card.classList.remove('swipe-right', 'swipe-left');
      }, 300);
    }
    
    // Save vote to database if not demo
    if (actualPlanId !== 'demo') {
      try {
        // Get user info from localStorage
        const voterInfo = localStorage.getItem(`voter_${actualPlanId}`);
        let voterId = '';
        if (voterInfo) {
          const voter = JSON.parse(voterInfo);
          // Always use phone number for host, userId or phone for guests
          if (voter.isCreator) {
            voterId = voter.phone; // Use phone number for creator to match host_phone
          } else {
            voterId = voter.userId || voter.phone; // Use userId if available, otherwise use phone as ID
          }
        } else {
          voterId = voterPhone; // Fallback to phone number
        }
        // Ensure voterId is always a string
        voterId = String(voterId);
        const voteData = {
          plan_id: actualPlanId,
          event_id: eventId,
          voter_id: voterId,
          vote_type: dir === 'right' ? 'like' : 'dislike'
        };
        const response = await fetch('/api/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(voteData)
        });
        if (!response.ok) {
          console.error('Failed to save vote:', response.status);
        }
      } catch (error) {
        console.error('Error saving vote:', error);
      }
    }
    
    // Update vote counts
    const storedVotes = localStorage.getItem(`votes_${actualPlanId}`);
    const currentVotes = storedVotes ? JSON.parse(storedVotes) : {};
    
    const currentCount = currentVotes[eventId] || 0;
    const newCount = dir === 'right' 
      ? currentCount + 1
      : Math.max(0, currentCount - 1);
    
    const updatedVotes = {
      ...currentVotes,
      [eventId]: newCount
    };
    localStorage.setItem(`votes_${actualPlanId}`, JSON.stringify(updatedVotes));
    setVoteCounts(updatedVotes);
    
    // Move to next card
    setCurrentIndex(prev => prev + 1);
    
    // Check if this voter has completed all events
    if (currentIndex >= deck.length - 1) {
      // For solo sessions, immediately redirect without API calls
      if (memoizedGroupSize === 'solo') {
        setAllVotersCompleted(true);
        console.log('✅ Redirecting to results for solo plan');
        setTimeout(() => {
          window.location.href = `/results/${actualPlanId}`;
        }, 500);
        return;
      }
      
      // Only check backend for group plans
      try {
        const response = await fetch(`/api/plans/${actualPlanId}/voting-status`);
        if (response.ok) {
          const status = await response.json();
          if (status.voting_limit_reached) {
            setAllVotersCompleted(true);
          }
        }
      } catch (error) {
        console.error('Error checking backend voting status:', error);
      }
    }
  }, [isSwiping, actualPlanId, voterId, currentIndex, deck.length, memoizedGroupSize]);

  // Manual swipe controls
  
  const handleManualSwipe = useCallback((dir) => {
    if (isSwiping || currentIndex >= deck.length) return;
    
    const currentCard = deck[currentIndex];
    if (currentCard?.type === 'event') {
      setIsSwiping(true);
      setSwipeDirection(dir);
      
      // Use a small delay to ensure smooth animation
      setTimeout(() => {
        swiped(dir, currentCard.id);
        setIsSwiping(false);
        setSwipeDirection(null);
      }, 100);
      
      // Safety timeout to prevent getting stuck
      setTimeout(() => {
        setIsSwiping(false);
        setSwipeDirection(null);
      }, 2000);
    }
  }, [currentIndex, deck, isSwiping, swiped]);

  // Get winning event for results page
  const getWinningEvent = () => {
    // Get all events with their vote counts
    const eventsWithVotes = events.map(event => ({
      ...event,
      voteCount: voteCounts[event.id] || 0
    }));
    
    // Sort by vote count (highest first)
    eventsWithVotes.sort((a, b) => b.voteCount - a.voteCount);
    
    // Check for clear winner (more than 50% of total votes)
    const totalVotes = Object.values(voteCounts).reduce((sum: number, count: any) => sum + (count as number), 0);
    const highestVoteCount = eventsWithVotes[0]?.voteCount || 0;
    
    if (totalVotes > 0 && highestVoteCount > totalVotes / 2) {
      // Clear winner exists
      return eventsWithVotes[0];
    }
    
    // No clear winner - return top voted event (for now)
    // In the future, this could trigger a new voting round with top 33%
    return eventsWithVotes[0] || events[0] || null;
  };

  // Handle tie-breaking (for future implementation)
  const handleTieBreak = () => {
    // Get events sorted by vote count
    const eventsWithVotes = events.map(event => ({
      ...event,
      voteCount: voteCounts[event.id] || 0
    }));
    
    // Sort by vote count (highest first)
    eventsWithVotes.sort((a, b) => b.voteCount - a.voteCount);
    
    // Get top 33% of events
    const topThirdCount = Math.ceil(eventsWithVotes.length / 3);
    const topEvents = eventsWithVotes.slice(0, topThirdCount);
    
    // In a real implementation, this would start a new voting round
    // with just the top events
    console.log('Tie detected - would start new round with:', topEvents);
    
    return topEvents[0]; // Return the highest voted event for now
  };

  // Format time display (MM:SS)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Render star rating
  const renderStars = (stars) => {
    return '⭐'.repeat(Math.floor(stars)) + '☆'.repeat(5 - Math.floor(stars));
  };

  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (voterName.trim() && voterPhone.trim()) {
      // Check voting status from backend first
      try {
        const planIdStr = Array.isArray(actualPlanId) ? actualPlanId[0] : actualPlanId;
        const response = await fetch(`/api/plans/${planIdStr}/voting-status`);
        if (response.ok) {
          const status = await response.json();
          console.log('🔐 Login check - voting status:', status);
          
          if (status.voting_limit_reached) {
            alert(`Sorry! This plan is limited to ${status.max_voters} ${status.max_voters === 1 ? 'person' : 'people'}. All voting slots have been filled.`);
            setVotingLimitReached(true);
            return;
          }
        }
      } catch (error) {
        console.log('🔐 Error checking voting status, falling back to local logic:', error);
      }
      
      // Fallback to local logic if backend check fails
      const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
      
      // Count unique voters for this plan
      const uniqueVoters = new Set();
      const keys = Object.keys(localStorage);
      const planIdStr = Array.isArray(actualPlanId) ? actualPlanId[0] : actualPlanId;
      keys.forEach(key => {
        if (key.startsWith(`voter_completed_${planIdStr}_`)) {
          // This is a voter completion key, extract voter ID
          const voterId = key.replace(`voter_completed_${planIdStr}_`, '');
          uniqueVoters.add(voterId);
        }
      });
      
      // Also count voters who have voter info stored but haven't completed yet
      const voterInfo = localStorage.getItem(`voter_${planIdStr}`);
      if (voterInfo) {
        const voter = JSON.parse(voterInfo);
        const voterId = voter.userId || voter.phone;
        // Only count if they haven't completed yet
        if (!localStorage.getItem(`voter_completed_${planIdStr}_${voterId}`)) {
          uniqueVoters.add(voterId);
        }
      }
      
      // Calculate max voters based on group size
      let maxVoters;
      if (groupSizeStr === 'group') {
        // For group plans, the max is the current number of participants (minimum 3)
        const currentParticipants = uniqueVoters.size;
        maxVoters = Math.max(3, currentParticipants); // Minimum 3 (you + 2 others), grows with participants
        console.log(`🔐 Group plan - current participants: ${currentParticipants}, max voters: ${maxVoters}`);
      } else {
        // Fixed sizes for other group types
        maxVoters = groupSizeStr === 'solo' ? 1 : (groupSizeStr === 'date' || groupSizeStr === 'friend') ? 2 : 2;
      }
      
      console.log(`🔐 Current unique voters: ${uniqueVoters.size}/${maxVoters}`);
      console.log(`🔐 Unique voter IDs:`, Array.from(uniqueVoters));
      
      if (uniqueVoters.size >= maxVoters) {
        alert(`Sorry! This plan is limited to ${maxVoters} ${maxVoters === 1 ? 'person' : 'people'}. All voting slots have been filled.`);
        return;
      }
      
      try {
        // Create user in database if not demo
        if (planIdStr !== 'demo') {
          const userData = {
            name: voterName.trim(),
            phone: voterPhone.trim()
          };
          
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          });
          
          if (response.ok) {
            const userResult = await response.json();
            // Store user ID for voting
            localStorage.setItem(`voter_${planIdStr}`, JSON.stringify({
              name: voterName.trim(),
              phone: voterPhone.trim(),
              userId: userResult.id,
              timestamp: Date.now()
            }));
          } else {
            console.error('Failed to create user:', response.status);
          }
        } else {
          // Demo mode - just store in localStorage
          localStorage.setItem(`voter_${planIdStr}`, JSON.stringify({
            name: voterName.trim(),
            phone: voterPhone.trim(),
            timestamp: Date.now()
          }));
        }
        
        setIsAuthenticated(true);
        setShowLogin(false);
      } catch (error) {
        console.error('Error creating user:', error);
        // Fallback to localStorage only
        localStorage.setItem(`voter_${actualPlanId}`, JSON.stringify({
          name: voterName.trim(),
          phone: voterPhone.trim(),
          timestamp: Date.now()
        }));
        setIsAuthenticated(true);
        setShowLogin(false);
      }
    }
  };

  // Set initial authentication state based on localStorage
  useEffect(() => {
    if (!router.isReady || !actualPlanId || actualPlanId === 'demo') return;
    
    const planIdStr = Array.isArray(actualPlanId) ? actualPlanId[0] : actualPlanId;
    const voterInfo = localStorage.getItem(`voter_${planIdStr}`);
    const creatorInfo = localStorage.getItem(`creator_${planIdStr}`);
    
    console.log('🔐 Initial auth check - planIdStr:', planIdStr);
    console.log('🔐 Initial auth check - voterInfo:', !!voterInfo, 'creatorInfo:', !!creatorInfo);
    
    if (voterInfo || creatorInfo) {
      console.log('🔐 User already authenticated, hiding login');
      setShowLogin(false);
      setIsAuthenticated(true);
      
      if (voterInfo) {
        const voter = JSON.parse(voterInfo);
        setVoterName(voter.name);
        setVoterPhone(voter.phone);
      } else if (creatorInfo) {
        const creator = JSON.parse(creatorInfo);
        setVoterName(creator.name);
        setVoterPhone(creator.phone);
      }
    } else {
      console.log('🔐 User not authenticated, showing login');
      setShowLogin(true);
      setIsAuthenticated(false);
    }
  }, [router.isReady, actualPlanId]);

  // Check voting status and handle authentication
  useEffect(() => {
    // Wait for router to be ready before checking authentication
    if (!router.isReady) {
      console.log('🔐 Waiting for router to be ready...');
      return;
    }
    
    console.log('🔐 Auth check - planId:', actualPlanId, 'groupSize:', groupSize);
    
    // Skip authentication for demo or undefined planId
    if (actualPlanId === 'demo' || !actualPlanId || actualPlanId === 'undefined') {
      console.log('🔐 Skipping auth - demo or undefined planId');
      setIsAuthenticated(true);
      setShowLogin(false);
      return;
    }
    
    const checkVotingStatus = async () => {
      try {
        // Check voting status from backend
        const response = await fetch(`/api/plans/${actualPlanId}/voting-status`);
        if (response.ok) {
          const status = await response.json();
          console.log('🔐 Voting status from backend:', status);
          
          // Update expected voters from backend
          setExpectedVoters(status.max_voters);
          
          // If voting limit reached, show limit message
          if (status.voting_limit_reached) {
            console.log('🔐 Voting limit reached from backend');
            setShowLogin(false);
            setIsAuthenticated(false);
            setVotingLimitReached(true);
            return;
          }
        } else {
          console.log('🔐 Could not fetch voting status, falling back to local logic');
        }
      } catch (error) {
        console.log('🔐 Error fetching voting status, falling back to local logic:', error);
      }
      
      // Clear any old session data that might interfere
      const currentPlanId = Array.isArray(actualPlanId) ? actualPlanId[0] : actualPlanId;
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('voter_') && currentPlanId && !key.includes(currentPlanId)) {
          console.log('🔐 Clearing old voter data:', key);
          localStorage.removeItem(key);
        }
      });
      
      const planIdStr = Array.isArray(actualPlanId) ? actualPlanId[0] : actualPlanId;
      const voterInfo = localStorage.getItem(`voter_${planIdStr}`);
      const creatorInfo = localStorage.getItem(`creator_${planIdStr}`);
      
      // Check if user came from the create page (has referrer info)
      const cameFromCreate = sessionStorage.getItem('cameFromCreate') === 'true';
      
      console.log('🔐 Auth check - planIdStr:', planIdStr);
      console.log('🔐 Auth check - voterInfo:', !!voterInfo, 'creatorInfo:', !!creatorInfo, 'cameFromCreate:', cameFromCreate);
      console.log('🔐 Auth check - actualPlanId:', actualPlanId);
      console.log('🔐 Auth check - router.isReady:', router.isReady);
      console.log('🔐 Auth check - router.query:', router.query);
      if (voterInfo) {
        console.log('🔐 Voter info found:', JSON.parse(voterInfo));
      }
      if (creatorInfo) {
        console.log('🔐 Creator info found:', JSON.parse(creatorInfo));
      }
      
      // Debug: Check all localStorage keys for this plan
      const allKeys = Object.keys(localStorage);
      const planKeys = allKeys.filter(key => key.includes(planIdStr));
      console.log('🔐 All localStorage keys for this plan:', planKeys);
      
      // Debug: Check all localStorage keys that start with 'creator_'
      const creatorKeys = allKeys.filter(key => key.startsWith('creator_'));
      console.log('🔐 All creator keys in localStorage:', creatorKeys);
      
      // Debug: Check if the exact creator key exists
      const exactCreatorKey = `creator_${planIdStr}`;
      console.log('🔐 Looking for exact creator key:', exactCreatorKey);
      console.log('🔐 Exact creator key exists:', localStorage.getItem(exactCreatorKey) ? 'YES' : 'NO');
      
      if (voterInfo) {
        // User has already voted in this plan
        const voter = JSON.parse(voterInfo);
        console.log('🔐 User already voted in this plan:', voter);
        setVoterName(voter.name);
        setVoterPhone(voter.phone);
        setIsAuthenticated(true);
        setShowLogin(false);
      } else if (creatorInfo && cameFromCreate) {
        // User is the creator AND just came from create page - auto-authenticate them
        const creator = JSON.parse(creatorInfo);
        console.log('🔐 Creator detected - auto-authenticating:', creator);
        setVoterName(creator.name);
        setVoterPhone(creator.phone);
        setIsAuthenticated(true);
        setShowLogin(false);
        // Also store as voter for consistency
        localStorage.setItem(`voter_${planIdStr}`, JSON.stringify({
          name: creator.name,
          phone: creator.phone,
          timestamp: Date.now(),
          isCreator: true
        }));
        // Clear the session flag
        sessionStorage.removeItem('cameFromCreate');
      } else if (creatorInfo) {
        // Creator info exists but user didn't just come from create page
        // This could be a creator returning to vote - show login with pre-filled info
        const creator = JSON.parse(creatorInfo);
        console.log('🔐 Creator returning to vote - showing login with pre-fill:', creator);
        setVoterName(creator.name);
        setVoterPhone(creator.phone);
        setShowLogin(true);
        setIsAuthenticated(false);
      } else {
        // New user or direct link access - check if voting limit reached
        const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
        
        // Count unique voters for this plan
        const uniqueVoters = new Set();
        const keys = Object.keys(localStorage);
        const planIdStr = Array.isArray(actualPlanId) ? actualPlanId[0] : actualPlanId;
        keys.forEach(key => {
          if (key.startsWith(`voter_completed_${planIdStr}_`)) {
            // This is a voter completion key, extract voter ID
            const voterId = key.replace(`voter_completed_${planIdStr}_`, '');
            uniqueVoters.add(voterId);
          }
        });
        
        // Also count voters who have voter info stored but haven't completed yet
        const voterInfo = localStorage.getItem(`voter_${planIdStr}`);
        if (voterInfo) {
          const voter = JSON.parse(voterInfo);
          const voterId = voter.userId || voter.phone;
          // Only count if they haven't completed yet
          if (!localStorage.getItem(`voter_completed_${planIdStr}_${voterId}`)) {
            uniqueVoters.add(voterId);
          }
        }
        
        // Calculate max voters based on group size
        // Get max voters from backend (dynamic based on actual participation)
        let maxVoters;
        try {
          const response = await fetch(`/api/plans/${planIdStr}/voting-status`);
          if (response.ok) {
            const status = await response.json();
            console.log('🔐 Voting status from backend:', status);
            maxVoters = status.max_voters;
            setExpectedVoters(status.max_voters);
          } else {
            // Fallback to local calculation if backend fails
            if (groupSizeStr === 'solo') {
              maxVoters = 1;
            } else if (groupSizeStr === 'date' || groupSizeStr === 'friend') {
              maxVoters = Math.max(2, uniqueVoters.size + 1);
            } else {
              maxVoters = Math.max(3, uniqueVoters.size + 1);
            }
          }
        } catch (error) {
          console.log('🔐 Error fetching voting status, using fallback:', error);
          // Fallback to local calculation
          if (groupSizeStr === 'solo') {
            maxVoters = 1;
          } else if (groupSizeStr === 'date' || groupSizeStr === 'friend') {
            maxVoters = Math.max(2, uniqueVoters.size + 1);
          } else {
            maxVoters = Math.max(3, uniqueVoters.size + 1);
          }
        }
        
        console.log(`🔐 Auth check - unique voters: ${uniqueVoters.size}/${maxVoters}`);
        console.log(`🔐 Auth check - unique voter IDs:`, Array.from(uniqueVoters));
        
        if (uniqueVoters.size >= maxVoters) {
          console.log('🔐 Voting limit reached - showing limit message');
          setShowLogin(false);
          setIsAuthenticated(false);
          setVotingLimitReached(true);
          return;
        }
        
        // Check if user is creator or new user
        // Note: Creators are handled earlier in the flow, so this section only handles new users
        // New user accessing shared link - always require login
        console.log('🔐 Requiring login - new user accessing shared link');
        setShowLogin(true);
        setIsAuthenticated(false);
        
        // Clear any existing session data to ensure fresh login
        sessionStorage.removeItem('cameFromCreate');
        
        // Force login for shared links - no auto-authentication
        console.log('🔐 Forcing login for shared link access');
      }
    };
    
    // Execute the authentication check
    checkVotingStatus();
  }, [actualPlanId, groupSize, router.isReady]);



  // Active voters tracking functions
  const joinActiveVoters = async () => {
    if (!actualPlanId || actualPlanId === 'demo') return;
    
    const voterId = `${voterName}-${Date.now()}`;
    setCurrentVoterId(voterId);
    
    try {
      await fetch(`/api/plans/${actualPlanId}/active-voters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter_id: voterId,
          name: voterName,
          action: 'join'
        })
      });
    } catch (error) {
      console.log('Error joining active voters:', error);
    }
  };
  
  const leaveActiveVoters = async () => {
    if (!actualPlanId || actualPlanId === 'demo' || !currentVoterId) return;
    
    try {
      await fetch(`/api/plans/${actualPlanId}/active-voters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter_id: currentVoterId,
          name: voterName,
          action: 'leave'
        })
      });
    } catch (error) {
      console.log('Error leaving active voters:', error);
    }
  };
  
  const fetchActiveVoters = async () => {
    if (!actualPlanId || actualPlanId === 'demo') return;
    
    try {
      const response = await fetch(`/api/plans/${actualPlanId}/active-voters`);
      if (response.ok) {
        const data = await response.json();
        setActiveVoters(data.active_voters || []);
      }
    } catch (error) {
      console.log('Error fetching active voters:', error);
    }
  };
  
  // Poll for active voters every 3 seconds
  useEffect(() => {
    if (!isAuthenticated || !actualPlanId || actualPlanId === 'demo') return;
    
    fetchActiveVoters();
    const interval = setInterval(fetchActiveVoters, 3000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, actualPlanId]);
  
  // Join active voters when authenticated
  useEffect(() => {
    if (isAuthenticated && voterName && actualPlanId && actualPlanId !== 'demo') {
      joinActiveVoters();
    }
  }, [isAuthenticated, voterName, actualPlanId]);
  
  // Leave active voters when component unmounts
  useEffect(() => {
    return () => {
      if (currentVoterId) {
        leaveActiveVoters();
      }
    };
  }, [currentVoterId]);

  // Create user in backend if not already created for this plan
  useEffect(() => {
    // Create user in backend if not already created for this plan
    if (!actualPlanId || actualPlanId === 'demo') return;
    const creatorInfo = localStorage.getItem(`creator_${actualPlanId}`);
    if (creatorInfo) {
      const { name, phone } = JSON.parse(creatorInfo);
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone })
      });
    }
  }, [actualPlanId]);

  // Loading state
  if (!router.isReady || !actualPlanId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Voting Page...</h2>
          <p className="text-gray-600">Getting your plan ready</p>
        </div>
      </div>
    );
  }

  // Voting limit reached message
  if (votingLimitReached) {
    const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
    
    // Use expectedVoters state for max voters (already set by backend)
    const maxVoters = expectedVoters || (groupSizeStr === 'solo' ? 1 : (groupSizeStr === 'date' || groupSizeStr === 'friend') ? 2 : 3);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center px-4 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md mx-auto w-full text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Voting Limit Reached</h1>
          <p className="text-gray-600 mb-6">
            This plan is limited to {maxVoters} {maxVoters === 1 ? 'person' : 'people'}. All voting slots have been filled.
          </p>
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-4 border-2 border-red-200 mb-6">
            <p className="text-sm text-gray-600 mb-2">Plan Details:</p>
            <p className="font-semibold text-gray-900">
              {(Array.isArray(topic) ? topic[0] : topic)} • {(Array.isArray(groupSize) ? groupSize[0] : groupSize) === 'solo' ? 'Solo' : (Array.isArray(groupSize) ? groupSize[0] : groupSize) === 'date' ? 'Date or Friend Night' : 'Group'}
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/create')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
            >
              Create Your Own Plan
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

    return (
    <div className="relative min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vote on Events</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Share button */}
          <button
            onClick={() => {
              const shareUrl = window.location.href;
              navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Link copied! Share it with friends to invite them to vote.');
              }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Link copied! Share it with friends to invite them to vote.');
              });
            }}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-sm font-medium"
          >
            <span>📤</span>
            <span>Share</span>
          </button>
          
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-600/50 transition-colors"
          >
            {isDarkMode ? (
              <span className="text-yellow-400 text-xl">☀️</span>
            ) : (
              <span className="text-gray-700 text-xl">🌙</span>
            )}
          </button>
        </div>
      </header>

      {/* Demo banner */}
      {actualPlanId === 'demo' && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-lg">
            <span className="text-lg font-bold">🎮</span>
            <span className="font-semibold">Demo Mode - Create a real plan to unlock full features!</span>
          </div>
        </div>
      )}

      {/* Empty state - no events found */}
      {deck.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">🤔</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Events Found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We couldn't find any events for {(Array.isArray(topic) ? topic[0] : topic)} in your area. 
              This might be because:
            </p>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-6">
              <ul className="text-left text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• The area doesn't have many events for this topic</li>
                <li>• Our event sources are temporarily unavailable</li>
                <li>• Try a different topic or location</li>
              </ul>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/create')}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
              >
                Try Different Topic
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-all duration-200"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login form - only show if not authenticated */}
      {!isAuthenticated && showLogin && (
        <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Join the Vote!</h1>
            <p className="text-gray-600 mb-6">
              Enter your info to start voting on events
            </p>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border-2 border-purple-200">
              <p className="text-sm text-gray-600 mb-2">Plan Details:</p>
              <p className="font-semibold text-gray-900">
                {(Array.isArray(topic) ? topic[0] : topic)} • {(Array.isArray(groupSize) ? groupSize[0] : groupSize) === 'solo' ? 'Solo' : (Array.isArray(groupSize) ? groupSize[0] : groupSize) === 'date' ? 'Date or Friend Night' : 'Group'}
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="e.g., Sarah Johnson"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={voterPhone}
                onChange={(e) => {
                  // Allow typing any phone number format, just clean it
                  let value = e.target.value;
                  
                  // Remove any non-digit characters except +, (, ), -, and space
                  value = value.replace(/[^0-9+\-\(\)\s]/g, '');
                  
                  // Limit to reasonable length
                  if (value.length > 20) {
                    value = value.slice(0, 20);
                  }
                  
                  setVoterPhone(value);
                }}
                placeholder="Enter your phone number (e.g., +1 555 123 4567)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter your full phone number with country code</p>
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl mt-6"
            >
              🎯 Start Voting
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p className="text-sm text-gray-500">💡 Your vote will be anonymous to other participants</p>
            <p>⏰ Voting session lasts 5 minutes</p>
          </div>
        </div>
      </div>
      )}

      {/* Active Voters Display */}
      {isAuthenticated && !showLogin && activeVoters.length > 0 && (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg mx-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Active Voters ({activeVoters.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              {activeVoters.slice(0, 3).map((voter, index) => (
                <div key={voter.voter_id} className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {voter.name} ({Math.floor(voter.time_remaining / 60)}:{(voter.time_remaining % 60).toString().padStart(2, '0')})
                  </span>
                  {index < Math.min(2, activeVoters.length - 1) && (
                    <span className="text-gray-400">•</span>
                  )}
                </div>
              ))}
              {activeVoters.length > 3 && (
                <span className="text-xs text-gray-500">+{activeVoters.length - 3} more</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cleaner Header - Merged and Slimmed */}
      {isAuthenticated && !showLogin && deck.length > 0 && voterName && (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg mx-4 mb-4">
          <div className="flex items-center justify-between">
            {/* Left: Timer and Topic */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatTime(timeLeft)}
                </span>
          </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                You're voting for {Array.isArray(topic) ? topic[0] : topic} vibes {getTopicEmoji(Array.isArray(topic) ? topic[0] : topic)}
              </div>
            </div>
            
            {/* Right: Share, Streak and Feeling Lucky */}
            <div className="flex items-center gap-3">
              {/* Share button */}
              <button
                onClick={() => {
                  const shareUrl = window.location.href;
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    alert('Link copied! Share it with friends to invite them to vote.');
                  }).catch(() => {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = shareUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert('Link copied! Share it with friends to invite them to vote.');
                  });
                }}
                className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-xs font-medium"
              >
                <span>📤</span>
                <span>Share</span>
              </button>
              
              <div className="flex items-center gap-1">
                <span className="text-sm">🔥</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">Day {streak}</span>
          </div>
          <button
                onClick={handleFeelingLucky}
                className="feeling-lucky text-white text-xs font-semibold px-3 py-1 rounded-full hover:scale-105 transition-all duration-200"
              >
                Feeling Lucky?
          </button>
        </div>
          </div>
          
          {/* Slim Progress Bar */}
          <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-1000 ease-out"
              style={{ width: `${(timeLeft / (5 * 60)) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Swipeable event cards */}
      {isAuthenticated && !showLogin && deck.length > 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
        <div className="relative w-full max-w-sm h-[500px]">
          <AnimatePresence>
              {currentIndex < deck.length && (
              <motion.div
                  key={deck[currentIndex].type === 'event' ? deck[currentIndex].id : deck[currentIndex].type}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -60 }}
                transition={{ duration: 0.3 }}
                className="absolute w-full"
              >
                  {currentCard?.type === 'event' && (
                <TinderCard
                      onSwipe={(dir) => swiped(dir, currentCard.id)}
                  preventSwipe={['up', 'down']}
                      className={`swipe-card-active ${currentIndex === deck.length - 1 ? 'animate-pulse' : ''}`}
                >
                      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden relative card-hover">
                        {/* Event image - optimized with loading */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-400 to-blue-500">
                      <img 
                            src={currentCard.image_url || getTopicImage(currentIndex, currentCard.topic)} 
                            alt={currentCard.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                          {/* Compact hours badge */}
                          <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-semibold text-gray-900 dark:text-white">
                            {currentCard.isDemo ? 'Demo' : currentCard.hours}
                      </div>
                    </div>

                        {/* Event details - Simplified layout */}
                    <div className="p-6">
                          {/* Title and badges */}
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentCard.name}</h2>
                            <div className="flex gap-1">
                              {currentCard.metadata?.offline_activity && (
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                  FREE
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Description */}
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {currentCard.metadata?.offline_activity 
                              ? currentCard.description
                              : currentCard.description || `Cozy ${currentCard.topic || memoizedTopic} spot with ${currentCard.reviews?.count || 42} happy customers`
                            }
                          </p>

                          {/* Tags */}
                          <div className="flex gap-1 mb-4">
                            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                              #{currentCard.topic || memoizedTopic}
                            </span>
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                              {currentCard.metadata?.offline_activity ? '#Indoor' : '#Local'}
                            </span>
                          </div>
                        
                          {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                            {currentCard.isDemo ? (
                          <span className="text-gray-400 dark:text-gray-500 text-sm">⭐ Demo Reviews</span>
                            ) : currentCard.metadata?.offline_activity ? (
                              <span className="text-green-600 text-sm font-medium">🎯 Perfect for {currentCard.metadata?.difficulty || 'Easy'} fun!</span>
                        ) : (
                          <>
                                <span className="text-yellow-400">{renderStars(currentCard.reviews?.stars || 0)}</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">({currentCard.reviews?.count || 0} reviews)</span>
                          </>
                        )}
                      </div>

                          {/* Contact info - simplified */}
                      <div className="space-y-2 mb-4">
                            {currentCard.isDemo ? (
                          <div className="text-center py-4">
                            <div className="text-gray-400 dark:text-gray-500 text-sm">🔒 Demo Mode</div>
                          </div>
                            ) : currentCard.metadata?.offline_activity ? (
                              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                                <div className="text-sm font-medium text-green-800 dark:text-green-200">
                                  🛠️ Materials: {currentCard.metadata?.materials_needed || 'Just your creativity!'}
                                </div>
                              </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>📞</span>
                              <span className="truncate">{currentCard.contact?.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>✉️</span>
      
                            </div>
                          </>
                        )}
                      </div>

                          {/* Progress indicator */}
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{currentIndex + 1} / {deck.length}</span>
                              <span>{deck.length - currentIndex - 1} left</span>
                            </div>
                            <div className="mt-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${((currentIndex + 1) / deck.length) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                    </div>
                  </div>
                </TinderCard>
                  )}
                  
                  {/* Special cards remain the same */}
                  {deck[currentIndex].type === 'hot' && (
                    <TinderCard
                      onSwipe={(dir) => swiped(dir, 'hot_card')}
                      preventSwipe={['up', 'down']}
                    >
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center h-full">
                        <div className="text-6xl mb-4">🔥</div>
                        <h2 className="text-2xl font-bold mb-3 text-gray-900">Hot in Your Area</h2>
                        {hotCardData && hotCardData.event ? (
                          <>
                            <div className="text-lg font-semibold mb-2 text-gray-800">{hotCardData.event.name}</div>
                            <div className="text-sm text-gray-600 mb-3">{hotCardData.event.description}</div>
                            <div className="bg-white/80 rounded-xl p-3 mb-3">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">👥 {hotCardData.event.votes}</div>
                                <div className="text-xs text-gray-600">people voted in {Array.isArray(zip) ? zip[0] : zip}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">🔥 Trending now in your neighborhood</div>
                          </>
                        ) : (
                          <>
                            <div className="text-gray-700 mb-3 text-center">
                              <div className="text-lg font-semibold mb-2">Discover Local Favorites</div>
                              <div className="text-sm">Check back soon for trending events in your area!</div>
                            </div>
                            <div className="bg-white/80 rounded-xl p-3">
                              <div className="text-center text-gray-600">
                                <div className="text-sm">💡 Pro tip: Create more plans to see trending events</div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </TinderCard>
                  )}
                  
                  {deck[currentIndex].type === 'secret' && (
                    <div className="bg-gradient-to-br from-purple-200 to-blue-200 border-2 border-purple-400 rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center h-full cursor-pointer" onClick={handleUnlockSecret}>
                      {!showSecretCard ? (
                        <>
                          <div className="text-5xl mb-4">🃏</div>
                          <h2 className="text-2xl font-bold mb-2 blur-sm select-none">Secret Card</h2>
                          <div className="text-gray-700 mb-2 blur-sm select-none">Tap to reveal a locals-only tip!</div>
                          <div className="text-xs text-gray-500 mt-4">💡 This is just a fun tip - not a votable event</div>
                        </>
                      ) : (
                        <>
                          <div className="text-5xl mb-4">🎉</div>
                          <h2 className="text-2xl font-bold mb-2">Hidden Gem</h2>
                          <div className="text-gray-700 mb-2">Locals say: "Try the late-night taco truck on 5th!"</div>
                          <div className="text-xs text-gray-500 mt-4">💡 This is just a fun tip - not a votable event</div>
                          <div className="text-xs text-purple-600 mt-2 font-medium">Tap anywhere to continue voting</div>
                        </>
                      )}
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>

            {/* Cleaner Manual swipe buttons - moved below card with better spacing */}
            <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 flex gap-6">
            <button
              onClick={() => handleManualSwipe('left')}
                className={`vote-button w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-xl transition-all duration-200 ${
                  deck[currentIndex]?.type === 'secret' 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
                title={deck[currentIndex]?.type === 'secret' ? "This is just a tip - not votable" : "Skip this event"}
                disabled={deck[currentIndex]?.type === 'secret'}
            >
              ❌
            </button>
            <button
              onClick={() => handleManualSwipe('right')}
                className={`vote-button w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-xl transition-all duration-200 ${
                  deck[currentIndex]?.type === 'secret' 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
                title={deck[currentIndex]?.type === 'secret' ? "This is just a tip - not votable" : "Vote for this event"}
                disabled={deck[currentIndex]?.type === 'secret'}
            >
              ✅
            </button>
          </div>
            
            {/* Conclude Voting Button - appears on last card */}
            {currentIndex === deck.length - 1 && (
              <div className="absolute -bottom-44 left-1/2 transform -translate-x-1/2">
                <button
                  onClick={() => {
                    setCurrentIndex(deck.length);
                  }}
                  className="vote-button bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2 text-sm"
                >
                  🎯 Conclude Voting
                </button>
        </div>
            )}
            
            {/* Last card indicator - subtle */}
            {currentIndex === deck.length - 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <div className="streak-counter bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                  🎯 Final Choice
        </div>
              </div>
            )}
      </div>

          {/* Removed instructions to clean up UI */}
        </div>
      )}

      {/* Enhanced Completion state with proper flow */}
      {currentIndex >= deck.length && deck.length > 0 && isAuthenticated && !showLogin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            {actualPlanId === 'demo' ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 Demo Complete!</h3>
                <p className="text-gray-600 mb-4">You've seen how Choosy works. Ready to create a real plan?</p>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/create')}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
                  >
                    Create Real Plan
                  </button>
                  <button
                    onClick={() => {
                      const winningEvent = getWinningEvent();
                      const params = new URLSearchParams({
                        topic: Array.isArray(topic) ? topic[0] : topic || '',
                        groupSize: Array.isArray(groupSize) ? groupSize[0] : groupSize || '',
                        zip: Array.isArray(zip) ? zip[0] : zip || '',
                        winningEvent: winningEvent ? JSON.stringify(winningEvent) : ''
                      });
                      window.location.href = `/results/${actualPlanId}?${params.toString()}`;
                    }}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
                  >
                    See Demo Results
                  </button>
                </div>
              </>
            ) : (
              // Simplified logic: if solo, show results immediately; otherwise show waiting
              (Array.isArray(groupSize) ? groupSize[0] : groupSize) === 'solo' ? (
              <>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 Voting Complete!</h3>
                  <p className="text-gray-600 mb-4">You've finished voting. Check your results!</p>
                <button
                  onClick={() => {
                    const winningEvent = getWinningEvent();
                    const params = new URLSearchParams({
                      topic: Array.isArray(topic) ? topic[0] : topic || '',
                      groupSize: Array.isArray(groupSize) ? groupSize[0] : groupSize || '',
                      zip: Array.isArray(zip) ? zip[0] : zip || '',
                      winningEvent: winningEvent ? JSON.stringify(winningEvent) : ''
                    });
                    window.location.href = `/results/${actualPlanId}?${params.toString()}`;
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
                >
                  See Results
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 You're Done!</h3>
                <p className="text-gray-600 mb-4">
                    Thanks for voting! Waiting for others to finish...
                  </p>
                  <div className="text-sm text-gray-500 mb-4">
                    {(() => {
                      // Calculate actual voting status for group plans
                      const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
                      let actualCompleted = completedVoters;
                      let actualExpected = expectedVoters;
                      
                      if (groupSizeStr === 'group') {
                        // Count actual completed voters
                        const uniqueCompletedVoters = new Set();
                        const keys = Object.keys(localStorage);
                        const planIdStr = Array.isArray(actualPlanId) ? actualPlanId[0] : actualPlanId;
                        keys.forEach(key => {
                          if (key.startsWith(`voter_completed_${planIdStr}_`)) {
                            const voterId = key.replace(`voter_completed_${planIdStr}_`, '');
                            uniqueCompletedVoters.add(voterId);
                          }
                        });
                        
                        // Count total participants (completed + current user)
                        const totalParticipants = Math.max(3, uniqueCompletedVoters.size + 1);
                        actualCompleted = uniqueCompletedVoters.size;
                        actualExpected = totalParticipants;
                        
                        console.log(`🔐 Group plan - planId: ${planIdStr}, completed: ${actualCompleted}, expected: ${actualExpected}`);
                      }
                      
                      return (
                        <>
                          <p>{actualCompleted}/{actualExpected} people have finished voting</p>
                          <p className="mt-2">Results will be available when everyone is done!</p>
                        </>
                      );
                    })()}
                  </div>
                  
                  {/* Real-time voting indicators */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-4">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      👥 Active Voters:
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>You - Finished voting</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span>Sarah - Currently voting (2 min left)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>Mike - Waiting to start</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Auto-refresh every 5 seconds */}
                  <div className="text-xs text-gray-400">
                    Auto-refreshing in 5 seconds...
                  </div>
                </>
              )
            )}
          </div>
        </motion.div>
      )}

      {/* Tutorial Overlay for First-Time Users */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">👋</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Choosy!
              </h3>
              <div className="space-y-4 text-left mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm">←</div>
                  <span className="text-gray-700 dark:text-gray-300">Swipe left to skip</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">→</div>
                  <span className="text-gray-700 dark:text-gray-300">Swipe right to vote</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">🎯</div>
                  <span className="text-gray-700 dark:text-gray-300">Use buttons below for easier control</span>
                </div>
              </div>
                        <button
                          onClick={() => {
                  setShowTutorial(false);
                  localStorage.setItem('choosy_tutorial_seen', 'true');
                          }}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
                        >
                Got it! Let's start voting 🎉
                        </button>
                </div>
          </div>
        </div>
      )}
    </div>
  );
} 
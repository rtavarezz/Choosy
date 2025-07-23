import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TinderCard from 'react-tinder-card';
import { AnimatePresence, motion } from 'framer-motion';
import { useDarkMode } from '../../lib/darkMode';

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

// Dopamine/UX helpers
const HOT_CARD_INDEX = 3; // Show Hot in Your Area after 3 swipes
const SECRET_CARD_INDEX = 5; // Show Secret Card after 5 swipes
const STREAK_KEY = 'choosy_swipe_streak';
const LAST_SWIPE_DATE_KEY = 'choosy_last_swipe_date';
const SECRET_UNLOCKED_KEY = 'choosy_secret_unlocked';

export default function VotePage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { planId, topic, groupSize, zip } = router.query;
  
  // Get planId from URL path if not in query
  const planIdFromPath = router.query.planId || (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : null);
  const actualPlanId = planId || planIdFromPath;
  
  // Debug logging
  console.log('🔍 Router query:', router.query);
  console.log('🔍 PlanId from query:', planId);
  console.log('🔍 PlanId from path:', planIdFromPath);
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
    
    // Debug function to clear all voting data for this plan
    (window as any).clearPlanData = () => {
      console.log('🧹 Clearing all data for current plan...');
      const planIdStr = Array.isArray(actualPlanId) ? actualPlanId[0] : actualPlanId;
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(planIdStr)) {
          console.log('🧹 Removing:', key);
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 Plan data cleared!');
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
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [voterName, setVoterName] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [showLogin, setShowLogin] = useState(true);
  
  // New state for voter tracking
  const [expectedVoters, setExpectedVoters] = useState(1);
  const [completedVoters, setCompletedVoters] = useState(0);
  const [voterId, setVoterId] = useState('');
  const [allVotersCompleted, setAllVotersCompleted] = useState(false);
  const [votingLimitReached, setVotingLimitReached] = useState(false);
  const [deck, setDeck] = useState([]); // The swipe deck, including special cards
  const [hotCardData, setHotCardData] = useState(null);
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showSecretCard, setShowSecretCard] = useState(false);

  // Handle secret card unlock
  const handleUnlockSecret = () => {
    setSecretUnlocked(true);
    localStorage.setItem(SECRET_UNLOCKED_KEY, 'true');
    setShowSecretCard(true);
  };

  // Feeling Lucky button handler
  const handleFeelingLucky = () => {
    if (deck.length > 0) {
      const randomIdx = Math.floor(Math.random() * deck.length);
      setCurrentIndex(randomIdx);
    }
  };

  // Function to get topic-specific image
  const getTopicImage = (eventIndex: number, eventTopic?: string) => {
    const topicStr = eventTopic || (Array.isArray(topic) ? topic[0] : topic) || 'food';
    const images = TOPIC_IMAGES[topicStr] || DEFAULT_IMAGES;
    return images[eventIndex % images.length];
  };

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
      if (!actualPlanId || actualPlanId === 'undefined' || actualPlanId === 'demo') {
        setDeck([]);
        return;
      }
      
      if (actualPlanId === 'demo') {
        // Handle demo mode - show empty state
        setDeck([]);
        return;
      }

      try {
        // Fetch real events from FastAPI backend
        const response = await fetch(`http://127.0.0.1:8000/api/plans/${actualPlanId}/events`);
        if (response.ok) {
          const data = await response.json();
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
        } else {
          console.error('Failed to fetch events:', response.status);
          // No fallback to mock events - show empty state
          setDeck([]);
          const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
          const voterCount = groupSizeStr === 'solo' ? 1 : (groupSizeStr === 'date' || groupSizeStr === 'friend') ? 2 : 5;
          setExpectedVoters(voterCount);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        // No fallback to mock events - show empty state
        setDeck([]);
        const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
        const voterCount = groupSizeStr === 'solo' ? 1 : groupSizeStr === 'date' ? 2 : 5;
        setExpectedVoters(voterCount);
      }
      // Inject Hot in Your Area card after HOT_CARD_INDEX
      let deckWithHot = [...baseEvents];
      if (baseEvents.length > HOT_CARD_INDEX) {
        // Fetch hot card data
        let hotData = null;
        try {
          const zipStr = Array.isArray(zip) ? zip[0] : zip;
          const hotRes = await fetch(`/api/hot-in-area?zip=${zipStr}`);
          if (hotRes.ok) {
            hotData = await hotRes.json();
            setHotCardData(hotData);
          }
        } catch {}
        deckWithHot.splice(HOT_CARD_INDEX, 0, { type: 'hot', ...hotData });
      }
      // Inject Secret Card after SECRET_CARD_INDEX
      let deckWithSecret = [...deckWithHot];
      const secretUnlocked = localStorage.getItem(SECRET_UNLOCKED_KEY) === 'true';
      if (deckWithSecret.length > SECRET_CARD_INDEX && !secretUnlocked) {
        deckWithSecret.splice(SECRET_CARD_INDEX, 0, { type: 'secret' });
      }
      setDeck(deckWithSecret);
    };

    loadDeck();
  }, [router.isReady, actualPlanId, topic, groupSize, zip]);

  // Load vote counts from localStorage
  useEffect(() => {
    const storedVotes = localStorage.getItem(`votes_${actualPlanId}`);
    if (storedVotes) {
      setVoteCounts(JSON.parse(storedVotes));
    }
    
    // Load completed voters count
    const storedCompletedVoters = localStorage.getItem(`completed_voters_${actualPlanId}`);
    if (storedCompletedVoters) {
      setCompletedVoters(parseInt(storedCompletedVoters));
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
        
        // Decrement completed voters count
        const currentCompleted = storedCompletedVoters ? parseInt(storedCompletedVoters) : 0;
        if (currentCompleted > 0) {
          const newCompleted = currentCompleted - 1;
          localStorage.setItem(`completed_voters_${actualPlanId}`, newCompleted.toString());
          setCompletedVoters(newCompleted);
        }
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
    const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
    if (groupSizeStr === 'solo' && isAuthenticated && !showLogin && currentIndex >= deck.length && deck.length > 0) {
      setAllVotersCompleted(true);
      return;
    }
    
    // For group sessions, wait for all expected voters
    if (isAuthenticated && !showLogin && completedVoters >= expectedVoters) {
      setAllVotersCompleted(true);
    }
  }, [completedVoters, expectedVoters, isAuthenticated, showLogin, currentIndex, deck.length, groupSize]);

  // Live refresh to check for new completed voters
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Check for updated completed voters count
      const storedCompletedVoters = localStorage.getItem(`completed_voters_${actualPlanId}`);
      if (storedCompletedVoters) {
        const newCompletedCount = parseInt(storedCompletedVoters);
        if (newCompletedCount !== completedVoters) {
          setCompletedVoters(newCompletedCount);
        }
      }
    }, 2000); // Check every 2 seconds

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

  // Handle swipe gestures
  const swiped = async (dir, eventId) => {
    setVoted(prev => ({ ...prev, [eventId]: dir === 'right' }));
    
    // Save vote to database if not demo
    if (actualPlanId !== 'demo') {
      try {
        // Get user info from localStorage
        const voterInfo = localStorage.getItem(`voter_${actualPlanId}`);
        const voter = voterInfo ? JSON.parse(voterInfo) : null;
        
        const voteData = {
          plan_id: actualPlanId,
          event_id: eventId,
          voter_id: voter?.userId || voterId, // Use database user ID if available
          vote_type: dir === 'right' ? 'like' : 'dislike'
        };
        
        const response = await fetch('http://127.0.0.1:8000/api/votes', {
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
    
    // Get current vote counts from localStorage (for demo or fallback)
    const storedVotes = localStorage.getItem(`votes_${actualPlanId}`);
    const currentVotes = storedVotes ? JSON.parse(storedVotes) : {};
    
    // Update vote count for this event
    const currentCount = currentVotes[eventId] || 0;
    const newCount = dir === 'right' 
      ? currentCount + 1  // Approve: +1
      : Math.max(0, currentCount - 1); // Deny: -1, but minimum 0
    
    // Save updated votes to localStorage
    const updatedVotes = {
      ...currentVotes,
      [eventId]: newCount
    };
    localStorage.setItem(`votes_${actualPlanId}`, JSON.stringify(updatedVotes));
    
    // Update local state
    setVoteCounts(updatedVotes);
    
    setCurrentIndex(prev => prev + 1);
    
    // Check if this voter has completed all events
    if (currentIndex >= deck.length - 1) {
      // Always check backend voting status after last vote
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/plans/${actualPlanId}/voting-status`);
        if (response.ok) {
          const status = await response.json();
          if (status.voting_limit_reached) {
            setAllVotersCompleted(true);
            // If solo, redirect to results immediately
            if (status.max_voters === 1) {
              console.log('✅ Redirecting to results for solo plan (backend status)');
              window.location.href = `/results/${actualPlanId}`;
              // Fallback: force redirect after 1s if not already
              setTimeout(() => {
                if (window.location.pathname !== `/results/${actualPlanId}`) {
                  window.location.href = `/results/${actualPlanId}`;
                }
              }, 1000);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking backend voting status:', error);
      }
        // For solo sessions, immediately mark as all voters completed
        const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
        if (groupSizeStr === 'solo') {
          setAllVotersCompleted(true);
        console.log('✅ Redirecting to results for solo plan (local state)');
        window.location.href = `/results/${actualPlanId}`;
        setTimeout(() => {
          if (window.location.pathname !== `/results/${actualPlanId}`) {
            window.location.href = `/results/${actualPlanId}`;
        }
        }, 1000);
        return;
      }
    }
  };

  // Manual swipe controls
  const handleManualSwipe = (dir) => {
    if (currentIndex < deck.length) {
      const currentCard = deck[currentIndex];
      if (currentCard.type === 'event') {
        swiped(dir, currentCard.id);
      }
    }
  };

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
        const response = await fetch(`http://127.0.0.1:8000/api/plans/${actualPlanId}/voting-status`);
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
      const maxVoters = groupSizeStr === 'solo' ? 1 : (groupSizeStr === 'date' || groupSizeStr === 'friend') ? 2 : 5;
      
      // Count unique voters for this plan
      const uniqueVoters = new Set();
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`voter_completed_${actualPlanId}_`)) {
          // This is a voter completion key, extract voter ID
          const voterId = key.replace(`voter_completed_${actualPlanId}_`, '');
          uniqueVoters.add(voterId);
        }
      });
      
      // Also count voters who have voter info stored but haven't completed yet
      const voterInfo = localStorage.getItem(`voter_${actualPlanId}`);
      if (voterInfo) {
        const voter = JSON.parse(voterInfo);
        const voterId = voter.userId || voter.phone;
        // Only count if they haven't completed yet
        if (!localStorage.getItem(`voter_completed_${actualPlanId}_${voterId}`)) {
          uniqueVoters.add(voterId);
        }
      }
      
      console.log(`🔐 Current unique voters: ${uniqueVoters.size}/${maxVoters}`);
      console.log(`🔐 Unique voter IDs:`, Array.from(uniqueVoters));
      
      if (uniqueVoters.size >= maxVoters) {
        alert(`Sorry! This plan is limited to ${maxVoters} ${maxVoters === 1 ? 'person' : 'people'}. All voting slots have been filled.`);
        return;
      }
      
      try {
        // Create user in database if not demo
        if (actualPlanId !== 'demo') {
          const userData = {
            name: voterName.trim(),
            phone: voterPhone.trim()
          };
          
          const response = await fetch('http://127.0.0.1:8000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          });
          
          if (response.ok) {
            const userResult = await response.json();
            // Store user ID for voting
            localStorage.setItem(`voter_${actualPlanId}`, JSON.stringify({
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
          localStorage.setItem(`voter_${actualPlanId}`, JSON.stringify({
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

  // Check if already authenticated or if user is the creator
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
        const response = await fetch(`http://127.0.0.1:8000/api/plans/${actualPlanId}/voting-status`);
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
      
      const voterInfo = localStorage.getItem(`voter_${actualPlanId}`);
      const creatorInfo = localStorage.getItem(`creator_${actualPlanId}`);
      
      // Check if user came from the create page (has referrer info)
      const cameFromCreate = sessionStorage.getItem('cameFromCreate');
      
      console.log('🔐 Auth check - voterInfo:', !!voterInfo, 'creatorInfo:', !!creatorInfo, 'cameFromCreate:', cameFromCreate);
      if (voterInfo) {
        console.log('🔐 Voter info found:', JSON.parse(voterInfo));
      }
      if (creatorInfo) {
        console.log('🔐 Creator info found:', JSON.parse(creatorInfo));
      }
      
      if (voterInfo) {
        // User has already voted in this plan
        const voter = JSON.parse(voterInfo);
        console.log('🔐 User already voted in this plan:', voter);
        setVoterName(voter.name);
        setVoterPhone(voter.phone);
        setIsAuthenticated(true);
        setShowLogin(false);
      } else if (creatorInfo && cameFromCreate) {
        // User is the creator AND came from create page
        const creator = JSON.parse(creatorInfo);
        setVoterName(creator.name);
        setVoterPhone(creator.phone);
        setIsAuthenticated(true);
        setShowLogin(false);
        // Also store as voter for consistency
        localStorage.setItem(`voter_${actualPlanId}`, JSON.stringify({
          name: creator.name,
          phone: creator.phone,
          timestamp: Date.now(),
          isCreator: true
        }));
        // Clear the session flag
        sessionStorage.removeItem('cameFromCreate');
      } else {
        // New user or direct link access - check if voting limit reached
        const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
        const maxVoters = groupSizeStr === 'solo' ? 1 : (groupSizeStr === 'date' || groupSizeStr === 'friend') ? 2 : 5;
        
        // Count unique voters for this plan
        const uniqueVoters = new Set();
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(`voter_completed_${actualPlanId}_`)) {
            // This is a voter completion key, extract voter ID
            const voterId = key.replace(`voter_completed_${actualPlanId}_`, '');
            uniqueVoters.add(voterId);
          }
        });
        
        // Also count voters who have voter info stored but haven't completed yet
        const voterInfo = localStorage.getItem(`voter_${actualPlanId}`);
        if (voterInfo) {
          const voter = JSON.parse(voterInfo);
          const voterId = voter.userId || voter.phone;
          // Only count if they haven't completed yet
          if (!localStorage.getItem(`voter_completed_${actualPlanId}_${voterId}`)) {
            uniqueVoters.add(voterId);
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
        
        // For group plans (3+ people), always require authentication
        console.log('🔐 Auth check - groupSizeStr:', groupSizeStr);
        
        if (groupSizeStr && groupSizeStr !== 'solo' && groupSizeStr !== 'friend' && groupSizeStr !== 'date') {
          console.log('🔐 Requiring login - group plan');
          setShowLogin(true);
          setIsAuthenticated(false);
        } else {
          // For friend/date plans, check if user is creator or needs to login
          if (creatorInfo) {
            // User is the creator - check if they came from create page or if this is a fresh visit
            const creator = JSON.parse(creatorInfo);
            
            if (cameFromCreate) {
              // Creator just came from create page - skip login
              console.log('🔐 Skipping login - creator from create page');
              setVoterName(creator.name);
              setVoterPhone(creator.phone);
              setIsAuthenticated(true);
              setShowLogin(false);
              // Store as voter for consistency
              localStorage.setItem(`voter_${actualPlanId}`, JSON.stringify({
                name: creator.name,
                phone: creator.phone,
                timestamp: Date.now(),
                isCreator: true
              }));
              // Clear the session flag
              sessionStorage.removeItem('cameFromCreate');
            } else {
              // Creator is returning to vote (e.g., from shared link) - check if they already voted
              const voterInfo = localStorage.getItem(`voter_${actualPlanId}`);
              if (voterInfo) {
                // Creator already voted - show voting interface
                console.log('🔐 Creator already voted - showing voting interface');
                const voter = JSON.parse(voterInfo);
                setVoterName(voter.name);
                setVoterPhone(voter.phone);
                setIsAuthenticated(true);
                setShowLogin(false);
              } else {
                // Creator hasn't voted yet - show login (they'll be auto-filled)
                console.log('🔐 Creator returning to vote - showing login with auto-fill');
                setVoterName(creator.name);
                setVoterPhone(creator.phone);
                setShowLogin(true);
                setIsAuthenticated(false);
              }
            }
          } else {
            // New user accessing shared link - always require login
            console.log('🔐 Requiring login - new user accessing shared link');
            setShowLogin(true);
            setIsAuthenticated(false);
            
            // Clear any existing session data to ensure fresh login
            sessionStorage.removeItem('cameFromCreate');
          }
        }
      }
    };
    
    checkVotingStatus();
  }, [actualPlanId, groupSize, router.isReady]);

  // Create user in backend if not already created for this plan
  useEffect(() => {
    // Create user in backend if not already created for this plan
    if (!actualPlanId || actualPlanId === 'demo') return;
    const creatorInfo = localStorage.getItem(`creator_${actualPlanId}`);
    if (creatorInfo) {
      const { name, phone } = JSON.parse(creatorInfo);
      fetch('http://127.0.0.1:8000/api/users', {
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
    const maxVoters = groupSizeStr === 'solo' ? 1 : (groupSizeStr === 'date' || groupSizeStr === 'friend') ? 2 : 5;
    
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

  // Login form
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center px-4 py-8">
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
                  // Only allow numbers, spaces, dashes, and parentheses
                  const value = e.target.value.replace(/[^0-9\s\-\(\)]/g, '');
                  setVoterPhone(value);
                }}
                placeholder="e.g., (555) 123-4567"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300"
                required
              />
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
            <p>⏰ Voting session lasts 15 minutes</p>
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
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {completedVoters}/{expectedVoters} voted
          </div>
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

      {/* Swipeable event cards */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
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
                {deck[currentIndex].type === 'event' && (
                <TinderCard
                    onSwipe={(dir) => swiped(dir, deck[currentIndex].id)}
                  preventSwipe={['up', 'down']}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
                    {/* Event image with hours overlay */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-400 to-blue-500">
                      <img 
                          src={getTopicImage(currentIndex, deck[currentIndex].topic)} 
                          alt={deck[currentIndex].name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {deck[currentIndex].isDemo ? 'Demo Hours' : deck[currentIndex].hours}
                      </div>
                    </div>

                    {/* Event details */}
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{deck[currentIndex].name}</h2>
                      
                      {/* Star rating */}
                      <div className="flex items-center gap-2 mb-4">
                          {deck[currentIndex].isDemo ? (
                          <span className="text-gray-400 dark:text-gray-500 text-sm">⭐ Demo Reviews</span>
                        ) : (
                          <>
                              <span className="text-yellow-400">{renderStars(deck[currentIndex].reviews.stars)}</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">({deck[currentIndex].reviews.count} reviews)</span>
                          </>
                        )}
                      </div>

                      {/* Contact information */}
                      <div className="space-y-2 mb-4">
                          {deck[currentIndex].isDemo ? (
                          <div className="text-center py-4">
                            <div className="text-gray-400 dark:text-gray-500 text-sm mb-2">🔒 Demo Mode</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Create a real plan to see contact info</div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="w-4 h-4">📞</span>
                                <span>{deck[currentIndex].contact.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="w-4 h-4">✉️</span>
                                <span>{deck[currentIndex].contact.email}</span>
                            </div>
                          </>
                        )}
                      </div>

                    </div>
                  </div>
                </TinderCard>
                )}
                {deck[currentIndex].type === 'hot' && (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center h-full">
                    <div className="text-5xl mb-4">🔥</div>
                    <h2 className="text-2xl font-bold mb-2">Popular Near You</h2>
                    {hotCardData && hotCardData.event ? (
                      <>
                        <div className="text-lg font-semibold mb-1">{hotCardData.event.name}</div>
                        <div className="text-gray-700 mb-2">👥 Voted on by {hotCardData.event.votes} people in {zip}</div>
                      </>
                    ) : (
                      <div className="text-gray-700 mb-2">💡 Try what locals are loving — a 2v2 soccer challenge</div>
                    )}
                  </div>
                )}
                {deck[currentIndex].type === 'secret' && (
                  <div className="bg-gradient-to-br from-purple-200 to-blue-200 border-2 border-purple-400 rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center h-full cursor-pointer" onClick={handleUnlockSecret}>
                    {!showSecretCard ? (
                      <>
                        <div className="text-5xl mb-4">🃏</div>
                        <h2 className="text-2xl font-bold mb-2 blur-sm select-none">Secret Card</h2>
                        <div className="text-gray-700 mb-2 blur-sm select-none">Tap to reveal a locals-only tip!</div>
                      </>
                    ) : (
                      <>
                        <div className="text-5xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold mb-2">Hidden Gem</h2>
                        <div className="text-gray-700 mb-2">Locals say: "Try the late-night taco truck on 5th!"</div>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manual swipe buttons */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
            <button
              onClick={() => handleManualSwipe('left')}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all duration-200 transform hover:scale-110"
            >
              ❌
            </button>
            <button
              onClick={() => handleManualSwipe('right')}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all duration-200 transform hover:scale-110"
            >
              ✅
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Swipe right to vote ✅ or left to skip ❌<br/>
            Or use the buttons below!
          </p>
        </div>
      </div>

      {/* Completion state - only show after user has authenticated and completed voting */}
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
                    className="w-full bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-all duration-200"
                  >
                    See Demo Results
                  </button>
                </div>
              </>
            ) : (
              // If solo, always show results button immediately
              (Array.isArray(groupSize) ? groupSize[0] : groupSize) === 'solo' || allVotersCompleted ? (
                (() => {
                  // Final check: if solo and on this page, force redirect
                  if ((Array.isArray(groupSize) ? groupSize[0] : groupSize) === 'solo' && typeof window !== 'undefined') {
                    setTimeout(() => {
                      if (window.location.pathname !== `/results/${actualPlanId}`) {
                        window.location.href = `/results/${actualPlanId}`;
                      }
                    }, 500);
                  }
                  return (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 All Votes In!</h3>
                <p className="text-gray-600 mb-4">Everyone has finished voting. Check the results!</p>
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
                  );
                })()
            ) : (
                // Waiting for all votes screen (never shown for solo)
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 You're Done!</h3>
                <p className="text-gray-600 mb-4">
                    Thanks for voting! Waiting for others to finish...
                </p>
                <div className="text-sm text-gray-500">
                        <p>{completedVoters}/{expectedVoters} people have finished voting</p>
                        <p className="mt-2">Results will be available when everyone is done!</p>
                </div>
              </>
              )
            )}
          </div>
        </motion.div>
      )}
      {/* Add Feeling Lucky button */}
      <div className="flex justify-center mt-4">
        <button onClick={handleFeelingLucky} className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2">
          <span>🪩</span> Feeling Lucky?
        </button>
      </div>
      {/* Show streak and badge UI */}
      <div className="flex justify-center mt-2">
        <div className="bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-full shadow text-sm font-semibold flex items-center gap-2">
          <span>🔥</span> Streak: {streak} day{streak !== 1 ? 's' : ''}
          {streak >= 3 && <span className="ml-2 bg-yellow-300 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">Gold Streak!</span>}
        </div>
      </div>
    </div>
  );
} 
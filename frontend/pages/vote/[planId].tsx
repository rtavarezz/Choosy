import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { validateVoteCreate, ValidationError, type EventResponse } from '../../lib/validation';

// Type for a voting card (matches backend event response exactly)
interface EventCard {
  id: string;
  name: string;
  description: string;
  image_url: string;        // Changed from 'image' to match backend
  start_time?: string;      // ISO datetime string
  end_time?: string;        // ISO datetime string
  venue?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  price?: string;
  category?: string;
  source?: string;
  external_id?: string;
  external_url?: string;
  organizer?: string;
  attendees_count?: number;
  max_attendees?: number;
  is_free?: boolean;
  is_featured?: boolean;
  metadata?: any;
  // Legacy fields for backwards compatibility
  rating?: number;
  reviewCount?: number;
  phone?: string;
  hours?: string;
}

const VotePage: React.FC = () => {
  const router = useRouter();
  const { planId } = router.query;

  // Get voter info from localStorage/session (do not prompt for login)
  const [voterId, setVoterId] = useState<string>('');
  const [deck, setDeck] = useState<EventCard[]>([]);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [voteDirection, setVoteDirection] = useState<'like' | 'dislike' | null>(null);
  const isAnimating = useRef(false);
  
  // Voting status and progress
  const [activeVoters, setActiveVoters] = useState<any[]>([]);
  const [completedVoters, setCompletedVoters] = useState(0);
  const [expectedVoters, setExpectedVoters] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);

  // Set voter ID from storage when component loads
  useEffect(() => {
    let voterId = localStorage.getItem('voterId') || sessionStorage.getItem('voterId');
    if (!voterId) {
      voterId = `host_${planId}`;
      localStorage.setItem('voterId', voterId);
      sessionStorage.setItem('voterId', voterId);
    }
    setVoterId(voterId);
  }, [planId]);

  // Fetch events for this plan
  useEffect(() => {
    if (!planId) return;
    (async () => {
      try {
        const res = await fetch(`/api/plans/${planId}/events`);
        if (res.ok) {
          const data = await res.json();
          
          // Handle both array response and object with events property
          const eventsArray = Array.isArray(data) ? data : (data.events || []);
          
          const events = eventsArray.map((e: any) => {
            // Parse metadata if it's a string
            let metadata: any = {};
            if (typeof e.metadata === 'string') {
              try {
                metadata = JSON.parse(e.metadata);
              } catch (err) {
                console.warn('Failed to parse metadata:', e.metadata);
              }
            } else if (typeof e.metadata === 'object') {
              metadata = e.metadata || {};
            }
            
            return {
              id: e.id,
              name: e.name,
              description: e.description || metadata.description || "Experience the best local vibes. Perfect for fun activities and memorable moments.",
              image_url: e.image_url || metadata.image_url || `https://picsum.photos/600/400?random=${e.id?.slice(-6)}`,  // Use image_url from backend
              start_time: e.start_time || metadata.start_time,
              end_time: e.end_time || metadata.end_time,
              venue: metadata.venue || e.venue || 'Local Venue',
              address: metadata.address || e.address || 'Address not available',
              city: metadata.city || e.city || 'City not available',
              state: metadata.state || e.state || 'State not available',
              zip_code: metadata.zip_code || e.zip_code || 'Zip not available',
              price: metadata.price || e.price || 'Free',
              category: e.category || metadata.category,
              source: e.source || metadata.source,
              external_id: e.external_id || metadata.external_id,
              external_url: e.external_url || metadata.external_url,
              organizer: metadata.organizer || e.organizer || 'Local Organizer',
              attendees_count: metadata.attendees_count || e.attendees_count,
              max_attendees: metadata.max_attendees || e.max_attendees,
              is_free: metadata.is_free || e.is_free,
              is_featured: metadata.is_featured || e.is_featured,
              metadata: metadata,
              // Legacy fields for backwards compatibility
              rating: metadata.rating || e.rating || Math.floor(Math.random() * 2) + 4,
              reviewCount: metadata.review_count || e.reviewCount || Math.floor(Math.random() * 100) + 20,
              phone: metadata.phone || e.phone || '',
              hours: e.hours || metadata.hours || 'Hours not available',
            };
          });
          
          setDeck(events);
          setTotalEvents(events.length);
        } else {
          console.error('Failed to fetch events:', res.status, res.statusText);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    })();
    // Get voterId from localStorage/session (customize as needed)
    const stored = localStorage.getItem(`voter_${planId}`) || sessionStorage.getItem(`voter_${planId}`);
    if (stored) {
      const v = JSON.parse(stored);
      setVoterId(v.phone || v.id || v.voter_id);
    }
  }, [planId]);

  // Fetch voting status
  useEffect(() => {
    if (!planId) return;
    (async () => {
      try {
        const res = await fetch(`/api/plans/${planId}/voting-status`);
        if (res.ok) {
          const status = await res.json();
          setExpectedVoters(status.max_voters || 1);
          setCompletedVoters(status.completed_voters || 0);
        }
      } catch (error) {
        console.error('Error fetching voting status:', error);
      }
    })();
  }, [planId]);

  // Fetch active voters
  useEffect(() => {
    if (!planId) return;
    const fetchActiveVoters = async () => {
      try {
        const res = await fetch(`/api/plans/${planId}/active-voters`);
        if (res.ok) {
          const voters = await res.json();
          setActiveVoters(voters || []);
        }
      } catch (error) {
        console.error('Error fetching active voters:', error);
      }
    };
    fetchActiveVoters();
    const interval = setInterval(fetchActiveVoters, 3000);
    return () => clearInterval(interval);
  }, [planId]);

  const onVote = async (eventId: string, direction: 'like' | 'dislike') => {
    if (!voterId || voterId === '') {
      console.warn('❌ No voter ID found, waiting for initialization...');
      return;
    }
    
    try {
      // Validate vote data before sending
      const voteData = {
        plan_id: planId as string,
        event_id: eventId,
        voter_id: voterId,
        vote_type: direction
      };
      
      const validatedVote = validateVoteCreate(voteData);
      
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedVote)
      });
      
      if (res.ok) {
        const result = await res.json();
        // Card removal is handled by Framer Motion animation
        setDeck(prev => prev.filter(card => card.id !== eventId));
        setCurrentIndex(prev => prev - 1);
      } else {
        console.error('Failed to submit vote:', res.status, res.statusText);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error('❌ Vote validation error:', error.message);
      } else {
        console.error('❌ Error recording vote:', error);
      }
    }
  };

  // Check if this is solo voting (group size 'myself' or single active voter)
  const isSoloVoting = expectedVoters === 1 || activeVoters.length <= 1;

  const removeTopCard = useCallback((id: string) => {
    setDeck(prevDeck => {
      const newDeck = prevDeck.filter(card => card.id !== id);
      return newDeck;
    });
    setCurrentIndex(prev => prev + 1);
    setLeavingId(null);
    setVoteDirection(null);
    isAnimating.current = false;
  }, []);

  if (deck.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-indigo-600 flex flex-col items-center justify-center text-white p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-2">All done!</h1>
          <p className="text-lg opacity-80 mb-6">You've voted on all events.</p>
          
          {/* Manual regeneration button for troubleshooting */}
          <button
            onClick={async () => {
              try {
                const planDetailsRes = await fetch(`/api/plans/${planId}`);
                if (planDetailsRes.ok) {
                  const planData = await planDetailsRes.json();
                  alert(`🔄 Manually refreshing events for "${planData.topic}" topic...`);
                  window.location.reload();
                }
              } catch (err) {
                console.error('Manual refresh failed:', err);
              }
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg mb-4 mr-4 transition-colors"
          >
            🔄 Refresh Events
          </button>
          
          <div>
            <button
              onClick={() => router.push(`/results/${planId}`)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-lg transition-colors"
            >
              View Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-purple-100 to-blue-100">
      {/* Header - Progress and Status */}
      {deck.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-lg mx-4 mt-4 mb-4 border border-white/20">
          <div className="flex items-center justify-between">
            {/* Left: Progress */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="text-sm font-semibold text-gray-800">
                  {currentIndex + 1} of {totalEvents} events
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Voting for activities 🎲
              </div>
            </div>
            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = `/results/${planId}`}
                className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-xs font-medium"
              >
                <span>📊</span>
                <span>Results</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Voters Display */}
      {activeVoters.length > 0 && (
        <div className="mx-4 mb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 inline-block">
            <div className="flex items-center gap-2">
              <span className="text-gray-800 font-semibold text-sm">👥</span>
              <span className="text-gray-800 text-sm">
                {activeVoters.length} {activeVoters.length === 1 ? 'person' : 'people'} voting now
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {activeVoters.map((voter, index) => (
                <div key={index} className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    {voter.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="text-gray-800 text-xs">{voter.name}</span>
                </div>
              ))}
            </div>
            
            {/* Group Progress Bar */}
            {expectedVoters > 1 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-800 mb-1">
                  <span>Group Progress</span>
                  <span>{completedVoters}/{expectedVoters} completed</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((completedVoters / expectedVoters) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Card Display Area */}
      <div className="relative w-full max-w-md h-auto mx-auto">
        <AnimatePresence mode="wait">
          {deck.length > 0 ? (
            <SwipeCard
              key={deck[deck.length - 1].id}
              card={deck[deck.length - 1]}
              isTop={true}
              leavingId={leavingId}
              voteDirection={voteDirection}
              onVote={onVote}
              onRemove={removeTopCard}
              setLeavingId={setLeavingId}
              setVoteDirection={setVoteDirection}
              isAnimating={isAnimating}
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-[500px] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50"
            >
              <span className="text-4xl mb-4">🎉</span>
              <span className="text-2xl font-bold text-gray-700 mb-2">All done!</span>
              <span className="text-lg text-gray-500">You've voted on all events.</span>
              <button
                onClick={() => window.location.href = `/results/${planId}`}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              >
                View Results
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons - Fixed Position Below Cards */}
        {deck.length > 0 && (
          <div className="flex gap-8 justify-center mt-12 px-4">
            <button
              onClick={() => {
                if (isAnimating.current || deck.length === 0) return;
                isAnimating.current = true;
                setVoteDirection('dislike');
                setLeavingId(deck[deck.length - 1].id);
                onVote(deck[deck.length - 1].id, 'dislike');
                setTimeout(() => removeTopCard(deck[deck.length - 1].id), 100);
              }}
              className="w-16 h-16 bg-white border-2 border-red-400 text-red-500 rounded-full font-semibold hover:bg-red-50 active:bg-red-100 transition-all duration-100 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (isAnimating.current || deck.length === 0) return;
                isAnimating.current = true;
                setVoteDirection('like');
                setLeavingId(deck[deck.length - 1].id);
                onVote(deck[deck.length - 1].id, 'like');
                setTimeout(() => removeTopCard(deck[deck.length - 1].id), 100);
              }}
              className="w-16 h-16 bg-white border-2 border-green-400 text-green-500 rounded-full font-semibold hover:bg-green-50 active:bg-green-100 transition-all duration-100 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced SwipeCard Component with Professional Design
interface SwipeCardProps {
  card: EventCard;
  isTop: boolean;
  leavingId: string | null;
  voteDirection: 'like' | 'dislike' | null;
  onVote: (eventId: string, direction: 'like' | 'dislike') => Promise<void>;
  onRemove: (id: string) => void;
  setLeavingId: (id: string | null) => void;
  setVoteDirection: (direction: 'like' | 'dislike' | null) => void;
  isAnimating: React.MutableRefObject<boolean>;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ 
  card, 
  isTop, 
  leavingId,
  voteDirection,
  onVote, 
  onRemove, 
  setLeavingId,
  setVoteDirection, 
  isAnimating 
}) => {
  // --- Motion values for drag/tilt/overlay ---
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 0, 150], [-5, 0, 5]);
  const likeOpacity = useTransform(x, [20, 80], [0, 1]);
  const dislikeOpacity = useTransform(x, [-80, -20], [1, 0]);
  
  return (
    <motion.div
      className="relative w-full overflow-visible"
      style={{ x, rotate }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        transition: { type: 'spring', stiffness: 500, damping: 30, mass: 0.8 }
      }}
      exit={{
        x: leavingId === card.id ? (voteDirection === 'like' ? 400 : -400) : 0,
        opacity: 0,
        scale: 0.9,
        rotate: leavingId === card.id ? (voteDirection === 'like' ? 10 : -10) : 0,
        transition: { duration: 0.1, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 800, bounceDamping: 30 }}
      onDrag={(e, info) => {
        if (isAnimating.current) return;
        x.set(info.offset.x);
      }}
      onDragEnd={(e, info) => {
        if (isAnimating.current) {
          return;
        }
        const shouldSwipe = Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 400;
        if (shouldSwipe) {
          isAnimating.current = true;
          const dir = info.offset.x > 0 ? 'like' : 'dislike';
          setVoteDirection(dir);
          setLeavingId(card.id);
          onVote(card.id, dir);
          setTimeout(() => onRemove(card.id), 100);
        } else {
          // Smooth snap back
          x.set(0);
        }
      }}
    >
      {/* The Card Itself */}
      <div className="bg-white rounded-3xl shadow-3xl overflow-hidden transform-gpu">
        <div className="relative w-full flex flex-col cursor-grab">
          {/* Card Image */}
          <div className="relative h-64 w-full">
            <img 
              src={card.image_url || `https://picsum.photos/600/400?random=${card.id.slice(-6)}`}
              alt={card.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If the primary image fails, try a different placeholder
                if (!e.currentTarget.src.includes('picsum')) {
                  e.currentTarget.src = `https://picsum.photos/600/400?random=${card.id.slice(-6)}`;
                } else {
                  // Final fallback to SVG gradient
                  e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(`
                    <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:rgb(147,51,234);stop-opacity:1" />
                          <stop offset="100%" style="stop-color:rgb(79,70,229);stop-opacity:1" />
                        </linearGradient>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grad)"/>
                      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${card.name || 'Event'}</text>
                    </svg>
                  `)}`;
                }
              }}
            />
            
            {/* Drag Overlays */}
            <>
              <motion.div 
                className="absolute top-6 left-6 bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-lg pointer-events-none select-none shadow-lg"
                style={{ opacity: likeOpacity }}
              >
                LIKE
              </motion.div>
              <motion.div 
                className="absolute top-6 right-6 bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg pointer-events-none select-none shadow-lg"
                style={{ opacity: dislikeOpacity }}
              >
                PASS
              </motion.div>
            </>
          </div>
          
          {/* Card Content */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{card.name}</h2>
            {card.venue && card.venue !== card.name && (
              <p className="text-purple-600 text-sm font-medium mb-1">📍 {card.venue}</p>
            )}
            {card.price && (
              <p className="text-green-600 text-sm font-medium mb-2">💰 {card.price}</p>
            )}
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              {card.description || "Experience the best local vibes. Perfect for fun activities and memorable moments."}
            </p>
            
            {/* Stars and Reviews with real data */}
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${star <= Math.floor(card.rating || 4) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.954a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.372 2.455a1 1 0 00-.364 1.118l1.287 3.953c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.372 2.454c-.784.57-1.838-.197-1.539-1.118l1.286-3.953a1 1 0 00-.364-1.118L2.639 9.38c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.953z" />
                </svg>
              ))}
              <span className="text-gray-500 ml-2 text-sm">
                ({card.reviewCount || 42} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VotePage;
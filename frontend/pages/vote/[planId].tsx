/**
 * Choosy Voting Interface
 * Copyright (c) 2024 rtavarezz
 * 
 * Real-time group voting interface with swipe mechanics.
 * Licensed under MIT License - see LICENSE file.
 * 
 * This proprietary interface handles group voting dynamics,
 * real-time synchronization, and user experience optimization.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { validateVoteCreate, ValidationError, type EventResponse } from '../../lib/validation';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { LoginModal } from '@/components/LoginModal';
import Head from 'next/head';
import CarouselVoting from '@/components/CarouselVoting';
import { FriendsVotingBar } from '@/components/FriendsVotingBar';

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
  tickets_required?: boolean;
  reservations_accepted?: boolean;
  source_type?: string;
}

const VotePage: React.FC = () => {
  const router = useRouter();
  const { planId, creator } = router.query;
  const { user, isAuthenticated, isLoading } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isValidCreator, setIsValidCreator] = useState(false);
  const [creatorValidationChecked, setCreatorValidationChecked] = useState(false);
  const isCreator = creator === 'true' && isValidCreator;
  const [deck, setDeck] = useState<EventCard[]>([]);
  const [votedEventIds, setVotedEventIds] = useState<Set<string>>(new Set());
  
  // Voting status and progress
  const [completedVoters, setCompletedVoters] = useState(0);
  const [expectedVoters, setExpectedVoters] = useState(1);
  // Voting session countdown timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerStarted, setTimerStarted] = useState(false);

  // Join/leave active voters for live presence
  useEffect(() => {
    if (!planId || !creatorValidationChecked) return;
    const voterId = (isCreator ? `host_${planId}` : (user?.id as string | undefined)) || undefined;
    const name = isCreator ? 'Host' : (user?.name || 'Friend');
    if (!voterId) return;
    let left = false;
    (async () => {
      try {
        await apiFetch(`/api/plans/${planId}/active-voters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voter_id: voterId, action: 'join', name })
        });
      } catch (e) {
        console.warn('Active voter join failed', e);
      }
    })();
    return () => {
      if (left) return;
      left = true;
      (async () => {
        try {
          await apiFetch(`/api/plans/${planId}/active-voters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voter_id: voterId, action: 'leave', name })
          });
        } catch (e) {
          // ignore
        }
      })();
    };
  }, [planId, isCreator, user?.id, user?.name, creatorValidationChecked]);

  // Validate creator claim if creator=true is in URL
  useEffect(() => {
    if (creator === 'true' && planId && !creatorValidationChecked) {
      (async () => {
        try {
          const res = await apiFetch(`/api/plans/${planId}/validate-creator`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              claimed_creator_id: `host_${planId}` // Use the same ID format as voting
            })
          });
          
          if (res.ok) {
            const data = await res.json();
            setIsValidCreator(data.is_valid_creator || false);
          } else {
            setIsValidCreator(false);
          }
        } catch (error) {
          console.error('Creator validation failed:', error);
          setIsValidCreator(false);
        }
        setCreatorValidationChecked(true);
      })();
    } else if (creator !== 'true') {
      setIsValidCreator(false);
      setCreatorValidationChecked(true);
    }
  }, [creator, planId, creatorValidationChecked]);

  // Check authentication when component loads (skip ONLY for validated creators)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isCreator && creatorValidationChecked) {
      setShowAuthModal(true);
    }
  }, [isLoading, isAuthenticated, isCreator, creatorValidationChecked]);

  // When a friend successfully authenticates, register them with the plan
  useEffect(() => {
    if (isAuthenticated && !isCreator && user && planId && creatorValidationChecked) {
      (async () => {
        try {
          const res = await apiFetch(`/api/plans/${planId}/add-voter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              voter_id: user.id,
              voter_name: user.name,
              voter_phone: user.phone
            })
          });
          
          if (res.ok) {
            console.log('Friend successfully registered with plan');
          }
        } catch (error) {
          console.error('Failed to register friend with plan:', error);
        }
      })();
    }
  }, [isAuthenticated, isCreator, user, planId, creatorValidationChecked]);

  // Fetch events for this plan
  useEffect(() => {
    if (!planId) return;
    (async () => {
      try {
        const res = await apiFetch(`/api/plans/${planId}/events`);
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
              source_type: e.source_type || e.source || metadata.source,
              external_id: e.external_id || metadata.external_id,
              external_url: e.external_url || metadata.external_url,
              organizer: metadata.organizer || e.organizer || 'Local Organizer',
              attendees_count: metadata.attendees_count || e.attendees_count,
              max_attendees: metadata.max_attendees || e.max_attendees,
              is_free: metadata.is_free || e.is_free,
              is_featured: metadata.is_featured || e.is_featured,
              metadata: metadata,
              tickets_required: e.tickets_required || metadata.tickets_required,
              reservations_accepted: e.reservations_accepted || metadata.reservations_accepted,
              // Legacy fields for backwards compatibility
              rating: metadata.rating || e.rating || Math.floor(Math.random() * 2) + 4,
              reviewCount: metadata.review_count || e.reviewCount || Math.floor(Math.random() * 100) + 20,
              phone: metadata.phone || e.phone || '',
              hours: e.hours || metadata.hours || 'Hours not available',
            };
          });
          
          setDeck(events);
          // Fixed 4-minute timer (240 seconds); initialize only once per session
          if (!timerStarted) {
            setTimeLeft(240);
            setTimerStarted(true);
          }
        } else {
          console.error('Failed to fetch events:', res.status, res.statusText);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    })();
    // Authentication is handled by useAuth hook
  }, [planId]);

  // Countdown effect and auto-finalize when time runs out
  useEffect(() => {
    if (!timerStarted || timeLeft === null) return;
    if (timeLeft <= 0) {
      (async () => {
        try {
          const res = await apiFetch(`/api/plans/${planId}/results`);
          let chosenId: string | null = null;
          if (res.ok) {
            const data = await res.json();
            const events = Array.isArray(data?.events) ? data.events : [];
            if (events.length > 0) {
              const maxVotes = Math.max(...events.map((e: any) => e.votes || 0));
              const top = events.filter((e: any) => (e.votes || 0) === maxVotes);
              const pick = top[Math.floor(Math.random() * top.length)];
              chosenId = pick?.id || null;
            }
          }
          if (!chosenId && deck.length > 0) {
            const pick = deck[Math.floor(Math.random() * deck.length)];
            chosenId = pick?.id || null;
          }
          if (chosenId && typeof window !== 'undefined') {
            try { sessionStorage.setItem(`choosy:selectedWinner:${planId}`, chosenId); } catch {}
          }
        } catch (_) {
          // ignore errors and continue to results
        } finally {
          router.push(`/results/${planId}`);
        }
      })();
      return;
    }
    const id = setInterval(() => setTimeLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearInterval(id);
  }, [timeLeft, timerStarted, planId, deck, router]);

  // Fetch voting status with live updates
  useEffect(() => {
    if (!planId) return;
    
    const fetchVotingStatus = async () => {
      try {
        const res = await apiFetch(`/api/plans/${planId}/voting-status`);
        if (res.ok) {
          const status = await res.json();
          setExpectedVoters(status.max_voters || 1);
          setCompletedVoters(status.completed_voters || 0);
        }
      } catch (error) {
        console.error('Error fetching voting status:', error);
      }
    };

    // Initial fetch
    fetchVotingStatus();
    
    // Live updates every 2 seconds
    const interval = setInterval(fetchVotingStatus, 2000);
    return () => clearInterval(interval);
  }, [planId]);


  const handleVote = async (eventId: string, direction: 'like' | 'dislike') => {
    // Ensure user is authenticated before voting (skip for creators)
    if (!isCreator && (!isAuthenticated || !user)) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      // Validate vote data before sending
      const voterId = isCreator ? `host_${planId}` : user?.id;
      
      if (!voterId) {
        console.error('No voter ID available');
        return;
      }
      
      const voteData = {
        plan_id: planId as string,
        event_id: eventId,
        voter_id: voterId,
        vote_type: direction
      };
      
      const validatedVote = validateVoteCreate(voteData);
      
      const res = await apiFetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedVote)
      });
      
      if (res.ok) {
        // Track voted events instead of removing from deck
        setVotedEventIds(prev => {
          const newSet = new Set(prev);
          newSet.add(eventId);
          return newSet;
        });
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



  // Show loading screen while auth is being checked
  if (isLoading) {
    return (
      <>
        <Head>
          <title>Loading • Choosy</title>
        </Head>
        <BackgroundGradient />
        <div className="min-h-screen flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white/80 animate-spin mx-auto" />
              <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Voting Session</h2>
            <p className="text-white/70">Preparing your voting experience...</p>
          </motion.div>
        </div>
      </>
    );
  }

  // Check if all events are voted on instead of deck length
  if (deck.length > 0 && votedEventIds.size >= deck.length) {
    return (
      <>
        <Head>
          <title>Voting • Choosy</title>
        </Head>
        <BackgroundGradient />
        <div className="min-h-screen flex flex-col items-center justify-center text-white p-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-2">All done!</h1>
            <p className="text-lg opacity-80 mb-6">You've voted on all events.</p>
            <button
              onClick={async () => {
                try {
                  const planDetailsRes = await apiFetch(`/api/plans/${planId}`);
                  if (planDetailsRes.ok) {
                    const planData = await planDetailsRes.json();
                    alert(`🔄 Manually refreshing events for "${planData.topic}" topic...`);
                    window.location.reload();
                  }
                } catch (err) {
                  console.error('Manual refresh failed:', err);
                }
              }}
              className="btn-primary mb-4 mr-4"
            >
              🔄 Refresh Events
            </button>
            <div>
              <button
                onClick={() => router.push(`/results/${planId}`)}
                className="btn-primary px-8"
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Voting • Choosy</title>
      </Head>
      <BackgroundGradient />
      <div className="min-h-screen w-full flex flex-col">
        {/* Session Timer - Top Right (before Share) */}
        {typeof timeLeft === 'number' && timeLeft >= 0 && (
          <div className="fixed top-4 right-36 z-50">
            <div className="bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium border border-white/20 whitespace-nowrap">
              Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}
        {/* Friends Voting Bar - Top Left */}
        <div className="fixed top-4 left-4 z-50">
          <FriendsVotingBar
            planId={planId as string}
            maxVoters={expectedVoters}
            completedVoters={completedVoters}
          />
        </div>
        {/* Carousel Voting Area */}
        <div className="relative w-full h-screen">
          <CarouselVoting
            key={`${planId}-${deck.slice(0, 3).map(e => e.id).join('-')}`}
            events={deck}
            onVote={handleVote}
            onComplete={() => router.push(`/results/${planId}`)}
            className="h-full"
            initialVotedEventIds={votedEventIds}
          />
        </div>

        {/* Authentication Modal */}
        <LoginModal
          isOpen={showAuthModal}
          onClose={() => {
            // Always close the modal - if auth failed, it will reopen immediately
            setShowAuthModal(false);
          }}
        />
      </div>
    </>
  );
};

export default VotePage;

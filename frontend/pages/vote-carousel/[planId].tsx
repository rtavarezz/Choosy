/**
 * Choosy Carousel Voting Page
 * Copyright (c) 2024 rtavarezz
 * 
 * Multi-card carousel voting interface for group decision-making.
 * Licensed under MIT License - see LICENSE file.
 * 
 * This page demonstrates the new multi-card carousel voting experience.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { validateVoteCreate, ValidationError, type EventResponse } from '../../lib/validation';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { useAuth } from '@/lib/auth';
import { LoginModal } from '@/components/LoginModal';
import CarouselVoting from '@/components/CarouselVoting';
import { FriendsVotingBar } from '@/components/FriendsVotingBar';
import Head from 'next/head';

// Type for a voting card (matches backend event response exactly)
interface EventCard {
  id: string;
  name: string;
  description: string;
  image_url: string;
  start_time?: string;
  end_time?: string;
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
  rating?: number;
  reviewCount?: number;
  phone?: string;
  hours?: string;
  contact?: {
    phone?: string;
  };
}

interface VotingStatusResponse {
  plan_id: string;
  topic: string;
  group_size: string;
  host_name: string;
  host_phone: string;
  max_voters: number;
  completed_voters: number;
  total_voters: number;
  active_voters: number;
  total_events: number;
  voting_limit_reached: boolean;
  can_vote: boolean;
  all_voters_completed: boolean;
}

const CarouselVotingPage: React.FC = () => {
  const router = useRouter();
  const { planId, creator } = router.query;
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const isCreator = creator === 'true';
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [events, setEvents] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingStatus, setVotingStatus] = useState<VotingStatusResponse | null>(null);
  const [hasVoted, setHasVoted] = useState<Set<string>>(new Set());

  // Check authentication when component loads (skip for creators)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isCreator) {
      setShowAuthModal(true);
    }
  }, [isLoading, isAuthenticated, isCreator]);

  // Generate a persistent voter ID for this browser/session (legacy - now using authenticated user ID)
  const [voterId, setVoterId] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;
    if (typeof window === 'undefined') return; // SSR guard

    const key = `voter_id_${planId}`;
    const existingVoterId = window.localStorage.getItem(key);
    if (existingVoterId) {
      console.log(`🔄 Using existing voter ID: ${existingVoterId}`);
      setVoterId(existingVoterId);
      return;
    }

    const newVoterId = `voter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    window.localStorage.setItem(key, newVoterId);
    console.log(`🆕 Generated new voter ID: ${newVoterId}`);
    setVoterId(newVoterId);
  }, [planId]);

  // Fetch events and voting status
  useEffect(() => {
    if (!planId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch events
        const eventsResponse = await fetch(`http://localhost:8000/api/plans/${planId}/events`);
        if (!eventsResponse.ok) {
          throw new Error('Failed to fetch events');
        }
        const eventsData = await eventsResponse.json();
        
        // Transform events to match our interface
        const transformedEvents: EventCard[] = eventsData.events.map((event: any) => ({
          id: event.id,
          name: event.name,
          description: event.description || `Experience the best ${event.topic || 'local'} vibes at ${event.name}. Perfect for ${event.topic || 'fun'} activities and memorable moments.`,
          image_url: event.image_url,
          venue: event.venue,
          address: event.address,
          city: event.city,
          state: event.state,
          zip_code: event.zip_code,
          price: event.price || 'Free',
          category: event.category,
          rating: event.reviews?.stars || 4.2,
          reviewCount: event.reviews?.count || 42,
          hours: event.hours,
          contact: event.contact,
          metadata: event.metadata
        }));

        setEvents(transformedEvents);

        // Fetch voting status
        const statusResponse = await fetch(`http://localhost:8000/api/plans/${planId}/voting-status`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setVotingStatus(statusData);
        }

        // Fetch existing votes for this voter
        try {
          if (!voterId) return; // wait until voterId is ready on client
          console.log(`🔍 Fetching existing votes for voter: ${voterId}`);
          const votesResponse = await fetch(`http://localhost:8000/api/plans/${planId}/votes/${voterId}`);
          console.log(`📡 Votes API response status: ${votesResponse.status}`);
          
          if (votesResponse.ok) {
            const votesData = await votesResponse.json();
            const votedEventIds = new Set<string>(votesData.votes.map((vote: any) => vote.event_id));
            setHasVoted(votedEventIds);
            console.log(`📊 Loaded ${votesData.total_votes} existing votes for voter ${voterId}:`, Array.from(votedEventIds));
          } else {
            const errorText = await votesResponse.text();
            console.log(`❌ Failed to fetch votes (${votesResponse.status}): ${errorText}`);
            console.log(`ℹ️ No existing votes found for voter ${voterId}`);
          }
        } catch (err) {
          console.error('❌ Error fetching existing votes:', err);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling for voting status updates
    const statusInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(`http://localhost:8000/api/plans/${planId}/voting-status`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setVotingStatus(statusData);
        }
      } catch (err) {
        console.error('Error fetching voting status:', err);
      }
    }, 3000);

    return () => clearInterval(statusInterval);
  }, [planId, voterId]);

  // Handle voting
  const handleVote = useCallback(async (eventId: string, voteType: 'like' | 'dislike') => {
    if (!planId || hasVoted.has(eventId)) return;

    // Ensure user is authenticated before voting (skip for creators)
    if (!isCreator && (!isAuthenticated || !user)) {
      setShowAuthModal(true);
      return;
    }

    try {
      // Optimistically update UI
      setHasVoted(prev => {
        const newSet = new Set(prev);
        newSet.add(eventId);
        return newSet;
      });

      // Validate vote data
      const currentVoterId = isCreator ? `host_${planId}` : user?.id;
      
      if (!currentVoterId) {
        console.error('No voter ID available');
        return;
      }
      
      const voteData = {
        plan_id: planId as string,
        event_id: eventId,
        voter_id: currentVoterId,
        vote_type: voteType
      };

      const validatedVote = validateVoteCreate(voteData);

      // Submit vote to backend
      const response = await fetch('http://localhost:8000/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validatedVote)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to submit vote' }));
        throw new Error(errorData.message || 'Failed to submit vote');
      }

      const result = await response.json();
      console.log(`Vote submitted: ${voteType} for event ${eventId}`);

    } catch (err) {
      console.error('Error submitting vote:', err);
      
      // Revert optimistic update on error
      setHasVoted(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });

      if (err instanceof ValidationError) {
        setError(`Validation error: ${err.message}`);
      } else {
        setError('Failed to submit vote. Please try again.');
      }
    }
  }, [planId, user?.id, hasVoted, isAuthenticated, isCreator]);

  // Handle voting completion
  const handleVotingComplete = useCallback(() => {
    router.push(`/results/${planId}`);
  }, [planId, router]);

  // Show loading screen while auth is being checked
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BackgroundGradient />
        <div className="text-center z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BackgroundGradient />
        <div className="text-center z-10 max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-4">Oops!</h2>
          <p className="text-white/80 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BackgroundGradient />
        <div className="text-center z-10">
          <div className="text-white/60 text-6xl mb-4">📍</div>
          <h2 className="text-white text-2xl font-bold mb-4">No Events Found</h2>
          <p className="text-white/80 mb-6">
            We couldn't find any events for this plan. Try a different location or category.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Vote on Events - Choosy</title>
        <meta name="description" content="Vote on events for your group plan" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen relative overflow-hidden">
        <BackgroundGradient />
        
        {/* Main content */}
        <div className="relative z-10 h-screen">
          {/* Friends Voting Bar - Top Left */}
          <div className="absolute top-4 left-4 z-20">
            <FriendsVotingBar
              planId={planId as string}
              maxVoters={votingStatus?.max_voters || 1}
              completedVoters={votingStatus?.completed_voters || 0}
            />
          </div>

          {/* Carousel Voting Component */}
          <CarouselVoting
            events={events}
            onVote={handleVote}
            onComplete={handleVotingComplete}
            className="h-full"
            initialVotedEventIds={hasVoted}
          />

          {/* Voting status indicator */}
          {votingStatus?.voting_limit_reached && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
            >
              <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Voting Complete!</h3>
                <p className="text-gray-600 mb-6">
                  All voters have finished. Ready to see the results?
                </p>
                <button
                  onClick={handleVotingComplete}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                >
                  View Results
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="absolute bottom-4 left-4 z-20 hidden lg:block">
          <div className="bg-black/20 backdrop-blur-md rounded-lg p-3 text-white text-sm">
            <p className="font-medium mb-1">Keyboard shortcuts:</p>
            <p>← → to navigate • Space for ❤️ • X for ✕</p>
          </div>
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

export default CarouselVotingPage;
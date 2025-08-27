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
import Head from 'next/head';
import CarouselVoting from '@/components/CarouselVoting';

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
  const [votedEventIds, setVotedEventIds] = useState<Set<string>>(new Set());
  
  // Voting status and progress
  const [activeVoters, setActiveVoters] = useState<any[]>([]);
  const [completedVoters, setCompletedVoters] = useState(0);
  const [expectedVoters, setExpectedVoters] = useState(1);
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

  const handleVote = async (eventId: string, direction: 'like' | 'dislike') => {
    // Get voter ID directly from storage as fallback if state isn't ready yet
    let currentVoterId = voterId;
    if (!currentVoterId || currentVoterId === '') {
      currentVoterId = localStorage.getItem('voterId') || sessionStorage.getItem('voterId') || '';
      if (!currentVoterId) {
        console.warn('❌ No voter ID found, waiting for initialization...');
        return;
      }
      // Update state for next time
      setVoterId(currentVoterId);
    }
    
    try {
      // Validate vote data before sending
      const voteData = {
        plan_id: planId as string,
        event_id: eventId,
        voter_id: currentVoterId,
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
        {/* Active Voters Display */}
        {activeVoters.length > 0 && (
          <div className="mx-auto mb-4 max-w-2xl w-full">
            <div className="bg-white/75 dark:bg-neutral-900/80 backdrop-blur-md rounded-lg p-3 inline-block border border-white/40 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-neutral-900 dark:text-white font-semibold text-sm">👥</span>
                <span className="text-neutral-900 dark:text-white text-sm">
                  {activeVoters.length} {activeVoters.length === 1 ? 'person' : 'people'} voting now
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {activeVoters.map((voter, index) => (
                  <div key={index} className="flex items-center gap-1 bg-white/20 dark:bg-white/10 rounded-full px-2 py-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {voter.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="text-neutral-900 dark:text-white text-xs">{voter.name}</span>
                  </div>
                ))}
              </div>
              {/* Group Progress Bar */}
              {expectedVoters > 1 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-neutral-900 dark:text-white mb-1">
                    <span>Group Progress</span>
                    <span>{completedVoters}/{expectedVoters} completed</span>
                  </div>
                  <div className="w-full bg-white/20 dark:bg-white/10 rounded-full h-2">
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
      </div>
    </>
  );
};

export default VotePage;
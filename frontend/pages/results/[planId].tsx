import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import Head from 'next/head';
import { useDarkMode } from '../../lib/darkMode';
import PhoneInput from 'react-phone-input-2/lib/lib';
import 'react-phone-input-2/lib/style.css';
import ProfanityFilter from 'profanity-filter';

import Confetti from 'react-confetti';

const getTopicImageUrl = (topic: string) => `https://source.unsplash.com/600x400/?${encodeURIComponent(topic || 'event')}`;

interface VotingStatus {
  max_voters: number;
  completed_voters: number;
  voting_limit_reached: boolean;
}

interface ResultsData {
  planId: string;
  topic: string;
  groupSize: string;
  zip: string;
  winningEvent?: {
    id: string;
    name: string;
    votes: number;
    image_url: string;     // Changed from image to image_url
    hours: string;
    contact: { phone: string };
  };
  plan: {
    userName: string;
    phoneNumber: string;
    topic: string;
    groupSize: string;
    zipCode: string;
  };
  totalVotes: number;
  participants: string[];
  allEvents: Array<{
    id: string;
    name: string;
    votes: number;
    total_votes: number;
    percentage: number;
    image_url: string;     // Changed from image to image_url
    hours: string;
    contact: { phone: string };
  }>;
}

// Custom hooks for React Query
function useVotingStatus(planId: string) {
  return useQuery<VotingStatus>({
    queryKey: ['voting-status', planId],
    queryFn: async () => {
      const response = await fetch(`/api/plans/${planId}/voting-status`);
      if (!response.ok) throw new Error('Failed to fetch voting status');
      return response.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds
    enabled: !!planId && planId !== 'demo',
  });
}

function useResults(planId: string) {
  return useQuery<ResultsData>({
    queryKey: ['results', planId],
    queryFn: async () => {
      const response = await fetch(`/api/plans/${planId}/results`);
      if (!response.ok) throw new Error('Failed to fetch results');
      const data = await response.json();
      
      // Transform API results to match frontend format
      return {
        planId,
        topic: data.plan.topic,
        groupSize: data.plan.group_size,      // Updated to use group_size
        zip: data.plan.zip_code,              // Updated to use zip_code
        winningEvent: data.events.length > 0 ? {
          id: data.events[0].id,
          name: data.events[0].name,
          votes: data.events[0].votes,
          image_url: data.events[0].image_url || getTopicImageUrl(data.plan.topic),  // Use image_url from backend
          hours: "2 hours",
          contact: { phone: '(555) 123-4567' }
        } : undefined,
        plan: {
          userName: data.plan.host_name,      // Updated to use host_name
          phoneNumber: data.plan.host_phone,  // Updated to use host_phone
          topic: data.plan.topic,
          groupSize: data.plan.group_size,    // Updated to use group_size
          zipCode: data.plan.zip_code         // Updated to use zip_code
        },
        totalVotes: data.totalVotes,
        participants: data.participants,
        allEvents: data.events.map((event: any, index: number) => ({
          id: event.id,
          name: event.name,
          votes: event.votes,
          total_votes: event.total_votes,
          percentage: event.percentage,
          image_url: event.image_url || getTopicImageUrl(data.plan.topic),  // Use image_url from backend
          hours: "2 hours",
          contact: { phone: '(555) 123-4567' }
        }))
      };
    },
    refetchInterval: 10000, // Poll every 10 seconds
    enabled: !!planId && planId !== 'demo',
  });
}

// Enhanced UI Components
function WinnerCard({ event, onCall, onReserve }: { 
  event: any; 
  onCall: (phone: string) => void; 
  onReserve: () => void; 
}) {
  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30 transform hover:scale-[1.02] transition-all duration-300">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <img 
          src={event.image} 
          alt={event.name}
          className="w-full md:w-32 h-32 rounded-xl object-cover shadow-lg"
        />
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{event.name}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-1">{event.hours}</p>
          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">{event.votes} votes</p>
          <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
            <span className="text-lg">📞</span>
            <span className="text-gray-700 dark:text-gray-300">{event.contact.phone}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <button
          onClick={() => onCall(event.contact.phone)}
          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <span className="text-lg">📞</span>
          <span>Call Now</span>
        </button>
        
        <button
          onClick={onReserve}
          className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <span className="text-lg">📅</span>
          <span>Reserve</span>
        </button>
      </div>
    </div>
  );
}



function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading live results...</p>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { planId } = router.query;
  const planIdStr = Array.isArray(planId) ? planId[0] : planId || '';
  
  // React Query hooks
  const { data: votingStatus, isLoading: statusLoading } = useVotingStatus(planIdStr);
  const { data: results, isLoading: resultsLoading, error } = useResults(planIdStr);
  
  // State
  const [showReservation, setShowReservation] = useState(false);
  const [reservationName, setReservationName] = useState('');
  const [reservationPhone, setReservationPhone] = useState('');
  const [reservationGroupSize, setReservationGroupSize] = useState('myself');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  // Window size for confetti
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateSize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);

  // Smart confetti trigger - only when voting completes
  useEffect(() => {
    if (votingStatus?.voting_limit_reached && !hasTriggeredConfetti) {
      setShowConfetti(true);
      setHasTriggeredConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [votingStatus?.voting_limit_reached, hasTriggeredConfetti]);

  const isSoloPlan = votingStatus?.max_voters === 1;
  const allVotersCompleted = votingStatus?.voting_limit_reached || false;

  // Name validation function
  const validateName = (name: string): boolean => {
    const trimmedName = name.trim();
    
    if (trimmedName.length < 2 || trimmedName.length > 30) {
      setNameError('Name must be between 2 and 30 characters');
      return false;
    }
    
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(trimmedName)) {
      setNameError('Name can only contain letters, spaces, hyphens, and apostrophes');
      return false;
    }
    
    const filter = new ProfanityFilter();
    if (filter.isProfane(trimmedName)) {
      setNameError('Please choose an appropriate name');
      return false;
    }
    
    setNameError('');
    return true;
  };

  // Event handlers
  const handleCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleReservation = async () => {
    if (!results?.winningEvent) return;
    setShowReservation(true);
  };

  const handleReservationSubmit = async () => {
    if (!validateName(reservationName)) return;

    if (!reservationPhone || reservationPhone.length < 10) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    setPhoneError('');

    try {
      const response = await fetch('/api/makeReservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: results?.topic,
          event_name: results?.winningEvent?.name,
          user_name: reservationName,
          phone_number: reservationPhone,
          group_size: reservationGroupSize,
          event_time: "7:00 PM",
          event_date: new Date().toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        alert('Reservation submitted successfully!');
        setShowReservation(false);
        setReservationName('');
        setReservationPhone('');
        setReservationGroupSize('myself');
      } else {
        alert('Failed to submit reservation. Please try again.');
      }
    } catch (error) {
      console.error('Reservation error:', error);
      alert('Failed to submit reservation. Please try again.');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/vote/${planIdStr}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my voting session!',
          text: 'Help me decide what to do!',
          url: shareUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Copy failed:', error);
      }
    }
  };

  // Loading state
  if (statusLoading || resultsLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Results Not Found</h1>
          <p className="text-gray-600 mb-6">{error?.message || 'The voting session may have expired or doesn\'t exist.'}</p>
          <button
            onClick={() => router.push('/create')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
          >
            Create New Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Voting Results - Choosy</title>
        <meta name="description" content="See the results of your group voting" />
      </Head>
      
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={300}
        />
      )}
      
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transition-all duration-300"
          >
            ← Back to Home
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white ml-4">Live Results</h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live Updates
          </div>
        </div>
        
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-white/20 dark:bg-gray-700/50 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-600/50 transition-colors"
        >
          {isDarkMode ? (
            <span className="text-yellow-400 text-xl">☀️</span>
          ) : (
            <span className="text-gray-700 dark:text-gray-300 text-xl">🌙</span>
          )}
        </button>
      </header>
      
      <div className="relative min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {/* Voter progress - only show for group plans */}
          {!isSoloPlan && votingStatus && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg">
              <span className="text-lg font-bold">👥</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {votingStatus.completed_voters}/{votingStatus.max_voters} finished voting
              </span>
              {allVotersCompleted && (
                <span className="text-green-600 dark:text-green-400 font-bold ml-2">🎉 All Done!</span>
              )}
            </div>
          )}

          {/* Winner announcement */}
          {(isSoloPlan || allVotersCompleted) && results.winningEvent && (
            <div className="text-center mb-8">
              <div className="text-6xl mb-4 animate-bounce">🏆</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Winner!</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {isSoloPlan ? 'You chose this event' : 'Your group chose this event'}
              </p>
              
              <div className="mt-8">
                <WinnerCard 
                  event={results.winningEvent}
                  onCall={handleCall}
                  onReserve={handleReservation}
                />
              </div>
            </div>
          )}

          {/* Waiting for votes */}
          {!isSoloPlan && !allVotersCompleted && (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 dark:border-gray-700/30 text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Waiting for All Votes</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {votingStatus?.completed_voters || 0} out of {votingStatus?.max_voters || 0} people have finished voting.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push(`/vote/${planIdStr}`)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:scale-105 transition-all duration-200"
                >
                  Back to Voting
                </button>
              </div>
            </div>
          )}

          {/* All Events Results */}
          {results.allEvents && results.allEvents.length > 0 && (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 dark:border-gray-700/30">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">All Results</h3>
              <div className="space-y-4">
                {results.allEvents.slice(0, 6).map((event, index) => {
                  let medal = null;
                  if (index === 0) medal = '🥇';
                  else if (index === 1) medal = '🥈';
                  else if (index === 2) medal = '🥉';
                  
                  return (
                    <div 
                      key={event.id} 
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-md border border-purple-100 dark:border-purple-800/30 hover:scale-[1.02] transition-all duration-200"
                    >
                      <img 
                        src={event.image_url}
                        alt={event.name}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-purple-200 dark:border-purple-700 shadow-sm"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{event.name}</h4>
                        <p className="text-purple-600 dark:text-purple-400 font-medium">
                          {event.votes} votes ({event.percentage}%)
                        </p>
                      </div>
                      {medal && <span className="text-3xl">{medal}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Share Button */}
          <div className="text-center">
            <button
              onClick={handleShare}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mx-auto"
            >
              <span className="text-lg">📤</span>
              <span>Share Results</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                                             <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md transform animate-[scale-110] hover:animate-none transition-transform duration-200">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Make a Reservation</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={reservationName}
                  onChange={(e) => setReservationName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="Your name"
                />
                {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <PhoneInput
                  country={'us'}
                  value={reservationPhone}
                  onChange={(phone) => setReservationPhone(phone)}
                  inputStyle={{ backgroundColor: '#ffffff', color: '#111827' }}
                  containerClass="w-full"
                />
                {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Size</label>
                <select
                  value={reservationGroupSize}
                  onChange={(e) => setReservationGroupSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="myself">Myself</option>
                  <option value="2">2 people</option>
                  <option value="3+">3+ people</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReservation(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReservationSubmit}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:scale-105 transition-all duration-200"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
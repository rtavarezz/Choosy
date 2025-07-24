import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useDarkMode } from '../../lib/darkMode';

// Topic-specific image collections (same as vote page)
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

// Mock friend data for avatar display
const MOCK_FRIENDS = {
  friendA: { name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face' },
  friendB: { name: 'Mike', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face' },
  friendC: { name: 'Emma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face' }
};

export default function ResultsPage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { planId, topic, groupSize, zip, winningEvent: winningEventParam } = router.query;
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [reservationResult, setReservationResult] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    userName: '',
    phoneNumber: '',
    groupSize: 'solo'
  });
  // Patch: always use backend voting status
  const [allVotersCompleted, setAllVotersCompleted] = useState(false);
  const [expectedVoters, setExpectedVoters] = useState(1);
  const [completedVoters, setCompletedVoters] = useState(0);

  // Patch: Fetch voting status from backend (no auto-refresh)
  useEffect(() => {
    async function fetchVotingStatus() {
      if (!planId) return;
      const planIdStr = Array.isArray(planId) ? planId[0] : planId;
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/plans/${planIdStr}/voting-status`);
        if (response.ok) {
          const status = await response.json();
          console.log('Voting status on results page:', status);
          setExpectedVoters(status.max_voters);
          setCompletedVoters(status.completed_voters);
          setAllVotersCompleted(status.voting_limit_reached);
        } else {
          console.error('Failed to fetch voting status:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch voting status:', error);
      }
    }
    fetchVotingStatus();
    // Poll every 10 seconds for status updates (no auto-refresh)
    const interval = setInterval(fetchVotingStatus, 10000);
    return () => clearInterval(interval);
  }, [planId]);

  // Function to get topic-specific image
  const getTopicImage = (eventIndex: number, eventTopic?: string) => {
    const topicStr = eventTopic || (Array.isArray(topic) ? topic[0] : topic) || 'food';
    const images = TOPIC_IMAGES[topicStr] || DEFAULT_IMAGES;
    return images[eventIndex % images.length];
  };

  // Load results data
  useEffect(() => {
    const loadResults = async () => {
      try {
        // Parse winning event from URL params
        let parsedWinningEvent = null;
        if (winningEventParam && typeof winningEventParam === 'string') {
          try {
            parsedWinningEvent = JSON.parse(winningEventParam);
          } catch (e) {
            console.error('Failed to parse winning event:', e);
          }
        }
        // Check if this is a demo or real plan
        const isDemo = Array.isArray(planId) ? planId[0] === 'demo' : planId === 'demo';
        // For real plans, get results from backend API
        if (!isDemo) {
          try {
            const planIdStr = Array.isArray(planId) ? planId[0] : planId;
            const response = await fetch(`http://127.0.0.1:8000/api/plans/${planIdStr}/results`);
            if (response.ok) {
              const apiResults = await response.json();
              // Get expected voters from API group size
              const apiGroupSize = apiResults.plan.groupSize;
              const apiVoterCount = apiGroupSize === 'solo' ? 1 : (apiGroupSize === 'date' || apiGroupSize === 'friend') ? 2 : 5;
              // Transform API results to match frontend format
              const transformedResults = {
                planId: planIdStr,
                topic: apiResults.plan.topic,
                groupSize: apiResults.plan.groupSize,
                zip: apiResults.plan.zipCode,
                winningEvent: apiResults.events.length > 0 ? {
                  id: apiResults.events[0].id,
                  name: apiResults.events[0].name,
                  votes: apiResults.events[0].votes,
                  image: getTopicImage(0, apiResults.plan.topic),
                  hours: "2 hours",
                  contact: { phone: '(555) 123-4567', email: 'info@event.com' }
                } : null,
                plan: {
                  userName: apiResults.plan.userName,
                  phoneNumber: apiResults.plan.phoneNumber,
                  topic: apiResults.plan.topic,
                  groupSize: apiResults.plan.groupSize,
                  zipCode: apiResults.plan.zipCode
                },
                totalVotes: apiResults.totalVotes,
                participants: apiResults.participants,
                allEvents: apiResults.events.map((event, index) => ({
                  id: event.id,
                  name: event.name,
                  votes: event.votes,
                  total_votes: event.total_votes,
                  percentage: event.percentage,
                  image: getTopicImage(index, apiResults.plan.topic),
                  hours: "2 hours",
                  contact: { phone: '(555) 123-4567', email: 'info@event.com' }
                })),
                // Patch: Remove allVotersCompleted, expectedVoters, completedVoters from here
              };
              setResults(transformedResults);
              return;
            }
          } catch (error) {
            console.error('Failed to load API results:', error);
          }
        }
        // For demo plans or if API fails, use mock data
        const mockResults = {
          planId: Array.isArray(planId) ? planId[0] : planId,
          topic: Array.isArray(topic) ? topic[0] : topic,
          groupSize: Array.isArray(groupSize) ? groupSize[0] : groupSize,
          zip: Array.isArray(zip) ? zip[0] : zip,
          winningEvent: null,
          plan: null,
          totalVotes: 0,
          participants: ['friendA', 'friendB', 'friendC'],
          allEvents: [],
        };
        setResults(mockResults);
      } catch (error) {
        console.error('Failed to load results:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (planId) {
      loadResults();
    }
  }, [planId, topic, groupSize, zip, winningEventParam]);

  // Handle phone call
  const handleCall = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  // Handle reservation
  const handleReservation = async () => {
    if (!results?.winningEvent) return;
    
    // Check if this is a demo
    const isDemo = Array.isArray(planId) ? planId[0] === 'demo' : planId === 'demo';
    
    if (isDemo) {
      alert('This is a demo! Create a real plan to make reservations.');
      return;
    }
    
    // Show reservation modal to collect user info
    setShowReservationModal(true);
  };

  const handleReservationSubmit = async () => {
    if (!results?.winningEvent || !reservationForm.userName || !reservationForm.phoneNumber) {
      alert('Please fill in all required fields.');
      return;
    }
    
    setIsReserving(true);
    try {
      const response = await fetch('/api/makeReservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: results.topic,
          eventName: results.winningEvent.name,
          userName: reservationForm.userName,
          phoneNumber: reservationForm.phoneNumber,
          groupSize: reservationForm.groupSize,
          eventTime: results.winningEvent.hours?.split(' - ')[0] || '7:00 PM',
          eventDate: new Date().toISOString().split('T')[0]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setReservationResult(data.reservation);
        setShowReservationModal(false);
        alert('Reservation submitted successfully!');
      } else {
        alert('Failed to make reservation. Please try again.');
      }
    } catch (error) {
      console.error('Reservation error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsReserving(false);
    }
  };

  // Handle share functionality
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/voting?planId=${planId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our plan on Choosy!',
          text: `Vote on ${results.topic} events near ${results.zip}`,
          url: shareUrl
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Copy failed:', error);
      }
    }
  };

  // Render star rating
  const renderStars = (stars) => {
    return '⭐'.repeat(Math.floor(stars)) + '☆'.repeat(5 - Math.floor(stars));
  };

  // Patch: Use backend voting status for UI logic
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }
  // Error state
  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Results Not Found</h1>
          <p className="text-gray-600 mb-6">The voting session may have expired or doesn't exist.</p>
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
  // Patch: Use backend voting status for waiting/results UI
  return (
    <>
      <Head>
        <title>Voting Results - Choosy</title>
        <meta name="description" content="See the results of your group voting" />
      </Head>
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            ← Back to Home
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Voting Results</h1>
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
      </header>
      
      <div className="relative min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl mx-auto">
          {/* Voter progress */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg mb-4">
            <span className="text-lg font-bold">👥</span>
            <span className="font-semibold text-gray-900 dark:text-white">{completedVoters}/{expectedVoters} finished voting</span>
            {allVotersCompleted && (
              <span className="text-green-600 dark:text-green-400 font-bold ml-2">🎉 All Done!</span>
            )}
          </div>
          {/* Waiting for all voters */}
          {!allVotersCompleted && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
              <div className="text-center">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for All Votes</h2>
                <p className="text-gray-600 mb-4">
                  {completedVoters} out of {expectedVoters} people have finished voting.
                </p>
                <p className="text-sm text-gray-500">
                  {(() => {
                    const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
                    if (groupSizeStr === 'solo') {
                      return "This is a solo session - you should see results immediately!";
                    }
                    return "Results will be available when everyone is done!";
                  })()}
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => router.push(`/voting?planId=${planId}`)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
                  >
                    Back to Voting
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
                  >
                    🔄 Refresh Results
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Winner announcement - only show if all voters completed */}
          {allVotersCompleted && results.winningEvent && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Winner!</h2>
                <p className="text-gray-600">Your group chose this event</p>
              </div>

              {/* Winner card */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={results.winningEvent.image} 
                    alt={results.winningEvent.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{results.winningEvent.name}</h3>
                    <p className="text-gray-600">{results.winningEvent.hours}</p>
                    <p className="text-sm text-purple-600 font-semibold">{results.winningEvent.votes} votes</p>
                  </div>
                </div>

                {/* Contact information */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5">📞</span>
                    <span className="text-gray-700">{results.winningEvent.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5">✉️</span>
                    <span className="text-gray-700">{results.winningEvent.contact.email}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCall(results.winningEvent.contact.phone)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <span className="text-xl font-bold">📞</span>
                    <span>Call Now</span>
                  </button>
                  
                  <button
                    onClick={handleReservation}
                    disabled={isReserving}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <span className="text-xl">
                      {isReserving ? '⏳' : '🎫'}
                    </span>
                    <span>
                      {isReserving ? 'Reserving...' : 'Reserve Now'}
                    </span>
                  </button>
                </div>

                {/* Reservation result */}
                {reservationResult && (
                  <>
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">✅</span>
                        <h4 className="font-semibold text-green-800">Reservation {reservationResult.status === 'confirmed' ? 'Confirmed!' : 'Submitted!'}</h4>
                      </div>
                      <p className="text-sm text-green-700 mb-2">{reservationResult.message}</p>
                      <div className="text-xs text-green-600 space-y-1">
                        <p>Confirmation #: {reservationResult.confirmationNumber}</p>
                        <p>Provider: {reservationResult.provider}</p>
                        {reservationResult.requiresConfirmation && (
                          <p className="font-medium">📞 You'll receive a confirmation call soon!</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => router.push('/')}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 mt-2"
                      >
                        Return Home
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* All results - only show if all voters completed */}
          {allVotersCompleted && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">All Results</h3>
              <div className="space-y-4">
                {results.allEvents.slice(0, 4).map((event, index) => (
                  <div key={event.id} className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                    index === 0 ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex items-center gap-4">
                      <img 
                        src={event.image} 
                        alt={event.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{event.name}</h4>
                        <p className="text-sm text-gray-600">{event.hours}</p>
                        <p className="text-sm text-purple-600 font-semibold">{event.votes} votes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {index === 0 && (
                        <div className="text-2xl mb-1">🥇</div>
                      )}
                      {index === 1 && (
                        <div className="text-2xl mb-1">🥈</div>
                      )}
                      {index === 2 && (
                        <div className="text-2xl mb-1">🥉</div>
                      )}
                      <div className="text-sm text-gray-500">#{index + 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <button
              onClick={handleShare}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <span className="text-xl font-bold">📤</span>
              <span>Share Results</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <span className="text-xl">🔄</span>
              <span>Refresh Results</span>
            </button>
            
            <button
              onClick={() => router.push('/create')}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <span className="text-xl">✨</span>
              <span>Create New Plan</span>
            </button>
          </div>

          {/* Home button */}
          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mx-auto"
            >
              <span className="text-xl">🏠</span>
              <span>Go Home</span>
            </button>
          </div>

          {/* Vote again button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push(`/voting?planId=${planId}`)}
              className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300"
            >
              Vote Again
            </button>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🎫</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Make a Reservation</h3>
              <p className="text-gray-600">Please provide your details to reserve this event</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={reservationForm.userName}
                  onChange={(e) => setReservationForm(prev => ({ ...prev, userName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={reservationForm.phoneNumber}
                  onChange={(e) => setReservationForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Size
                </label>
                <select
                  value={reservationForm.groupSize}
                  onChange={(e) => setReservationForm(prev => ({ ...prev, groupSize: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="solo">Just me</option>
                  <option value="date">Date (2 people)</option>
                  <option value="friend">Friends (2-4 people)</option>
                  <option value="group">Group (5+ people)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReservationModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReservationSubmit}
                disabled={isReserving || !reservationForm.userName || !reservationForm.phoneNumber}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isReserving ? 'Submitting...' : 'Submit Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
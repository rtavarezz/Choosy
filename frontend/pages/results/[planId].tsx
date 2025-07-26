import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useDarkMode } from '../../lib/darkMode';
import PhoneInput from 'react-phone-input-2/lib/lib';
import 'react-phone-input-2/lib/style.css';
import ProfanityFilter from 'profanity-filter';

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
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
];

export default function ResultsPage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { planId, topic, groupSize, zip, winningEvent: winningEventParam } = router.query;
  
  // State
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReservation, setShowReservation] = useState(false);
  const [reservationName, setReservationName] = useState('');
  const [reservationPhone, setReservationPhone] = useState('');
  const [reservationGroupSize, setReservationGroupSize] = useState('myself');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [allVotersCompleted, setAllVotersCompleted] = useState(false);
  const [expectedVoters, setExpectedVoters] = useState(1);
  const [completedVoters, setCompletedVoters] = useState(0);

  // Fetch voting status from backend
  useEffect(() => {
    async function fetchVotingStatus() {
      if (!planId) return;
      const planIdStr = Array.isArray(planId) ? planId[0] : planId;
      try {
        const response = await fetch(`/api/plans/${planIdStr}/voting-status`);
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
    // Poll every 10 seconds for status updates
    const interval = setInterval(fetchVotingStatus, 10000);
    return () => clearInterval(interval);
  }, [planId]);

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
    
    // Use profanity filter library for comprehensive profanity detection
    const filter = new ProfanityFilter();
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
            const response = await fetch(`/api/plans/${planIdStr}/results`);
            if (!response.ok) {
              setIsLoading(false);
              setError('Failed to load results');
              return;
            }
            
            const apiResults = await response.json();
            
            // Check if there are no events
            if (!apiResults.events || apiResults.events.length === 0) {
              setIsLoading(false);
              setError('No events found for this plan');
              return;
            }
            
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
                contact: { phone: '(555) 123-4567' }
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
                contact: { phone: '(555) 123-4567' }
              }))
            };
            setResults(transformedResults);
            return;
          } catch (error) {
            console.error('Failed to load API results:', error);
            setIsLoading(false);
            setError('Failed to load results');
            return;
          }
        }
        
        // For demo plans, use mock data
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
        setError('Failed to load results');
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
    setShowReservation(true);
  };

  // Handle reservation submit
  const handleReservationSubmit = async () => {
    // Validate name
    if (!validateName(reservationName)) {
      return;
    }

    // Validate phone
    if (!reservationPhone || reservationPhone.length < 10) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    setPhoneError('');

    try {
      const response = await fetch('/api/makeReservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity_type: results.topic,
          event_name: results.winningEvent.name,
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

  // Handle share
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/vote?planId=${planId}`;
    
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
  if (error || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Results Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The voting session may have expired or doesn\'t exist.'}</p>
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

  // Check if this is a solo plan (standardize on "myself")
  const isSoloPlan = results.groupSize === 'myself';

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
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transition-all duration-300"
          >
            ← Back to Home
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white ml-4">Voting Results</h1>
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
          {/* Voter progress - only show for group plans */}
          {!isSoloPlan && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg mb-4">
              <span className="text-lg font-bold">👥</span>
              <span className="font-semibold text-gray-900 dark:text-white">{completedVoters}/{expectedVoters} finished voting</span>
              {allVotersCompleted && (
                <span className="text-green-600 dark:text-green-400 font-bold ml-2">🎉 All Done!</span>
              )}
            </div>
          )}

          {/* Waiting for all voters - only show for group plans */}
          {!isSoloPlan && !allVotersCompleted && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
              <div className="text-center">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for All Votes</h2>
                <p className="text-gray-600 mb-4">
                  {completedVoters} out of {expectedVoters} people have finished voting.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Results will be available when everyone is done!
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => router.push(`/voting?planId=${planId}`)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:scale-105 transition-all duration-200 text-sm"
                  >
                    Back to Voting
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-2 px-4 rounded-lg hover:scale-105 transition-all duration-200 text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Winner announcement - show immediately for solo plans, or when all voters completed for group plans */}
          {(isSoloPlan || allVotersCompleted) && results.winningEvent && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Winner!</h2>
                <p className="text-gray-600">
                  {isSoloPlan ? 'You chose this event' : 'Your group chose this event'}
                </p>
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
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCall(results.winningEvent.contact.phone)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">📞</span>
                    <span>Call Now</span>
                  </button>
                  
                  <button
                    onClick={handleReservation}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">📅</span>
                    <span>Reserve</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Share button */}
          <div className="text-center mb-8">
            <button
              onClick={handleShare}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mx-auto"
            >
              <span className="text-lg">📤</span>
              <span>Share with Friends</span>
            </button>
          </div>

          {/* All events results */}
          {results.allEvents && results.allEvents.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">All Results</h3>
              <div className="space-y-4">
                {results.allEvents.slice(0, 6).map((event, index) => {
                  const image = event.image || '/default-event.jpg';
                  let medal = null;
                  if (index === 0) medal = '🥇';
                  else if (index === 1) medal = '🥈';
                  else if (index === 2) medal = '🥉';
                  return (
                    <div key={event.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-md border border-purple-100 hover:scale-105 transition-transform duration-200">
                      <img 
                        src={image} 
                        alt={event.name}
                        className="w-14 h-14 rounded-lg object-cover border-2 border-purple-200 shadow-sm"
                        onError={e => { e.currentTarget.src = '/default-event.jpg'; }}
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg mb-1">{event.name}</h4>
                        <p className="text-sm text-gray-600 mb-1">{event.votes} votes <span className='text-xs text-gray-400'>({event.percentage}%)</span></p>
                      </div>
                      {medal && (
                        <span className="text-2xl">{medal}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Make a Reservation</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={reservationName}
                  onChange={(e) => setReservationName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  inputClass="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  containerClass="w-full"
                />
                {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Size</label>
                <select
                  value={reservationGroupSize}
                  onChange={(e) => setReservationGroupSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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
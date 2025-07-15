import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Mock friend data for avatar display
const MOCK_FRIENDS = {
  friendA: { name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face' },
  friendB: { name: 'Mike', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face' },
  friendC: { name: 'Emma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face' }
};

export default function ResultsPage() {
  const router = useRouter();
  const { planId, topic, groupSize, zip, winningEvent } = router.query;
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [reservationResult, setReservationResult] = useState(null);

  // Load results data
  useEffect(() => {
    const loadResults = async () => {
      try {
        // Parse winning event from URL params
        let parsedWinningEvent = null;
        if (winningEvent && typeof winningEvent === 'string') {
          try {
            parsedWinningEvent = JSON.parse(winningEvent);
          } catch (e) {
            console.error('Failed to parse winning event:', e);
          }
        }

        // Check if this is a demo or real plan
        const isDemo = Array.isArray(planId) ? planId[0] === 'demo' : planId === 'demo';
        
        // Mock results data
        const mockResults = {
          planId: Array.isArray(planId) ? planId[0] : planId,
          topic: Array.isArray(topic) ? topic[0] : topic,
          groupSize: Array.isArray(groupSize) ? groupSize[0] : groupSize,
          zip: Array.isArray(zip) ? zip[0] : zip,
          winningEvent: parsedWinningEvent,
          // For real plans, include plan data; for demo, omit it
          plan: isDemo ? null : {
            userName: 'John Smith', // This would come from the actual plan data
            phoneNumber: '(555) 123-4567', // This would come from the actual plan data
            topic: Array.isArray(topic) ? topic[0] : topic,
            groupSize: Array.isArray(groupSize) ? groupSize[0] : groupSize,
            zipCode: Array.isArray(zip) ? zip[0] : zip
          },
          totalVotes: 3,
          participants: ['friendA', 'friendB', 'friendC'],
          allEvents: [
            {
              id: '1',
              name: parsedWinningEvent?.name || 'Winning Event',
              image: parsedWinningEvent?.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
              votes: 2,
              contact: parsedWinningEvent?.contact || { phone: '(555) 123-4567', email: 'info@event.com' }
            },
            {
              id: '2',
              name: 'Second Place Event',
              image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop',
              votes: 1,
              contact: { phone: '(555) 234-5678', email: 'info@secondplace.com' }
            }
          ]
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
  }, [planId, topic, groupSize, zip, winningEvent]);

  // Handle phone call
  const handleCall = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  // Handle reservation
  const handleReservation = async () => {
    if (!results?.winningEvent) return;
    
    // Check if this is a demo
    const isDemo = Array.isArray(planId) ? planId[0] === 'demo' : planId === 'demo';
    
    if (isDemo || !results.plan?.userName || !results.plan?.phoneNumber) {
      alert('This is a demo! Create a real plan to make reservations.');
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
          userName: results.plan?.userName || 'John Smith', // Get from plan data
          phoneNumber: results.plan?.phoneNumber || results.winningEvent.contact.phone,
          groupSize: results.groupSize,
          eventTime: results.winningEvent.hours?.split(' - ')[0] || '7:00 PM',
          eventDate: new Date().toISOString().split('T')[0]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setReservationResult(data.reservation);
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
    const shareUrl = `${window.location.origin}/vote/${planId}?topic=${results.topic}&groupSize=${results.groupSize}&zip=${results.zip}`;
    
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

  return (
    <>
      <Head>
        <title>Voting Results - Choosy</title>
        <meta name="description" content="See the results of your group voting" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 Voting Complete!</h1>
            <p className="text-gray-600">
              {results.topic === 'datenight' ? 'Date Night' : results.topic} • {results.groupSize === 'solo' ? 'Solo' : results.groupSize === 'date' ? 'Date or Friend Night' : 'Group'} • {results.zip}
            </p>
          </div>

          {/* Winner announcement */}
          {results.winningEvent && (
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
                    <span className="text-xl">📞</span>
                    <span>Call Now</span>
                  </button>
                  
                  <button
                    onClick={handleReservation}
                    disabled={isReserving}
                    className={`flex-1 font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                      (Array.isArray(planId) ? planId[0] === 'demo' : planId === 'demo') || !results.plan?.userName || !results.plan?.phoneNumber
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    }`}
                  >
                    <span className="text-xl">
                      {isReserving ? '⏳' : ((Array.isArray(planId) ? planId[0] === 'demo' : planId === 'demo') || !results.plan?.userName || !results.plan?.phoneNumber) ? '🔒' : '🎫'}
                    </span>
                    <span>
                      {isReserving 
                        ? 'Reserving...' 
                        : ((Array.isArray(planId) ? planId[0] === 'demo' : planId === 'demo') || !results.plan?.userName || !results.plan?.phoneNumber) 
                          ? 'Demo Mode' 
                          : 'Reserve Now'
                      }
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

          {/* All results */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">All Results</h3>
            <div className="space-y-4">
              {results.allEvents.map((event, index) => (
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
                      <p className="text-sm text-gray-600">{event.votes} votes</p>
                    </div>
                  </div>
                  {index === 0 && (
                    <div className="text-2xl">🥇</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleShare}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <span className="text-xl">📤</span>
              <span>Share Results</span>
            </button>
            
            <button
              onClick={() => router.push('/create')}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <span className="text-xl">✨</span>
              <span>Create New Plan</span>
            </button>
          </div>

          {/* Vote again button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push(`/vote/${planId}?topic=${results.topic}&groupSize=${results.groupSize}&zip=${results.zip}`)}
              className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300"
            >
              Vote Again
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 
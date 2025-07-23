import Head from 'next/head';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import { useDarkMode } from '../lib/darkMode';
import TinderCard from 'react-tinder-card';

interface Event {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  distance: string;
  price: string;
  rating: number;
  attendees: number;
}

export default function Onboarding() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isDarkMode } = useDarkMode();
  
  const [step, setStep] = useState<'zipcode' | 'events' | 'tutorial'>('zipcode');
  const [zipcode, setZipcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  // Real API integration using your existing backend
  const fetchEventsFromAPIs = async (zipcode: string): Promise<Event[]> => {
    try {
      console.log('Fetching events for zipcode:', zipcode);
      
      // First, convert zipcode to coordinates using your geocoding service
      const geocodeResponse = await fetch(`/api/geocode?zipcode=${zipcode}`);
      if (!geocodeResponse.ok) {
        throw new Error('Failed to geocode zipcode');
      }
      
      const geocodeData = await geocodeResponse.json();
      const { lat, lng } = geocodeData;
      
      // Now fetch events from your backend using the coordinates
      const eventsResponse = await fetch(`/api/events?lat=${lat}&lng=${lng}&category=adventure&radius=5000&limit=20`);
      if (!eventsResponse.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const backendEvents = await eventsResponse.json();
      
      // Convert backend events to frontend format
      const convertedEvents: Event[] = backendEvents.map((backendEvent: any) => ({
        id: backendEvent.id,
        title: backendEvent.name,
        description: backendEvent.description || `${backendEvent.category} event`,
        image: backendEvent.image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop',
        category: backendEvent.category,
        distance: backendEvent.metadata?.distance ? `${Math.round(backendEvent.metadata.distance)} mi` : 'Nearby',
        price: backendEvent.price || 'Varies',
        rating: backendEvent.metadata?.rating || 4.0 + Math.random() * 1.0,
        attendees: backendEvent.attendees_count || Math.floor(Math.random() * 50) + 5
      }));
      
      console.log(`Found ${convertedEvents.length} real events from APIs`);
      return convertedEvents;
      
    } catch (error) {
      console.error('Error fetching events:', error);
      
      // TODO: Implement fallback event sources when primary APIs fail
      // Options to implement:
      // 1. Yelp Fusion API (https://www.yelp.com/developers) - Free tier available
      //    - Get local businesses and venues
      //    - Provides ratings, reviews, hours, contact info
      // 2. Foursquare Places API (https://developer.foursquare.com/) - Free tier available
      //    - Rich venue data with categories, tips, photos
      // 3. Google Places API (https://developers.google.com/maps/documentation/places/web-service) - $200 free credit
      //    - Comprehensive venue information
      // 4. OpenTable API (https://opentable.herokuapp.com/) - Free
      //    - Restaurant reservations and availability
      // 5. Local event aggregators (Eventful, Zvents, etc.)
      
      console.error('All event APIs failed - implement fallback sources above');
      return [];
    }
  };

  const handleZipcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipcode.trim()) return;

    setIsLoading(true);
    
    // Fetch real events from APIs
    const fetchedEvents = await fetchEventsFromAPIs(zipcode);
    
    setEvents(fetchedEvents);
    setStep('events');
    setIsLoading(false);
  };

  const handleSwipe = (direction: string) => {
    if (direction === 'right') {
      // Like - could save to favorites or create plan
      console.log('Liked:', events[currentEventIndex]);
    }
    
    if (currentEventIndex < events.length - 1) {
      setCurrentEventIndex(prev => prev + 1);
    } else {
      // Show tutorial after going through all events
      setShowTutorial(true);
      setStep('tutorial');
    }
  };

  const handleSkipTutorial = () => {
    router.push('/create');
  };

  const handleShareLink = () => {
    // Generate shareable link
    const shareLink = `${window.location.origin}/vote/${Date.now()}?zip=${zipcode}`;
    navigator.clipboard.writeText(shareLink);
    // Show success message
    alert('Link copied to clipboard! Share with friends to start voting together.');
  };

  return (
    <>
      <Head>
        <title>Welcome to Choosy - Find Local Events</title>
        <meta name="description" content="Discover events happening around you and invite friends to join" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-blue-100 to-cyan-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <AnimatePresence mode="wait">
          {step === 'zipcode' && (
            <motion.div
              key="zipcode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center min-h-screen p-6"
            >
              <div className="max-w-md w-full">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-slate-600/20"
                >
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">📍</div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      Where are you?
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                      We'll show you events happening around you today
                    </p>
                  </div>

                  <form onSubmit={handleZipcodeSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter your zipcode
                      </label>
                      <input
                        type="text"
                        id="zipcode"
                        value={zipcode}
                        onChange={(e) => setZipcode(e.target.value)}
                        placeholder="12345"
                        className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                        maxLength={5}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !zipcode.trim()}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                          Finding events...
                        </div>
                      ) : (
                        'Find Events Near Me'
                      )}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => navigator.geolocation.getCurrentPosition(
                        (position) => {
                          // In real app, reverse geocode to get zipcode
                          setZipcode('10001'); // Mock for demo
                        },
                        () => {
                          // Fallback to manual entry
                        }
                      )}
                      className="text-purple-600 dark:text-purple-400 hover:underline text-sm"
                    >
                      📍 Use my current location
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {step === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen p-6"
            >
              <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Events near {zipcode}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Swipe right to like, left to skip
                  </p>
                  {events.length === 0 && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        🔍 Searching for events in your area...
                      </p>
                    </div>
                  )}
                </div>

                {/* Event Cards Stack */}
                {events.length > 0 ? (
                  <div className="relative h-96">
                    {events.map((event, index) => (
                      <TinderCard
                        key={event.id}
                        onSwipe={(direction) => handleSwipe(direction)}
                        preventSwipe={['up', 'down']}
                        className="absolute w-full"
                      >
                        <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing">
                          <div className="relative h-96">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            
                            {/* Event Info Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                                  {event.category}
                                </span>
                                <span className="text-sm opacity-90">
                                  {event.distance}
                                </span>
                              </div>
                              
                              <h3 className="text-2xl font-bold mb-2">
                                {event.title}
                              </h3>
                              
                              <p className="text-sm opacity-90 mb-3">
                                {event.description}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <span className="text-sm">{event.price}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-yellow-400">★</span>
                                    <span className="text-sm">{event.rating}</span>
                                  </div>
                                </div>
                                <div className="text-sm opacity-90">
                                  {event.attendees} interested
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TinderCard>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center shadow-2xl">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      No events found nearby
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      We're working on expanding our event coverage in your area. 
                      Try a different zipcode or check back later!
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={() => setStep('zipcode')}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 w-full"
                      >
                        Try Different Location
                      </button>
                      <button
                        onClick={() => setStep('tutorial')}
                        className="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 w-full"
                      >
                        Continue Anyway
                      </button>
                    </div>
                  </div>
                )}

                {/* Swipe Instructions */}
                {events.length > 0 && (
                  <>
                    <div className="flex justify-center gap-8 mt-6">
                      <button
                        onClick={() => handleSwipe('left')}
                        className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
                      >
                        ❌
                      </button>
                      <button
                        onClick={() => handleSwipe('right')}
                        className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
                      >
                        ❤️
                      </button>
                    </div>

                    {/* Progress */}
                    <div className="mt-4 text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {currentEventIndex + 1} of {events.length}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {step === 'tutorial' && (
            <motion.div
              key="tutorial"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-center min-h-screen p-6"
            >
              <div className="max-w-md w-full">
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-slate-600/20 text-center">
                  <div className="text-6xl mb-6">🎉</div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Ready to plan with friends?
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Share this link with friends to start voting together on events. 
                    Everyone swipes, and the most popular choice wins!
                  </p>

                  <div className="space-y-4">
                    <button
                      onClick={handleShareLink}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      📤 Share Link with Friends
                    </button>
                    
                    <button
                      onClick={handleSkipTutorial}
                      className="w-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300"
                    >
                      Create Plan Later
                    </button>
                  </div>

                  <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                    💡 Tip: The more friends join, the better the recommendations get!
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
} 
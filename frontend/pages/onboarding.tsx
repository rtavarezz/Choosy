import Head from 'next/head';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import { useDarkMode } from '../lib/darkMode';
import TinderCard from 'react-tinder-card';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

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

const TOPICS = [
  { key: 'food', label: 'Food', icon: '🍔' },
  { key: 'drinks', label: 'Drinks', icon: '🍹' },
  { key: 'sports', label: 'Sports', icon: '⚽' },
  { key: 'music', label: 'Music', icon: '🎵' },
  { key: 'movies', label: 'Movies', icon: '🎬' },
  { key: 'outdoors', label: 'Outdoors', icon: '🌳' },
  { key: 'adventure', label: 'Adventure', icon: '🧗' },
  { key: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { key: 'wellness', label: 'Wellness', icon: '🧘' },
  { key: 'art', label: 'Art & Culture', icon: '🖼️' },
  { key: 'shopping', label: 'Shopping', icon: '🛍️' },
  { key: 'choose', label: 'Choose for me', icon: '🤖' },
];

const COUNTRY_LIST = [
  { code: '+1', label: 'United States', flag: '🇺🇸', maxLength: 10, format: 'XXX-XXX-XXXX' },
  { code: '+1', label: 'Canada', flag: '🇨🇦', maxLength: 10, format: 'XXX-XXX-XXXX' },
  { code: '+44', label: 'United Kingdom', flag: '🇬🇧', maxLength: 10, format: 'XXXXX-XXXXX' },
  { code: '+52', label: 'Mexico', flag: '🇲🇽', maxLength: 10, format: 'XXX-XXX-XXXX' },
  { code: '+91', label: 'India', flag: '🇮🇳', maxLength: 10, format: 'XXXXX-XXXXX' },
  { code: '+61', label: 'Australia', flag: '🇦🇺', maxLength: 9, format: 'X-XXXX-XXXX' },
  { code: '+81', label: 'Japan', flag: '🇯🇵', maxLength: 10, format: 'XX-XXXX-XXXX' },
  { code: '+49', label: 'Germany', flag: '🇩🇪', maxLength: 11, format: 'XXXX-XXXXXXX' },
  { code: '+33', label: 'France', flag: '🇫🇷', maxLength: 9, format: 'X-XX-XX-XX-XX' },
  { code: '+34', label: 'Spain', flag: '🇪🇸', maxLength: 9, format: 'XXX-XXX-XXX' },
  { code: '+39', label: 'Italy', flag: '🇮🇹', maxLength: 10, format: 'XXX-XXXXXXX' },
  { code: '+86', label: 'China', flag: '🇨🇳', maxLength: 11, format: 'XXX-XXXX-XXXX' },
  { code: '+7', label: 'Russia', flag: '🇷🇺', maxLength: 10, format: 'XXX-XXX-XX-XX' },
  { code: '+55', label: 'Brazil', flag: '🇧🇷', maxLength: 11, format: 'XX-XXXXX-XXXX' },
  { code: '+27', label: 'South Africa', flag: '🇿🇦', maxLength: 9, format: 'XX-XXX-XXXX' },
  { code: '+82', label: 'South Korea', flag: '🇰🇷', maxLength: 10, format: 'XX-XXXX-XXXX' },
  { code: '+62', label: 'Indonesia', flag: '🇮🇩', maxLength: 10, format: 'XXX-XXXX-XXX' },
  { code: '+63', label: 'Philippines', flag: '🇵🇭', maxLength: 10, format: 'XXX-XXX-XXXX' },
  { code: '+90', label: 'Turkey', flag: '🇹🇷', maxLength: 10, format: 'XXX-XXX-XXXX' },
  { code: '+31', label: 'Netherlands', flag: '🇳🇱', maxLength: 9, format: 'X-XXX-XXXXX' },
  { code: '+46', label: 'Sweden', flag: '🇸🇪', maxLength: 9, format: 'XX-XXX-XXXX' },
  { code: '+47', label: 'Norway', flag: '🇳🇴', maxLength: 8, format: 'XXX-XX-XXX' },
  { code: '+48', label: 'Poland', flag: '🇵🇱', maxLength: 9, format: 'XXX-XXX-XXX' },
  { code: '+351', label: 'Portugal', flag: '🇵🇹', maxLength: 9, format: 'XXX-XXX-XXX' },
  { code: '+358', label: 'Finland', flag: '🇫🇮', maxLength: 9, format: 'XX-XXX-XXXX' },
  { code: '+43', label: 'Austria', flag: '🇦🇹', maxLength: 10, format: 'XXX-XXXXXXX' },
  { code: '+41', label: 'Switzerland', flag: '🇨🇭', maxLength: 9, format: 'XX-XXX-XXXX' },
  { code: '+420', label: 'Czech Republic', flag: '🇨🇿', maxLength: 9, format: 'XXX-XXX-XXX' },
  { code: '+421', label: 'Slovakia', flag: '🇸🇰', maxLength: 9, format: 'XXX-XXX-XXX' },
  { code: '+353', label: 'Ireland', flag: '🇮🇪', maxLength: 9, format: 'XX-XXX-XXXX' },
  { code: '+45', label: 'Denmark', flag: '🇩🇰', maxLength: 8, format: 'XX-XX-XX-XX' },
  { code: '+32', label: 'Belgium', flag: '🇧🇪', maxLength: 9, format: 'XXX-XX-XX-XX' },
  { code: '+972', label: 'Israel', flag: '🇮🇱', maxLength: 9, format: 'XX-XXX-XXXX' },
  { code: '+65', label: 'Singapore', flag: '🇸🇬', maxLength: 8, format: 'XXXX-XXXX' },
  { code: '+60', label: 'Malaysia', flag: '🇲🇾', maxLength: 9, format: 'XXX-XXXXXX' },
  { code: '+66', label: 'Thailand', flag: '🇹🇭', maxLength: 9, format: 'XXX-XXX-XXX' },
  { code: '+64', label: 'New Zealand', flag: '🇳🇿', maxLength: 9, format: 'XXX-XXX-XXX' },
  { code: '+20', label: 'Egypt', flag: '🇪🇬', maxLength: 10, format: 'X-XXX-XXX-XXX' },
  { code: '+212', label: 'Morocco', flag: '🇲🇦', maxLength: 9, format: 'XX-XXXX-XXX' },
  { code: '+234', label: 'Nigeria', flag: '🇳🇬', maxLength: 10, format: 'XXX-XXX-XXXX' },
  { code: '+92', label: 'Pakistan', flag: '🇵🇰', maxLength: 10, format: 'XXX-XXXXXXX' },
  { code: '+880', label: 'Bangladesh', flag: '🇧🇩', maxLength: 10, format: 'XXX-XXXXXXX' },
  { code: '+84', label: 'Vietnam', flag: '🇻🇳', maxLength: 9, format: 'XXX-XXX-XXX' },
  // Add more as needed
];

// Sort alphabetically by label
const SORTED_COUNTRIES = [...COUNTRY_LIST].sort((a, b) => a.label.localeCompare(b.label));

export default function Onboarding() {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const [step, setStep] = useState<'form' | 'sms' | 'topic' | 'events'>('form');
  const [smsCode, setSmsCode] = useState('');
  const [smsError, setSmsError] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [country, setCountry] = useState(SORTED_COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [suggestionSent, setSuggestionSent] = useState(false);

  // Geolocate for ZIP
  const handleGeolocate = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Call backend to get ZIP from lat/lng
        const res = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`);
        if (res.ok) {
          const data = await res.json();
          setZipcode(data.zipcode || '');
        }
      },
      () => {}
    );
  };

  // Step 1: Combined ZIP + Phone form
  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // US/Canada: 11 digits (1 + 10)
    if (phone.startsWith('+1')) {
      if (digits.length !== 11) {
        setPhoneError('US/Canada phone numbers must be 10 digits.');
        return;
      }
    }
    // UK: +44, 12 digits (44 + 10)
    else if (phone.startsWith('+44')) {
      if (digits.length !== 12) {
        setPhoneError('UK phone numbers must be 10 digits.');
        return;
      }
    }
    // India: +91, 12 digits (91 + 10)
    else if (phone.startsWith('+91')) {
      if (digits.length !== 12) {
        setPhoneError('India phone numbers must be 10 digits.');
        return;
      }
    }
    // Add more country-specific checks as needed
    // Default: at least 8 digits
    else if (digits.length < 8) {
      setPhoneError('Phone number is too short.');
      return;
    }
    setPhoneError('');
    setStep('sms');
  };

  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsCode.trim()) {
      setSmsError('Please enter the code sent to your phone.');
      return;
    }
    setSmsError('');
    setStep('topic');
  };

  // Step 2: Topic picker
  const handleTopicPick = (topic: string) => {
    setSelectedTopic(topic);
    setStep('events');
    fetchEvents(zipcode, topic);
  };

  // Step 3: Fetch events for ZIP + topic
  const fetchEvents = async (zipcode: string, topic: string) => {
    setIsLoading(true);
    try {
      // Geocode ZIP to lat/lng
      const geocodeResponse = await fetch(`/api/geocode?zipcode=${zipcode}`);
      if (!geocodeResponse.ok) throw new Error('Failed to geocode zipcode');
      const geocodeData = await geocodeResponse.json();
      const { lat, lng } = geocodeData;
      // If topic is 'choose', pick a random topic
      let topicKey = topic;
      if (topic === 'choose') {
        const random = TOPICS.filter(t => t.key !== 'choose');
        topicKey = random[Math.floor(Math.random() * random.length)].key;
      }
      // Fetch events for topic
      const eventsResponse = await fetch(`/api/events?lat=${lat}&lng=${lng}&category=${topicKey}&radius=5000&limit=20`);
      if (!eventsResponse.ok) throw new Error('Failed to fetch events');
      const backendEvents = await eventsResponse.json();
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
      setEvents(convertedEvents);
      setCurrentEventIndex(0);
    } catch (error) {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Swiping
  const handleSwipe = (direction: string) => {
    if (direction === 'right') {
      // Like - could save to favorites or create plan
    }
    if (currentEventIndex < events.length - 1) {
      setCurrentEventIndex(prev => prev + 1);
    } else {
      // End of events, could show a CTA or restart
      setCurrentEventIndex(0);
    }
  };

  return (
    <>
      <Head>
        <title>Choosy Onboarding</title>
        <meta name="description" content="Get started with Choosy" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-blue-100 to-cyan-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center">
        {/* App name and pitch */}
        {step === 'form' && (
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Choosy</h1>
            <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg max-w-xl mx-auto">
              Plan less. Live more.<br />
              From solo hangs to group outings, just swipe to decide.
            </p>
          </div>
        )}
        {/* Onboarding box */}
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md mx-auto p-8 bg-white/80 dark:bg-slate-800/80 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-600/20"
            >
              <form onSubmit={handleStart} className="space-y-6">
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={zipcode}
                    onChange={e => setZipcode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                    placeholder="ZIP code"
                    className="px-4 py-3 text-lg border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    required
                  />
                  <div className="w-full max-w-md">
                    <PhoneInput
                      country={'us'}
                      value={phone}
                      onChange={setPhone}
                      inputProps={{
                        name: 'phone',
                        required: true,
                        autoFocus: false,
                        placeholder: 'Enter phone number'
                      }}
                      containerStyle={{ width: '100%' }}
                    />
                    {phoneError && <div className="text-red-500 text-sm mt-1">{phoneError}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={handleGeolocate}
                    className="text-purple-600 dark:text-purple-400 hover:underline text-sm self-end"
                  >
                    📍 Use my location
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!zipcode.trim() || !phone.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Start
                </button>
              </form>
            </motion.div>
          )}
          {step === 'sms' && (
            <motion.div
              key="sms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md mx-auto p-8 bg-white/80 dark:bg-slate-800/80 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-600/20"
            >
              <form onSubmit={handleSmsSubmit} className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enter SMS Code</h2>
                  <p className="text-gray-600 dark:text-gray-300">We sent a code to your phone. (Any code will work!)</p>
                </div>
                <input
                  type="text"
                  value={smsCode}
                  onChange={e => setSmsCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-center"
                  required
                  maxLength={6}
                />
                {smsError && <div className="text-red-500 text-sm mt-1">{smsError}</div>}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Verify
                </button>
              </form>
            </motion.div>
          )}
          {step === 'topic' && (
            <motion.div
              key="topic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md mx-auto p-8 bg-white/80 dark:bg-slate-800/80 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-600/20"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pick a vibe</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {TOPICS.map(topic => (
                  <button
                    key={topic.key}
                    onClick={() => handleTopicPick(topic.key)}
                    className="flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 rounded-2xl p-6 shadow hover:scale-105 transition-all duration-200"
                  >
                    <span className="text-3xl mb-2">{topic.icon}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{topic.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowSuggestModal(true)}
                className="w-full mt-2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200 border border-gray-300 dark:border-gray-600"
              >
                + Suggest a topic
              </button>
              {/* Suggest a topic modal */}
              {showSuggestModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl w-full max-w-sm">
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Suggest a Topic</h3>
                    {suggestionSent ? (
                      <div className="text-green-600 font-semibold text-center py-4">Thank you for your suggestion!</div>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={suggestion}
                          onChange={e => setSuggestion(e.target.value)}
                          placeholder="Your topic idea..."
                          className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white mb-4"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSuggestionSent(true);
                              setTimeout(() => {
                                setShowSuggestModal(false);
                                setSuggestion('');
                                setSuggestionSent(false);
                              }, 1500);
                            }}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
                            disabled={!suggestion.trim()}
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => setShowSuggestModal(false)}
                            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
          {step === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="relative h-96 mt-8">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                  </div>
                ) : events.length > 0 ? (
                  events.map((event, index) => (
                    <TinderCard
                      key={event.id}
                      onSwipe={handleSwipe}
                      preventSwipe={['up', 'down']}
                      className={index === currentEventIndex ? 'absolute w-full' : 'hidden'}
                    >
                      <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing">
                        <div className="relative h-96">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
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
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">No events found.</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
} 
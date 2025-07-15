import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Available topics for plan creation
const TOPICS = [
  { key: 'concerts', label: 'Concerts', icon: '🎤' },
  { key: 'nightlife', label: 'Nightlife', icon: '🌃' },
  { key: 'foodie', label: 'Foodie', icon: '🍽️' },
  { key: 'datenight', label: 'Date Night', icon: '💕' },
  { key: 'sports', label: 'Sports', icon: '🏀' },
  { key: 'parks', label: 'Parks', icon: '🌳' },
  { key: 'gokart', label: 'Go Karting', icon: '🏎️' },
  { key: 'swimming', label: 'Swimming', icon: '🏊' },
  { key: 'drinks', label: 'Fun Drinks', icon: '🍹' },
];

// Group size options
const GROUP_SIZES = [
  { key: 'solo', label: 'Just Myself', icon: '👤', description: 'Solo adventures' },
  { key: 'date', label: '2 People Only', icon: '👥', description: 'friend/family/date' },
  { key: 'group', label: '3+ People', icon: '👥👤👤👥', description: 'Group' },
];

export default function Create() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: topic, 2: group size, 3: contact, 4: custom events, 5: share URL
  const [topic, setTopic] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [cityArea, setCityArea] = useState('');
  const [customEvents, setCustomEvents] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [planId, setPlanId] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Handle topic selection
  const handleTopicSelect = (key: string) => {
    setTopic(key);
    setStep(2);
  };

  // Regular random topic generator for non-solo users
  const handleRandomTopic = () => {
    const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    setTopic(randomTopic.key);
    setStep(2);
  };

  // Complete random choice for solo users - picks topic, group size, and event
  const handleCompleteRandomChoice = async () => {
    setIsLoading(true);
    
    try {
      // Pick random topic and set to solo
      const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      const randomGroupSize = 'solo';
      
      // Import mock events data to pick a random event
      const MOCK_EVENTS: Record<string, Record<string, any[]>> = {
        concerts: {
          solo: [
            {
              id: '1',
              name: 'Taylor Swift Concert',
              image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
              hours: '8:00 PM - 11:00 PM',
              reviews: { stars: 4.8, count: 1247 },
              contact: { phone: '(555) 123-4567', email: 'info@madisonsquaregarden.com' },
              voters: ['friendA', 'friendC']
            }
          ]
        },
        datenight: {
          solo: [
            {
              id: '1',
              name: 'Self-Care Spa Day',
              image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop',
              hours: '10:00 AM - 6:00 PM',
              reviews: { stars: 4.8, count: 456 },
              contact: { phone: '(555) 123-4567', email: 'spa@wellness.com' },
              voters: ['friendA']
            }
          ]
        },
        foodie: {
          solo: [
            {
              id: '1',
              name: 'Food Truck Festival',
              image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
              hours: '11:00 AM - 8:00 PM',
              reviews: { stars: 4.5, count: 1234 },
              contact: { phone: '(555) 123-4567', email: 'info@foodtruckfest.com' },
              voters: ['friendA']
            }
          ]
        },
        nightlife: {
          solo: [
            {
              id: '1',
              name: 'Solo Bar Hopping',
              image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
              hours: '8:00 PM - 2:00 AM',
              reviews: { stars: 4.3, count: 234 },
              contact: { phone: '(555) 123-4567', email: 'info@solobar.com' },
              voters: ['friendA']
            }
          ]
        },
        parks: {
          solo: [
            {
              id: '1',
              name: 'Solo Hiking Trail',
              image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
              hours: '9:00 AM - 5:00 PM',
              reviews: { stars: 4.7, count: 456 },
              contact: { phone: '(555) 123-4567', email: 'info@hikingtrail.com' },
              voters: ['friendA']
            }
          ]
        },
        sports: {
          solo: [
            {
              id: '1',
              name: 'Solo Tennis Session',
              image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
              hours: '9:00 AM - 11:00 AM',
              reviews: { stars: 4.6, count: 123 },
              contact: { phone: '(555) 123-4567', email: 'tennis@solo.com' },
              voters: ['friendA']
            }
          ]
        },
        gokart: {
          solo: [
            {
              id: '1',
              name: 'Solo Go Kart Racing',
              image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
              hours: '10:00 AM - 6:00 PM',
              reviews: { stars: 4.4, count: 234 },
              contact: { phone: '(555) 123-4567', email: 'racing@gokart.com' },
              voters: ['friendA']
            }
          ]
        },
        swimming: {
          solo: [
            {
              id: '1',
              name: 'Solo Swim Session',
              image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
              hours: '7:00 AM - 9:00 AM',
              reviews: { stars: 4.5, count: 123 },
              contact: { phone: '(555) 123-4567', email: 'swim@solo.com' },
              voters: ['friendA']
            }
          ]
        },
        drinks: {
          solo: [
            {
              id: '1',
              name: 'Solo Craft Beer Tasting',
              image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
              hours: '5:00 PM - 9:00 PM',
              reviews: { stars: 4.4, count: 123 },
              contact: { phone: '(555) 123-4567', email: 'beer@solo.com' },
              voters: ['friendA']
            }
          ]
        }
      };
      
      // Pick a random event from the selected topic
      const eventsForTopic = MOCK_EVENTS[randomTopic.key]?.solo || [];
      const randomEvent = eventsForTopic[Math.floor(Math.random() * eventsForTopic.length)];
      
      // Set the random choices and go to contact step
      setTopic(randomTopic.key);
      setGroupSize(randomGroupSize);
      setStep(3); // Go directly to contact info step
      
      // Store the random event for later use
      localStorage.setItem('randomChoiceEvent', JSON.stringify(randomEvent));
      
    } catch (error) {
      console.error('Error in random choice:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle group size selection
  const handleGroupSizeSelect = (key: string) => {
    setGroupSize(key);
    setStep(3);
  };



  // Zip code to city mapping with international support
  const getCityFromZip = (zip: string): string => {
    // Handle international zip codes (non-US format)
    if (zip.length > 5 || /[A-Z]/.test(zip)) {
      return 'International Location';
    }
    
    const zipPrefix = zip.substring(0, 3);
    const zipMap: Record<string, string> = {
      // New York
      '100': 'New York, NY',
      '101': 'New York, NY',
      '102': 'New York, NY',
      '103': 'Staten Island, NY',
      '104': 'Bronx, NY',
      '105': 'Westchester, NY',
      '106': 'Westchester, NY',
      '107': 'Westchester, NY',
      '108': 'Westchester, NY',
      '109': 'Rockland, NY',
      '110': 'Queens, NY',
      '111': 'Queens, NY',
      '112': 'Brooklyn, NY',
      '113': 'Queens, NY',
      '114': 'Queens, NY',
      '115': 'Nassau, NY',
      '116': 'Queens, NY',
      '117': 'Suffolk, NY',
      '118': 'Nassau, NY',
      '119': 'Suffolk, NY',
      
      // Washington DC
      '200': 'Washington, DC',
      '201': 'Virginia',
      '202': 'Washington, DC',
      '203': 'Connecticut',
      '204': 'Washington, DC',
      '205': 'Washington, DC',
      
      // Chicago
      '600': 'Chicago, IL',
      '601': 'Chicago Suburbs, IL',
      '602': 'Evanston, IL',
      '603': 'Oak Park, IL',
      '604': 'Chicago Suburbs, IL',
      '605': 'Chicago Suburbs, IL',
      '606': 'Chicago, IL',
      '607': 'Chicago, IL',
      '608': 'Chicago, IL',
      '609': 'Chicago Suburbs, IL',
      
      // Los Angeles
      '900': 'Los Angeles, CA',
      '901': 'Los Angeles, CA',
      '902': 'Beverly Hills, CA',
      '903': 'Inglewood, CA',
      '904': 'Santa Monica, CA',
      '905': 'Torrance, CA',
      '906': 'Whittier, CA',
      '907': 'Long Beach, CA',
      '908': 'Long Beach, CA',
      '909': 'San Bernardino, CA',
      '910': 'Glendale, CA',
      '911': 'Pasadena, CA',
      '912': 'Glendale, CA',
      '913': 'Van Nuys, CA',
      '914': 'Westchester, NY',
      '915': 'Burbank, CA',
      '916': 'North Hollywood, CA',
      '917': 'Rosemead, CA',
      '918': 'Alhambra, CA',
      '919': 'San Diego, CA',
      '920': 'San Diego, CA',
      '921': 'San Diego, CA',
      '922': 'Palm Springs, CA',
      '923': 'San Bernardino, CA',
      '924': 'San Bernardino, CA',
      '925': 'Riverside, CA',
      '926': 'Irvine, CA',
      '927': 'Santa Ana, CA',
      '928': 'Anaheim, CA',
      '929': 'New York, NY',
      '930': 'Ventura, CA',
      '931': 'Santa Barbara, CA',
      '932': 'Bakersfield, CA',
      '933': 'Bakersfield, CA',
      '934': 'San Luis Obispo, CA',
      '935': 'Lancaster, CA',
      '936': 'Fresno, CA',
      '937': 'Fresno, CA',
      '938': 'Fresno, CA',
      '939': 'Salinas, CA',
      '940': 'San Mateo, CA',
      '941': 'San Francisco, CA',
      '942': 'Sacramento, CA',
      '943': 'Palo Alto, CA',
      '944': 'San Mateo, CA',
      '945': 'Oakland, CA',
      '946': 'Oakland, CA',
      '947': 'Berkeley, CA',
      '948': 'Richmond, CA',
      '949': 'Irvine, CA',
      '950': 'San Jose, CA',
      '951': 'San Jose, CA',
      '952': 'Stockton, CA',
      '953': 'Modesto, CA',
      '954': 'Santa Rosa, CA',
      '955': 'Eureka, CA',
      '956': 'Sacramento, CA',
      '957': 'Sacramento, CA',
      '958': 'Sacramento, CA',
      '959': 'Chico, CA',
      '960': 'Redding, CA',
      '961': 'Reno, NV',
      '962': 'Honolulu, HI',
      '963': 'Honolulu, HI',
      '964': 'Honolulu, HI',
      '965': 'Honolulu, HI',
      '966': 'Honolulu, HI',
      '967': 'Hawaii',
      '968': 'Honolulu, HI',
      '969': 'Guam',
      '970': 'Portland, OR',
      '971': 'Portland, OR',
      '972': 'Portland, OR',
      '973': 'Salem, OR',
      '974': 'Eugene, OR',
      '975': 'Medford, OR',
      '976': 'Klamath Falls, OR',
      '977': 'Bend, OR',
      '978': 'Pendleton, OR',
      '979': 'College Station, TX',
      '980': 'Seattle, WA',
      '981': 'Seattle, WA',
      '982': 'Everett, WA',
      '983': 'Tacoma, WA',
      '984': 'Tacoma, WA',
      '985': 'Olympia, WA',
      '986': 'Vancouver, WA',
      '987': 'Spokane, WA',
      '988': 'Wenatchee, WA',
      '989': 'Yakima, WA',
      '990': 'Spokane, WA',
      '991': 'Spokane, WA',
      '992': 'Spokane, WA',
      '993': 'Tri-Cities, WA',
      '994': 'Walla Walla, WA',
      '995': 'Anchorage, AK',
      '996': 'Anchorage, AK',
      '997': 'Fairbanks, AK',
      '998': 'Juneau, AK',
      '999': 'Alaska'
    };
    
    return zipMap[zipPrefix] || 'Unknown Area';
  };

  // Handle contact info submission (name, phone, zip combined)
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !phoneNumber.trim() || !zipCode.trim()) return;
    
    // Set city area based on zip code
    setCityArea(getCityFromZip(zipCode.trim()));
    
    // For solo users, skip to voting directly
    if (groupSize === 'solo') {
      setIsLoading(true);
      try {
        const response = await fetch('/api/createPlan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            groupSize,
            zipCode: zipCode.trim(),
            userName: userName.trim(),
            phoneNumber: phoneNumber.trim(),
            customEvents: customEvents.filter(event => event.trim())
          })
        });
        
        if (response.ok) {
          const { planId } = await response.json();
          
          // Store creator info for automatic login
          localStorage.setItem(`creator_${planId}`, JSON.stringify({
            name: userName.trim(),
            phone: phoneNumber.trim(),
            timestamp: Date.now()
          }));
          
          // Check if this was a random choice
          const randomEvent = localStorage.getItem('randomChoiceEvent');
          if (randomEvent) {
            // Clear the stored random event
            localStorage.removeItem('randomChoiceEvent');
            
            // Go directly to results with the random event
            const params = new URLSearchParams({
              topic,
              groupSize,
              zip: zipCode.trim(),
              winningEvent: randomEvent
            });
            router.push(`/results/${planId}?${params.toString()}`);
          } else {
            // Normal flow - go to voting
            sessionStorage.setItem('cameFromCreate', 'true');
            router.push(`/vote/${planId}?topic=${topic}&groupSize=${groupSize}&zip=${zipCode}`);
          }
        } else {
          alert('Failed to create plan. Please try again.');
        }
      } catch (error) {
        alert('Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setStep(4);
    }
  };

  // Add custom event field
  const addCustomEvent = () => {
    if (customEvents.length < 5) setCustomEvents([...customEvents, '']);
  };

  // Remove custom event field
  const removeCustomEvent = (index: number) => {
    if (customEvents.length > 1) setCustomEvents(customEvents.filter((_, i) => i !== index));
  };

  // Update custom event value
  const updateCustomEvent = (index: number, value: string) => {
    const newEvents = [...customEvents];
    newEvents[index] = value;
    setCustomEvents(newEvents);
  };

  // Copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Start swiping (go to voting page)
  const startSwiping = () => {
    // Set flag to indicate user came from create page
    sessionStorage.setItem('cameFromCreate', 'true');
    router.push(`/vote/${planId}?topic=${topic}&groupSize=${groupSize}&zip=${zipCode}`);
  };

  // Submit plan creation
  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/createPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          groupSize,
          zipCode: zipCode.trim(),
          userName: userName.trim(),
          phoneNumber: phoneNumber.trim(),
          customEvents: customEvents.filter(event => event.trim())
        })
      });
      
      if (response.ok) {
        const { planId } = await response.json();
        setPlanId(planId);
        
        // Store creator info for automatic login
        localStorage.setItem(`creator_${planId}`, JSON.stringify({
          name: userName.trim(),
          phone: phoneNumber.trim(),
          timestamp: Date.now()
        }));
        
        // For solo users, go straight to voting
        if (groupSize === 'solo') {
          // Set flag to indicate user came from create page
          sessionStorage.setItem('cameFromCreate', 'true');
          router.push(`/vote/${planId}?topic=${topic}&groupSize=${groupSize}&zip=${zipCode}`);
        } else {
          // For groups, show sharing step
          const baseUrl = window.location.origin;
          const shareUrl = `${baseUrl}/vote/${planId}?topic=${topic}&groupSize=${groupSize}&zip=${zipCode}`;
          setShareUrl(shareUrl);
          setStep(5);
        }
      } else {
        alert('Failed to create plan. Please try again.');
      }
    } catch (error) {
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create a Plan - Choosy</title>
        <meta name="description" content="Create a new plan with local recommendations" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl mx-auto">
          {/* Step 1: Topic selection */}
          {step === 1 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <h1 className="text-3xl font-bold text-center mb-6">What are you in the mood for?</h1>
              <p className="text-center text-gray-600 mb-8">Choosy will find the best local events for you</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {TOPICS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleTopicSelect(t.key)}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl shadow-md border-2 border-transparent hover:border-purple-400 transition-all duration-200 bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 ${topic === t.key ? 'border-purple-600 bg-purple-100' : ''}`}
                  >
                    <span className="text-4xl mb-2">{t.icon}</span>
                    <span className="font-semibold text-lg text-gray-800">{t.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Random topic button */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleCompleteRandomChoice}
                  disabled={isLoading}
                  className="flex items-center gap-3 mx-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className="text-2xl">🎲</span>
                  <span className="text-lg">{isLoading ? 'Choosing...' : 'Choose for me'}</span>
                </button>
                <p className="text-sm text-gray-500 mt-2">We'll pick a random activity and event for you!</p>
              </div>
            </div>
          )}

          {/* Step 2: Group size selection */}
          {step === 2 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-center mb-4">Who's coming?</h2>
              <p className="text-center text-gray-600 mb-6">We'll customize events for your group size</p>
              <div className="space-y-4">
                {GROUP_SIZES.map((g) => (
                  <button
                    key={g.key}
                    onClick={() => handleGroupSizeSelect(g.key)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${
                      groupSize === g.key 
                        ? 'border-purple-600 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-400 bg-white'
                    }`}
                  >
                    <span className="text-2xl">{g.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{g.label}</div>
                      <div className="text-sm text-gray-600">{g.description}</div>
                    </div>
                  </button>
                ))}
              </div>
              

            </div>
          )}

          {/* Step 3: Contact info input (name, phone, zip combined) */}
          {step === 3 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-center mb-4">Your Contact Info</h2>
              <p className="text-center text-gray-600 mb-6">
                We'll use this for reservations and confirmations
              </p>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g., John Smith"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      // Only allow numbers, spaces, dashes, and parentheses
                      const value = e.target.value.replace(/[^0-9\s\-\(\)]/g, '');
                      setPhoneNumber(value);
                    }}
                    placeholder="e.g., (555) 123-4567"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300"
                    required
                  />
                </div>
                
                                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zip/Postal Code</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => {
                        setZipCode(e.target.value);
                        // Auto-detect city when zip code changes
                        if (e.target.value.length >= 3) {
                          const city = getCityFromZip(e.target.value);
                          setCityArea(city);
                        }
                      }}
                      placeholder="e.g., 10001 or international code"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300"
                      required
                    />
                    {cityArea && cityArea !== 'Unknown Area' && (
                      <p className={`text-sm mt-1 ${
                        cityArea === 'International Location' 
                          ? 'text-blue-600' 
                          : 'text-purple-600'
                      }`}>
                        📍 {cityArea}
                      </p>
                    )}
                  </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl mt-6"
                >
                  {groupSize === 'solo' ? 'Start Swiping!' : 'Next'}
                </button>
              </form>
            </div>
          )}

          {/* Step 4: Optional custom events */}
          {step === 4 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Almost done!</h2>
                <p className="text-gray-600 mb-4">
                  Choosy will find the best {topic} events for {groupSize === 'solo' ? 'solo adventures' : groupSize === 'date' ? 'date night' : 'your group'} near {zipCode}
                </p>
                <p className="text-sm text-gray-500">
                  Optionally add any events you know about
                </p>
              </div>

              <form onSubmit={handlePlanSubmit} className="space-y-6">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add your own events (optional)
                  </label>
                  {customEvents.map((event, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={event}
                        onChange={(e) => updateCustomEvent(index, e.target.value)}
                        placeholder={`Custom event ${index + 1} (e.g., That new sushi place downtown)`}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300"
                      />
                      {customEvents.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCustomEvent(index)}
                          className="px-4 py-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {customEvents.length < 5 && (
                    <button
                      type="button"
                      onClick={addCustomEvent}
                      className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300"
                    >
                      + Add another event
                    </button>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? 'Creating...' : 'Create Plan & Share Link'}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>💡 Choosy will automatically add 10-15 curated events for your group to vote on</p>
              </div>
            </div>
          )}

          {/* Step 5: Share URL */}
          {step === 5 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 Plan Created!</h2>
                <p className="text-gray-600 mb-6">
                  Share this link with your friends to start voting together
                </p>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-3">Shareable Link:</p>
                  <div className="flex items-center gap-3 bg-white rounded-xl p-4 border-2 border-gray-200">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 bg-transparent text-gray-700 font-mono text-sm"
                    />
                    <button
                      onClick={copyToClipboard}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                        copied 
                          ? 'bg-green-500 text-white' 
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={startSwiping}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  🎯 Start Swiping Now
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 border-2 border-gray-200"
                >
                  🏠 Back to Home
                </button>
              </div>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>💡 Your friends can join anytime by clicking the link above</p>
                <p>⏰ Voting session lasts 15 minutes once started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 
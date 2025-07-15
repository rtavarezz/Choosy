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
  { key: 'solo', label: 'Just Me', icon: '👤', description: 'Solo adventures' },
  { key: 'date', label: 'Date or Friend Night', icon: '👫', description: '2 people' },
  { key: 'group', label: 'Friend Group', icon: '👥', description: '3+ people' },
];

export default function Create() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: topic, 2: group size, 3: zip, 4: phone, 5: optional custom events
  const [topic, setTopic] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [customEvents, setCustomEvents] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);

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
      
      // Create plan with random choices
      const response = await fetch('/api/createPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: randomTopic.key,
          groupSize: randomGroupSize,
          zipCode: '10001', // Default zip code
          phoneNumber: '555-123-4567', // Default phone
          customEvents: []
        })
      });
      
      if (response.ok) {
        const { planId } = await response.json();
        // Go directly to results for solo users with the random event
        const params = new URLSearchParams({
          topic: randomTopic.key,
          groupSize: randomGroupSize,
          zip: '10001',
          winningEvent: JSON.stringify(randomEvent)
        });
        router.push(`/results/${planId}?${params.toString()}`);
      } else {
        alert('Failed to create plan. Please try again.');
      }
    } catch (error) {
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



  // Handle zip code submission
  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipCode.trim()) return;
    setStep(4);
  };

  // Handle name submission
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;
    setStep(5);
  };

  // Handle phone number submission
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    
    // For solo users, skip to voting directly
    if (groupSize === 'solo') {
      handlePlanSubmit(e);
    } else {
      setStep(6);
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
        router.push(`/vote/${planId}?topic=${topic}&groupSize=${groupSize}&zip=${zipCode}`);
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

          {/* Step 3: Zip code input */}
          {step === 3 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-center mb-4">Where are you?</h2>
              <p className="text-center text-gray-600 mb-6">We'll find events near you</p>
              <form onSubmit={handleZipSubmit} className="space-y-6">
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="e.g., 10001"
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 text-lg"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Next
                </button>
              </form>
            </div>
          )}

          {/* Step 4: Name input */}
          {step === 4 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-center mb-4">What's your name?</h2>
              <p className="text-center text-gray-600 mb-6">
                We'll use this for reservations and confirmations
              </p>
              <form onSubmit={handleNameSubmit} className="space-y-6">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g., John Smith"
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 text-lg"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Next
                </button>
              </form>
            </div>
          )}

          {/* Step 5: Phone number input */}
          {step === 5 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-center mb-4">Your phone number</h2>
              <p className="text-center text-gray-600 mb-6">
                {groupSize === 'solo' 
                  ? "We'll save your preferences for future plans" 
                  : "We'll send you a link to share with friends"
                }
              </p>
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., (555) 123-4567"
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 text-lg"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {groupSize === 'solo' ? 'Start Swiping!' : 'Next'}
                </button>
              </form>
            </div>
          )}

          {/* Step 6: Optional custom events */}
          {step === 6 && (
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
        </div>
      </div>
    </>
  );
} 
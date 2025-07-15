import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TinderCard from 'react-tinder-card';
import { AnimatePresence, motion } from 'framer-motion';

// Mock event data organized by topic and group size
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
      },
      {
        id: '2',
        name: 'Jazz Night at Blue Note',
        image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop',
        hours: '7:00 PM - 10:00 PM',
        reviews: { stars: 4.6, count: 892 },
        contact: { phone: '(555) 234-5678', email: 'reservations@bluenote.com' },
        voters: ['friendB']
      }
    ],
    date: [
      {
        id: '1',
        name: 'Romantic Jazz Duo',
        image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop',
        hours: '8:00 PM - 11:00 PM',
        reviews: { stars: 4.7, count: 567 },
        contact: { phone: '(555) 234-5678', email: 'reservations@romanticjazz.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '2',
        name: 'Acoustic Love Songs',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        hours: '7:30 PM - 10:30 PM',
        reviews: { stars: 4.5, count: 234 },
        contact: { phone: '(555) 345-6789', email: 'info@acousticlove.com' },
        voters: ['friendB']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Rock Festival in Central Park',
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop',
        hours: '6:00 PM - 11:00 PM',
        reviews: { stars: 4.4, count: 567 },
        contact: { phone: '(555) 345-6789', email: 'events@centralpark.com' },
        voters: ['friendA', 'friendB', 'friendC']
      },
      {
        id: '2',
        name: 'Pop Concert at Stadium',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        hours: '7:00 PM - 10:30 PM',
        reviews: { stars: 4.6, count: 1234 },
        contact: { phone: '(555) 456-7890', email: 'tickets@stadium.com' },
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
      },
      {
        id: '2',
        name: 'Solo Art Workshop',
        image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
        hours: '2:00 PM - 5:00 PM',
        reviews: { stars: 4.6, count: 234 },
        contact: { phone: '(555) 234-5678', email: 'art@workshop.com' },
        voters: ['friendB']
      }
    ],
    date: [
      {
        id: '1',
        name: 'Romantic Candlelit Dinner',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        hours: '6:00 PM - 10:00 PM',
        reviews: { stars: 4.9, count: 789 },
        contact: { phone: '(555) 345-6789', email: 'reservations@romanticdinner.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '2',
        name: 'Couples Massage',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop',
        hours: '2:00 PM - 4:00 PM',
        reviews: { stars: 4.7, count: 456 },
        contact: { phone: '(555) 456-7890', email: 'massage@couples.com' },
        voters: ['friendB']
      },
      {
        id: '3',
        name: 'Sunset Rooftop Drinks',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '5:00 PM - 8:00 PM',
        reviews: { stars: 4.8, count: 567 },
        contact: { phone: '(555) 567-8901', email: 'drinks@rooftop.com' },
        voters: ['friendA', 'friendB']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Group Cooking Class',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        hours: '6:00 PM - 9:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 678-9012', email: 'cooking@group.com' },
        voters: ['friendA', 'friendB', 'friendC']
      },
      {
        id: '2',
        name: 'Wine Tasting Experience',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '7:00 PM - 10:00 PM',
        reviews: { stars: 4.7, count: 234 },
        contact: { phone: '(555) 789-0123', email: 'wine@tasting.com' },
        voters: ['friendA', 'friendC']
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
    ],
    date: [
      {
        id: '1',
        name: 'Romantic Sushi Master',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
        hours: '6:00 PM - 10:00 PM',
        reviews: { stars: 4.9, count: 2341 },
        contact: { phone: '(555) 678-9012', email: 'reservations@sushimaster.com' },
        voters: ['friendB', 'friendC']
      },
      {
        id: '2',
        name: 'Farm-to-Table Bistro',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        hours: '5:00 PM - 11:00 PM',
        reviews: { stars: 4.6, count: 892 },
        contact: { phone: '(555) 789-0123', email: 'hello@farmtable.com' },
        voters: ['friendA']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Group BBQ Experience',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        hours: '4:00 PM - 9:00 PM',
        reviews: { stars: 4.7, count: 567 },
        contact: { phone: '(555) 890-1234', email: 'bbq@group.com' },
        voters: ['friendA', 'friendB', 'friendC']
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
    ],
    date: [
      {
        id: '1',
        name: 'Skyline Rooftop Bar',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '6:00 PM - 2:00 AM',
        reviews: { stars: 4.7, count: 1567 },
        contact: { phone: '(555) 456-7890', email: 'reservations@skylinebar.com' },
        voters: ['friendA', 'friendB', 'friendC']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Underground Club',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        hours: '10:00 PM - 4:00 AM',
        reviews: { stars: 4.3, count: 723 },
        contact: { phone: '(555) 567-8901', email: 'info@undergroundclub.com' },
        voters: ['friendA', 'friendB']
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
      },
      {
        id: '2',
        name: 'Peaceful Garden Walk',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
        hours: '8:00 AM - 6:00 PM',
        reviews: { stars: 4.5, count: 234 },
        contact: { phone: '(555) 234-5678', email: 'info@gardenwalk.com' },
        voters: ['friendB']
      }
    ],
    date: [
      {
        id: '1',
        name: 'Romantic Park Picnic',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
        hours: '12:00 PM - 4:00 PM',
        reviews: { stars: 4.8, count: 567 },
        contact: { phone: '(555) 345-6789', email: 'picnic@park.com' },
        voters: ['friendA', 'friendC']
      },
      {
        id: '2',
        name: 'Couples Nature Trail',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
        hours: '10:00 AM - 2:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 456-7890', email: 'trail@nature.com' },
        voters: ['friendB']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Group Park Games',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
        hours: '2:00 PM - 6:00 PM',
        reviews: { stars: 4.4, count: 234 },
        contact: { phone: '(555) 567-8901', email: 'games@park.com' },
        voters: ['friendA', 'friendB', 'friendC']
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
    ],
    date: [
      {
        id: '1',
        name: 'Couples Tennis Match',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        hours: '6:00 PM - 8:00 PM',
        reviews: { stars: 4.7, count: 234 },
        contact: { phone: '(555) 234-5678', email: 'tennis@couples.com' },
        voters: ['friendA', 'friendB']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Basketball Tournament',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop',
        hours: '3:00 PM - 7:00 PM',
        reviews: { stars: 4.5, count: 456 },
        contact: { phone: '(555) 345-6789', email: 'basketball@tournament.com' },
        voters: ['friendA', 'friendB', 'friendC']
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
    ],
    date: [
      {
        id: '1',
        name: 'Couples Go Kart Race',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '2:00 PM - 8:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 234-5678', email: 'couples@gokart.com' },
        voters: ['friendA', 'friendB']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Group Go Kart Championship',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '1:00 PM - 9:00 PM',
        reviews: { stars: 4.8, count: 567 },
        contact: { phone: '(555) 345-6789', email: 'championship@gokart.com' },
        voters: ['friendA', 'friendB', 'friendC']
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
    ],
    date: [
      {
        id: '1',
        name: 'Couples Pool Day',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '12:00 PM - 4:00 PM',
        reviews: { stars: 4.7, count: 234 },
        contact: { phone: '(555) 234-5678', email: 'pool@couples.com' },
        voters: ['friendA', 'friendB']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Group Pool Party',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        hours: '2:00 PM - 8:00 PM',
        reviews: { stars: 4.6, count: 345 },
        contact: { phone: '(555) 345-6789', email: 'party@pool.com' },
        voters: ['friendA', 'friendB', 'friendC']
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
    ],
    date: [
      {
        id: '1',
        name: 'Couples Wine Tasting',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '6:00 PM - 10:00 PM',
        reviews: { stars: 4.8, count: 456 },
        contact: { phone: '(555) 234-5678', email: 'wine@couples.com' },
        voters: ['friendA', 'friendB']
      }
    ],
    group: [
      {
        id: '1',
        name: 'Group Cocktail Night',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
        hours: '7:00 PM - 11:00 PM',
        reviews: { stars: 4.6, count: 234 },
        contact: { phone: '(555) 345-6789', email: 'cocktails@group.com' },
        voters: ['friendA', 'friendB', 'friendC']
      }
    ]
  }
};

// Mock friend data for avatar display
const MOCK_FRIENDS = {
  friendA: { name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face' },
  friendB: { name: 'Mike', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face' },
  friendC: { name: 'Emma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face' }
};

export default function VotePage() {
  const router = useRouter();
  const { planId, topic, groupSize, zip } = router.query;
  const [events, setEvents] = useState([]);
  const [voted, setVoted] = useState({});
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load events based on topic and group size
  useEffect(() => {
    const topicStr = Array.isArray(topic) ? topic[0] : topic;
    const groupSizeStr = Array.isArray(groupSize) ? groupSize[0] : groupSize;
    
    if (topicStr && groupSizeStr && MOCK_EVENTS[topicStr] && MOCK_EVENTS[topicStr][groupSizeStr]) {
      setEvents(MOCK_EVENTS[topicStr][groupSizeStr]);
    }
  }, [topic, groupSize]);

  // Timer countdown - redirects to results when time expires
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            router.push(`/results/${planId}`);
          }, 1000);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [planId, router]);

  // Handle swipe gestures
  const swiped = (dir, eventId) => {
    setVoted(prev => ({ ...prev, [eventId]: dir === 'right' }));
    setCurrentIndex(prev => prev + 1);
  };

  // Manual swipe controls
  const handleManualSwipe = (dir) => {
    if (currentIndex < events.length) {
      const currentEvent = events[currentIndex];
      swiped(dir, currentEvent.id);
    }
  };

  // Random choice generator
  const handleRandomChoice = () => {
    if (currentIndex < events.length) {
      const randomDirection = Math.random() > 0.5 ? 'right' : 'left';
      handleManualSwipe(randomDirection);
    }
  };

  // Get winning event for results page
  const getWinningEvent = () => {
    const votedEvents = events.filter(event => voted[event.id] === true);
    if (votedEvents.length > 0) {
      return votedEvents[0]; // Return first voted event
    }
    return events.length > 0 ? events[0] : null; // Fallback to first event
  };

  // Format time display (MM:SS)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Render star rating
  const renderStars = (stars) => {
    return '⭐'.repeat(Math.floor(stars)) + '☆'.repeat(5 - Math.floor(stars));
  };

  // Loading state
  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 to-blue-100 flex flex-col items-center justify-center px-4 py-8">
      {/* Header with timer */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vote on Events</h1>
        <p className="text-gray-600 mb-4">
          {(Array.isArray(topic) ? topic[0] : topic) === 'datenight' ? 'Date Night' : (Array.isArray(topic) ? topic[0] : topic)} • {(Array.isArray(groupSize) ? groupSize[0] : groupSize) === 'solo' ? 'Solo' : (Array.isArray(groupSize) ? groupSize[0] : groupSize) === 'date' ? 'Date or Friend Night' : 'Group'} • {Array.isArray(zip) ? zip[0] : zip}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg">
          <span className="text-lg">⏰</span>
          <span className="font-mono font-bold">{formatTime(timeLeft)} left</span>
        </div>
      </div>

      {/* Swipeable event cards */}
      <div className="relative w-full max-w-sm h-[500px]">
        <AnimatePresence>
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -60 }}
              transition={{ duration: 0.3 }}
              className="absolute w-full"
              style={{ zIndex: events.length - index }}
            >
              <TinderCard
                onSwipe={(dir) => swiped(dir, event.id)}
                preventSwipe={['up', 'down']}
              >
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  {/* Event image with hours overlay */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-400 to-blue-500">
                    <img 
                      src={event.image} 
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold">
                      {event.hours}
                    </div>
                  </div>

                  {/* Event details */}
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">{event.name}</h2>
                    
                    {/* Star rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-yellow-400">{renderStars(event.reviews.stars)}</span>
                      <span className="text-sm text-gray-600">({event.reviews.count} reviews)</span>
                    </div>

                    {/* Contact information */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-4 h-4">📞</span>
                        <span>{event.contact.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-4 h-4">✉️</span>
                        <span>{event.contact.email}</span>
                      </div>
                    </div>

                    {/* Friend avatars with vote status */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Voted by:</span>
                      <div className="flex -space-x-2">
                        {Object.keys(MOCK_FRIENDS).map((friendId) => {
                          const hasVoted = event.voters.includes(friendId);
                          return (
                            <div
                              key={friendId}
                              className={`w-8 h-8 rounded-full border-2 border-white overflow-hidden ${
                                hasVoted ? 'opacity-100' : 'opacity-30 blur-sm'
                              }`}
                              title={hasVoted ? MOCK_FRIENDS[friendId].name : 'Not voted'}
                            >
                              <img 
                                src={MOCK_FRIENDS[friendId].avatar} 
                                alt={MOCK_FRIENDS[friendId].name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </TinderCard>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Completion state */}
        {currentIndex >= events.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-2">🎉 You're Done!</h3>
              <p className="text-gray-600 mb-4">Thanks for voting! Check back for results.</p>
              <button
                onClick={() => {
                  const winningEvent = getWinningEvent();
                  const params = new URLSearchParams({
                    topic: Array.isArray(topic) ? topic[0] : topic || '',
                    groupSize: Array.isArray(groupSize) ? groupSize[0] : groupSize || '',
                    zip: Array.isArray(zip) ? zip[0] : zip || '',
                    winningEvent: winningEvent ? JSON.stringify(winningEvent) : ''
                  });
                  window.location.href = `/results/${planId}?${params.toString()}`;
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
              >
                See Results
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Manual control buttons */}
      {currentIndex < events.length && (
        <div className="mt-8 flex items-center justify-center gap-6">
          {/* Random choice button */}
          <button
            onClick={handleRandomChoice}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-2xl hover:scale-105 transition-all duration-200 shadow-lg"
          >
            <span className="text-xl">🎲</span>
            <span>Choose for me</span>
          </button>
          
          {/* Manual swipe buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => handleManualSwipe('left')}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white text-3xl font-bold rounded-full shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center"
            >
              ✕
            </button>
            <button
              onClick={() => handleManualSwipe('right')}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white text-3xl font-bold rounded-full shadow-lg hover:scale-110 transition-all duration-200 flex items-center justify-center"
            >
              ✓
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Swipe right to vote ✅ or left to skip ❌</p>
        <p className="mt-1">Or use the buttons below!</p>
      </div>
    </div>
  );
} 
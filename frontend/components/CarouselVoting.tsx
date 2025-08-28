/**
 * Choosy Carousel Voting Component
 * Copyright (c) 2024 rtavarezz
 * 
 * Simple carousel voting interface for group decision-making.
 * Licensed under MIT License - see LICENSE file.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Star, DollarSign } from 'lucide-react';

interface EventCard {
  id: string;
  name: string;
  description: string;
  image_url: string;
  venue?: string;
  address?: string;
  price?: string;
  tickets_required?: boolean;
  reservations_accepted?: boolean;
  rating?: number;
  reviewCount?: number;
  category?: string;
  hours?: string;
  contact?: {
    phone?: string;
  };
  source_type?: string;
}

const vendorLabel = (s?: string) => {
  const key = (s || '').toLowerCase();
  const map: Record<string, string> = {
    ticketmaster: 'Ticketmaster',
    eventbrite: 'Eventbrite',
    google: 'Google Places',
    yelp: 'Yelp',
    local: 'Meetup/Local'
  };
  return map[key] || (s || '');
};

interface CarouselVotingProps {
  events: EventCard[];
  onVote: (eventId: string, voteType: 'like' | 'dislike') => void;
  onComplete?: () => void;
  className?: string;
  initialVotedEventIds?: Set<string>;
}

const CarouselVoting: React.FC<CarouselVotingProps> = ({
  events,
  onVote,
  onComplete,
  className = '',
  initialVotedEventIds = new Set()
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votedEventIds, setVotedEventIds] = useState<Set<string>>(initialVotedEventIds);
  const [totalEvents] = useState(events.length); // Fixed total for consistent counter
  const [votedCount, setVotedCount] = useState(initialVotedEventIds.size);

  // Reset component state when events change
  useEffect(() => {
    setCurrentIndex(0);
    setVotedEventIds(initialVotedEventIds);
    setVotedCount(initialVotedEventIds.size);
  }, [events]);

  // Sync with parent's voted events
  useEffect(() => {
    setVotedEventIds(initialVotedEventIds);
    setVotedCount(initialVotedEventIds.size);
  }, [initialVotedEventIds]);
  // State for More Info overlay
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const handleVote = useCallback((voteType: 'like' | 'dislike') => {
    const currentEvent = events[currentIndex];
    if (!currentEvent || votedEventIds.has(currentEvent.id)) return;

    onVote(currentEvent.id, voteType);

    const newVotedEventIds = new Set(votedEventIds);
    newVotedEventIds.add(currentEvent.id);
    setVotedEventIds(newVotedEventIds);
    setVotedCount(prev => prev + 1);

    if (newVotedEventIds.size >= events.length) {
      setTimeout(() => onComplete?.(), 500);
      return;
    }

    setTimeout(() => {
      setCurrentIndex(prev => Math.min(prev + 1, events.length - 1));
    }, 200);
  }, [currentIndex, events, votedEventIds, onVote, onComplete]);

  const handleUndoVote = useCallback((eventId: string) => {
    if (!votedEventIds.has(eventId)) return;
    const newVotedEventIds = new Set(votedEventIds);
    newVotedEventIds.delete(eventId);
    setVotedEventIds(newVotedEventIds);
    setVotedCount(prev => Math.max(0, prev - 1));
    const undoneIndex = events.findIndex(e => e.id === eventId);
    if (undoneIndex !== -1) {
      setCurrentIndex(undoneIndex);
    }
  }, [votedEventIds, events]);

  const navigate = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex(prev => prev > 0 ? prev - 1 : events.length - 1);
    } else {
      setCurrentIndex(prev => prev < events.length - 1 ? prev + 1 : 0);
    }
  }, [events.length]);

  const getVisibleCards = () => {
    const total = events.length;
    if (total === 0) return [];
    
    const safeCurrentIndex = Math.max(0, Math.min(currentIndex, total - 1));
    const maxVisible = Math.min(5, total);
    let start = safeCurrentIndex - Math.floor(maxVisible / 2);
    let end = safeCurrentIndex + Math.floor((maxVisible - 1) / 2);

    // Count consecutive voted cards before current index (up to 3)
    let prevCount = 0;
    for (let i = safeCurrentIndex - 1; i >= 0 && prevCount < 3; i--) {
      const event = events[i];
      if (!event?.id) break;
      if (votedEventIds.has(event.id)) {
        prevCount++;
      } else {
        break;
      }
    }
    
    start = Math.min(start, safeCurrentIndex - prevCount);
    
    if (start < 0) {
      end += -start;
      start = 0;
    }
    if (end > total - 1) {
      start -= (end - (total - 1));
      end = total - 1;
    }
    start = Math.max(0, start);
    end = Math.min(total - 1, end);

    const visible = [];
    for (let i = start; i <= end; i++) {
      const event = events[i];
      if (!event?.id) continue;
      
      visible.push({
        event,
        index: i,
        offset: i - safeCurrentIndex,
        isActive: i === safeCurrentIndex,
        isPreviousVoted: i < safeCurrentIndex && votedEventIds.has(event.id),
      });
    }
    return visible;
  };

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <p>No events available</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 ${className}`}>
      {/* Progress indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-black/20 backdrop-blur-md rounded-full px-4 py-2 text-white text-sm font-medium">
          <span className="text-red-400">♥</span> {votedCount} of {totalEvents} voted
          <span className="ml-2 text-blue-400">Voting for activities ⚡</span>
        </div>
      </div>

      {/* Share button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={async () => {
            try {
              const currentUrl = window.location.href;
              const shareUrl = currentUrl.replace('creator=true', 'creator=false');
              await navigator.clipboard.writeText(shareUrl);
              alert('Link copied to clipboard! 📋');
            } catch (err) {
              const shareUrl = window.location.href.replace('creator=true', 'creator=false');
              alert('Could not copy link. Please copy manually: ' + shareUrl);
            }
          }}
          className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-2 rounded-full font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-200 shadow-lg"
        >
          🔗 Share
        </button>
      </div>

      {/* Carousel container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="flex items-center justify-center gap-x-2 h-full max-w-6xl mx-auto px-4">
          {getVisibleCards().map(({ event, index, offset, isActive, isPreviousVoted }) => {
            const isVoted = votedEventIds.has(event.id);
            
            return (
              <motion.div
                key={event.id}
                className="flex-shrink-0 cursor-pointer group mx-1"
                style={{
                  width: isActive ? '350px' : '280px',
                  height: isActive ? '500px' : '400px',
                }}
                animate={{
                  scale: isActive ? 1 : 0.85,
                  opacity: isActive ? 1 : 0.6,
                  y: isActive ? -10 : 0,
                  zIndex: isActive ? 20 : Math.abs(offset) === 1 ? 10 : 5,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                onClick={() => {
                  if (!isActive) {
                    setCurrentIndex(index);
                  }
                }}
                onMouseEnter={() => isActive && setShowMoreInfo(true)}
                onMouseLeave={() => isActive && setShowMoreInfo(false)}
              >
                {/* Card */}
                <div className={`relative w-full h-full bg-black rounded-xl overflow-hidden transition-all duration-300 ${
                  isActive && !isVoted ? 'shadow-2xl shadow-blue-500/30 ring-2 ring-blue-400/50' : 
                  isActive && isVoted ? 'shadow-2xl shadow-green-500/30 ring-2 ring-green-400/50' :
                  'shadow-lg'
                }`}>
                  {/* Image */}
                  <div className="relative h-3/5 overflow-hidden">
                    <img
                      src={event.image_url}
                      alt={event.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallbackApplied) {
                          target.dataset.fallbackApplied = 'true';
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2FhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-0 right-0 px-4 flex justify-between items-start">
                      <div className="flex gap-2 items-center">
                        {event.category && (
                          <div className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wide">
                            {event.category}
                          </div>
                        )}
                        {event.source_type && (
                          <div className="bg-white/20 text-white px-2 py-1 rounded text-[10px] font-semibold">
                            {vendorLabel(event.source_type)}
                          </div>
                        )}
                        {event.tickets_required && (
                          <div className="bg-yellow-600 text-white px-2 py-1 rounded text-[10px] font-semibold">
                            Tickets Required
                          </div>
                        )}
                        {event.reservations_accepted && (
                          <div className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-semibold">
                            Reservations
                          </div>
                        )}
                      </div>
                      {event.price && (
                        <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {event.price}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold leading-tight line-clamp-2">
                        {event.name}
                      </h3>
                      
                      {event.venue && (
                        <div className="flex items-center text-red-400 text-sm">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="font-medium">Local Venue</span>
                        </div>
                      )}
                      
                      {typeof event.rating === 'number' && (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[...Array(Math.floor(event.rating))].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            {[...Array(5 - Math.floor(event.rating))].map((_, i) => (
                              <Star key={i + 10} className="w-4 h-4 text-gray-400" />
                            ))}
                          </div>
                          <span className="text-sm text-gray-300">
                            ({event.reviewCount || 40} reviews)
                          </span>
                        </div>
                      )}
                      
                      <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>

                  {/* More Info Overlay (only for active card, on hover) */}
                  {isActive && showMoreInfo && !isVoted && (
                    <div className="absolute inset-0 bg-black/90 bg-opacity-90 flex flex-col justify-center items-center text-white p-6 z-40 rounded-xl animate-fade-in">
                      <h3 className="text-2xl font-bold mb-2">{event.name}</h3>
                      <p className="mb-2 text-base text-gray-200">{event.description}</p>
                      {event.address && (
                        <div className="mb-1 text-sm flex items-center"><MapPin className="w-4 h-4 mr-2" />{event.address}</div>
                      )}
                      {event.hours && (
                        <div className="mb-1 text-sm">Hours: {event.hours}</div>
                      )}
                      {event.contact?.phone && (
                        <div className="mb-1 text-sm">Contact: {event.contact.phone}</div>
                      )}
                      <button
                        className="mt-4 px-4 py-2 bg-blue-600 rounded-full text-white font-semibold hover:bg-blue-700 transition"
                        onClick={e => { e.stopPropagation(); setShowMoreInfo(false); }}
                      >Close</button>
                    </div>
                  )}

                  {/* Voted overlay for active card */}
                  {isActive && isVoted && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm rounded-xl p-4">
                      <div className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-xl shadow-2xl flex items-center gap-3 border-2 border-green-400 mb-3">
                        <span className="text-3xl">✓</span> 
                        <span>VOTED</span>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleUndoVote(event.id);
                        }}
                        className="px-4 py-2 bg-red-600 rounded-full text-white font-semibold hover:bg-red-700 transition"
                      >
                        Undo Vote
                      </button>
                    </div>
                  )}

                  {/* Smaller voted overlay for previous voted cards */}
                  {!isActive && isPreviousVoted && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl cursor-pointer"
                      onClick={() => setCurrentIndex(index)}
                      title="Previously voted - click to revisit"
                    >
                      <div className="bg-green-600 text-white px-3 py-1 rounded font-semibold text-sm shadow-md flex items-center gap-2 border border-green-400">
                        <span className="text-xl">✓</span> Voted
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="hidden md:block">
        <button
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/80 backdrop-blur-sm hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200"
          onClick={() => navigate('prev')}
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        <button
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/80 backdrop-blur-sm hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200"
          onClick={() => navigate('next')}
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Voting buttons - only show for current unvoted card */}
      {events[currentIndex] && !votedEventIds.has(events[currentIndex].id) && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex space-x-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleVote('dislike')}
              className="w-16 h-16 bg-white border-4 border-red-200 hover:border-red-400 rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
            >
              <span className="text-2xl text-red-500">✕</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleVote('like')}
              className="w-16 h-16 bg-white border-4 border-green-200 hover:border-green-400 rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
            >
              <span className="text-2xl text-green-500">✓</span>
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarouselVoting;

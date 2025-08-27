/**
 * Choosy SwipeCard Component
 * Copyright (c) 2024 rtavarezz
 * 
 * Interactive swipe card component for group voting.
 * Licensed under MIT License - see LICENSE file.
 * 
 * This proprietary component provides smooth swipe animations
 * and gesture handling for the voting interface.
 */

import React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

interface EventCard {
  id: string;
  name: string;
  description: string;
  image_url: string;
  rating?: number;
  reviewCount?: number;
  venue?: string;
  price?: string;
}

interface SwipeCardProps {
  card: EventCard;
  isTop: boolean;
  leavingId: string | null;
  voteDirection: 'like' | 'dislike' | null;
  onVote: (eventId: string, direction: 'like' | 'dislike') => Promise<void>;
  onRemove: (id: string) => void;
  setLeavingId: (id: string | null) => void;
  setVoteDirection: (direction: 'like' | 'dislike' | null) => void;
  isAnimating: React.MutableRefObject<boolean>;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ 
  card, 
  isTop, 
  leavingId,
  voteDirection,
  onVote, 
  onRemove, 
  setLeavingId,
  setVoteDirection, 
  isAnimating 
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 0, 150], [-5, 0, 5]);
  const likeOpacity = useTransform(x, [20, 80], [0, 1]);
  const dislikeOpacity = useTransform(x, [-80, -20], [1, 0]);

  return (
    <motion.div
      className="relative w-full overflow-visible"
      style={{ x, rotate }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        transition: { type: 'spring', stiffness: 500, damping: 30, mass: 0.8 }
      }}
      exit={{
        x: leavingId === card.id ? (voteDirection === 'like' ? 400 : -400) : 0,
        opacity: 0,
        scale: 0.9,
        rotate: leavingId === card.id ? (voteDirection === 'like' ? 10 : -10) : 0,
        transition: { duration: 0.1, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      dragTransition={{ bounceStiffness: 800, bounceDamping: 30 }}
      onDrag={(e, info) => {
        if (isAnimating.current) return;
        x.set(info.offset.x);
      }}
      onDragEnd={(e, info) => {
        if (isAnimating.current) {
          return;
        }
        const shouldSwipe = Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 400;
        if (shouldSwipe) {
          isAnimating.current = true;
          const dir = info.offset.x > 0 ? 'like' : 'dislike';
          setVoteDirection(dir);
          setLeavingId(card.id);
          onVote(card.id, dir);
          setTimeout(() => onRemove(card.id), 100);
        } else {
          x.set(0);
        }
      }}
    >
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-3xl overflow-hidden transform-gpu">
        <div className="relative w-full flex flex-col cursor-grab">
          <div className="relative h-64 w-full">
            <img 
              src={card.image_url || `https://picsum.photos/600/400?random=${card.id.slice(-6)}`}
              alt={card.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                if (!e.currentTarget.src.includes('picsum')) {
                  e.currentTarget.src = `https://picsum.photos/600/400?random=${card.id.slice(-6)}`;
                } else {
                  e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(`
                    <svg width='600' height='400' xmlns='http://www.w3.org/2000/svg'>
                      <defs>
                        <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
                          <stop offset='0%' style='stop-color:rgb(147,51,234);stop-opacity:1' />
                          <stop offset='100%' style='stop-color:rgb(79,70,229);stop-opacity:1' />
                        </linearGradient>
                      </defs>
                      <rect width='100%' height='100%' fill='url(#grad)'/>
                      <text x='50%' y='50%' font-family='Arial' font-size='24' fill='white' text-anchor='middle' dominant-baseline='middle'>${card.name || 'Event'}</text>
                    </svg>
                  `)}`;
                }
              }}
            />
            <>
              <motion.div 
                className="absolute top-6 left-6 bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-lg pointer-events-none select-none shadow-lg"
                style={{ opacity: likeOpacity }}
              >
                LIKE
              </motion.div>
              <motion.div 
                className="absolute top-6 right-6 bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg pointer-events-none select-none shadow-lg"
                style={{ opacity: dislikeOpacity }}
              >
                PASS
              </motion.div>
            </>
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{card.name}</h2>
            {card.venue && card.venue !== card.name && (
              <p className="text-purple-600 dark:text-purple-300 text-sm font-medium mb-1">📍 {card.venue}</p>
            )}
            {card.price && (
              <p className="text-green-600 dark:text-green-300 text-sm font-medium mb-2">💰 {card.price}</p>
            )}
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
              {card.description || "Experience the best local vibes. Perfect for fun activities and memorable moments."}
            </p>
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= Math.floor(card.rating || 4);
                const starClassName = `w-4 h-4 ${isActive ? 'text-yellow-400' : 'text-gray-300'}`;
                return (
                  <svg
                    key={star}
                    className={starClassName}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.954a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.372 2.455a1 1 0 00-.364 1.118l1.287 3.953c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.372 2.454c-.784.57-1.838-.197-1.539-1.118l1.286-3.953a1 1 0 00-.364-1.118L2.639 9.38c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.953z" />
                  </svg>
                );
              })}
              <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">
                ({card.reviewCount || 42} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
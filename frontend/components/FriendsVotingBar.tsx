import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Voter {
  id: string;
  name: string;
  phone?: string;
  isVoting: boolean;
  isCompleted: boolean;
  avatar?: string;
  timeRemaining?: number;
}

interface FriendsVotingBarProps {
  planId: string;
  maxVoters: number;
  completedVoters: number;
  className?: string;
}

// Generate consistent emoji avatar for a user
const generateEmojiAvatar = (userId: string): string => {
  const emojis = [
    '🦊', '🐻', '🐯', '🦁', '🐸', '🐙', '🦄', '🐨', 
    '🐷', '🐵', '🐰', '🐱', '🐶', '🐼', '🐧', '🦉',
    '🦆', '🐺', '🐹', '🐭', '🐳', '🐢', '🦋', '🐝'
  ];
  
  // Use the user ID to consistently pick an emoji
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return emojis[Math.abs(hash) % emojis.length];
};

// Generate a random name for display if needed
const generateRandomName = (userId: string): string => {
  const adjectives = ['Cool', 'Smart', 'Fun', 'Nice', 'Epic', 'Super', 'Happy'];
  const animals = ['Fox', 'Bear', 'Tiger', 'Lion', 'Frog', 'Panda', 'Penguin'];
  
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const adj = adjectives[Math.abs(hash) % adjectives.length];
  const animal = animals[Math.abs(hash >> 8) % animals.length];
  
  return `${adj} ${animal}`;
};

export function FriendsVotingBar({ planId, maxVoters, completedVoters, className = '' }: FriendsVotingBarProps) {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch active voters from API
  const fetchVoters = async () => {
    try {
      const response = await fetch(`/api/plans/${planId}/active-voters`);
      if (response.ok) {
        const data = await response.json();
        
        // Transform the data into our voter format
        const activeVoters: Voter[] = (data || []).map((voter: any, index: number) => ({
          id: voter.id || `voter_${index}`,
          name: voter.name || generateRandomName(`voter_${index}`),
          phone: voter.phone,
          isVoting: true,
          isCompleted: false,
          avatar: generateEmojiAvatar(voter.id || `voter_${index}`),
          timeRemaining: voter.time_remaining
        }));

        // Add completed voters as inactive
        const totalVotersToShow = Math.max(maxVoters, activeVoters.length + completedVoters);
        const completedVotersArray: Voter[] = [];
        
        for (let i = 0; i < completedVoters; i++) {
          const completedId = `completed_${i}`;
          completedVotersArray.push({
            id: completedId,
            name: generateRandomName(completedId),
            isVoting: false,
            isCompleted: true,
            avatar: generateEmojiAvatar(completedId)
          });
        }

        // Combine active and completed voters
        setVoters([...activeVoters, ...completedVotersArray]);
      }
    } catch (error) {
      console.error('Failed to fetch voters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch voters on mount and set up polling
  useEffect(() => {
    if (planId) {
      fetchVoters();
      
      // Poll every 3 seconds for updates
      const interval = setInterval(fetchVoters, 3000);
      return () => clearInterval(interval);
    }
  }, [planId, maxVoters, completedVoters]);

  if (isLoading) {
    return (
      <div className={`bg-black/20 backdrop-blur-md rounded-2xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-white/20 rounded-full" />
          </div>
          <div className="animate-pulse">
            <div className="w-24 h-4 bg-white/20 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Show the bar if this is a group plan (max_voters > 1) or if there are active voters
  const shouldShow = maxVoters > 1 || voters.length > 0;
  
  if (!shouldShow) {
    return null; // Don't show for solo voting with no activity
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-black/30 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20 ${className}`}
    >
      <div className="flex items-center gap-3">
        {/* Live indicator + counter */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white/90 font-medium text-sm">
            {completedVoters}/{maxVoters}
          </span>
        </div>

        {/* Friend avatars (only show active + recent) */}
        <div className="flex -space-x-1">
          <AnimatePresence mode="popLayout">
            {voters.slice(0, 4).map((voter) => (
              <motion.div
                key={voter.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: voter.isCompleted ? 0.6 : 1,
                  scale: voter.isVoting ? [1, 1.1, 1] : 1
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.2,
                  scale: { repeat: voter.isVoting ? Infinity : 0, duration: 2 }
                }}
                className="relative"
              >
                {/* Compact Avatar */}
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-sm relative border-2
                  ${voter.isCompleted 
                    ? 'bg-green-500/20 border-green-400/60' 
                    : 'bg-blue-500/20 border-blue-400/60'
                  }
                `}>
                  <span className={voter.isCompleted ? 'grayscale' : ''}>
                    {voter.avatar}
                  </span>
                  
                  {/* Tiny completion check */}
                  {voter.isCompleted && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px]">✓</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Overflow indicator */}
          {voters.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
              <span className="text-white text-xs font-medium">+{voters.length - 4}</span>
            </div>
          )}
        </div>

        {/* Compact progress bar */}
        <div className="flex-1 max-w-20">
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedVoters / maxVoters) * 100}%` }}
              className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
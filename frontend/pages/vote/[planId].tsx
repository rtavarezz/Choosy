import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import TinderCard from 'react-tinder-card';
import { AnimatePresence, motion } from 'framer-motion';
import { useDarkMode } from '../../lib/darkMode';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

// Styling for swipe animations
const swipeStyles = `
  .swipe-right { transform: translateX(100px) rotate(15deg) scale(1.05) !important; transition: all 0.3s ease !important; box-shadow: 0 20px 40px rgba(34, 197, 94, 0.3) !important; }
  .swipe-left  { transform: translateX(-100px) rotate(-15deg) scale(0.95) !important; transition: all 0.3s ease !important; opacity: 0.7 !important; }
  .swipe-card-active { will-change: transform; transform-style: preserve-3d; }
`;
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = swipeStyles;
  document.head.appendChild(style);
}

// Utilities
const SECRET_CARD_INDEX = 3;
const SECRET_UNLOCKED_KEY = 'choosy_secret_unlocked';
const POLLING_INTERVAL = 10000;
const apiCache = new Map<string, any>();
const cacheTimeout = new Map<string, number>();
const getCachedOrFetch = async (key: string, fn: () => Promise<any>, ttl = POLLING_INTERVAL) => {
  const now = Date.now();
  const cached = apiCache.get(key);
  const expiry = cacheTimeout.get(key) || 0;
  if (cached && now < expiry) return cached;
  const fresh = await fn();
  apiCache.set(key, fresh);
  cacheTimeout.set(key, now + ttl);
  return fresh;
};

// Toast component
function Toast({ message, show, onClose }: { message: string; show: boolean; onClose: () => void }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
      <div className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in-out">
        {message} <button onClick={onClose} className="ml-4 font-bold">×</button>
      </div>
    </div>
  );
}

export default function VotePage() {
  const router = useRouter();
  const { planId, topic, groupSize, zip } = router.query;
  const actualPlanId = router.isReady ? String(planId) : undefined;

  // Dark mode toggle
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // State
  const [deck, setDeck] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAuth, setIsAuth] = useState(false);
  const [voterName, setVoterName] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const confettiRef = useRef<HTMLDivElement>(null);
  const [luckyUsed, setLuckyUsed] = useState(false);
  const [secretUsed, setSecretUsed] = useState(false);
  const [showSecretCard, setShowSecretCard] = useState(false);
  const hasJoinedRef = useRef(false);
  const hasLeftRef = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [motionEnabled, setMotionEnabled] = useState(true);

  // Helpers
  const showToast = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 2500);
  };
  const showConfetti = () => {
    if (!confettiRef.current) return;
    confettiRef.current.innerHTML = '<div style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;pointer-events:none;font-size:3rem;">🎉🎉🎉</div>';
    setTimeout(() => { if (confettiRef.current) confettiRef.current.innerHTML = ''; }, 1200);
  };

  // Fetch deck of events / secret card
  useEffect(() => {
    if (!actualPlanId) return;
    (async () => {
      let events: any[] = [];
      if (actualPlanId === 'demo') {
        // Demo: load fallback events
        events = [
          { id: 'demo1', name: 'Live Music', type: 'event' },
          { id: 'demo2', name: 'Comedy Show', type: 'event' }
        ];
      } else {
        // Real plan: fetch from API
        const res = await fetch(`/api/plans/${actualPlanId}/events`);
        if (res.ok) {
          const data = await res.json();
          events = data.events.map((e: any) => ({ ...e, type: 'event' }));
        }
      }
      // Inject secret card
      const unlocked = localStorage.getItem(SECRET_UNLOCKED_KEY) === 'true';
      if (!unlocked && events.length > SECRET_CARD_INDEX) {
        events.splice(SECRET_CARD_INDEX, 0, { id: 'secret', type: 'secret' });
      }
      setDeck(events);
    })();
  }, [actualPlanId]);

  // Authentication check / login flow
  useEffect(() => {
    if (!actualPlanId) return;
    // Skip auth for demo
    if (actualPlanId === 'demo') {
      setIsAuth(true);
      return;
    }
    // Check localStorage
    const voter = localStorage.getItem(`voter_${actualPlanId}`);
    if (voter) {
      const v = JSON.parse(voter);
      setVoterName(v.name);
      setVoterPhone(v.phone);
      setIsAuth(true);
    } else {
      setShowLogin(true);
    }
  }, [actualPlanId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterName || !voterPhone) return;
    // Persist to backend
    if (actualPlanId !== 'demo') {
      const res = await fetch('/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: voterName, phone: voterPhone })
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem(`voter_${actualPlanId}`, JSON.stringify({ ...user, name: voterName, phone: voterPhone }));
      }
    } else {
      localStorage.setItem(`voter_${actualPlanId}`, JSON.stringify({ name: voterName, phone: voterPhone }));
    }
    setIsAuth(true);
    setShowLogin(false);
  };

  // JOIN effect: only once, after auth
  useEffect(() => {
    if (
      isAuth &&
      actualPlanId &&
      actualPlanId !== 'demo' &&
      voterPhone &&
      voterName &&
      !hasJoinedRef.current
    ) {
      hasJoinedRef.current = true;
      fetch(`/api/plans/${actualPlanId}/active-voters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          voter_id: voterPhone,
          name: voterName
        })
      });
    }
  }, [isAuth, actualPlanId, voterPhone, voterName]);

  // SWIPE handler: send vote, and LEAVE if last card
  const swiped = useCallback(async (dir: 'left'|'right', eventId: string) => {
    const votePayload = {
      plan_id: actualPlanId,
      event_id: eventId,
      voter_id: voterPhone,
      vote_type: dir === 'right' ? 'like' : 'dislike'
    };
    console.log('Submitting vote:', votePayload);
    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(votePayload)
    });
    setCurrentIndex(i => {
      const next = i + 1;
      if (next >= deck.length && !hasLeftRef.current) {
        hasLeftRef.current = true;
        fetch(`/api/plans/${actualPlanId}/active-voters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave',
            voter_id: voterPhone
          })
        });
      }
      return next;
    });
  }, [deck.length, actualPlanId, voterPhone]);

  // --- Power-up: Feeling Lucky ---
  const handleFeelingLucky = useCallback(() => {
    if (luckyUsed) return;
    if (deck.length > 0) {
      const randomIndex = Math.floor(Math.random() * deck.length);
      setCurrentIndex(randomIndex);
      setLuckyUsed(true);
      showToast('Feeling Lucky! Jumped to a random event.');
      showConfetti();
    }
  }, [deck.length, luckyUsed]);

  // --- Power-up: Secret Card ---
  const handleUnlockSecret = useCallback(() => {
    if (secretUsed) return;
    setSecretUsed(true);
    showToast('Secret Card Unlocked!');
    showConfetti();
  }, [secretUsed]);

  // Progress bar color segments
  const progressSegments = useMemo(() => {
    return deck.map((_, idx) => {
      if (idx < currentIndex) return deck[idx].voteType === 'like' ? 'bg-green-400' : 'bg-red-400';
      if (idx === currentIndex) return 'bg-purple-500';
      return 'bg-gray-200';
    });
  }, [deck, currentIndex]);

  // Animated background gradient
  const bgGradients = [
    'from-violet-500 via-blue-500 to-cyan-500',
    'from-pink-500 via-purple-500 to-indigo-500',
    'from-green-400 via-blue-400 to-purple-400',
    'from-yellow-400 via-pink-400 to-red-400',
  ];
  const bgIdx = Math.min(Math.floor((currentIndex / deck.length) * bgGradients.length), bgGradients.length - 1);

  // UI
  if (!router.isReady || showLogin) {
    return (
      <div className="p-8">
        {showLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input value={voterName} onChange={e => setVoterName(e.target.value)} placeholder="Name" />
            <input value={voterPhone} onChange={e => setVoterPhone(e.target.value)} placeholder="Phone" />
            <button type="submit">Join Voting</button>
          </form>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    );
  }

  const current = deck[currentIndex];
  if (!current) {
    return <div className="p-8">Finished voting, redirecting…</div>;
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center transition-all duration-700 bg-gradient-to-br ${bgGradients[bgIdx]}`}>
      <div ref={confettiRef} />
      {toast.show && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          <div className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg text-center animate-fade-in-out">
            {toast.message}
          </div>
        </div>
      )}
      {/* Progress bar */}
      <div className="w-full max-w-md mx-auto mt-8 mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1">
            <span role="img" aria-label="swipe">🤟</span> {currentIndex + 1}/{deck.length}
          </span>
          <span className="text-xs text-gray-400">Voting for {topic || 'events'}</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          {deck.map((_, idx) => (
            <motion.div
              key={idx}
              className={`flex-1 transition-colors duration-300 ${progressSegments[idx]}`}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ minWidth: 0 }}
            />
          ))}
        </div>
      </div>
      {/* Card deck */}
      <div className="relative w-full max-w-md flex flex-col items-center justify-center" style={{ minHeight: 420 }}>
        <AnimatePresence>
          <motion.div
            key={current.id}
            className="swipe-card-active"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, boxShadow: '0 8px 16px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.08)', borderRadius: '1.5rem', background: isDarkMode ? 'rgba(30,30,40,0.95)' : 'rgba(255,255,255,0.98)' }}
            exit={{ opacity: 0 }}
            whileHover={motionEnabled ? { scale: 1.02, y: -4 } : {}}
            whileTap={motionEnabled ? { scale: 0.99 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <TinderCard
              onSwipe={(dir) => swiped(dir as any, current.id)}
              preventSwipe={["up","down"]}
              onCardLeftScreen={() => setDragX(0)}
              onSwipeRequirementFulfilled={(dir) => setDragX(dir === 'right' ? 1 : -1)}
              onSwipeRequirementUnfulfilled={() => setDragX(0)}
            >
              <div className="relative p-8 rounded-3xl shadow-2xl flex flex-col items-center min-h-[340px]">
                {/* Swipe overlay */}
                <AnimatePresence>
                  {dragX !== 0 && (
                    <motion.div
                      key={dragX > 0 ? 'like' : 'dislike'}
                      className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none ${dragX > 0 ? 'text-green-400' : 'text-red-400'}`}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 0.7, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      {dragX > 0 ? <FaThumbsUp size={96} /> : <FaThumbsDown size={96} />}
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Render event or secret */}
                {current.type === 'secret' ? (
                  <motion.div initial={{ rotateY: 0 }} animate={{ rotateY: secretUsed ? 180 : 0 }} transition={{ duration: 0.7 }} className="w-full h-full flex items-center justify-center">
                    <div className="text-3xl">✨ Secret Unlocked! ✨</div>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-2 text-center">{current.name}</h2>
                    <p className="text-gray-600 text-center mb-4">{current.description}</p>
                  </>
                )}
              </div>
            </TinderCard>
          </motion.div>
        </AnimatePresence>
        {/* Floating swipe buttons */}
        <div className="absolute left-0 right-0 flex justify-center gap-16 -bottom-10 z-20">
          <motion.button
            className="w-16 h-16 rounded-full bg-red-500 shadow-lg hover:shadow-2xl flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-red-300 border-4 border-white dark:border-gray-900 transition"
            whileHover={motionEnabled ? { scale: 1.1, boxShadow: '0 0 16px 4px rgba(239,68,68,0.4)' } : {}}
            whileTap={motionEnabled ? { scale: 0.95 } : {}}
            aria-label="Dislike"
            tabIndex={0}
            onClick={() => swiped('left', current.id)}
          >
            <FaThumbsDown size={32} />
          </motion.button>
          <motion.button
            className="w-16 h-16 rounded-full bg-green-500 shadow-lg hover:shadow-2xl flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-green-300 border-4 border-white dark:border-gray-900 transition"
            whileHover={motionEnabled ? { scale: 1.1, boxShadow: '0 0 16px 4px rgba(34,197,94,0.4)' } : {}}
            whileTap={motionEnabled ? { scale: 0.95 } : {}}
            aria-label="Like"
            tabIndex={0}
            onClick={() => swiped('right', current.id)}
          >
            <FaThumbsUp size={32} />
          </motion.button>
        </div>
      </div>
      {/* Motion toggle */}
      <div className="mt-8 flex items-center gap-3">
        <label className="text-sm text-gray-600 dark:text-gray-300">Motion:</label>
        <input type="checkbox" checked={motionEnabled} onChange={() => setMotionEnabled(v => !v)} className="accent-purple-500" />
      </div>
    </div>
  );
}
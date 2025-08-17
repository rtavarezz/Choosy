import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useDarkMode } from '../../lib/darkMode';
import { useQuery } from '@tanstack/react-query';
import PhoneInput from 'react-phone-input-2/lib/lib';
import 'react-phone-input-2/lib/style.css';
import ProfanityFilter from 'profanity-filter';
import { ReservationDialog } from '@/components/ReservationDialog';
import { WinnerCard } from "@/components/WinnerCard";
import { BackgroundGradient } from "@/components/BackgroundGradient";
import { Leaderboard } from "@/components/Leaderboard";

type EventRow = {
  id: string;
  name: string;
  votes: number;
  percentage?: number;
  image_url?: string;
  hours?: string;
  contact?: { phone?: string };
  needs_reservation?: boolean;
};

interface VotingStatus {
  max_voters: number;
  completed_voters: number;
  voting_limit_reached: boolean;
}

interface ResultsData {
  planId: string;
  topic: string;
  groupSize: string;
  zip: string;
  winningEvent?: EventRow;
  plan: {
    userName: string;
    phoneNumber: string;
    topic: string;
    groupSize: string;
    zipCode: string;
  };
  totalVotes: number;
  participants: string[];
  allEvents: EventRow[];
}

// Custom hooks for React Query
function useVotingStatus(planId: string) {
  return useQuery<VotingStatus>({
    queryKey: ['voting-status', planId],
    queryFn: async () => {
      const response = await fetch(`/api/plans/${planId}/voting-status`);
      if (!response.ok) throw new Error('Failed to fetch voting status');
      return response.json();
    },
    refetchInterval: 5000,
    enabled: !!planId && planId !== 'demo',
  });
}

function useResults(planId: string) {
  return useQuery<ResultsData>({
    queryKey: ['results', planId],
    queryFn: async () => {
      const response = await fetch(`/api/plans/${planId}/results`);
      if (!response.ok) throw new Error('Failed to fetch results');
      const data = await response.json();
      
      return {
        planId,
        topic: data.plan.topic,
        groupSize: data.plan.group_size,
        zip: data.plan.zip_code,
        winningEvent: data.events.length > 0 ? {
          id: data.events[0].id,
          name: data.events[0].name,
          votes: data.events[0].votes,
          image_url: data.events[0].image_url,
          hours: "2 hours",
          contact: { phone: '(555) 123-4567' },
          needs_reservation: data.events[0].needs_reservation ?? true // Default to requiring reservation for safety
        } : undefined,
        plan: {
          userName: data.plan.host_name,
          phoneNumber: data.plan.host_phone,
          topic: data.plan.topic,
          groupSize: data.plan.group_size,
          zipCode: data.plan.zip_code,
        },
        totalVotes: data.totalVotes,
        participants: data.participants,
        allEvents: data.events.map((event: any, index: number) => ({
          id: event.id,
          name: event.name,
          votes: event.votes,
          percentage: event.percentage,
          image_url: event.image_url,
          hours: "2 hours",
          contact: { phone: '(555) 123-4567' }
        }))
      };
    },
    refetchInterval: 10000,
    enabled: !!planId && planId !== 'demo',
  });
}

export default function Results() {
  const router = useRouter();
  const { planId } = router.query;
  const planIdStr = Array.isArray(planId) ? planId[0] : planId || '';
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // React Query hooks
  const { data: votingStatus, isLoading: statusLoading } = useVotingStatus(planIdStr);
  const { data: results, isLoading: resultsLoading, error } = useResults(planIdStr);

  // State
  const [showReservation, setShowReservation] = useState(false);
  const [reservationName, setReservationName] = useState('');
  const [reservationPhone, setReservationPhone] = useState('');
  const [reservationGroupSize, setReservationGroupSize] = useState('myself');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // ✅ IMPORTANT: ensure dark mode applies to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Window size for confetti
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateSize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);

  // Smart confetti trigger - only when voting completes
  useEffect(() => {
    if (votingStatus?.voting_limit_reached && !hasTriggeredConfetti) {
      setShowConfetti(true);
      setHasTriggeredConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2200);
      return () => clearTimeout(timer);
    }
  }, [votingStatus?.voting_limit_reached, hasTriggeredConfetti]);

  const isSoloPlan = votingStatus?.max_voters === 1;
  const allVotersCompleted = votingStatus?.voting_limit_reached || false;

  const totalVotes = useMemo(
    () => (results?.allEvents ?? []).reduce((s, e) => s + (e.votes || 0), 0),
    [results]
  );

  const sortedEvents = useMemo(
    () => (results?.allEvents ?? []).slice().sort((a, b) => (b.votes || 0) - (a.votes || 0)),
    [results]
  );

  // Name validation function
  const validateName = (name: string): boolean => {
    const trimmedName = name.trim();
    
    if (trimmedName.length < 2 || trimmedName.length > 30) {
      setNameError('Name must be between 2 and 30 characters');
      return false;
    }
    
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(trimmedName)) {
      setNameError('Name can only contain letters, spaces, hyphens, and apostrophes');
      return false;
    }
    
    const filter = new ProfanityFilter();
    if (filter.isProfane(trimmedName)) {
      setNameError('Please choose an appropriate name');
      return false;
    }
    
    setNameError('');
    return true;
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/vote/${results?.planId || planId}`
      : '';
    try {
      if (navigator.share) {
        await navigator.share({ 
          title: 'Choosy Results - Check out what we picked!', 
          text: `We voted and chose: ${results?.winningEvent?.name || 'an awesome activity'}!`,
          url 
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Share link copied to clipboard!');
      }
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  const handleCall = (phone?: string) => {
    if (!phone) return;
    window.open(`tel:${phone}`, '_self');
  };

  const handleReservation = () => {
    setShowReservation(true);
  };

  const handleReservationSubmit = async () => {
    if (!validateName(reservationName)) return;
    if (!reservationPhone.trim()) {
      setPhoneError('Phone number is required');
      return;
    }
    
    try {
      const response = await fetch('/api/makeReservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: results?.winningEvent?.id,
          name: reservationName.trim(),
          phone: reservationPhone,
          groupSize: reservationGroupSize,
        }),
      });

      if (response.ok) {
        alert('Reservation request sent! The venue will contact you soon.');
        setShowReservation(false);
        setReservationName('');
        setReservationPhone('');
        setReservationGroupSize('myself');
      } else {
        alert('Failed to make reservation. Please try calling directly.');
      }
    } catch (error) {
      alert('Failed to make reservation. Please try calling directly.');
    }
  };

  // Loading state
  if (statusLoading || resultsLoading) {
    return (
      <>
        <Head>
          <title>Loading Results • Choosy</title>
        </Head>
        <BackgroundGradient />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center text-white/90">
            <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-white/80 mx-auto mb-4" />
            <p>Loading live results…</p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error || !results) {
    return (
      <>
        <Head>
          <title>Results Not Found • Choosy</title>
        </Head>
        <BackgroundGradient />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white/90 mb-4">Results Not Found</h1>
            <p className="text-white/70 mb-6">{error?.message || 'The voting session may have expired or doesn\'t exist.'}</p>
            <button
              onClick={() => router.push('/onboarding')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-200"
            >
              Create New Plan
            </button>
          </div>
        </div>
      </>
    );
  }

  // Patch: Ensure event passed to WinnerCard has required fields
  const winnerEvent = results.winningEvent ? {
    ...results.winningEvent,
    image_url: results.winningEvent.image_url || '',
    hours: results.winningEvent.hours || '2 hours',
    contact: { phone: results.winningEvent.contact?.phone || '' }
  } : undefined;

  return (
    <>
      <Head>
        <title>Results • Choosy</title>
        <meta name="description" content="See the results of your group voting" />
      </Head>

      <BackgroundGradient />

      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <Confetti 
            width={windowSize.width} 
            height={windowSize.height} 
            recycle={false} 
            numberOfPieces={220}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/50 dark:bg-neutral-900/50 border-b border-white/20 dark:border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="px-3 py-2 rounded-lg bg-white/70 dark:bg-white/10 text-sm font-medium text-neutral-800 dark:text-neutral-100 hover:scale-[1.02] transition border border-white/40 dark:border-white/10"
          >
            ← Home
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              Live Results
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live updates
            </span>
            <button
              onClick={toggleDarkMode}
              className="ml-2 px-2 py-2 rounded-lg bg-white/70 dark:bg-white/10 border border-white/40 dark:border-white/10"
              aria-label="Toggle theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero + Winner */}
      <main className="relative mx-auto max-w-5xl px-4 pt-8 pb-28" aria-live="polite">
        {/* Waiting for votes */}
        {!isSoloPlan && !allVotersCompleted && (
          <section className="text-center mb-8">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl mb-2"
            >
              ⏳
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
              Waiting for all votes
            </h1>
            <p className="text-white/80 mt-1">
              {votingStatus?.completed_voters || 0} out of {votingStatus?.max_voters || 0} people have finished voting.
            </p>
            
            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => router.push(`/vote/${planIdStr}`)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:scale-105 transition-all duration-200"
              >
                Back to Voting
              </button>
            </div>
          </section>
        )}

        {/* Winner Section */}
        {(isSoloPlan || allVotersCompleted) && winnerEvent && (
          <>
            <section className="text-center mb-6">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-5xl mb-2"
              >
                🏆
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
                Winner picked!
              </h1>
              <p className="text-white/80 mt-1">
                {isSoloPlan ? 'You chose this event' : 'Your group chose this event'}
              </p>
            </section>

            <WinnerCard
              event={winnerEvent}
              onCall={() => handleCall(winnerEvent.contact.phone)}
              onReserve={handleReservation}
            />
          </>
        )}

        {/* Leaderboard */}
        {sortedEvents.length > 0 && (
          <section className="mt-10">
            <h2 className="text-center text-white/90 font-semibold mb-4">All Results</h2>
            <div className="rounded-2xl bg-white/75 dark:bg-neutral-900/80 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-[0_18px_40px_-15px_rgba(0,0,0,0.35)] p-2 sm:p-3">
              <Leaderboard events={sortedEvents} totalVotes={totalVotes} />
            </div>
          </section>
        )}
      </main>

      {/* Sticky CTA bar */}
      <div className="fixed bottom-0 inset-x-0 z-30">
        <div className="mx-auto max-w-5xl px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <div className="rounded-2xl bg-white/75 dark:bg-neutral-900/80 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-lg p-3 flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition"
            >
              📤 Share Results
            </button>
            <button
              onClick={() => router.push('/onboarding')}
              className="px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/70 dark:border-white/10 text-neutral-800 dark:text-neutral-100 font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition"
            >
              + Start New
            </button>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      <ReservationDialog
        open={showReservation}
        onOpenChange={setShowReservation}
        reservationName={reservationName}
        setReservationName={setReservationName}
        reservationPhone={reservationPhone}
        setReservationPhone={setReservationPhone}
        reservationGroupSize={reservationGroupSize}
        setReservationGroupSize={setReservationGroupSize}
        nameError={nameError}
        phoneError={phoneError}
        onSubmit={handleReservationSubmit}
      />
    </>
  );
}
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
import { BackgroundGradient } from '@/components/BackgroundGradient';
import { Star, MapPin, Phone, Trophy, Medal, Timer, Share2, Plus, Ticket, Map as MapIcon, ExternalLink } from 'lucide-react';

type EventRow = {
  id: string;
  name: string;
  votes: number;
  percentage?: number;
  image_url?: string;
  hours?: string;
  contact?: { phone?: string };
  needs_reservation?: boolean;
  tickets_required?: boolean;
  external_url?: string;
  seatmap_url?: string;
  source_type?: string;
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
    refetchInterval: 2000,
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

      // Determine winning event with tie-breaking and optional preselected winner
      const eventsArr: any[] = Array.isArray(data.events) ? data.events : [];
      let selectedWinner: any | undefined;
      try {
        if (typeof window !== 'undefined') {
          const pre = sessionStorage.getItem(`choosy:selectedWinner:${planId}`);
          if (pre) {
            selectedWinner = eventsArr.find(e => e.id === pre);
          }
        }
      } catch { /* ignore */ }
      if (!selectedWinner && eventsArr.length > 0) {
        const maxVotes = Math.max(...eventsArr.map(e => e.votes || 0));
        const top = eventsArr.filter(e => (e.votes || 0) === maxVotes);
        selectedWinner = top[Math.floor(Math.random() * top.length)] || eventsArr[0];
      }

      // Build enriched events list with ticketing and venue details
      const events = (data.events || []).map((event: any) => {
        const meta = event.metadata || {};
        let hours: string | undefined;
        if (Array.isArray(meta.opening_hours)) {
          hours = meta.opening_hours.join(' • ');
        } else if (typeof meta.opening_hours === 'string') {
          hours = meta.opening_hours;
        } else if (meta.hours) {
          hours = meta.hours;
        }
        const phone = meta.phone || meta.display_phone || '';
        return {
          id: event.id,
          name: event.name,
          votes: event.votes,
          percentage: event.percentage,
          image_url: event.image_url,
          hours,
          contact: { phone },
          tickets_required: !!event.tickets_required,
          external_url: event.external_url || meta.purchase_url,
          seatmap_url: meta.seatmap_url,
          source_type: event.source_type
        } as EventRow;
      });

      return {
        planId,
        topic: data.plan.topic,
        groupSize: data.plan.group_size,
        zip: data.plan.zip_code,
        // If preselected winner exists, override with enriched event shape
        winningEvent: selectedWinner ? events.find(e => e.id === selectedWinner.id) || events[0] : (events[0] || undefined),
        plan: {
          userName: data.plan.host_name,
          phoneNumber: data.plan.host_phone,
          topic: data.plan.topic,
          groupSize: data.plan.group_size,
          zipCode: data.plan.zip_code,
        },
        totalVotes: data.totalVotes,
        participants: data.participants,
        allEvents: events
      };
    },
    refetchInterval: 3000,
    enabled: !!planId && planId !== 'demo',
  });
}

export default function Results() {
  const router = useRouter();
  const { planId } = router.query;
  const planIdStr = Array.isArray(planId) ? planId[0] : planId || '';
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const { data: votingStatus, isLoading: statusLoading } = useVotingStatus(planIdStr);
  const { data: results, isLoading: resultsLoading, error } = useResults(planIdStr);

  const [showReservation, setShowReservation] = useState(false);
  const [reservationName, setReservationName] = useState('');
  const [reservationPhone, setReservationPhone] = useState('');
  const [reservationGroupSize, setReservationGroupSize] = useState('myself');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

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

  useEffect(() => {
    if (votingStatus?.voting_limit_reached && !hasTriggeredConfetti) {
      setShowConfetti(true);
      setHasTriggeredConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
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

  const WinningCTAs = () => {
    const w = results?.winningEvent;
    if (!w) return null;
    const showTickets = w.tickets_required && !!w.external_url;
    const showSeatmap = !!w.seatmap_url;
    if (!showTickets && !showSeatmap) return null;
    return (
      <div className="mt-3 flex gap-3">
        {showTickets && (
          <a
            href={w.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold"
          >
            <Ticket className="w-4 h-4" /> Get Tickets
          </a>
        )}
        {showSeatmap && (
          <a
            href={w.seatmap_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
          >
            <MapIcon className="w-4 h-4" /> Seat Map
          </a>
        )}
      </div>
    );
  };

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

  if (statusLoading || resultsLoading) {
    return (
      <>
        <Head>
          <title>Loading Results • Choosy</title>
        </Head>
        <BackgroundGradient />
        <div className="min-h-screen flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white/80 animate-spin mx-auto" />
              <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Results</h2>
            <p className="text-white/70">Calculating the perfect choice...</p>
          </motion.div>
        </div>
      </>
    );
  }

  if (error || !results) {
    return (
      <>
        <Head>
          <title>Results Not Found • Choosy</title>
        </Head>
        <BackgroundGradient />
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="text-6xl mb-6">🚫</div>
            <h1 className="text-2xl font-bold text-white mb-4">Results Not Found</h1>
            <p className="text-white/70 mb-8">{error?.message || 'The voting session may have expired or doesn\'t exist.'}</p>
            <button
              onClick={() => router.push('/onboarding')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-8 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Create New Plan
            </button>
          </motion.div>
        </div>
      </>
    );
  }

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

      <AnimatePresence>
        {showConfetti && (
          <Confetti 
            width={windowSize.width} 
            height={windowSize.height} 
            recycle={false} 
            numberOfPieces={300}
            gravity={0.3}
            colors={['#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F59E0B']}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="relative z-20 p-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md text-white font-medium hover:bg-black/30 transition-all duration-300"
          >
            ← Home
          </button>
          
          <div className="flex items-center gap-3">
            {!isSoloPlan && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-500/20 backdrop-blur-md text-green-300 text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live Results
              </div>
            )}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-black/20 backdrop-blur-md text-white hover:bg-black/30 transition-all duration-300"
              aria-label="Toggle theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 pb-32">
        <div className="mx-auto max-w-4xl">
          {/* Waiting State */}
          {!isSoloPlan && !allVotersCompleted && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="relative mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="text-8xl mb-4"
                >
                  ⏳
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Waiting for Votes
              </h1>
              <p className="text-white/70 text-lg mb-8">
                {votingStatus?.completed_voters || 0} of {votingStatus?.max_voters || 0} people have finished voting
              </p>
              
              {/* Progress Bar */}
              <div className="max-w-md mx-auto mb-8">
                <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${((votingStatus?.completed_voters || 0) / (votingStatus?.max_voters || 1)) * 100}%` 
                    }}
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
              
              <motion.button
                onClick={() => router.push(`/vote/${planIdStr}`)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-4 px-8 rounded-2xl hover:shadow-2xl transition-all duration-300"
              >
                Back to Voting
              </motion.button>
            </motion.section>
          )}

          {/* Winner Section */}
          {(isSoloPlan || allVotersCompleted) && winnerEvent && (
            <>
              {/* Winner Announcement */}
              <motion.section 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20,
                    delay: 0.2 
                  }}
                  className="relative inline-block mb-6"
                >
                  <div className="text-8xl animate-bounce">🏆</div>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-orange-500/30 rounded-full blur-2xl animate-pulse" />
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg"
                >
                  We Have a Winner!
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-white/80 text-lg"
                >
                  {isSoloPlan ? 'Your perfect choice' : 'Your group has spoken'}
                </motion.p>
              </motion.section>

              {/* Winner Card */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="relative mb-12"
              >
                <div className="relative rounded-3xl overflow-hidden bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl">
                  {/* Background Image */}
                  <div className="relative h-80 md:h-96 overflow-hidden">
                    <img
                      src={winnerEvent.image_url || `https://picsum.photos/800/400?random=${winnerEvent.id}`}
                      alt={winnerEvent.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallbackApplied) {
                          target.dataset.fallbackApplied = 'true';
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2FhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkV2ZW50IEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Winner Badge */}
                    <div className="absolute top-6 left-6">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold shadow-lg">
                        <Trophy className="w-5 h-5" />
                        WINNER
                      </div>
                    </div>
                    
                    {/* Vote Count */}
                    <div className="absolute top-6 right-6">
                      <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md text-white font-semibold">
                        {winnerEvent.votes} {winnerEvent.votes === 1 ? 'vote' : 'votes'}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                      {winnerEvent.name}
                    </h2>
                    
                    <div className="flex flex-wrap items-center gap-4 mb-8 text-white/70">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        <span>Local Venue</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer className="w-5 h-5" />
                        <span>{winnerEvent.hours || '2 hours'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span>4.5 rating</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      {winnerEvent.tickets_required && results?.winningEvent?.external_url && (
                        <motion.a
                          href={results.winningEvent.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-yellow-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-yellow-700 hover:shadow-lg transition-all duration-300"
                        >
                          <Ticket className="w-5 h-5" /> Get Tickets
                        </motion.a>
                      )}
                      {results?.winningEvent?.seatmap_url && (
                        <motion.a
                          href={results.winningEvent.seatmap_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-300"
                        >
                          <MapIcon className="w-5 h-5" /> Seat Map
                        </motion.a>
                      )}
                      {winnerEvent.needs_reservation && (
                        <motion.button
                          onClick={handleReservation}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-300"
                        >
                          📅 Make Reservation
                        </motion.button>
                      )}
                      
                      {winnerEvent.contact.phone && (
                        <motion.button
                          onClick={() => handleCall(winnerEvent.contact.phone)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/10 backdrop-blur-md text-white font-semibold hover:bg-white/20 transition-all duration-300"
                        >
                          <Phone className="w-5 h-5" />
                          Call Venue
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* Results Leaderboard */}
          {sortedEvents.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="mb-12"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">All Results</h3>
                <p className="text-white/70">Here's how everything ranked</p>
              </div>

              <div className="grid gap-4">
                {sortedEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                    className="relative rounded-2xl overflow-hidden bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30 transition-all duration-300"
                  >
                    <div className="flex items-center p-6">
                      {/* Ranking */}
                      <div className="flex-shrink-0 mr-6">
                        <div className="relative">
                          {index === 0 && <Medal className="w-8 h-8 text-yellow-400 fill-yellow-400" />}
                          {index === 1 && <Medal className="w-8 h-8 text-gray-400 fill-gray-400" />}
                          {index === 2 && <Medal className="w-8 h-8 text-amber-600 fill-amber-600" />}
                          {index > 2 && (
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Event Image */}
                      <div className="flex-shrink-0 mr-6">
                        <img
                          src={event.image_url || `https://picsum.photos/200/200?random=${event.id}`}
                          alt={event.name}
                          className="w-16 h-16 rounded-xl object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNDQ0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2FhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-white mb-1 truncate">
                          {event.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-white/70">
                          <span>{event.votes} {event.votes === 1 ? 'vote' : 'votes'}</span>
                          <span>{event.percentage?.toFixed(0) || 0}%</span>
                          {event.source_type && (
                            <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs">
                              {vendorLabel(event.source_type)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex-shrink-0 w-24 ml-4">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${event.percentage || 0}%` }}
                            transition={{ delay: 1.3 + index * 0.1, duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-4">
        <motion.button
          onClick={handleShare}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:shadow-blue-500/25"
        >
          <Share2 className="w-6 h-6" />
        </motion.button>
        
        <motion.button
          onClick={() => router.push('/onboarding')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:shadow-purple-500/25"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
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

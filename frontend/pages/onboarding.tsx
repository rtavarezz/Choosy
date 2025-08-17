import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '../lib/darkMode';
import PhoneInput from 'react-phone-input-2/lib/lib';
import 'react-phone-input-2/lib/style.css';
import { validatePhoneNumber, formatPhoneForDisplay } from "@/lib/security";
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader as ShadDialogHeader,
  DialogTitle as ShadDialogTitle,
  DialogDescription as ShadDialogDescription,
  DialogFooter as ShadDialogFooter,
  DialogClose as ShadDialogClose,
} from '../components/ui/dialog';
import { BackgroundGradient } from "@/components/BackgroundGradient";

const CATEGORIES = [
  { id: 'concerts',  label: 'Concerts & Music',        emoji: '🎵' },
  { id: 'foodie',    label: 'Food & Dining',           emoji: '🍕' },
  { id: 'sports',    label: 'Sports & Fitness',        emoji: '⚽️' },
  { id: 'art',      label: 'Arts & Culture',          emoji: '🎨' },
  { id: 'nightlife', label: 'Nightlife',               emoji: '🍸' },
  { id: 'adventure', label: 'Adventure',               emoji: '🏔️' },
  { id: 'shopping',  label: 'Shopping',                emoji: '🛍️' },
  { id: 'comedy',    label: 'Comedy',                  emoji: '😂' },
  { id: 'movies',    label: 'Movies & Entertainment',  emoji: '🎬' },
  { id: 'wellness',  label: 'Wellness & Health',       emoji: '🧘' },
  { id: 'parks',     label: 'Parks & Outdoors',        emoji: '🌳' },
  { id: 'racing',    label: 'Racing & Motorsports',    emoji: '🏎️' },
  { id: 'bored',     label: "I'm Bored 🤷‍♀️",         emoji: '🤷‍♀️' },
];

export default function Onboarding() {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const [step, setStep] = useState(1);
  const [zipcode, setZipcode] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => setIsClient(true), []);
  useEffect(() => {
    // Fix dark mode: set class on <html>
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Optional: keep last pick
  useEffect(() => {
    const last = localStorage.getItem('choosy:lastCategory');
    if (last && CATEGORIES.some(c => c.id === last)) setSelectedCategory(last);
  }, []);
  useEffect(() => {
    if (selectedCategory) localStorage.setItem('choosy:lastCategory', selectedCategory);
  }, [selectedCategory]);

  const handleGeolocate = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use the backend geocoding service to convert coordinates to zipcode
      const response = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.zipcode) {
          setZipcode(data.zipcode);
        } else {
          alert('Could not determine your ZIP code from location.');
        }
      } else {
        alert('Failed to get ZIP code from location.');
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      if (error.code === 1) {
        alert('Location access denied. Please allow location access and try again.');
      } else if (error.code === 2) {
        alert('Location unavailable. Please enter your ZIP code manually.');
      } else if (error.code === 3) {
        alert('Location request timeout. Please try again or enter your ZIP code manually.');
      } else {
        alert('Unable to get your location. Please enter your ZIP code manually.');
      }
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setPhoneError('');
    if (!validatePhoneNumber(phone)) {
      setPhoneError('Invalid phone number');
      return;
    }
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) {
        setPhoneError('Failed to send code.');
        return;
      }
      const data = await response.json();
      setSessionId(data.session_id || data.sessionId || data.session);
      setShowVerification(true);
      setStep(2);
    } catch (err) {
      setPhoneError('Network error. Please try again.');
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setVerificationError('');
    if (!verificationCode.trim()) {
      setVerificationError('Please enter the verification code');
      return;
    }
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, code: verificationCode }),
      });
      if (!response.ok) {
        setVerificationError('Invalid code.');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setIsVerified(true);
        setStep(3);
      } else {
        setVerificationError('Invalid code.');
      }
    } catch (err) {
      setVerificationError('Network error. Please try again.');
    }
  };

  const handleCreatePlan = async (catId) => {
    try {
      // Step 1: Create the plan
      const planData = {
        topic: catId,
        group_size: 'myself',
        zip_code: zipcode,
        host_name: 'Host',
        host_phone: phone,
      };
      const planResponse = await fetch('/api/plans/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      });
      if (!planResponse.ok) {
        throw new Error('Failed to create plan');
      }
      const planResult = await planResponse.json();
      const planId = planResult.plan_id || planResult.planId || planResult.id;

      // Step 2: Get coordinates from ZIP code for event fetching
      let lat = 34.0522, lng = -118.2437; // Default to LA
      try {
        const geoResponse = await fetch(`/api/geocode?zipcode=${zipcode}`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          lat = geoData.lat;
          lng = geoData.lng;
        }
      } catch (geoError) {
        console.warn('Failed to geocode, using default location');
      }

      // Step 3: Fetch events for the location and category
      const eventsResponse = await fetch(`/api/events?lat=${lat}&lng=${lng}&category=${catId}&limit=20`);
      if (!eventsResponse.ok) {
        throw new Error('Failed to fetch events');
      }
      const events = await eventsResponse.json();

      // Step 4: Create events for the plan
      if (events && events.length > 0) {
        const createEventsResponse = await fetch('/api/createEvents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId, events }),
        });
        if (!createEventsResponse.ok) {
          console.warn('Failed to create events, proceeding anyway');
        }
      }

      // Step 5: Redirect to voting page
      router.push(`/vote/${planId}?creator=true`);
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Error creating plan. Please try again.');
    }
  };

  // Step 3: Only select, do not auto-advance
  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
  };

  const handleChooseForMe = () => {
    const available = CATEGORIES.map(c => c.id).filter(id => id !== selectedCategory);
    const random = available[Math.floor(Math.random() * available.length)];
    setSelectedCategory(random);
  };

  // Add keyboard shortcut for continue on Step 3
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (step === 3 && (e.key === 'Enter' || e.key === ' ')) {
        if (selectedCategory) handleCreatePlan(selectedCategory);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, selectedCategory]);

  if (!isClient) return null;

  return (
    <>
      <Head>
        <title>Choosy Onboarding</title>
        <meta name="description" content="Get started with Choosy" />
      </Head>
      {/* Full-page glass/gradient background, dark mode ready */}
      <BackgroundGradient />
      {/* Sticky header with navy/transparent blend */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-gradient-to-b from-black/20 to-transparent backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="font-semibold text-white/90 text-lg">Choosy</div>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-2 py-1 rounded-full bg-black/10 text-white/80">Step {step} of 3</span>
            <span className="text-white/60 hidden sm:inline">{step === 3 ? 'Pick a vibe' : step === 2 ? 'Verify phone' : 'Start'}</span>
          </div>
        </div>
      </header>
      <main className="relative z-10 flex flex-col min-h-[calc(100vh-56px)] mx-auto max-w-5xl px-4 pt-8 pb-32">
        {/* Step 1: ZIP and Phone */}
        {step === 1 && (
          <div className="flex flex-1 items-center justify-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
              <Card className="p-6 sm:p-8 bg-[#181f3a]/90 dark:bg-[#181f3a]/90 rounded-2xl border border-white/10 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]">
                <form onSubmit={sessionId ? handleVerifyCode : handleSendCode} className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/90 mb-1">ZIP code</label>
                    <input
                      type="text"
                      value={zipcode}
                      onChange={e => setZipcode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                      placeholder="ZIP code"
                      className="w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-700 border border-white/20 dark:border-white/10 text-neutral-900 dark:text-white"
                      required
                    />
                    <p className="text-xs text-white/70 mt-1">We use this only to find nearby options.</p>
                  </div>
                  <div>
                    <label className="block text-sm text-white/90 mb-1">Your phone (optional)</label>
                    <PhoneInput
                      country={'us'}
                      value={phone}
                      onChange={setPhone}
                      enableAreaCodes={true}
                      autoFormat={true}
                      inputProps={{
                        name: 'phone',
                        required: false,
                        autoFocus: false,
                        placeholder: 'Enter phone number'
                      }}
                      containerStyle={{ width: '100%' }}
                      inputStyle={{
                        width: '100%',
                        height: '48px',
                        fontSize: '16px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        paddingLeft: '48px',
                        backgroundColor: '#fff',
                        color: '#111827'
                      }}
                      buttonStyle={{
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px 0 0 12px',
                        backgroundColor: '#f9fafb'
                      }}
                      disabled={isVerified}
                    />
                    <p className="text-xs text-white/70 mt-1">Add a phone to get a link by SMS. You can skip it.</p>
                    {phoneError && (
                      <div role="alert" aria-live="polite" className="text-red-400 text-sm mt-1">{phoneError}</div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <button type="button" onClick={handleGeolocate} className="text-purple-200 hover:text-purple-100 text-sm">
                      📍 Use my location <span className="text-white/50">(we only store a ZIP)</span>
                    </button>
                    {!sessionId ? (
                      <button type="submit" className="btn-primary">Send Code</button>
                    ) : !isVerified ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="6-digit code"
                          value={verificationCode}
                          onChange={e => setVerificationCode(e.target.value)}
                          className="code-input"
                          maxLength={6}
                        />
                        <button type="submit" className="btn-primary">Verify</button>
                      </div>
                    ) : (
                      <span className="text-green-300 text-sm">Verified ✓</span>
                    )}
                  </div>
                  {verificationError && (
                    <div role="alert" aria-live="polite" className="text-red-400 text-sm mt-2">{verificationError}</div>
                  )}
                  {isVerified && <div className="text-green-600 text-sm mt-2">Phone verified!</div>}
                  <div className="pt-2">
                    <button type="button" onClick={() => setStep(3)} className="w-full px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/15">
                      Skip for now
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
        {/* Step 2: SMS Verification */}
        {step === 2 && showVerification && (
          <div className="flex flex-1 items-center justify-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-neutral-50 mb-2">Verify Your Phone</h2>
                <p className="text-white/80">We sent a code to {formatPhoneForDisplay(phone)}</p>
              </div>
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="code-input w-full"
                  required
                  maxLength={6}
                />
                <button
                  type="submit"
                  disabled={!verificationCode.trim()}
                  className="btn-primary w-full"
                >
                  Verify
                </button>
              </form>
              <div className="mt-4 text-center text-sm text-white/60">
                <p>💡 Demo mode: Enter any 6-digit code</p>
              </div>
              {verificationError && (
                <div role="alert" aria-live="polite" className="text-red-400 text-sm mt-2">{verificationError}</div>
              )}
            </motion.div>
          </div>
        )}
        {/* Step 3: Category Selection (modern grid) */}
        {step === 3 && (
          <div className="flex flex-1 flex-col items-center justify-start w-full py-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
              {/* Hero */}
              <div className="text-center mb-8 sm:mb-10">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-50 drop-shadow-[0_1px_0_rgba(0,0,0,0.3)]">What sounds fun?</h1>
                <p className="mt-2 text-base sm:text-lg text-white/80">Pick a vibe. We’ll handle the options.</p>
              </div>
              {/* Quick controls */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <button
                  className="px-3 py-1.5 rounded-full bg-white/85 dark:bg-white/10 text-sm text-neutral-800 dark:text-neutral-200 border border-white/20 dark:border-white/10 hover:scale-[1.02] transition"
                  onClick={handleGeolocate}
                >
                  📍 {zipcode ? `${zipcode} • change` : 'Use current location'}
                </button>
                <button
                  className="px-3 py-1.5 rounded-full bg-white/85 dark:bg-white/10 text-sm text-neutral-800 dark:text-neutral-200 border border-white/20 dark:border-white/10 hover:scale-[1.02] transition"
                  onClick={() => handleChooseForMe()}
                  title="Surprise me"
                >
                  🎲 Surprise me
                </button>
              </div>
              {/* Category grid (accessible radio group) */}
              <section
                role="radiogroup"
                aria-label="Categories"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full"
              >
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat.id}
                    className={`group relative isolate rounded-2xl p-4 sm:p-5 cursor-pointer bg-white/85 dark:bg-neutral-900/80 border border-white/10 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] hover:scale-[1.02] transition will-change-transform ${selectedCategory===cat.id ? 'ring-4 ring-purple-400/50 border-purple-400' : ''}`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={selectedCategory===cat.id}
                      onChange={() => setSelectedCategory(cat.id)}
                      className="sr-only"
                    />
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="text-2xl sm:text-3xl">{cat.emoji}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">{cat.label}</div>
                        <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Tap to choose</div>
                      </div>
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${selectedCategory===cat.id ? 'border-transparent bg-gradient-to-br from-purple-500 to-blue-500 text-white' : 'border-white/30 text-transparent'}`}>✓</div>
                    </div>
                  </label>
                ))}
              </section>
            </motion.div>
          </div>
        )}
      </main>
      {/* Sticky bottom bar CTA */}
      {step === 3 && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black/20 via-black/10 to-transparent">
          <div className="mx-auto max-w-5xl px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <div className="rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)] p-3 sm:p-4 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/15 border border-white/10 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => selectedCategory && handleCreatePlan(selectedCategory)}
                disabled={!selectedCategory}
                className={`px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg transition-all flex-1 sm:flex-none ${!selectedCategory ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

export async function getServerSideProps() {
  return { props: {} };
}

// Tailwind utilities for .btn-primary and .code-input (add to your global CSS or Tailwind config)
// .btn-primary {
//   @apply bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-5 py-3 rounded-xl shadow-lg transition;
// }
// .code-input {
//   @apply w-28 text-center tracking-[0.3em] rounded-xl bg-white/90 dark:bg-slate-700 border border-white/20 dark:border-white/10;
// }

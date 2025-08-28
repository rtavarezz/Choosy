import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDarkMode } from '../lib/darkMode';
import PhoneInput from 'react-phone-input-2/lib/lib';
import 'react-phone-input-2/lib/style.css';
import { validatePhoneNumber, formatPhoneForDisplay } from "@/lib/security";
import { Card } from '../components/ui/card';
import { BackgroundGradient } from "@/components/BackgroundGradient";
import { Search, Shuffle, MapPin, Sparkles, TrendingUp, Zap } from 'lucide-react';
import Fuse from 'fuse.js';

const CATEGORIES = [
  { id: 'concerts',  label: 'Concerts & Music',        emoji: '🎵', group: 'entertainment', trending: true },
  { id: 'foodie',    label: 'Food & Dining',           emoji: '🍕', group: 'lifestyle', trending: true },
  { id: 'sports',    label: 'Sports & Fitness',        emoji: '⚽️', group: 'active', trending: false },
  { id: 'art',      label: 'Arts & Culture',          emoji: '🎨', group: 'culture', trending: false },
  { id: 'nightlife', label: 'Nightlife',               emoji: '🍸', group: 'entertainment', trending: true },
  { id: 'adventure', label: 'Adventure',               emoji: '🏔️', group: 'active', trending: false },
  { id: 'shopping',  label: 'Shopping',                emoji: '🛍️', group: 'lifestyle', trending: false },
  { id: 'comedy',    label: 'Comedy',                  emoji: '😂', group: 'entertainment', trending: false },
  { id: 'movies',    label: 'Movies & Entertainment',  emoji: '🎬', group: 'entertainment', trending: false },
  { id: 'wellness',  label: 'Wellness & Health',       emoji: '🧘', group: 'lifestyle', trending: false },
  { id: 'parks',     label: 'Parks & Outdoors',        emoji: '🌳', group: 'active', trending: false },
  { id: 'racing',    label: 'Racing & Motorsports',    emoji: '🏎️', group: 'active', trending: false }
];

const CATEGORY_GROUPS = {
  trending: { label: 'Trending Now', icon: TrendingUp },
  entertainment: { label: 'Entertainment', icon: Sparkles },
  lifestyle: { label: 'Lifestyle', icon: MapPin },
  active: { label: 'Active & Sports', icon: Shuffle },
  culture: { label: 'Arts & Culture', icon: Sparkles }
};

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isAnimating, setIsAnimating] = useState(false);

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

  const handleSendCode = async (e: React.FormEvent) => {
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

  const handleVerifyCode = async (e: React.FormEvent) => {
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

  const handleCreatePlan = async (catId: string) => {
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

  const handleChooseForMe = () => {
    setIsAnimating(true);
    
    // Create dramatic animation sequence
    const animationSteps = 8;
    let currentStep = 0;
    
    const animate = () => {
      if (currentStep < animationSteps) {
        const tempCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].id;
        setSelectedCategory(tempCategory);
        currentStep++;
        setTimeout(animate, 150 - (currentStep * 15)); // Speed up each step
      } else {
        // Final selection with weight towards trending
        const trendingWeight = 0.4; // 40% chance for trending
        const shouldPickTrending = Math.random() < trendingWeight;
        
        let finalCategories: typeof CATEGORIES;
        if (shouldPickTrending) {
          finalCategories = CATEGORIES.filter(c => c.trending);
        } else {
          finalCategories = CATEGORIES;
        }
        
        const finalChoice = finalCategories[Math.floor(Math.random() * finalCategories.length)];
        setSelectedCategory(finalChoice.id);
        setIsAnimating(false);
      }
    };
    
    animate();
  };
  
  const handleBoredAction = () => {
    // "I'm bored" creates a mixed bag plan with multiple categories
    const mixedCategories = ['concerts', 'foodie', 'nightlife', 'adventure', 'comedy'];
    const randomMix = mixedCategories[Math.floor(Math.random() * mixedCategories.length)];
    setSelectedCategory(randomMix);
    
    // Auto-continue after short delay for "surprise me" effect
    setTimeout(() => {
      if (zipcode) {
        handleCreatePlan(randomMix);
      }
    }, 1000);
  };

  // Step 3: Handle category selection with haptic-like feedback
  const handleCategorySelect = (catId: string) => {
    if (isAnimating) return;
    
    // Add subtle animation on select
    setSelectedCategory(catId);
    
    // Store selection for quick access next time
    localStorage.setItem('choosy:recentCategory', catId);
  };
  
  // Search and filter logic
  const fuse = useMemo(() => new Fuse(CATEGORIES, {
    keys: ['label', 'id'],
    threshold: 0.3,
    includeScore: true
  }), []);
  
  const filteredCategories = useMemo(() => {
    let filtered = CATEGORIES;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const results = fuse.search(searchQuery);
      filtered = results.map(result => result.item);
    }
    
    // Apply group filter
    if (selectedGroup !== 'all') {
      if (selectedGroup === 'trending') {
        filtered = filtered.filter(cat => cat.trending);
      } else {
        filtered = filtered.filter(cat => cat.group === selectedGroup);
      }
    }
    
    return filtered;
  }, [searchQuery, selectedGroup, fuse]);
  
  const groupedCategories = useMemo(() => {
    const groups: Record<string, typeof CATEGORIES> = {
      trending: CATEGORIES.filter(cat => cat.trending),
      entertainment: CATEGORIES.filter(cat => cat.group === 'entertainment'),
      lifestyle: CATEGORIES.filter(cat => cat.group === 'lifestyle'),
      active: CATEGORIES.filter(cat => cat.group === 'active'),
      culture: CATEGORIES.filter(cat => cat.group === 'culture')
    };
    
    return groups;
  }, []);

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
        {/* Step 3: Modern Category Selection */}
        {step === 3 && (
          <div className="flex flex-1 flex-col w-full py-4 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-6xl mx-auto">
              {/* Hero */}
              <div className="text-center mb-6">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-50 drop-shadow-[0_1px_0_rgba(0,0,0,0.3)]">What sounds fun?</h1>
                <p className="mt-2 text-base sm:text-lg text-white/80">Pick a vibe. We'll handle the options.</p>
              </div>
              
              {/* Search + Quick Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search vibes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/90 dark:bg-neutral-800/90 border border-white/20 text-neutral-900 dark:text-white placeholder-neutral-500 text-sm focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-2.5 rounded-full bg-white/90 dark:bg-white/10 text-sm text-neutral-800 dark:text-neutral-200 border border-white/20 hover:scale-[1.02] transition flex items-center gap-2"
                    onClick={handleGeolocate}
                  >
                    <MapPin className="w-4 h-4" />
                    {zipcode || 'Location'}
                  </button>
                  <button
                    className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all flex items-center gap-2 ${
                      isAnimating 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent animate-pulse' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-transparent hover:scale-[1.02]'
                    }`}
                    onClick={handleChooseForMe}
                    disabled={isAnimating}
                  >
                    <Shuffle className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
                    {isAnimating ? 'Choosing...' : 'Surprise Me'}
                  </button>
                </div>
              </div>
              
              {/* Filter Tabs */}
              <div className="flex justify-center mb-6">
                <div className="flex bg-black/20 rounded-full p-1 backdrop-blur-sm border border-white/10">
                  <button
                    onClick={() => setSelectedGroup('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedGroup === 'all' 
                        ? 'bg-white/20 text-white shadow-lg' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedGroup('trending')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedGroup === 'trending' 
                        ? 'bg-white/20 text-white shadow-lg' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Trending
                  </button>
                  <button
                    onClick={() => setSelectedGroup('entertainment')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedGroup === 'entertainment' 
                        ? 'bg-white/20 text-white shadow-lg' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Fun
                  </button>
                  <button
                    onClick={() => setSelectedGroup('lifestyle')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedGroup === 'lifestyle' 
                        ? 'bg-white/20 text-white shadow-lg' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Chill
                  </button>
                  <button
                    onClick={() => setSelectedGroup('active')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedGroup === 'active' 
                        ? 'bg-white/20 text-white shadow-lg' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Active
                  </button>
                </div>
              </div>
              
              {/* I'm Bored Special Button */}
              <div className="flex justify-center mb-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBoredAction}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold text-lg shadow-lg border-2 border-yellow-400/50 backdrop-blur-sm flex items-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  🤷‍♀️ I'm Bored - Pick Something Fun!
                </motion.button>
              </div>
              
              {/* Dynamic Categories Display */}
              {selectedGroup === 'all' && !searchQuery ? (
                // Grouped view for "all"
                <div className="space-y-8">
                  {Object.entries(groupedCategories).map(([groupKey, categories]) => (
                    categories.length > 0 && (
                      <div key={groupKey}>
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="text-lg font-semibold text-white/90">{CATEGORY_GROUPS[groupKey]?.label}</h3>
                          {groupKey === 'trending' && <TrendingUp className="w-4 h-4 text-yellow-400" />}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {categories.map((cat) => (
                            <CategoryCard 
                              key={cat.id} 
                              category={cat} 
                              isSelected={selectedCategory === cat.id}
                              isAnimating={isAnimating}
                              onClick={() => handleCategorySelect(cat.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                // Grid view for filtered results
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {filteredCategories.map((cat) => (
                    <CategoryCard 
                      key={cat.id} 
                      category={cat} 
                      isSelected={selectedCategory === cat.id}
                      isAnimating={isAnimating}
                      onClick={() => handleCategorySelect(cat.id)}
                    />
                  ))}
                </div>
              )}
              
              {filteredCategories.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-white/70 text-lg mb-2">No vibes found for "{searchQuery}"</p>
                  <p className="text-white/50 text-sm">Try a different search or browse all categories</p>
                </div>
              )}
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

// Modern Category Card Component
interface CategoryCardProps {
  category: typeof CATEGORIES[0];
  isSelected: boolean;
  isAnimating: boolean;
  onClick: () => void;
}

function CategoryCard({ category, isSelected, isAnimating, onClick }: CategoryCardProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={isAnimating}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        group relative isolate rounded-2xl p-3 sm:p-4 cursor-pointer 
        bg-white/90 dark:bg-neutral-900/80 border border-white/10 
        shadow-lg hover:shadow-xl transition-all duration-200 will-change-transform
        ${isSelected 
          ? 'ring-2 ring-purple-400/70 border-purple-400/50 bg-gradient-to-br from-purple-50/90 to-blue-50/90 dark:from-purple-900/20 dark:to-blue-900/20' 
          : 'hover:border-white/30'
        }
        ${isAnimating && isSelected ? 'animate-pulse' : ''}
      `}
    >
      <div className="relative z-10 flex flex-col items-center text-center gap-2">
        <div className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-200">
          {category.emoji}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm sm:text-base leading-tight">
            {category.label}
          </div>
          {category.trending && (
            <div className="mt-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3 text-yellow-500" />
              <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Trending</span>
            </div>
          )}
        </div>
        <div className={`
          absolute -top-2 -right-2 h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all
          ${isSelected 
            ? 'border-transparent bg-gradient-to-br from-purple-500 to-blue-500 text-white scale-100' 
            : 'border-white/30 text-transparent scale-0'
          }
        `}>
          ✓
        </div>
      </div>
    </motion.button>
  );
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
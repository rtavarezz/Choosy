import Head from 'next/head';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useDarkMode } from '../lib/darkMode';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const COUNTRY_LIST = [
  { code: '+1', label: 'United States', flag: '🇺🇸', maxLength: 10, format: 'XXX-XXX-XXXX' },
  { code: '+1', label: 'Canada', flag: '🇨🇦', maxLength: 10, format: 'XXX-XXX-XXXX' },
  { code: '+44', label: 'United Kingdom', flag: '🇬🇧', maxLength: 10, format: 'XXXXX-XXXXX' },
  { code: '+52', label: 'Mexico', flag: '🇲🇽', maxLength: 10, format: 'XXX-XXX-XXXX' },
  { code: '+91', label: 'India', flag: '🇮🇳', maxLength: 10, format: 'XXXXX-XXXXX' },
  { code: '+61', label: 'Australia', flag: '🇦🇺', maxLength: 9, format: 'X-XXXX-XXXX' },
  { code: '+81', label: 'Japan', flag: '🇯🇵', maxLength: 10, format: 'XX-XXXX-XXXX' },
  { code: '+49', label: 'Germany', flag: '🇩🇪', maxLength: 11, format: 'XXXX-XXXXXXX' },
  { code: '+33', label: 'France', flag: '🇫🇷', maxLength: 9, format: 'X-XX-XX-XX-XX' },
  { code: '+34', label: 'Spain', flag: '🇪🇸', maxLength: 9, format: 'XXX-XXX-XXX' },
  { code: '+39', label: 'Italy', flag: '🇮🇹', maxLength: 10, format: 'XXX-XXXXXXX' },
  { code: '+86', label: 'China', flag: '🇨🇳', maxLength: 11, format: 'XXX-XXXX-XXXX' },
  { code: '+7', label: 'Russia', flag: '🇷🇺', maxLength: 10, format: 'XXX-XXX-XX-XX' },
  { code: '+55', label: 'Brazil', flag: '🇧🇷', maxLength: 11, format: 'XX-XXXXX-XXXX' },
  { code: '+27', label: 'South Africa', flag: '🇿🇦', maxLength: 9, format: 'XX-XXX-XXXX' },
  { code: '+82', label: 'South Korea', flag: '🇰🇷', maxLength: 10, format: 'XX-XXXX-XXXX' },
  { code: '+62', label: 'Indonesia', flag: '🇮🇩', maxLength: 10, format: 'XXX-XXXX-XXX' },
  { code: '+63', label: 'Philippines', flag: '🇵🇭', maxLength: 10, format: 'XXX-XXX-XXXX' },
  { code: '+90', label: 'Turkey', flag: '🇹🇷', maxLength: 10, format: 'XXX-XXX-XXXX' },
  { code: '+31', label: 'Netherlands', flag: '🇳🇱', maxLength: 9, format: 'X-XXX-XXXXX' },
  { code: '+46', label: 'Sweden', flag: '🇸🇪', maxLength: 9, format: 'XX-XXX-XXXX' },
  { code: '+47', label: 'Norway', flag: '🇳🇴', maxLength: 8, format: 'XXX-XX-XXX' },
  { code: '+48', label: 'Poland', flag: '🇵🇱', maxLength: 9, format: 'XXX-XXX-XXX' },
  { code: '+351', label: 'Portugal', flag: '🇵🇹', maxLength: 9, format: 'XXX-XXX-XXX' },
  { code: '+358', label: 'Finland', flag: '🇫🇮', maxLength: 9, format: 'XX-XXX-XXXX' },
  { code: '+43', label: 'Austria', flag: '🇦🇹', maxLength: 10, format: 'XXX-XXXXXXX' },
  { code: '+41', label: 'Switzerland', flag: '🇨🇭', maxLength: 9, format: 'XX-XXX-XXXX' },
  { code: '+420', label: 'Czech Republic', flag: '🇨🇿', maxLength: 9, format: 'XXX-XXX-XXX' },
  { code: '+421', label: 'Slovakia', flag: '🇸🇰', maxLength: 9, format: 'XXX-XXX-XXX' },
  { code: '+353', label: 'Ireland', flag: '🇮🇪', maxLength: 9, format: 'XX-XXX-XXXX' },
  { code: '+45', label: 'Denmark', flag: '🇩🇰', maxLength: 8, format: 'XX-XX-XX-XX' },
  { code: '+32', label: 'Belgium', flag: '🇧🇪', maxLength: 9, format: 'XXX-XX-XX-XX' },
  { code: '+972', label: 'Israel', flag: '🇮🇱', maxLength: 9, format: 'XX-XXX-XXXX' },
  { code: '+65', label: 'Singapore', flag: '🇸🇬', maxLength: 8, format: 'XXXX-XXXX' },
  { code: '+60', label: 'Malaysia', flag: '🇲🇾', maxLength: 9, format: 'XXX-XXXXXX' },
  { code: '+66', label: 'Thailand', flag: '🇹🇭', maxLength: 9, format: 'XXX-XXX-XXX' },
  { code: '+64', label: 'New Zealand', flag: '🇳🇿', maxLength: 9, format: 'XXX-XXX-XXX' },
  { code: '+20', label: 'Egypt', flag: '🇪🇬', maxLength: 10, format: 'X-XXX-XXX-XXX' },
  { code: '+212', label: 'Morocco', flag: '🇲🇦', maxLength: 9, format: 'XX-XXXX-XXX' },
  { code: '+234', label: 'Nigeria', flag: '🇳🇬', maxLength: 10, format: 'XXX-XXX-XXXX' },
  { code: '+92', label: 'Pakistan', flag: '🇵🇰', maxLength: 10, format: 'XXX-XXXXXXX' },
  { code: '+880', label: 'Bangladesh', flag: '🇧🇩', maxLength: 10, format: 'XXX-XXXXXXX' },
  { code: '+84', label: 'Vietnam', flag: '🇻🇳', maxLength: 9, format: 'XXX-XXX-XXX' },
];

// Sort alphabetically by label
const SORTED_COUNTRIES = [...COUNTRY_LIST].sort((a, b) => a.label.localeCompare(b.label));

const TOPICS = [
  { id: 'concerts', name: 'Concerts & Music', icon: '🎵', color: 'from-purple-500 to-pink-500' },
  { id: 'foodie', name: 'Food & Dining', icon: '🍕', color: 'from-orange-500 to-red-500' },
  { id: 'sports', name: 'Sports & Fitness', icon: '⚽', color: 'from-green-500 to-blue-500' },
  { id: 'art', name: 'Arts & Culture', icon: '🎨', color: 'from-indigo-500 to-purple-500' },
  { id: 'nightlife', name: 'Nightlife', icon: '🍸', color: 'from-pink-500 to-purple-500' },
  { id: 'adventure', name: 'Adventure', icon: '🏔️', color: 'from-green-500 to-teal-500' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: 'from-blue-500 to-indigo-500' },
  { id: 'comedy', name: 'Comedy', icon: '😂', color: 'from-yellow-500 to-orange-500' },
  { id: 'movies', name: 'Movies & Entertainment', icon: '🎬', color: 'from-red-500 to-pink-500' },
  { id: 'wellness', name: 'Wellness & Health', icon: '🧘', color: 'from-green-500 to-emerald-500' },
  { id: 'parks', name: 'Parks & Outdoors', icon: '🌳', color: 'from-green-500 to-teal-500' },
  { id: 'racing', name: 'Racing & Motorsports', icon: '🏎️', color: 'from-red-500 to-orange-500' },
];

export default function Onboarding() {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const [step, setStep] = useState(1);
  const [zipcode, setZipcode] = useState('');
  const [country, setCountry] = useState(SORTED_COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showTopicSuggestion, setShowTopicSuggestion] = useState(false);
  const [suggestedTopic, setSuggestedTopic] = useState('');

  // Geolocation detection
  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`);
            if (response.ok) {
              const data = await response.json();
              setZipcode(data.zipcode || '');
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  // Format phone number for display
  const formatPhoneForDisplay = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '');
    
    // If it starts with country code (e.g., 1 for US), format accordingly
    if (digits.length === 11 && digits.startsWith('1')) {
      // US format: +1 (333) 222-1111
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      // US format without country code: (333) 222-1111
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 10) {
      // International format: +XX XXX XXX XXXX
      const countryCode = digits.slice(0, digits.length - 10);
      const localNumber = digits.slice(digits.length - 10);
      return `+${countryCode} (${localNumber.slice(0, 3)}) ${localNumber.slice(3, 6)}-${localNumber.slice(6)}`;
    }
    
    // Fallback: just add dashes
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  // Step 1: Handle form submission
  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipcode.trim() || !phone.trim()) return;
    
    // Validate phone number
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    
    setPhoneError('');
    setStep(2);
    setShowVerification(true);
  };

  // Step 2: Handle SMS verification
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;
    
    // For demo purposes, accept any code
    setStep(3);
  };

  // Step 3: Handle topic selection
  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId);
    setStep(4);
  };

  // Step 4: Handle topic suggestion
  const handleTopicSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestedTopic.trim()) return;
    
    // Store the suggested topic (no backend integration yet)
    console.log('Suggested topic:', suggestedTopic);
    setShowTopicSuggestion(false);
    setStep(4);
  };

  // Final step: Create plan and redirect to voting
  const handleCreatePlan = async () => {
    try {
      // Clean and format phone number for backend
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('1') && cleanPhone.length === 11 
        ? `+${cleanPhone}` 
        : `+1${cleanPhone}`;

      console.log('🎯 Creating plan with data:', {
        topic: selectedTopic,
        groupSize: 'solo',
        zipCode: zipcode.trim(),
        userName: 'Demo User',
        phoneNumber: formattedPhone
      });

      // Create a real plan
      const response = await fetch('/api/createPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          groupSize: 'solo',
          zipCode: zipcode.trim(),
          userName: 'Demo User',
          phoneNumber: formattedPhone
        })
      });

      console.log('🎯 Plan creation response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🎯 Plan created successfully:', data);
        // Redirect to voting page with real plan ID
        router.push(`/vote/${data.planId}?topic=${selectedTopic}&groupSize=solo&zip=${zipcode.trim()}`);
      } else {
        const errorData = await response.json();
        console.error('🎯 Failed to create plan:', errorData);
        alert('Failed to create plan. Please try again.');
      }
    } catch (error) {
      console.error('🎯 Error creating plan:', error);
      alert('Error creating plan. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Choosy Onboarding</title>
        <meta name="description" content="Get started with Choosy" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-blue-100 to-cyan-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center">
        {/* App name and pitch - only show on first step */}
        {step === 1 && (
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Choosy</h1>
            <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg max-w-xl mx-auto">
              Plan less. Live more.<br />
              From solo hangs to group outings, just swipe to decide.
            </p>
          </div>
        )}
        
        {/* Step 1: ZIP and Phone */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto p-8 bg-white/80 dark:bg-slate-800/80 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-600/20"
          >
            <form onSubmit={handleStart} className="space-y-6">
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  value={zipcode}
                  onChange={e => setZipcode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                  placeholder="ZIP code"
                  className="px-4 py-3 text-lg border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  required
                />
                <div className="w-full max-w-md">
                  <PhoneInput
                    country={'us'}
                    value={phone}
                    onChange={setPhone}
                    enableAreaCodes={true}
                    autoFormat={true}
                    inputProps={{
                      name: 'phone',
                      required: true,
                      autoFocus: false,
                      placeholder: 'Enter phone number'
                    }}
                    containerStyle={{ width: '100%' }}
                    inputStyle={{
                      width: '100%',
                      height: '48px',
                      fontSize: '16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '12px',
                      paddingLeft: '48px'
                    }}
                    buttonStyle={{
                      border: '1px solid #d1d5db',
                      borderRadius: '12px 0 0 12px',
                      backgroundColor: '#f9fafb'
                    }}
                  />
                  {phoneError && <div className="text-red-500 text-sm mt-1">{phoneError}</div>}
                </div>
                <button
                  type="button"
                  onClick={handleGeolocate}
                  className="text-purple-600 dark:text-purple-400 hover:underline text-sm self-end"
                >
                  📍 Use my location
                </button>
              </div>
              <button
                type="submit"
                disabled={!zipcode.trim() || !phone.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Continue
              </button>
            </form>
          </motion.div>
        )}

        {/* Step 2: SMS Verification */}
        {step === 2 && showVerification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto p-8 bg-white/80 dark:bg-slate-800/80 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-600/20"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify Your Phone</h2>
              <p className="text-gray-600 dark:text-gray-300">We sent a code to {formatPhoneForDisplay(phone)}</p>
            </div>
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <input
                type="text"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-center tracking-widest"
                required
                maxLength={6}
              />
              <button
                type="submit"
                disabled={!verificationCode.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Verify
              </button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>💡 Demo mode: Enter any 6-digit code</p>
            </div>
          </motion.div>
        )}

        {/* Step 3: Topic Selection */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto p-8 bg-white/80 dark:bg-slate-800/80 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-600/20"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">What sounds fun?</h2>
              <p className="text-gray-600 dark:text-gray-300">Choose a category to start discovering events</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic.id)}
                  className="p-4 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300 hover:scale-105 bg-white/50 dark:bg-slate-700/50"
                >
                  <div className="text-3xl mb-2">{topic.icon}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{topic.name}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTopicSuggestion(true)}
              className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
            >
              💡 Suggest a topic
            </button>
          </motion.div>
        )}

        {/* Topic Suggestion Modal */}
        {showTopicSuggestion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md mx-4 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Suggest a Topic</h3>
              <form onSubmit={handleTopicSuggestion} className="space-y-4">
                <input
                  type="text"
                  value={suggestedTopic}
                  onChange={e => setSuggestedTopic(e.target.value)}
                  placeholder="Enter your topic idea..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  required
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTopicSuggestion(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Step 4: Create Plan and Redirect */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto p-8 bg-white/80 dark:bg-slate-800/80 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-600/20"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ready to Start!</h2>
              <p className="text-gray-600 dark:text-gray-300">
                You selected: <span className="font-semibold">{TOPICS.find(t => t.id === selectedTopic)?.name}</span>
              </p>
            </div>
            <button
              onClick={handleCreatePlan}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🎮 Start Swiping!
            </button>
          </motion.div>
        )}
      </div>
    </>
  );
} 
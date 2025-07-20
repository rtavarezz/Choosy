import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useDarkMode } from '../lib/darkMode';
import { LoginModal } from '../components/LoginModal';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <Head>
        <title>Choosy - Group Decision Making Made Fun</title>
        <meta name="description" content="Stop the 'I don\'t know, what do you want to do?' loop. Create plans, share links, and let friends swipe to vote on local events." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="relative min-h-screen bg-gradient-to-br from-violet-100 via-blue-100 to-cyan-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col transition-colors duration-300">
        {/* Header */}
        <header className="flex justify-between items-center p-6">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">Choosy</div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-300">Welcome, {user?.name}!</span>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-white/20 dark:bg-slate-700/50 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-slate-600/50 transition-colors"
                >
                  {isDarkMode ? (
                    <span className="text-yellow-400 text-xl">☀️</span>
                  ) : (
                    <span className="text-slate-700 text-xl">🌙</span>
                  )}
                </button>
                <button
                  onClick={logout}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-sm"
                >
                  Logout
                </button>
                <Link 
                  href="/create"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Create Plan
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-white/20 dark:bg-slate-700/50 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-slate-600/50 transition-colors"
                >
                  {isDarkMode ? (
                    <span className="text-yellow-400 text-xl">☀️</span>
                  ) : (
                    <span className="text-slate-700 text-xl">🌙</span>
                  )}
                </button>
                <Link 
                  href="/create"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Try Demo
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Demo Mode Banner */}
        {!isAuthenticated && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mx-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  <strong>Demo Mode:</strong> You're currently in demo mode. 
                  <button 
                    onClick={() => setShowLoginModal(true)}
                    className="underline ml-1 hover:text-yellow-800 dark:hover:text-yellow-200"
                  >
                    Sign in
                  </button> 
                  to access all features including voting, reservations, and personalized recommendations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Stop the 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                "I don't know"
              </span>
              loop
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Turn indecisive friends into decision makers in 15 minutes. 
              Get local recommendations, share the link, and let everyone swipe their way to plans.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {isAuthenticated ? (
                <Link 
                  href="/create"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">→</span>
                  <span>Create Your First Plan</span>
                </Link>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">→</span>
                  <span>Get Started</span>
                </button>
              )}
              
              <Link 
                href="/vote/demo?topic=concerts&groupSize=group&zip=10001"
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-slate-700/90 text-gray-900 dark:text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-white/20 dark:border-slate-600/20 flex items-center justify-center gap-3"
              >
                <span className="text-2xl">👁</span>
                <span>See How It Works</span>
              </Link>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-600/20">
                <div className="text-4xl mb-4 font-bold">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Smart Recommendations</h3>
                <p className="text-gray-600 dark:text-gray-300">Location-based events, restaurants, and activities curated for your group size</p>
              </div>
              
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-600/20">
                <div className="text-4xl mb-4 font-bold">⏰</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">15-Minute Timer</h3>
                <p className="text-gray-600 dark:text-gray-300">Time pressure that forces quick, fun decisions - no more overthinking</p>
              </div>
              
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-600/20">
                <div className="text-4xl mb-4 font-bold">📱</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Swipe to Vote</h3>
                <p className="text-gray-600 dark:text-gray-300">Tinder-style voting that's intuitive and fun for everyone</p>
              </div>
            </div>

            {/* Social proof */}
            <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-slate-600/20">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Perfect For</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4">
                  <div className="text-2xl mb-2 font-bold">🍽️</div>
                  <p className="font-semibold text-gray-900 dark:text-white">Dinner Plans</p>
                </div>
                <div className="p-4">
                  <div className="text-2xl mb-2 font-bold">🎉</div>
                  <p className="font-semibold text-gray-900 dark:text-white">Weekend Activities</p>
                </div>
                <div className="p-4">
                  <div className="text-2xl mb-2 font-bold">👥</div>
                  <p className="font-semibold text-gray-900 dark:text-white">Group Meetups</p>
                </div>
                <div className="p-4">
                  <div className="text-2xl mb-2 font-bold">💕</div>
                  <p className="font-semibold text-gray-900 dark:text-white">Date Nights</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-8 text-gray-600 dark:text-gray-400">
          <p>Built with ❤️ for better group decision making</p>
        </footer>
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
}

/**
 * Choosy Demo Page
 * Copyright (c) 2024 rtavarezz
 * 
 * Demonstrates both single-card and carousel voting interfaces.
 * Licensed under MIT License - see LICENSE file.
 */

import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { BackgroundGradient } from '@/components/BackgroundGradient';
import Head from 'next/head';

const DemoPage: React.FC = () => {
  const router = useRouter();

  const demoEvents = [
    {
      id: '1',
      name: 'Sugar Factory',
      description: 'Experience the best local vibes at Sugar Factory. Perfect for fun activities and memorable moments.',
      image_url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop',
      venue: 'Local Venue',
      price: 'Free',
      rating: 4.0,
      reviewCount: 40,
      category: 'foodie'
    },
    {
      id: '2', 
      name: 'Rooftop Cocktails',
      description: 'Stunning city views with craft cocktails. The perfect spot for a memorable evening with friends.',
      image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=600&fit=crop',
      venue: 'Sky Lounge',
      price: '$25-35',
      rating: 4.5,
      reviewCount: 127,
      category: 'nightlife'
    },
    {
      id: '3',
      name: 'Jazz Night at Blue Note',
      description: 'Live jazz performances in an intimate setting. Featuring local and touring musicians.',
      image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
      venue: 'Blue Note Club',
      price: '$15',
      rating: 4.8,
      reviewCount: 203,
      category: 'concerts'
    },
    {
      id: '4',
      name: 'Sunset Beach Volleyball',
      description: 'Join a friendly beach volleyball game as the sun sets. Equipment provided, all skill levels welcome.',
      image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
      venue: 'Manhattan Beach',
      price: 'Free',
      rating: 4.2,
      reviewCount: 89,
      category: 'sports'
    }
  ];

  // Create a demo plan URL
  const createDemoVoting = async (type: 'single' | 'carousel') => {
    try {
      // Create a demo plan
      const planResponse = await fetch('http://localhost:8000/api/plans/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'nightlife',
          groupSize: '3+',  // Changed from 'friend' to match database constraint
          zipCode: '10001',
          userName: 'Demo User',
          phoneNumber: '+1234567890'
        })
      });

      if (planResponse.ok) {
        const planData = await planResponse.json();
        const planId = planData.plan_id || planData.planId || planData.id;
        
        // Add demo events to the plan
        await fetch(`http://localhost:8000/api/plans/${planId}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(demoEvents)
        });

        // Navigate to the appropriate voting interface
        const url = type === 'carousel' ? `/vote-carousel/${planId}` : `/vote/${planId}`;
        router.push(url);
      } else {
        throw new Error('Failed to create demo plan');
      }
    } catch (error) {
      console.error('Error creating demo:', error);
      alert('Failed to create demo. Make sure the backend is running.');
    }
  };

  return (
    <>
      <Head>
        <title>Choosy Demo - Compare Voting Styles</title>
        <meta name="description" content="Try both single-card and carousel voting interfaces" />
      </Head>

      <div className="min-h-screen relative overflow-hidden">
        <BackgroundGradient />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="max-w-4xl w-full">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-5xl font-bold text-white mb-4">
                Try Our 
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Voting Styles</span>
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Experience our default multi-card carousel and the classic single-card interface.
              </p>
            </motion.div>

            {/* Demo Options */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Carousel Demo - Now Default */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 border-green-400/50"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎬</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Multi-Card Carousel <span className="text-sm bg-green-500 text-white px-2 py-1 rounded-full">Default</span></h3>
                  <p className="text-white/70">
                    Our new default interface. See multiple options at once. Browse and compare while keeping context of what's coming next.
                  </p>
                </div>

                <div className="space-y-3 mb-6 text-white/60">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    3-4 cards visible at once
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Preview upcoming options
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Smooth carousel navigation
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Better context awareness
                  </div>
                </div>

                <button
                  onClick={() => createDemoVoting('carousel')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105"
                >
                  Try Default Style
                </button>
              </motion.div>

              {/* Single Card Demo - Now Alternative */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Classic Single-Card <span className="text-sm bg-blue-500 text-white px-2 py-1 rounded-full">Alternative</span></h3>
                  <p className="text-white/70">
                    The original single-card interface. Focus on one option at a time for a simple, distraction-free experience.
                  </p>
                </div>

                <div className="space-y-3 mb-6 text-white/60">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    One card at a time
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Full attention on current option
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Swipe gestures
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Minimal cognitive load
                  </div>
                </div>

                <button
                  onClick={() => createDemoVoting('single')}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105"
                >
                  Try Classic Style
                </button>
              </motion.div>
            </div>

            {/* Features Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10"
            >
              <h4 className="text-xl font-bold text-white mb-6 text-center">Both Styles Include</h4>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl mb-2">📱</div>
                  <h5 className="font-semibold text-white mb-1">Mobile Optimized</h5>
                  <p className="text-white/60 text-sm">Responsive design that works perfectly on all devices</p>
                </div>
                <div>
                  <div className="text-3xl mb-2">⚡</div>
                  <h5 className="font-semibold text-white mb-1">Real-time Updates</h5>
                  <p className="text-white/60 text-sm">See live voting progress and results as they happen</p>
                </div>
                <div>
                  <div className="text-3xl mb-2">🎨</div>
                  <h5 className="font-semibold text-white mb-1">Beautiful Animations</h5>
                  <p className="text-white/60 text-sm">Smooth transitions and delightful micro-interactions</p>
                </div>
              </div>
            </motion.div>

            {/* Back to Home */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-8"
            >
              <button
                onClick={() => router.push('/')}
                className="text-white/60 hover:text-white transition-colors underline"
              >
                ← Back to Home
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DemoPage;
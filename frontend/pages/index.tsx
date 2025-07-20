import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Choosy - Group Decision Making Made Fun</title>
        <meta name="description" content="Stop the 'I don\'t know, what do you want to do?' loop. Create plans, share links, and let friends swipe to vote on local events." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-blue-100 to-cyan-100 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center p-6">
          <div className="text-2xl font-bold text-gray-900">Choosy</div>
          <Link 
            href="/create"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Stop the 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                "I don't know"
              </span>
              loop
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Turn indecisive friends into decision makers in 15 minutes. 
              Get local recommendations, share the link, and let everyone swipe their way to plans.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                href="/create"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                <span className="text-2xl">→</span>
                <span>Create Your First Plan</span>
              </Link>
              
              <Link 
                href="/vote/demo?topic=concerts&groupSize=group&zip=10001"
                className="bg-white/80 backdrop-blur-sm hover:bg-white/90 text-gray-900 font-semibold py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border border-white/20 flex items-center justify-center gap-3"
              >
                <span className="text-2xl">👁</span>
                <span>See How It Works</span>
              </Link>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-4xl mb-4 font-bold">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Recommendations</h3>
                <p className="text-gray-600">Location-based events, restaurants, and activities curated for your group size</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-4xl mb-4 font-bold">⏰</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">15-Minute Timer</h3>
                <p className="text-gray-600">Time pressure that forces quick, fun decisions - no more overthinking</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-4xl mb-4 font-bold">📱</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Swipe to Vote</h3>
                <p className="text-gray-600">Tinder-style voting that's intuitive and fun for everyone</p>
              </div>
            </div>

            {/* Social proof */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Perfect For</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4">
                  <div className="text-2xl mb-2 font-bold">🍽️</div>
                  <p className="font-semibold text-gray-900">Dinner Plans</p>
                </div>
                <div className="p-4">
                  <div className="text-2xl mb-2 font-bold">🎉</div>
                  <p className="font-semibold text-gray-900">Weekend Activities</p>
                </div>
                <div className="p-4">
                  <div className="text-2xl mb-2 font-bold">👥</div>
                  <p className="font-semibold text-gray-900">Group Meetups</p>
                </div>
                <div className="p-4">
                  <div className="text-2xl mb-2 font-bold">💕</div>
                  <p className="font-semibold text-gray-900">Date Nights</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-8 text-gray-600">
          <p>Built with ❤️ for better group decision making</p>
        </footer>
    </div>
    </>
  );
}

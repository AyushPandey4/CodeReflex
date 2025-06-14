'use client'

import { signInWithGoogle } from '@/lib/supabase'
import { motion } from 'framer-motion'

export default function Home() {
  const handleGoogleLogin = async () => {
    await signInWithGoogle()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
          >
            CodeReflex
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8 text-gray-300"
          >
            Train Smarter. Code Sharper. Crack the Interview.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-2">AI Voice Q&A</h3>
                <p className="text-gray-400">Real-time voice interaction with AI interviewer</p>
              </div>
              <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-2">Live Code Simulation</h3>
                <p className="text-gray-400">Practice coding in a real interview environment</p>
              </div>
              <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-2">Smart Feedback</h3>
                <p className="text-gray-400">Get detailed feedback on your performance</p>
              </div>
        </div>

            <button
              onClick={handleGoogleLogin}
              className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center mx-auto space-x-2"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </motion.div>
        </div>
    </div>
    </main>
  )
}

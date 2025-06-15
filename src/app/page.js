'use client'

import { signInWithGoogle, getCurrentUser, signOut } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, LogOut, ChevronDown, Mic, Camera, Code, FileText, Star, Github, Linkedin, Twitter, Bot } from 'lucide-react'

export default function Home() {
  const [user, setUser] = useState(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getCurrentUser()
      setUser(userData)
    }
    fetchUser()
  }, [])

  const handleGoogleLogin = async () => {
    await signInWithGoogle()
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100" suppressHydrationWarning>
      {/* Header */}
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20"
              >
                <span className="text-white font-bold text-lg">CR</span>
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">CodeReflex</span>
            </div>
            
            {user ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-3 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-slate-300">{user.user_metadata?.full_name || 'User'}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </motion.button>

                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-800/90 backdrop-blur-sm rounded-lg shadow-lg py-1 z-50 border border-slate-700/50"
                  >
                    <div className="px-4 py-2 border-b border-slate-700/50">
                      <p className="text-sm font-medium text-slate-300">{user.user_metadata?.full_name || 'User'}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={() => router.push('/dashboard')}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 flex items-center space-x-2"
                    >
                      <span>Dashboard</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </motion.button>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                className="px-4 py-2 bg-white/10 border border-[#3D8BFF] rounded-xl hover:bg-[#3D8BFF] transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              </motion.button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <h1 className="text-5xl font-bold leading-tight">
                Mock Interviews Reimagined with{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  AI
                </span>
              </h1>
              <p className="text-xl text-slate-400">
                Practice DSA, HR, and Behavioral rounds with real-time voice + facial feedback.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20"
                >
                  <span>🔥 Start Interview</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>Upload Resume</span>
                </motion.button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-video bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4">
                <div className="grid grid-cols-2 gap-4 h-full">
                  {/* Left Column - AI Interviewer */}
                  <div className="space-y-4">
                    {/* AI Avatar */}
                    <div className="h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg p-4 flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 bg-slate-700/50 rounded-full w-3/4 mb-2 animate-pulse"></div>
                        <div className="h-2 bg-slate-700/50 rounded-full w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                    {/* Waveform */}
                    <div className="h-32 bg-slate-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-center h-full space-x-1">
                        {[30, 60, 45, 75, 25, 90, 40, 55, 80, 35, 65, 50, 70, 85, 20, 95, 15, 45, 60, 40].map((height, i) => (
                          <div
                            key={i}
                            className="w-1 bg-indigo-500/50 rounded-full animate-pulse"
                            style={{
                              height: `${height}%`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Right Column - Code Editor */}
                  <div className="space-y-4">
                    {/* Code Editor */}
                    <div className="h-32 bg-slate-900 rounded-lg p-4 font-mono text-sm">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-indigo-400">function <span className="text-yellow-400">solve</span>() {'{'}</div>
                        <div className="text-slate-400 ml-4">// Your solution here...</div>
                        <div className="text-indigo-400">{'}'}</div>
                      </div>
                    </div>
                    {/* Feedback Popup */}
                    <div className="h-32 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                          <span className="text-emerald-400">✓</span>
                        </div>
                        <div>
                          <p className="text-emerald-400 font-medium">Great energy!</p>
                          <p className="text-slate-400 text-sm">Your enthusiasm is showing.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full blur-2xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:ring-2 ring-[#3D8BFF] transition-all">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Voice + Face AI</h3>
              <p className="text-slate-400">Interviews feel human</p>
            </div>
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:ring-2 ring-[#3D8BFF] transition-all">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">DSA + HR + Behav.</h3>
              <p className="text-slate-400">Practice multiple round types</p>
            </div>
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:ring-2 ring-[#3D8BFF] transition-all">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Feedback</h3>
              <p className="text-slate-400">Know your strengths & gaps</p>
            </div>
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:ring-2 ring-[#3D8BFF] transition-all">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Resume Evaluator</h3>
              <p className="text-slate-400">Optimize resume for ATS</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why CodeReflex Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <h3 className="text-xl font-semibold mb-2 flex items-center space-x-2">
                <span className="text-2xl">⚡</span>
                <span>10x Faster Prep</span>
              </h3>
              <p className="text-slate-400">AI doesn't cancel, reschedule, or judge.</p>
            </div>
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <h3 className="text-xl font-semibold mb-2 flex items-center space-x-2">
                <span className="text-2xl">🎯</span>
                <span>Real-time Feedback</span>
              </h3>
              <p className="text-slate-400">Confidence, clarity, composure — tracked.</p>
            </div>
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <h3 className="text-xl font-semibold mb-2 flex items-center space-x-2">
                <span className="text-2xl">🧠</span>
                <span>Product-Based Prep</span>
              </h3>
              <p className="text-slate-400">DSA + HR + Behavioral = Interview complete.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-slate-300 mb-4">"Practicing with CodeReflex helped me reduce anxiety and improve my behavioral answers. Landed my job at a fintech startup!"</p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-indigo-400 font-semibold">AS</span>
                </div>
                <div>
                  <p className="font-medium">Aditi Sharma</p>
                  <p className="text-sm text-slate-400">SDE Intern</p>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-slate-300 mb-4">"Honestly, this is the closest I've felt to a real interview. The face feedback made me realize I frown while answering."</p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-indigo-400 font-semibold">DM</span>
                </div>
                <div>
                  <p className="font-medium">Dev Mehta</p>
                  <p className="text-sm text-slate-400">Final Year Student</p>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-slate-300 mb-4">"Got rejected 3 times before. After using CodeReflex, cracked TCS NQT & a service-based interview!"</p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-indigo-400 font-semibold">PD</span>
                </div>
                <div>
                  <p className="font-medium">Pratik Das</p>
                  <p className="text-sm text-slate-400">Tier-3 College</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* GitHub Button */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.a
            href="https://github.com/AyushPandey4"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-slate-700/50"
          >
            <Github className="w-5 h-5" />
            <span>⭐ Star on GitHub</span>
          </motion.a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800/50 border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">CR</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">CodeReflex</span>
              </div>
              <p className="text-slate-400">Built with ❤️ by Ayush</p>
            </div>
            <div className="flex flex-col md:flex-row md:justify-end space-y-4 md:space-y-0 md:space-x-8">
              <div className="space-y-2">
                <h4 className="font-semibold">About</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-slate-400 hover:text-slate-300">About</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-slate-300">Docs</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-slate-300">Privacy Policy</a></li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Connect</h4>
                <div className="flex space-x-4">
                  <a href="#" className="text-slate-400 hover:text-slate-300">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href="#" className="text-slate-400 hover:text-slate-300">
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

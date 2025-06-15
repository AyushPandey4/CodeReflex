'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser, signOut } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import InterviewFormModal from '@/components/InterviewFormModal'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, Building, Briefcase, Trash2, AlertCircle, User, LogOut, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [interviews, setInterviews] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser()
        if (!userData) {
          router.push('/')
          return
        }
        setUser(userData)
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [router])

  const fetchInterviews = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [user]);

  const handleDeleteInterview = async (interviewId) => {
    try {
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', interviewId);

      if (error) throw error;
      await fetchInterviews();
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Error deleting interview:', error);
      alert('Failed to delete interview. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (level) => {
    const colors = {
      'easy': 'text-green-400',
      'medium': 'text-yellow-400',
      'hard': 'text-red-400'
    };
    return colors[level.toLowerCase()] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500/30"></div>
          </div>
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
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
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-xl border border-slate-700/50"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Welcome back, {user.user_metadata?.full_name || 'User'}!
                </h1>
                <p className="text-slate-400 mt-2">Ready to ace your next interview?</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-indigo-500/20"
              >
                <Briefcase className="w-5 h-5" />
                <span>Start New Interview</span>
              </motion.button>
            </div>
          </motion.div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <Calendar className="w-6 h-6 text-indigo-400" />
              <span>Interview History</span>
            </h2>

            {interviews.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700/50"
              >
                <p className="text-slate-400">No interviews yet. Start your first interview!</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {interviews.map((interview, index) => (
                  <motion.div
                    key={interview.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)" }}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 hover:bg-slate-700/50 transition-all cursor-pointer group border border-slate-700/50"
                    onClick={() => router.push(`/feedback/${interview.id}`)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center space-x-2">
                          <Briefcase className="w-4 h-4 text-indigo-400" />
                          <span>{interview.job_role}</span>
                        </h3>
                        <p className="text-slate-400 text-sm flex items-center space-x-2 mt-1">
                          <Building className="w-4 h-4" />
                          {interview.company_name}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        interview.difficulty_level === 'easy' ? 'bg-emerald-500/20 text-emerald-400' :
                        interview.difficulty_level === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {interview.difficulty_level}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-slate-400 text-sm flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        {formatDate(interview.created_at)}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {interview.interview_type}
                      </p>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmation(interview);
                        }}
                        className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
                        title="Delete Interview"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      <InterviewFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {deleteConfirmation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/90 backdrop-blur-sm p-6 rounded-xl max-w-md w-full mx-4 shadow-xl border border-slate-700/50"
          >
            <div className="flex items-center gap-2 text-red-400 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-xl font-bold">Delete Interview</h3>
            </div>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete your {deleteConfirmation.job_role} interview with {deleteConfirmation.company_name}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDeleteInterview(deleteConfirmation.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
} 
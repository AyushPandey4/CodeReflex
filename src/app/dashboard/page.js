'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser, signOut } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import InterviewFormModal from '@/components/InterviewFormModal'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, Building, Briefcase, Trash2, AlertCircle } from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [interviews, setInterviews] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
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

  const DeleteConfirmationModal = ({ interview, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center gap-2 text-red-400 mb-4">
          <AlertCircle className="h-6 w-6" />
          <h3 className="text-xl font-bold">Delete Interview</h3>
        </div>
        <p className="text-gray-300 mb-6">
          Are you sure you want to delete your {interview.job_role} interview with {interview.company_name}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(interview.id)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold">CodeReflex</span>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Welcome, {user.user_metadata?.full_name || 'User'}!</h1>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Start New Interview
            </button>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Interview History
            </h2>
            
            {interviews.length === 0 ? (
              <div className="text-center py-8 bg-gray-700 rounded-lg">
                <p className="text-gray-400">No interviews yet. Start your first interview!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {interviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <div 
                        className="space-y-2 flex-1 cursor-pointer"
                        onClick={() => router.push(`/feedback/${interview.id}`)}
                      >
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          {interview.job_role}
                        </h3>
                        <p className="text-sm text-gray-300 flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {interview.company_name}
                        </p>
                        <p className="text-sm text-gray-300 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {formatDate(interview.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-medium ${getDifficultyColor(interview.difficulty_level)}`}>
                          {interview.difficulty_level}
                        </span>
                        <span className="text-sm text-gray-400 mb-2">
                          {interview.interview_type}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmation(interview);
                          }}
                          className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-gray-700/50"
                          title="Delete Interview"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <InterviewFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {deleteConfirmation && (
        <DeleteConfirmationModal
          interview={deleteConfirmation}
          onConfirm={handleDeleteInterview}
          onCancel={() => setDeleteConfirmation(null)}
        />
      )}
    </div>
  )
} 
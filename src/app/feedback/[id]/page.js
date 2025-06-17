'use client'

import { useState, useEffect } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CodeEditor } from '@/components/CodeEditor';
import { useToast } from '@/context/ToastContext';
import { 
  CheckCircle, MessageSquare, Code, Download, Copy, Smile, 
  ArrowLeft, Clock, Calendar, Target, User, Building, 
  Star, BarChart2, ChevronDown, ChevronUp, Brain, 
  Video, Award, MessageCircle, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Sticky Header Component
const StickyHeader = ({ onBack, onDownload, onCopy }) => (
  <motion.header 
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="h-6 w-px bg-gray-800"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CR</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              CodeReflex
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDownload}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCopy}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
          >
            <Copy className="h-4 w-4" />
            <span>Copy Feedback</span>
          </motion.button>
        </div>
      </div>
    </div>
  </motion.header>
);

// Interview Metadata Card
const InterviewMetadata = ({ data }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Job Role</p>
              <p className="text-white font-medium">{data.job_role}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Company</p>
              <p className="text-white font-medium">{data.company_name}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Interview Type</p>
              <p className="text-white font-medium">{data.interview_type}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Award className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Difficulty</p>
              <p className="text-white font-medium">{data.difficulty_level}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Duration</p>
              <p className="text-white font-medium">{data.duration} minutes</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Video className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Webcam</p>
              <p className="text-white font-medium">{data.enable_webcam ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-2">Started</p>
            <p className="text-white">{formatDate(data.created_at)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Ended</p>
            <p className="text-white">{formatDate(data.ended_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// AI Feedback Section with Rating
const AiFeedbackSection = ({ feedback }) => {
  if (!feedback) return null;

  // Parse the feedback object if it's a string
  const feedbackData = typeof feedback === 'string' ? JSON.parse(feedback) : feedback;
  const feedbackContent = typeof feedbackData.content === 'string' ? JSON.parse(feedbackData.content) : feedbackData.content;
  const { interview_feedback, emotional_feedback, final_rating, recommendation } = feedbackContent;

  const getRatingColor = (rating) => {
    if (rating >= 7) return 'text-green-400';
    if (rating >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRecommendationColor = (recommendation) => {
    switch(recommendation.toLowerCase()) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'needs improvement': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI Feedback Summary</h2>
          <p className="text-gray-400">Detailed analysis of your performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div className="bg-gray-900/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Overall Rating</span>
              <span className={`text-2xl font-bold ${getRatingColor(final_rating)}`}>
                {final_rating.toFixed(1)}
              </span>
            </div>
            <div className="flex space-x-1">
              {[...Array(10)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(final_rating)
                      ? 'text-yellow-400 fill-current'
                      : i < Math.ceil(final_rating) && i > Math.floor(final_rating)
                      ? 'text-yellow-400 fill-current opacity-50'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Recommendation</span>
              <span className={`text-lg font-medium ${getRecommendationColor(recommendation)}`}>
                {recommendation}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-4">
          <h3 className="text-lg font-medium text-white mb-3">Interview Feedback</h3>
          <p className="text-gray-300 whitespace-pre-wrap">{interview_feedback}</p>
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-4">
        <h3 className="text-lg font-medium text-white mb-3">Emotional Analysis</h3>
        <p className="text-gray-300 whitespace-pre-wrap">{emotional_feedback}</p>
      </div>
    </div>
  );
};

// Emotion Analysis Section with Timeline
const EmotionAnalysisSection = ({ emotionSummary }) => {
  if (!emotionSummary || emotionSummary.length === 0) return null;

  const emotionCounts = emotionSummary.reduce((acc, log) => {
    acc[log.emotion] = (acc[log.emotion] || 0) + 1;
    return acc;
  }, {});
  
  const totalEvents = emotionSummary.length;
  const topEmotion = Object.keys(emotionCounts).reduce((a,b) => emotionCounts[a] > emotionCounts[b] ? a : b);

  const getEmoji = (emotion) => {
    switch(emotion) {
      case 'happy': return '😊';
      case 'neutral': return '😐';
      case 'surprised': return '😮';
      case 'sad': return '😟';
      default: return '😐';
    }
  };

  const getColor = (emotion) => {
    switch(emotion) {
      case 'happy': return 'bg-green-500';
      case 'neutral': return 'bg-blue-500';
      case 'surprised': return 'bg-yellow-500';
      case 'sad': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getInsight = (emotion) => {
    switch(emotion) {
      case 'happy': return "You consistently showed positive engagement and enthusiasm.";
      case 'neutral': return "You maintained a calm, focused, and professional demeanor throughout.";
      case 'surprised': return "You appeared highly engaged and attentive to the questions.";
      case 'sad': return "You seemed a bit concerned at times, but you pushed through.";
      default: return `Your dominant expression was ${emotion}, showing your concentration.`;
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
          <Smile className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Emotion Analysis</h2>
          <p className="text-gray-400">Your emotional journey during the interview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-gray-900/50 rounded-xl p-4">
            <p className="text-gray-300 text-lg mb-4">{getInsight(topEmotion)}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(emotionCounts).map(([emotion, count]) => (
                <div key={emotion} className="bg-gray-700 rounded-full px-4 py-2 text-sm font-medium">
                  <span className="capitalize">{emotion}</span>
                  <span className="ml-2 text-gray-400">{((count / totalEvents) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(emotionCounts).map(([emotion, count]) => (
              <div key={emotion} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getEmoji(emotion)}</span>
                  <span className="text-gray-300 capitalize">{emotion}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getColor(emotion)}`}
                      style={{ width: `${(count / totalEvents) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-400 w-12 text-right">
                    {((count / totalEvents) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-4">
          <h3 className="text-lg font-medium text-white mb-3">Emotion Timeline</h3>
          <div className="flex flex-wrap gap-2">
            {emotionSummary.map((log, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${getColor(log.emotion)}`}
                title={`${log.emotion} at ${new Date(log.timestamp).toLocaleTimeString()}`}
              >
                {getEmoji(log.emotion)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Transcript Section with Chat UI
const TranscriptSection = ({ transcript }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!transcript || transcript.length === 0) return null;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Interview Transcript</h2>
            <p className="text-gray-400">Complete conversation history</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          {isOpen ? (
            <>
              <span>Collapse</span>
              <ChevronUp className="h-5 w-5" />
            </>
          ) : (
            <>
              <span>Expand</span>
              <ChevronDown className="h-5 w-5" />
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
              {transcript.map((item, index) => (
                <motion.div
                  key={`message-${index}-${item.sender}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[80%] ${
                    item.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.sender === 'user' 
                        ? 'bg-indigo-500' 
                        : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                    }`}>
                      {item.sender === 'user' ? (
                        <span className="text-sm font-medium text-white">You</span>
                      ) : (
                        <Brain className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className={`p-4 rounded-2xl ${
                      item.sender === 'user'
                        ? 'bg-indigo-500/20 text-white'
                        : 'bg-gray-700/50 text-white'
                    }`}>
                      <p className="whitespace-pre-wrap">{item.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Code Snippet Section
const CodeSnippetSection = ({ code }) => {
  if (!code) return null;

  // Parse the code if it's a string
  const codeSnippets = typeof code === 'string' ? JSON.parse(code) : code;
  
  if (!Array.isArray(codeSnippets) || codeSnippets.length === 0) return null;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
          <Code className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Code Solutions</h2>
          <p className="text-gray-400">Your submitted code solutions</p>
        </div>
      </div>

      <div className="space-y-6">
        {codeSnippets.map((snippet, index) => (
          <div key={index} className="bg-gray-900/50 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700/50">
              <h3 className="text-lg font-medium text-white mb-2">Question {index + 1}</h3>
              <p className="text-gray-300">{snippet.question}</p>
            </div>
            <div className="p-4">
              <CodeEditor 
                initialCode={snippet.code} 
                onCodeChange={() => {}} 
                readOnly={true}
                language="cpp"
              />
              <div className="mt-2 text-sm text-gray-400">
                Submitted at: {new Date(snippet.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Notes Section Component
const NotesSection = ({ notes, onSave }) => {
  const [noteText, setNoteText] = useState(notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(noteText);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
          <MessageSquare className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Your Notes</h2>
          <p className="text-gray-400">Add your personal notes about this interview</p>
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add your notes here..."
          className="w-full h-32 bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
        />
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              isSaving 
                ? 'bg-gray-700 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white transition-colors`}
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Notes'}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default function FeedbackPage() {
  const { id } = useParams();
  const router = useRouter();
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchInterview = async () => {
      if (!id) {
        setLoading(false);
        setError("No interview ID provided.");
        return;
      }

      try {
        const { data, error } = await supabase
          .from('interviews')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Interview not found');

        setInterviewData(data);
      } catch (err) {
        console.error("Error fetching feedback:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id]);

  const handleDownload = () => {
    // TODO: Implement PDF download
    alert("Download functionality coming soon!");
  };

  const handleCopy = () => {
    if (interviewData?.ai_feedback) {
      navigator.clipboard.writeText(interviewData.ai_feedback)
        .then(() => alert("Feedback copied to clipboard!"))
        .catch(err => alert("Failed to copy feedback."));
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleSaveNotes = async (notes) => {
    try {
      const { error } = await supabase
        .from('interviews')
        .update({ user_notes: notes })
        .eq('id', id);

      if (error) throw error;

      setInterviewData(prev => ({ ...prev, user_notes: notes }));
      addToast('Notes saved successfully!', 'success');
    } catch (err) {
      console.error('Error saving notes:', err);
      addToast('Failed to save notes', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg">Loading your feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    notFound();
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <StickyHeader 
        onBack={handleBack}
        onDownload={handleDownload}
        onCopy={handleCopy}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <InterviewMetadata data={interviewData} />
        <AiFeedbackSection feedback={interviewData?.ai_feedback} />
        <EmotionAnalysisSection emotionSummary={interviewData?.emotion_summary} />
        <TranscriptSection transcript={interviewData?.transcript} />
        <CodeSnippetSection code={interviewData?.code_snippet} />
        <NotesSection 
          notes={interviewData?.user_notes} 
          onSave={handleSaveNotes}
        />
      </main>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 3px;
          transition: all 0.2s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(99, 102, 241, 0.5) rgba(31, 41, 55, 0.3);
        }
      `}</style>
    </div>
  );
} 
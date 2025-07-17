'use client'

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { interviewSchema } from '@/lib/validations/interview';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { motion } from 'framer-motion';
import { Briefcase, FileText, CheckCircle, BrainCircuit } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useCache } from '@/context/CacheContext';
import { getUserCredits, deductUserCredits } from '@/lib/credits';

const personaPrompts = {
  "Friendly Dev": "Act as a friendly senior developer, encouraging and helpful.",
  "Strict HR": "Act as a strict corporate HR with high standards. Be brief and to the point.",
  "Calm Manager": "Act as a calm and patient engineering manager. Focus on soft skills.",
  "Fast-Paced Tech Lead": "Act as a tech lead in a fast-paced environment. Be direct, technical, and focus on problem-solving speed."
};

export default function InterviewFormModal({ isOpen, onClose }) {
  const { user } = useCache(); 
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const router = useRouter();
  const { voices } = useTextToSpeech();
  const [selectedVoice, setSelectedVoice] = useState('');
  const { addToast } = useToast();

  // Fetch user's credits when the modal is opened
  useEffect(() => {
    const fetchCredits = async () => {
      if (user) {
        const userCredits = await getUserCredits(user.id);
        setCredits(userCredits === null ? 0 : userCredits);
      }
    };
    if (isOpen) {
      fetchCredits();
    }
  }, [user, isOpen]);

  useEffect(() => {
    const savedVoice = localStorage.getItem('interviewer_voice_uri');
    if (savedVoice) {
      setSelectedVoice(savedVoice);
    } else if (voices.length > 0) {
      const defaultVoice = voices.find(v => v.lang === 'en-US') || voices[0];
      setSelectedVoice(defaultVoice.voiceURI);
    }
  }, [voices]);

  const handleVoiceChange = (event) => {
    const voiceURI = event.target.value;
    setSelectedVoice(voiceURI);
    localStorage.setItem('interviewer_voice_uri', voiceURI);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      enableWebcam: false,
    },
  });

  const extractTextFromPDF = async (file) => {
    try {
      if (file.type !== 'application/pdf') {
        throw new Error('Please upload a PDF file');
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size should be less than 10MB');
      }
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Server error:', data);
        throw new Error(data.details || data.error || 'Failed to extract text from PDF');
      }
      if (!data.text) {
        throw new Error('No text could be extracted from the PDF');
      }
      return data.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw error;
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsExtracting(true);
      setResumeFileName(file.name);
      const extractedText = await extractTextFromPDF(file);
      if (!extractedText.trim()) {
        throw new Error('The PDF appears to be empty or unreadable');
      }
      const storageKey = `resume_${Date.now()}`;
      localStorage.setItem(storageKey, extractedText);
      setResumeText(storageKey);
      addToast('Resume uploaded successfully!', 'success');
    } catch (error) {
      console.error('Error processing resume:', error);
      addToast(error.message || 'Failed to process resume. Please try again.', 'error');
      setResumeText('');
      setResumeFileName('');
    } finally {
      setIsExtracting(false);
    }
  };

  const onSubmit = async (data) => {
    if (!user) {
      addToast('You must be logged in to start an interview.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const currentCredits = await getUserCredits(user.id);
      if (currentCredits < 1) {
        addToast("You don't have enough credits for a new interview. You get 3 free credits daily.", 'error');
        onClose();
        return;
      }

      await deductUserCredits(user.id, 1);
    
      setCredits(prev => Math.max(0, prev - 1)); 

      const storedResumeText = resumeText ? localStorage.getItem(resumeText) : '';
      const interviewData = {
        user_id: user.id,
        job_role: data.jobRole,
        company_name: data.companyName,
        interview_type: data.interviewType,
        difficulty_level: data.difficultyLevel,
        duration: data.duration,
        job_description: data.jobDescription,
        interviewer_personality: data.interviewerPersonality,
        enable_webcam: data.enableWebcam,
        custom_focus_areas: data.customFocusAreas ? data.customFocusAreas.split(',').map(area => area.trim()) : [],
        resume_text: storedResumeText,
        created_at: new Date().toISOString()
      };
      
      const storageKey = `interview_${Date.now()}`;
      const localStorageData = {
        job_role: data.jobRole,
        company_name: data.companyName,
        interview_type: data.interviewType,
        difficulty_level: data.difficultyLevel,
        duration: data.duration,
        job_description: data.jobDescription,
        interviewer_personality: data.interviewerPersonality,
        enable_webcam: data.enableWebcam,
        custom_focus_areas: data.customFocusAreas ? data.customFocusAreas.split(',').map(area => area.trim()) : [],
        resume_storage_key: resumeText,
        file_name: resumeFileName
      };
      localStorage.setItem(storageKey, JSON.stringify(localStorageData));
      
      const { data: interview, error } = await supabase
        .from('interviews')
        .insert([interviewData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      reset();
      onClose();
      router.push(`/interview/${interview.id}`);

    } catch (error) {
      console.error('Error creating interview:', error);
      addToast(error.message || 'Failed to create interview. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800/90 backdrop-blur-sm rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50 shadow-xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:bg-slate-600/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-500/50"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20"
              >
                <Briefcase className="w-5 h-5 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Start New Interview</h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              ✕
            </motion.button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Resume Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Resume</span>
              </h3>
              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition-colors">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Upload Resume (PDF)
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeUpload}
                      className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-colors"
                    />
                  </div>
                  {isExtracting && (
                    <div className="flex items-center space-x-2 text-indigo-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500"></div>
                      <p className="text-sm">Extracting text from PDF...</p>
                    </div>
                  )}
                  {resumeFileName && !isExtracting && (
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <p className="text-sm">{resumeFileName}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Job Info Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <span>Job Information</span>
              </h3>
              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Job Role
                    </label>
                    <input
                      {...register('jobRole')}
                      className="w-full px-3 py-2 bg-slate-800 rounded-lg text-white border border-slate-600/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      placeholder="e.g., Backend Developer"
                    />
                    {errors.jobRole && (
                      <p className="mt-1 text-sm text-red-400">{errors.jobRole.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company Name
                    </label>
                    <input
                      {...register('companyName')}
                      className="w-full px-3 py-2 bg-slate-800 rounded-lg text-white border border-slate-600/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      placeholder="e.g., Google"
                    />
                    {errors.companyName && (
                      <p className="mt-1 text-sm text-red-400">{errors.companyName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Interview Type
                    </label>
                    <select
                      {...register('interviewType')}
                      className="w-full px-3 py-2 bg-slate-800 rounded-lg text-white border border-slate-600/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    >
                      <option value="">Select type</option>
                      <option value="DSA">DSA</option>
                      <option value="HR">HR</option>
                      <option value="Behavioral">Behavioral</option>
                      <option value="System Design">System Design</option>
                      <option value="Full Stack">Full Stack</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                    {errors.interviewType && (
                      <p className="mt-1 text-sm text-red-400">{errors.interviewType.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      {...register('difficultyLevel')}
                      className="w-full px-3 py-2 bg-slate-800 rounded-lg text-white border border-slate-600/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    >
                      <option value="">Select level</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                    {errors.difficultyLevel && (
                      <p className="mt-1 text-sm text-red-400">{errors.difficultyLevel.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      {...register('duration', { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-slate-800 rounded-lg text-white border border-slate-600/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      min="5"
                      max="60"
                    />
                    {errors.duration && (
                      <p className="mt-1 text-sm text-red-400">{errors.duration.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Interviewer Personality
                    </label>
                    <select
                      {...register('interviewerPersonality')}
                      className="w-full px-3 py-2 bg-slate-800 rounded-lg text-white border border-slate-600/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    >
                      <option value="">Select personality</option>
                      {Object.keys(personaPrompts).map((persona) => (
                        <option key={persona} value={persona}>{persona}</option>
                      ))}
                    </select>
                    {errors.interviewerPersonality && (
                      <p className="mt-1 text-sm text-red-400">{errors.interviewerPersonality.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Interviewer Voice Accent
                    </label>
                    <select
                      value={selectedVoice}
                      onChange={handleVoiceChange}
                      className="w-full px-3 py-2 bg-slate-800 rounded-lg text-white border border-slate-600/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      disabled={voices.length === 0}
                    >
                      {voices.length > 0 ? (
                        voices.map((voice) => (
                          <option key={voice.voiceURI} value={voice.voiceURI}>
                            {`${voice.name} (${voice.lang})`}
                          </option>
                        ))
                      ) : (
                        <option value="">Loading voices...</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Job Description (Optional)
                  </label>
                  <textarea
                    {...register('jobDescription')}
                    className="w-full px-3 py-2 bg-slate-800 rounded-lg text-white border border-slate-600/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    rows="3"
                    placeholder="Paste job description here..."
                  />
                </div>
              </div>
            </motion.div>

            {/* AI Settings Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                <span>AI Settings</span>
              </h3>
              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50 hover:border-slate-500/50 transition-colors">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Custom Focus Areas (Optional)
                  </label>
                  <input
                    {...register('customFocusAreas')}
                    className="w-full px-3 py-2 bg-slate-800 rounded-lg text-white border border-slate-600/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder="e.g., OOP, DBMS, React, Graph Algorithms"
                  />
                </div>

                <div className="mt-4">
                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      {...register('enableWebcam')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 group-hover:bg-slate-600/50"></div>
                    <span className="ml-3 text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      Enable Webcam for Emotion Detection
                    </span>
                  </label>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-end space-x-4 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Start Interview'
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { interviewSchema } from '@/lib/validations/interview'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'

const personaPrompts = {
  "Friendly Dev": "Act as a friendly senior developer, encouraging and helpful.",
  "Strict HR": "Act as a strict corporate HR with high standards. Be brief and to the point.",
  "Calm Manager": "Act as a calm and patient engineering manager. Focus on soft skills.",
  "Fast-Paced Tech Lead": "Act as a tech lead in a fast-paced environment. Be direct, technical, and focus on problem-solving speed."
};

export default function InterviewFormModal({ isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [resumeFileName, setResumeFileName] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const router = useRouter()
  const { voices } = useTextToSpeech();
  const [selectedVoice, setSelectedVoice] = useState('');

  useEffect(() => {
    const savedVoice = localStorage.getItem('interviewer_voice_uri');
    if (savedVoice) {
      setSelectedVoice(savedVoice);
    } else if (voices.length > 0) {
      // Set a default voice if none is saved
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
  })

  const extractTextFromPDF = async (file) => {
    try {
      // Validate file type
      if (file.type !== 'application/pdf') {
        throw new Error('Please upload a PDF file')
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size should be less than 10MB')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Server error:', data)
        throw new Error(data.details || data.error || 'Failed to extract text from PDF')
      }

      if (!data.text) {
        throw new Error('No text could be extracted from the PDF')
      }

      // Log successful extraction
      console.log('PDF processed successfully:', {
        pages: data.info?.pages,
        textLength: data.text.length,
        metadata: data.info?.metadata
      })

      return data.text
    } catch (error) {
      console.error('Error extracting text from PDF:', error)
      throw error
    }
  }

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setIsExtracting(true)
      setResumeFileName(file.name)

      // Extract text from PDF
      const extractedText = await extractTextFromPDF(file)
      
      if (!extractedText.trim()) {
        throw new Error('The PDF appears to be empty or unreadable')
      }
      
      // Store in localStorage with a unique key
      const storageKey = `resume_${Date.now()}`
      localStorage.setItem(storageKey, extractedText)
      
      // Store the storage key for later use
      setResumeText(storageKey)
      
      // Show success message with page count
      alert('Resume uploaded and processed successfully!')
    } catch (error) {
      console.error('Error processing resume:', error)
      alert(error.message || 'Failed to process resume. Please try again.')
      setResumeText('')
      setResumeFileName('')
    } finally {
      setIsExtracting(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('No user found')

      // Get resume text from localStorage
      const storedResumeText = resumeText ? localStorage.getItem(resumeText) : ''

      // Create interview data object
      const interviewData = {
        user_id: user.id,
        job_role: data.jobRole,
        company_name: data.companyName,
        interview_type: data.interviewType,
        difficulty_level: data.difficultyLevel,
        duration: data.duration,
        job_description: data.jobDescription,
        interviewer_personality: personaPrompts[data.interviewerPersonality] || data.interviewerPersonality,
        enable_webcam: data.enableWebcam,
        custom_focus_areas: data.customFocusAreas ? data.customFocusAreas.split(',').map(area => area.trim()) : [],
        resume_text: storedResumeText,
        created_at: new Date().toISOString()
      }

      // Save to localStorage with timestamp as key
      const storageKey = `interview_${Date.now()}`
      localStorage.setItem(storageKey, JSON.stringify({
        ...interviewData,
        resume_storage_key: resumeText, // Store reference to resume text
        file_name: resumeFileName
      }))

      // Create interview record in Supabase
      const { data: interview, error } = await supabase
        .from('interviews')
        .insert([interviewData])
        .select()
        .single()

      if (error) throw error

      // Reset form and close modal
      reset()
      onClose()

      // Redirect to interview page
      router.push(`/interview/${interview.id}`)
    } catch (error) {
      console.error('Error creating interview:', error)
      alert('Failed to create interview. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Start New Interview</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Resume Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Resume</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Resume (PDF)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    className="w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  {isExtracting && (
                    <p className="text-sm text-blue-400">Extracting text from PDF...</p>
                  )}
                  {resumeFileName && !isExtracting && (
                    <p className="text-sm text-green-400">✓ {resumeFileName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Job Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Job Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Job Role
                  </label>
                  <input
                    {...register('jobRole')}
                    className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                    placeholder="e.g., Backend Developer"
                  />
                  {errors.jobRole && (
                    <p className="mt-1 text-sm text-red-500">{errors.jobRole.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Name
                  </label>
                  <input
                    {...register('companyName')}
                    className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                    placeholder="e.g., Google"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-500">{errors.companyName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Interview Type
                  </label>
                  <select
                    {...register('interviewType')}
                    className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
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
                    <p className="mt-1 text-sm text-red-500">{errors.interviewType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    {...register('difficultyLevel')}
                    className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                  >
                    <option value="">Select level</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  {errors.difficultyLevel && (
                    <p className="mt-1 text-sm text-red-500">{errors.difficultyLevel.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    {...register('duration', { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                    min="5"
                    max="60"
                  />
                  {errors.duration && (
                    <p className="mt-1 text-sm text-red-500">{errors.duration.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Interviewer Personality
                  </label>
                  <select
                    {...register('interviewerPersonality')}
                    className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                  >
                    <option value="">Select personality</option>
                    {Object.keys(personaPrompts).map((persona) => (
                      <option key={persona} value={persona}>{persona}</option>
                    ))}
                  </select>
                  {errors.interviewerPersonality && (
                    <p className="mt-1 text-sm text-red-500">{errors.interviewerPersonality.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Interviewer Voice Accent
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={handleVoiceChange}
                    className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Description (Optional)
                </label>
                <textarea
                  {...register('jobDescription')}
                  className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                  rows="3"
                  placeholder="Paste job description here..."
                />
              </div>
            </div>

            {/* AI Settings Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">AI Settings</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Focus Areas (Optional)
                </label>
                <input
                  {...register('customFocusAreas')}
                  className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                  placeholder="e.g., OOP, DBMS, React, Graph Algorithms"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('enableWebcam')}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-300">
                  Enable Webcam for Emotion Detection
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Start Interview'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
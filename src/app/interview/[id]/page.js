'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { notFound, useParams, useRouter } from 'next/navigation'
import { Mic, Video, VideoOff, BrainCircuit } from 'lucide-react'
import { Timer } from '@/components/Timer'
import { useSpeechToText } from '@/hooks/useSpeechToText'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import { UserTranscriptArea } from '@/components/UserTranscriptArea'
import { InterviewerChatArea } from '@/components/InterviewerChatArea'
import { CodeEditor } from '@/components/CodeEditor'
import FacialFeedback from '@/components/FacialFeedback'

// Placeholder components - we will build these out next
const PermissionsPrompt = ({ onPermissionsGranted, isCameraEnabled, requestCamera, setRequestCamera }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50">
    <div className="bg-gray-800 p-8 rounded-lg shadow-2xl text-center max-w-md w-full">
      <h2 className="text-2xl font-bold text-white mb-4">Ready for your interview?</h2>
      <p className="text-gray-300 mb-6">
        We need microphone access to hear your responses. Camera access is optional but recommended for emotion feedback.
      </p>
      
      {isCameraEnabled && (
        <div className="flex items-center justify-center space-x-4 mb-6">
          <p className="text-gray-300">Camera for feedback:</p>
          <button 
            onClick={() => setRequestCamera(!requestCamera)}
            className={`p-2 rounded-full transition-colors ${requestCamera ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            <Video className="h-5 w-5" />
          </button>
        </div>
      )}

      <button 
        onClick={onPermissionsGranted} 
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full flex items-center justify-center"
      >
        <Mic className="h-5 w-5 mr-2" />
        Grant Permissions & Start
      </button>
    </div>
  </div>
);

const SubmissionOverlay = ({ feedback }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-50 p-4">
    <BrainCircuit className="h-16 w-16 text-blue-500 mb-6 animate-pulse" />
    <h2 className="text-3xl font-bold text-white mb-4">Generating Your Feedback...</h2>
    <p className="text-gray-300 text-lg text-center max-w-2xl">
      {feedback}
    </p>
  </div>
);

export default function InterviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [requestCamera, setRequestCamera] = useState(true)
  
  const [conversationLog, setConversationLog] = useState([])
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [code, setCode] = useState('// Your code here...');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState('Gathering your responses...');
  const lastSpokenTextRef = useRef(null);
  const [emotionLog, setEmotionLog] = useState([]);
  const [videoStream, setVideoStream] = useState(null);

  const { isListening, transcript: userSpeech, startListening, stopListening, setTranscript: setUserSpeech } = useSpeechToText()
  const { speak, cancel: cancelSpeech, isSpeaking } = useTextToSpeech();
  const [voiceURI, setVoiceURI] = useState('');

  useEffect(() => {
    const savedVoice = localStorage.getItem('interviewer_voice_uri');
    if (savedVoice) {
      setVoiceURI(savedVoice);
    }
  }, []);

  useEffect(() => {
    const fetchInterview = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('interviews')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        if (!data) throw new Error('Interview not found')
        
        setInterview(data)
      } catch (err) {
        console.error('Error fetching interview:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchInterview()
  }, [id])

  // This is now a regular function, not a useCallback, to ensure it never has stale state.
  const getAiResponse = async (currentConversation) => {
    // Stronger guard clause to ensure all necessary data is loaded.
    if (!interview || !interview.job_role || !interview.interviewer_personality) {
      console.error("getAiResponse called before interview data was fully loaded.");
      return;
    }
    
    setIsAiTyping(true);

    const conversationHistory = currentConversation
      .map(msg => {
        let history = `${msg.sender === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.text}`;
        if (msg.code) {
          history += `\n\`\`\`javascript\n${msg.code}\n\`\`\``;
        }
        return history;
      })
      .join('\n\n');
      
    const lastMessage = currentConversation[currentConversation.length - 1];
    const isCodeSubmission = lastMessage?.sender === 'user' && lastMessage?.code;

    const systemPrompt = `You are a professional technical interviewer for CodeReflex.
Your persona: "${interview.interviewer_personality}"
The interview is for a ${interview.job_role} role at ${interview.company_name} (${interview.difficulty_level} difficulty).

**Your Core Rules:**
1.  **You are the INTERVIEWER, not the solver.** Your one and only job is to ask questions and evaluate the user's responses.
2.  **NEVER provide the solution** to a coding problem before the user has attempted it.
3.  You **MUST ALWAYS** reply in a single JSON object with two keys: "text" (your spoken response) and "code" (a string for the code editor, or null).

**JSON Response Rules:**
-   **"text"**: Your conversational part. What you would say out loud.
-   **"code"**: ONLY for providing the problem statement or starter code.
    -   **Good Example (Problem Setup):** \`{"text": "Let's start with a coding challenge. Can you implement this function?", "code": "/**\\n * Given an array of integers, return indices of the two numbers such that they add up to a specific target.\\n * @param {number[]} nums\\n * @param {number} target\\n * @return {number[]}\\n */\\nfunction twoSum(nums, target) {\\n  // Your code here...\\n}"}\`
    -   **Bad Example (Providing Solution):** \`{"text": "Here is how you do it.", "code": "function twoSum(nums, target) { let map = new Map(); for(let i=0; i<nums.length; i++) { /* ...solution logic... */ } }"}\`

---
**Conversation Context:**
${conversationHistory ? `Conversation History:\\n${conversationHistory}` : 'This is the beginning of the interview.'}
---

**Your Current Task:**
${isCodeSubmission
  ? `The user has just submitted their code. Your task is to **EVALUATE** it.
   - In your "text" response, provide feedback on their solution. Discuss its correctness, efficiency (time/space complexity), and style.
   - Ask a relevant follow-up question about their code.
   - Set the "code" field to null. **DO NOT** provide a corrected or alternative solution in the code block.`
  : `Your task is to ask the **NEXT** interview question.
   - If it is a behavioral or theoretical question, set the "code" field to null.
   - If it is a coding question, set the "text" field to introduce the problem and set the "code" field to the problem statement and function signature, as shown in the examples. **DO NOT** include the solution logic.`
}`;

    const apiMessages = currentConversation.map(msg => ({
      role: msg.sender === 'ai' ? 'assistant' : 'user',
      content: msg.text
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [
            { role: 'system', content: systemPrompt },
            ...apiMessages
          ] 
        }),
      });

      if (!response.ok) {
        // Log the server's error response for better debugging
        const errorBody = await response.json();
        console.error("Server responded with an error:", errorBody);
        throw new Error(`AI response failed: ${errorBody.error || response.statusText}`);
      }
      
      const aiMessage = await response.json();
      // It's possible the model doesn't respect the JSON format perfectly.
      try {
        const aiContent = typeof aiMessage.content === 'string' ? JSON.parse(aiMessage.content) : aiMessage.content;
        
        setConversationLog(prev => [...prev, {
          sender: 'ai',
          text: aiContent.text,
          code: aiContent.code || null,
        }]);

        if (aiContent.code) {
          setCode(aiContent.code);
        }
      } catch (parseError) {
          console.error("Failed to parse AI response as JSON:", aiMessage.content);
          // Handle non-JSON response from AI
          setConversationLog(prev => [...prev, { sender: 'ai', text: aiMessage.content, code: null }]);
      }
    } catch (err) {
      console.error('Error fetching AI response:', err);
      setConversationLog(prev => [...prev, { sender: 'ai', text: "I'm sorry, I encountered an error. Could you please repeat that?" }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Kicks off the interview once permissions are granted
  useEffect(() => {
    if (permissionsGranted && interview && conversationLog.length === 0) {
      getAiResponse([]);
    }
  }, [permissionsGranted, interview, conversationLog.length]);

  // This hook now reliably speaks only new AI messages and is immune to re-render loops.
  useEffect(() => {
    if (conversationLog.length === 0) return;

    const lastMessage = conversationLog[conversationLog.length - 1];

    // 1. Only act on messages from the AI.
    if (lastMessage.sender !== 'ai') return;

    // 2. If this is the same text we were last told to speak, do nothing. This prevents the loop.
    if (lastMessage.text === lastSpokenTextRef.current) return;

    // 3. If we're here, it's a new message. Cancel any prior speech.
    cancelSpeech();

    // 4. Update our reference to the new text and speak it.
    lastSpokenTextRef.current = lastMessage.text;
    speak(lastMessage.text, { voiceURI });

  }, [conversationLog, speak, cancelSpeech, voiceURI]); // Note: isSpeaking is NOT in the dependency array.

  // Processes the user's spoken response
  useEffect(() => {
    if (userSpeech && !isListening) {
      const lastMessage = conversationLog[conversationLog.length - 1];
      // Make sure we don't double-add user messages
      if (lastMessage && lastMessage.sender === 'ai') {
        setConversationLog(prev => [...prev, { sender: 'user', text: userSpeech }]);
        setUserSpeech('');
      }
    }
  }, [userSpeech, isListening, conversationLog, setUserSpeech]);

  // Triggers the AI response after user speaks OR code is submitted
  useEffect(() => {
    if (conversationLog.length > 0) {
      const lastMessage = conversationLog[conversationLog.length - 1];
      if (lastMessage.sender === 'user') {
        getAiResponse(conversationLog);
      }
    }
  }, [conversationLog, interview]); // Now also triggers on code submission

  const handlePermissionsGranted = async () => {
    try {
      const constraints = {
        audio: true,
        video: interview.enable_webcam && requestCamera
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (constraints.video) {
        setVideoStream(stream);
      } else {
        // If video is not enabled for the interview, stop the video track immediately.
        stream.getVideoTracks().forEach(track => track.stop());
      }
      
      console.log('Permissions granted successfully!');
      setPermissionsGranted(true);
    } catch (err) {
      alert('You must grant at least microphone access to continue.');
      console.error('Permission error:', err);
    }
  };

  const handleEmotionLogUpdate = useCallback((newLog) => {
    setEmotionLog(prev => [...prev, newLog]);
  }, []);

  const handleSubmitInterview = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // Stop any active listening or speaking
    if (isListening) {
      stopListening();
    }
    cancelSpeech();
    
    try {
      // 1. Gather all data
      setSubmissionFeedback('Analyzing your interview transcript...');
      const finalTranscript = conversationLog;
      
      // 2. Get Final AI Feedback
      setSubmissionFeedback('Asking the AI for overall feedback...');
      const feedbackPrompt = `The interview has now concluded. Based on the entire transcript, please provide overall feedback for the candidate. Address their strengths and weaknesses in communication, technical knowledge (if applicable), and problem-solving. Keep the feedback constructive and encouraging. Here is the transcript:\n\n${JSON.stringify(finalTranscript)}`;
      
      const apiMessages = conversationLog.map(msg => ({
        role: msg.sender === 'ai' ? 'assistant' : 'user',
        content: msg.text
      }));

      const feedbackMessages = [...apiMessages, { role: 'system', content: feedbackPrompt }];
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: feedbackMessages }),
      });
      if (!response.ok) throw new Error('Failed to get final AI feedback.');
      
      const finalAiMessage = await response.json();
      const finalAiFeedback = finalAiMessage.content;

      // 3. Update Supabase
      setSubmissionFeedback('Saving your results to the database...');
      const { error: updateError } = await supabase
        .from('interviews')
        .update({
          transcript: finalTranscript,
          code_snippet: code,
          emotion_summary: emotionLog,
          ai_feedback: finalAiFeedback,
          ended_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // 4. Redirect
      setSubmissionFeedback('All done! Redirecting to your results...');
      router.push(`/feedback/${id}`);

    } catch (err) {
      console.error('Error during submission:', err);
      alert('There was an error submitting your interview. Please try again.');
      setIsSubmitting(false);
    }
  }, [isSubmitting, isListening, stopListening, conversationLog, code, id, router, cancelSpeech, emotionLog]);

  const handleTimeUp = useCallback(() => {
    handleSubmitInterview();
  }, [handleSubmitInterview]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  const handleSubmitCode = (submittedCode) => {
    if (isListening) {
      stopListening();
    }
    const newConversationLog = [...conversationLog, {
      sender: 'user',
      text: 'I have finished writing my code. Here is my solution.',
      code: submittedCode,
    }];
    setConversationLog(newConversationLog);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading interview...</div>
  }

  if (error) {
    notFound(); // Redirect to a 404 page if interview is not found or an error occurs
  }
  
  const messagesForChat = conversationLog.map(msg => ({
    role: msg.sender === 'ai' ? 'assistant' : 'user',
    content: msg.text
  }));

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
      {isSubmitting && <SubmissionOverlay feedback={submissionFeedback} />}
      {!permissionsGranted && interview && (
        <PermissionsPrompt 
          onPermissionsGranted={handlePermissionsGranted}
          isCameraEnabled={interview.enable_webcam}
          requestCamera={requestCamera}
          setRequestCamera={setRequestCamera}
        />
      )}
      
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-gray-800 p-4 rounded-lg">
          <div>
            <h1 className="text-2xl font-bold">{interview.job_role} Interview</h1>
            <p className="text-gray-400">with {interview.company_name}</p>
          </div>
          <div className="flex items-center space-x-4">
            {permissionsGranted && <Timer duration={interview.duration} onTimeUp={handleTimeUp} />}
            <button onClick={handleSubmitInterview} className="bg-green-600 px-6 py-2 rounded-lg hover:bg-green-700">Submit Interview</button>
          </div>
        </header>

        {permissionsGranted && (
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <InterviewerChatArea messages={messagesForChat} isAiTyping={isAiTyping} />
              <UserTranscriptArea 
                isListening={isListening}
                transcript={userSpeech}
                startListening={startListening}
                stopListening={stopListening}
              />
              <CodeEditor 
                initialCode={code} 
                onCodeChange={handleCodeChange} 
                onSubmitCode={handleSubmitCode}
              />
            </div>
            <aside className="space-y-6">
              {interview.enable_webcam && videoStream && permissionsGranted && (
                <FacialFeedback 
                  stream={videoStream} 
                  onEmotionLogUpdate={handleEmotionLogUpdate} 
                  isInterviewActive={permissionsGranted} 
                />
              )}
            </aside>
          </main>
        )}
      </div>
    </div>
  )
} 
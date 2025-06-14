'use client'

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CodeEditor } from '@/components/CodeEditor';
import { CheckCircle, MessageSquare, Code, Download, Copy, Smile } from 'lucide-react';

const AiFeedbackSection = ({ feedback }) => {
  if (!feedback) return null;

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Final AI Feedback</h2>
      <div className="text-gray-300 space-y-4 whitespace-pre-wrap">{feedback}</div>
    </div>
  )
};

const EmotionAnalysisSection = ({ emotionSummary }) => {
  if (!emotionSummary || emotionSummary.length === 0) return null;

  const emotionCounts = emotionSummary.reduce((acc, log) => {
      acc[log.emotion] = (acc[log.emotion] || 0) + 1;
      return acc;
  }, {});
  
  const totalEvents = emotionSummary.length;
  const topEmotion = Object.keys(emotionCounts).reduce((a,b) => emotionCounts[a] > emotionCounts[b] ? a : b);

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
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
        <Smile className="h-6 w-6" />
        Facial Expression Summary
      </h2>
      <p className="text-gray-300 text-lg mb-4">{getInsight(topEmotion)}</p>
      <div className="flex flex-wrap gap-4">
        {Object.entries(emotionCounts).map(([emotion, count]) => (
          <div key={emotion} className="bg-gray-700 rounded-full px-4 py-2 text-sm font-medium">
            <span className="capitalize">{emotion}</span>
            <span className="ml-2 text-gray-400">{((count / totalEvents) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TranscriptSection = ({ transcript }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!transcript || transcript.length === 0) return null;

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left">
        <h2 className="text-2xl font-bold text-white flex justify-between items-center">
          Full Transcript
          <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </h2>
      </button>
      {isOpen && (
        <div className="mt-4 space-y-4 max-h-96 overflow-y-auto pr-4">
          {transcript.map((item, index) => (
            <div key={index} className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg max-w-lg ${item.sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <p className="font-bold capitalize text-white">{item.sender === 'ai' ? 'Interviewer' : 'You'}</p>
                <p className="text-white">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CodeSnippetSection = ({ code }) => {
  if (!code || code.trim() === '' || code.trim() === '// Your code here...') return null;

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Code Snippet</h2>
      <CodeEditor initialCode={code} onCodeChange={() => {}} readOnly={true} />
    </div>
  )
};

export default function FeedbackPage() {
  const { id } = useParams();
  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInterview = async () => {
      if (!id) {
        setLoading(false);
        setError("No interview ID provided.");
        return;
      };

      try {
        const { data, error } = await supabase
          .from('interviews')
          .select('ai_feedback, transcript, code_snippet, emotion_summary')
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
    alert("Download functionality not yet implemented.");
  };

  const handleCopy = () => {
    if (interviewData?.ai_feedback) {
      navigator.clipboard.writeText(interviewData.ai_feedback)
        .then(() => alert("Feedback copied to clipboard!"))
        .catch(err => alert("Failed to copy feedback."));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Loading feedback...</div>;
  }

  if (error) {
    notFound();
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold">Thank You! Interview Completed.</h1>
          <p className="text-gray-400 mt-2">Here is a detailed breakdown of your performance.</p>
        </header>

        <div className="flex justify-center space-x-4">
          <button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </button>
          <button onClick={handleCopy} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded inline-flex items-center">
            <Copy className="mr-2 h-4 w-4" />
            Copy Feedback
          </button>
        </div>

        <main className="space-y-6">
          <AiFeedbackSection feedback={interviewData?.ai_feedback} />
          <EmotionAnalysisSection emotionSummary={interviewData?.emotion_summary} />
          <TranscriptSection transcript={interviewData?.transcript} />
          <CodeSnippetSection code={interviewData?.code_snippet} />
        </main>
      </div>
    </div>
  );
} 
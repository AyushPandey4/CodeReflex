'use client'

import { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const EMOTION_MAP = {
  happy: "Happy 😊",
  sad: "Sad 😟",
  angry: "Angry 😠",
  surprised: "Surprised 😮",
  neutral: "Neutral 😐",
};

const getTopExpression = (expressions) => {
  if (!expressions) return 'neutral';
  return Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
};

export default function FacialFeedback({ stream, onEmotionLogUpdate, isInterviewActive }) {
  const videoRef = useRef(null);
  const emotionLogRef = useRef([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState('');

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      console.log('FacialFeedback: Loading models...');
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log('FacialFeedback: Models loaded successfully.');
      } catch (error) {
        console.error("FacialFeedback: Error loading face-api models:", error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleAnalysis = useCallback(async () => {
    if (videoRef.current && modelsLoaded && isInterviewActive) {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
      
      if (detections) {
        const dominantEmotion = getTopExpression(detections.expressions);
        const newLogEntry = { time: Date.now(), emotion: dominantEmotion };
        
        onEmotionLogUpdate(newLogEntry);
        emotionLogRef.current = [...emotionLogRef.current, newLogEntry];
      }
    }
  }, [modelsLoaded, onEmotionLogUpdate, isInterviewActive]);

  useEffect(() => {
    let intervalId;
    if (modelsLoaded && isInterviewActive && isVideoReady) {
      intervalId = setInterval(handleAnalysis, 5000); // Analyze every 5 seconds
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [modelsLoaded, handleAnalysis, isInterviewActive, isVideoReady]);

  useEffect(() => {
    if (!isInterviewActive) return;

    const generateFeedback = () => {
      const currentLog = emotionLogRef.current;
      if (currentLog.length < 2) return; // Generate feedback with at least 2 data points

      const recentEmotions = currentLog.slice(-3); // Last ~30 seconds of data
      const emotionCounts = recentEmotions.reduce((acc, log) => {
          acc[log.emotion] = (acc[log.emotion] || 0) + 1;
          return acc;
      }, {});
      const topEmotion = Object.keys(emotionCounts).reduce((a,b) => emotionCounts[a] > emotionCounts[b] ? a : b);
      
      let message = '';
      switch (topEmotion) {
          case 'happy': message = "Great energy! Your enthusiasm is showing."; break;
          case 'neutral': message = "You seem calm and focused. Keep it up."; break;
          case 'surprised': message = "You appear very engaged with the questions."; break;
          default: message = "Maintaining a professional demeanor.";
      }
      setLiveFeedback(message);

      // Make the feedback disappear after a few seconds
      setTimeout(() => setLiveFeedback(''), 7000);
    };
    
    const feedbackInterval = setInterval(generateFeedback, 30000);
    return () => clearInterval(feedbackInterval);

  }, [isInterviewActive]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-2">Facial Feedback</h2>
      <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline
          onCanPlay={() => setIsVideoReady(true)}
          className="w-full h-full object-cover transform scale-x-[-1]" 
        />
        {liveFeedback && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg text-sm shadow-lg transition-opacity duration-300 animate-pulse">
            {liveFeedback}
          </div>
        )}
      </div>
      {!modelsLoaded && <p className="text-sm text-gray-400 mt-2">Loading analysis models...</p>}
      {!isVideoReady && modelsLoaded && <p className="text-sm text-gray-400 mt-2">Waiting for camera stream...</p>}
    </div>
  );
} 
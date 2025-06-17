'use client'

import { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const EMOTION_MAP = {
  happy: { emoji: "😊", label: "Happy" },
  sad: { emoji: "😟", label: "Sad" },
  angry: { emoji: "😠", label: "Angry" },
  surprised: { emoji: "😮", label: "Surprised" },
  fearful: { emoji: "😨", label: "Fearful" },
  disgusted: { emoji: "🤢", label: "Disgusted" },
  neutral: { emoji: "😐", label: "Neutral" }
};

const getTopExpression = (expressions) => {
  if (!expressions) return null;
  const threshold = 0.3; // Minimum confidence threshold
  const validEmotions = Object.entries(expressions)
    .filter(([_, value]) => value > threshold);
  
  if (validEmotions.length === 0) return null;
  return validEmotions.reduce((a, b) => a[1] > b[1] ? a : b)[0];
};

const getFeedbackMessage = (emotion, confidence) => {
  if (!emotion) return "No clear emotion detected. Please ensure your face is visible.";
  
  const baseMessages = {
    happy: [
      "Great energy! Your enthusiasm is showing.",
      "Your positive attitude is coming through!",
      "You're radiating confidence and positivity."
    ],
    neutral: [
      "You're maintaining a professional and focused demeanor.",
      "Good composure! You're staying calm and collected.",
      "You're showing good interview presence."
    ],
    surprised: [
      "You're showing great engagement with the questions!",
      "Your interest in the topic is evident.",
      "You're demonstrating active listening and engagement."
    ],
    sad: [
      "You seem a bit down. Remember to stay positive!",
      "Try to maintain a more upbeat demeanor.",
      "Keep your spirits up - you're doing great!"
    ],
    angry: [
      "You might want to relax a bit more.",
      "Try to maintain a more neutral expression.",
      "Take a deep breath and stay calm."
    ],
    fearful: [
      "Don't worry, you're doing fine!",
      "Try to relax and be more confident.",
      "Remember to breathe and stay composed."
    ],
    disgusted: [
      "You might want to adjust your expression.",
      "Try to maintain a more neutral face.",
      "Keep a professional demeanor."
    ]
  };

  const messages = baseMessages[emotion] || ["Maintaining a professional demeanor."];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  return `${EMOTION_MAP[emotion].emoji} ${randomMessage} (${Math.round(confidence * 100)}% confidence)`;
};

export default function FacialFeedback({ stream, onEmotionLogUpdate, isInterviewActive, onFeedbackChange }) {
  const videoRef = useRef(null);
  const emotionLogRef = useRef([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState(null);

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
        setError(null);
        console.log('FacialFeedback: Models loaded successfully.');
      } catch (error) {
        console.error("FacialFeedback: Error loading face-api models:", error);
        setError("Failed to load emotion detection models. Please refresh the page.");
        onFeedbackChange("Error: Emotion detection not available");
      }
    };
    loadModels();
  }, [onFeedbackChange]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleAnalysis = useCallback(async () => {
    if (!videoRef.current || !modelsLoaded || !isInterviewActive) return;
    
    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
      
      if (detections) {
        const dominantEmotion = getTopExpression(detections.expressions);
        const confidence = dominantEmotion ? detections.expressions[dominantEmotion] : 0;
        
        const newLogEntry = { 
          time: Date.now(), 
          emotion: dominantEmotion,
          confidence: confidence
        };
        
        onEmotionLogUpdate(newLogEntry);
        emotionLogRef.current = [...emotionLogRef.current, newLogEntry];

        // Generate feedback message
        const feedback = getFeedbackMessage(dominantEmotion, confidence);
        onFeedbackChange(feedback);
      } else {
        onFeedbackChange("No face detected. Please ensure your face is visible.");
      }
    } catch (err) {
      console.error("Error during face analysis:", err);
      onFeedbackChange("Error analyzing facial expression. Please try again.");
    }
  }, [modelsLoaded, onEmotionLogUpdate, isInterviewActive, onFeedbackChange]);

  useEffect(() => {
    let intervalId;
    if (modelsLoaded && isInterviewActive && isVideoReady && !error) {
      intervalId = setInterval(handleAnalysis, 5000); // Analyze every 5 seconds
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [modelsLoaded, handleAnalysis, isInterviewActive, isVideoReady, error]);

  return (
    <div className="w-full h-full relative">
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline
        onCanPlay={() => setIsVideoReady(true)}
        className="w-full h-full object-cover rounded-lg transform scale-x-[-1]" 
      />
      {!modelsLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-300">Loading emotion detection...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}
      {!isVideoReady && modelsLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-300">Initializing camera...</p>
          </div>
        </div>
      )}
    </div>
  );
} 
'use client'

import { useState, useEffect, useRef } from 'react'

export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const isListeningRef = useRef(false)
  const lastTranscriptRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      setError('Speech recognition not available in this environment');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('Speech recognition not supported in this browser');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setError(null);
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setIsListening(false);
        // Only restart if it was stopped unexpectedly
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (err) {
            console.error('Error restarting recognition:', err);
            setError('Failed to restart speech recognition');
          }
        }
      };

      recognition.onresult = (event) => {
        try {
          let fullTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            fullTranscript += event.results[i][0].transcript;
          }
          if (!fullTranscript) return;
      
          setTranscript(prevTranscript => {
            // If the new transcript is already at the end, don't append
            if (prevTranscript.endsWith(fullTranscript)) {
              return prevTranscript;
            }
            // If the new transcript contains the previous transcript, only append the new part
            if (fullTranscript.startsWith(prevTranscript)) {
              return fullTranscript;
            }
            // Otherwise, try to find the largest overlap
            let overlap = '';
            for (let i = 1; i < fullTranscript.length; i++) {
              if (prevTranscript.endsWith(fullTranscript.substring(0, i))) {
                overlap = fullTranscript.substring(0, i);
              }
            }
            return prevTranscript + fullTranscript.substring(overlap.length);
          });
      
          lastTranscriptRef.current = fullTranscript;
          setError(null);
        } catch (err) {
          console.error('Error processing speech result:', err);
          setError('Failed to process speech result');
        }
      };
      
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        isListeningRef.current = false;
        setIsListening(false);
      };

      recognition.onnomatch = () => {
        setError('No speech was recognized');
      };

      recognitionRef.current = recognition;

      return () => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (err) {
            console.error('Error stopping recognition on cleanup:', err);
          }
        }
      };
    } catch (err) {
      console.error('Error initializing speech recognition:', err);
      setError('Failed to initialize speech recognition');
    }
  }, []);

  // When transcript is cleared, also reset lastTranscriptRef
useEffect(() => {
  if (transcript === '') {
    lastTranscriptRef.current = '';
  }
}, [transcript]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return;
    }

    try {
      if (!isListening) {
        recognitionRef.current.start();
        isListeningRef.current = true;
        setIsListening(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Failed to start speech recognition');
      isListeningRef.current = false;
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return;
    }

    try {
      if (isListening) {
        recognitionRef.current.stop();
        isListeningRef.current = false;
        setIsListening(false);
        setError(null);
      }
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
      setError('Failed to stop speech recognition');
    }
  };

  return { 
    isListening, 
    transcript, 
    error,
    startListening, 
    stopListening, 
    setTranscript 
  };
} 
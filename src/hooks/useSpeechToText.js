'use client'

import { useState, useEffect, useRef } from 'react'

export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const isListeningRef = useRef(false)
  const finalTranscriptRef = useRef('');

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
        const wasListening = isListeningRef.current;
        isListeningRef.current = false;
        setIsListening(false);
        // Only restart if it was stopped unexpectedly (and not via a manual call to stopListening)
        if (wasListening) {
          finalTranscriptRef.current = transcript; // Persist the transcript before restarting
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.error('Error restarting recognition:', err);
            setError('Failed to restart speech recognition');
          }
        }
      };

      recognition.onresult = (event) => {
        try {
          let interimTranscript = '';
          let sessionFinalTranscript = '';

          for (let i = 0; i < event.results.length; ++i) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              sessionFinalTranscript += transcriptPart;
            } else {
              interimTranscript += transcriptPart;
            }
          }
          
          setTranscript(finalTranscriptRef.current + sessionFinalTranscript + interimTranscript);
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

  // When transcript is cleared from the parent, also reset our final transcript ref
  useEffect(() => {
    if (transcript === '') {
      finalTranscriptRef.current = '';
    }
  }, [transcript]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return;
    }

    try {
      if (!isListening) {
        // Before starting, ensure the final transcript is up-to-date with any existing text
        finalTranscriptRef.current = transcript;
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
        isListeningRef.current = false; // Signal that this is a manual stop
        recognitionRef.current.stop();
        // State update will be handled by onend
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
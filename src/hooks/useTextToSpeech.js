'use client'

import { useState, useEffect, useCallback } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [error, setError] = useState(null);

  const populateVoiceList = useCallback(() => {
    if (speechSynthesis) {
      try {
        const availableVoices = speechSynthesis.getVoices();
        const englishVoices = availableVoices
          .filter(voice => voice.lang.startsWith('en'))
          .sort((a, b) => a.lang.localeCompare(b.lang));
        setVoices(englishVoices);
        setError(null);
      } catch (err) {
        console.error('Error populating voice list:', err);
        setError('Failed to load voices');
      }
    }
  }, [speechSynthesis]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const synth = window.speechSynthesis;
        setSpeechSynthesis(synth);
        
        if (synth.onvoiceschanged !== undefined) {
          synth.onvoiceschanged = populateVoiceList;
        }
        
        populateVoiceList();
      } catch (err) {
        console.error('Error initializing speech synthesis:', err);
        setError('Speech synthesis not available');
      }
    } else {
      setError('Speech synthesis not supported in this browser');
    }
  }, [populateVoiceList]);

  const speak = useCallback((text, { voiceURI, onEndCallback = () => {} }) => {
    if (!speechSynthesis || !text) {
      setError('Speech synthesis not initialized or no text provided');
      return;
    }

    try {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else if (voices.length > 0) {
        utterance.voice = voices.find(v => v.lang === 'en-US') || voices[0];
      }
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => { 
        setIsSpeaking(true);
        setError(null);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        onEndCallback();
      };
      
      utterance.onerror = (event) => {
        if (event.error === 'interrupted') {
        console.log('Speech was interrupted by user action.');
          setError(null);
          return;
        }
        console.error('SpeechSynthesisUtterance.onerror', event);
        setIsSpeaking(false);
        setError(`Speech error: ${event.error}`);
      };

      speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Error in speak function:', err);
      setError('Failed to speak text');
      setIsSpeaking(false);
    }
  }, [speechSynthesis, voices]);

  const cancel = useCallback(() => {
    if (speechSynthesis) {
      try {
        speechSynthesis.cancel();
        setIsSpeaking(false);
        setError(null);
      } catch (err) {
        console.error('Error canceling speech:', err);
        setError('Failed to cancel speech');
      }
    }
  }, [speechSynthesis]);

  return { speak, cancel, isSpeaking, voices, error };
};

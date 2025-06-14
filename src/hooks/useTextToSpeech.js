'use client'

import { useState, useEffect, useCallback } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);

  const populateVoiceList = useCallback(() => {
    if (speechSynthesis) {
      const availableVoices = speechSynthesis.getVoices();
      const englishVoices = availableVoices
        .filter(voice => voice.lang.startsWith('en'))
        .sort((a, b) => a.lang.localeCompare(b.lang));
      setVoices(englishVoices);
    }
  }, [speechSynthesis]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      setSpeechSynthesis(synth);
      
      synth.onvoiceschanged = populateVoiceList;
      populateVoiceList();
    }
  }, [populateVoiceList]);

  const speak = useCallback((text, { voiceURI, onEndCallback = () => {} }) => {
    if (!speechSynthesis || !text) return;

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
    
    utterance.onstart = () => { setIsSpeaking(true); };
    utterance.onend = () => {
      setIsSpeaking(false);
      onEndCallback();
    };
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      setIsSpeaking(false);
    };

    speechSynthesis.speak(utterance);
  }, [speechSynthesis, voices]);

  const cancel = useCallback(() => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [speechSynthesis]);

  return { speak, cancel, isSpeaking, voices };
};

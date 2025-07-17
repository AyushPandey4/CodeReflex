import { useEffect } from "react";

export function useSpeechEvents({
  conversationLog,
  speak,
  cancelSpeech,
  voiceURI,
  lastSpokenTextRef,
  userSpeech,
  isListening,
  setUserSpeech,
  addUserMessage,
}) {
  // Effect to speak the AI's latest message
  useEffect(() => {
    if (conversationLog.length === 0) return;
    const lastMessage = conversationLog[conversationLog.length - 1];

    // Only act on messages from the AI that haven't been spoken yet
    if (
      lastMessage.sender === "ai" &&
      lastMessage.text !== lastSpokenTextRef.current
    ) {
      cancelSpeech();
      lastSpokenTextRef.current = lastMessage.text;
      speak(lastMessage.text, { voiceURI });
    }
  }, [conversationLog, speak, cancelSpeech, voiceURI, lastSpokenTextRef]);

  // Effect to process the user's spoken response
  useEffect(() => {
    if (userSpeech && !isListening) {
      addUserMessage(userSpeech);
      setUserSpeech(""); // Clear transcript after processing
    }
  }, [userSpeech, isListening, setUserSpeech, addUserMessage]);
}
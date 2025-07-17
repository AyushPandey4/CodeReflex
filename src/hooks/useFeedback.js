import { useState, useEffect } from "react";

export function useFeedback(speechError, speechSynthesisError) {
  const [liveFeedback, setLiveFeedback] = useState("");

  useEffect(() => {
    if (speechError) {
      const message = `Speech recognition error: ${speechError}`;
      console.error(message);
      setLiveFeedback(message);
    }
  }, [speechError]);

  useEffect(() => {
    if (speechSynthesisError) {
      const message = `Speech synthesis error: ${speechSynthesisError}`;
      console.error(message);
      setLiveFeedback(message);
    }
  }, [speechSynthesisError]);

  return { liveFeedback, setLiveFeedback };
}
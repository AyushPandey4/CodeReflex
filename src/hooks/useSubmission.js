// src/hooks/useSubmission.js
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function useSubmission({
  id,
  conversationLog,
  codeLog,
  emotionLog,
  isListening,
  stopListening,
  cancelSpeech,
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(
    "Gathering your responses..."
  );
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmitInterview = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmation(false);
    if (isListening) stopListening();
    cancelSpeech();

    try {
      setSubmissionFeedback("Analyzing your interview transcript...");
      const finalTranscript = conversationLog;

      setSubmissionFeedback("Asking the AI for overall feedback...");
      const feedbackPrompt = `The interview has now concluded.
You are a senior-level technical recruiter and soft-skill evaluator at a top-tier company. Your task is to provide **professional-level feedback** for the candidate based on the following:
---
📄 Transcript:
${JSON.stringify(finalTranscript)}
📈 Emotion log (chronological order):
${JSON.stringify(emotionLog)}
---
🧠 You must return a valid JSON response with **four keys**:
1. **"interview_feedback"** (String):  
   - Assess technical strengths/weaknesses  
   - Comment on problem-solving, communication, and collaboration  
   - Give constructive suggestions  
2. **"emotional_feedback"** (String):  
   - Analyze patterns from the emotion log: confidence, stress, hesitation, enthusiasm  
   - Identify behavioral cues and how they evolved during the interview  
3. **"final_rating"** (Number, from 0 to 10):  
   - Rate the overall performance (consider knowledge, clarity, soft skills, composure)  
   - Use integers or one decimal point (e.g., 7.5)  
4. **"recommendation"** (String):  
   Choose one of:
   - "Advance to next round"  
   - "Needs improvement"  
   - "Strongly recommended"  
---
✅ The tone should be professional, encouraging, and realistic.  
❌ Do NOT include any code, emotion logs, or unrelated commentary.  
✅ Format your answer **strictly as JSON**.  
✅ Total word count must stay under 400 words.
Return only the JSON response.`;

      const apiMessages = conversationLog.map((msg) => ({
        role: msg.sender === "ai" ? "assistant" : "user",
        content: msg.text,
      }));

      const feedbackMessages = [
        ...apiMessages,
        { role: "system", content: feedbackPrompt },
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: feedbackMessages }),
      });
      if (!response.ok) throw new Error("Failed to get final AI feedback.");

      const finalAiMessage = await response.json();
      const finalAiFeedback = finalAiMessage;

      setSubmissionFeedback("Saving your results to the database...");
      const { error: updateError } = await supabase
        .from("interviews")
        .update({
          transcript: finalTranscript,
          code_snippet: codeLog,
          emotion_summary: emotionLog,
          ai_feedback: finalAiFeedback,
          ended_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (updateError) throw updateError;

      setSubmissionFeedback("All done! Redirecting to your results...");
      router.push(`/feedback/${id}`);
    } catch (err) {
      console.error("Error during submission:", err);
      alert("There was an error submitting your interview. Please try again.");
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    isListening,
    stopListening,
    conversationLog,
    id,
    router,
    cancelSpeech,
    emotionLog,
    codeLog,
  ]);

  const handleSubmitClick = () => {
    if (isListening) stopListening();
    cancelSpeech();
    setShowConfirmation(true);
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return {
    isSubmitting,
    submissionFeedback,
    showConfirmation,
    handleSubmitClick,
    handleConfirmSubmission: handleSubmitInterview,
    handleCloseConfirmation,
  };
}
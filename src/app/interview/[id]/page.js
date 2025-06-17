"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { notFound, useParams, useRouter } from "next/navigation";
import { Mic, Video, VideoOff, BrainCircuit, Bot, User } from "lucide-react";
import { Timer } from "@/components/Timer";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { UserTranscriptArea } from "@/components/UserTranscriptArea";
import { InterviewerChatArea } from "@/components/InterviewerChatArea";
import { CodeEditor } from "@/components/CodeEditor";
import FacialFeedback from "@/components/FacialFeedback";
import { motion, AnimatePresence } from "framer-motion";

// Placeholder components - we will build these out next
const PermissionsPrompt = ({
  onPermissionsGranted,
  isCameraEnabled,
  requestCamera,
  setRequestCamera,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 20 }}
      className="bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 border border-gray-700/50"
    >
      {/* Logo and Title */}
      <div className="flex items-center justify-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-white font-bold text-xl">CR</span>
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Ready for your interview?
        </h2>
      </div>

      {/* Description */}
      <p className="text-gray-300 mb-8 leading-relaxed">
        We need microphone access to hear your responses. Camera access is
        optional but recommended for emotion feedback.
      </p>

      {/* Camera Toggle */}
      {isCameraEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center space-x-4 mb-8 p-4 bg-gray-700/30 rounded-xl"
        >
          <div className="flex-1 text-left">
            <p className="text-gray-300 font-medium">Enable Camera</p>
            <p className="text-sm text-gray-400">
              For real-time emotion feedback
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setRequestCamera(!requestCamera)}
            className={`relative p-2 rounded-full transition-colors ${
              requestCamera
                ? "bg-indigo-500 hover:bg-indigo-600"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
          >
            <Video
              className={`h-5 w-5 transition-colors ${
                requestCamera ? "text-white" : "text-gray-400"
              }`}
            />
            {requestCamera && (
              <motion.div
                layoutId="cameraToggle"
                className="absolute inset-0 rounded-full border-2 border-indigo-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Permissions Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onPermissionsGranted}
        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-6 py-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20"
      >
        <Mic className="h-5 w-5" />
        <span className="font-medium">Grant Permissions & Start</span>
      </motion.button>

      {/* Privacy Note */}
      <p className="mt-4 text-sm text-gray-400">
        Your privacy is important. We only use your camera and microphone during
        the interview.
      </p>
    </motion.div>
  </motion.div>
);

const SubmissionOverlay = ({ feedback }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-50 p-4">
    <BrainCircuit className="h-16 w-16 text-blue-500 mb-6 animate-pulse" />
    <h2 className="text-3xl font-bold text-white mb-4">
      Generating Your Feedback...
    </h2>
    <p className="text-gray-300 text-lg text-center max-w-2xl">{feedback}</p>
  </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        key="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          key="modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 border border-gray-700/50"
        >
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="h-8 w-8 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
            End Interview?
          </h2>

          {/* Description */}
          <p className="text-gray-300 mb-8 leading-relaxed">
            Are you sure you want to end this interview? Your responses will be
            analyzed and you'll receive detailed feedback.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-colors flex-1"
            >
              Continue Interview
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white transition-colors flex-1 shadow-lg shadow-indigo-500/20"
            >
              End & Submit
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function InterviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [requestCamera, setRequestCamera] = useState(true);

  const [conversationLog, setConversationLog] = useState([]);
  const [codeLog, setCodeLog] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [code, setCode] = useState("// Your code here...");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(
    "Gathering your responses..."
  );
  const [liveFeedback, setLiveFeedback] = useState("");
  const lastSpokenTextRef = useRef(null);
  const [emotionLog, setEmotionLog] = useState([]);
  const [videoStream, setVideoStream] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    isListening,
    transcript: userSpeech,
    startListening,
    stopListening,
    setTranscript: setUserSpeech,
    error: speechError,
  } = useSpeechToText();
  const {
    speak,
    cancel: cancelSpeech,
    isSpeaking,
    error: speechSynthesisError,
  } = useTextToSpeech();
  const [voiceURI, setVoiceURI] = useState("");

  useEffect(() => {
    const savedVoice = localStorage.getItem("interviewer_voice_uri");
    if (savedVoice) {
      setVoiceURI(savedVoice);
    }
  }, []);

  useEffect(() => {
    const fetchInterview = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("interviews")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Interview not found");

        setInterview(data);
      } catch (err) {
        console.error("Error fetching interview:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id]);

  // This is now a regular function, not a useCallback, to ensure it never has stale state.
  const getAiResponse = async (currentConversation) => {
    // Stronger guard clause to ensure all necessary data is loaded.
    if (
      !interview ||
      !interview.job_role ||
      !interview.interviewer_personality
    ) {
      console.error(
        "getAiResponse called before interview data was fully loaded."
      );
      return;
    }

    setIsAiTyping(true);

    const conversationHistory = currentConversation
      .map((msg) => {
        let history = `${msg.sender === "ai" ? "Interviewer" : "Candidate"}: ${
          msg.text
        }`;
        if (msg.code) {
          history += `\n\`\`\`javascript\n${msg.code}\n\`\`\``;
        }
        return history;
      })
      .join("\n\n");

    const lastMessage = currentConversation[currentConversation.length - 1];
    const isCodeSubmission =
      lastMessage?.sender === "user" && lastMessage?.code;

    const systemPrompt = `You are a highly advanced, context-aware, top-tier AI interviewer for CodeReflex.

      ---
      
      🧠 Interview Context:
      
      - 🏢 **Target Company**: ${interview.company_name}
      - 👔 **Role**: ${interview.job_role}
      - 📋 **Job Description**: ${interview.job_description}
      - 🧾 **Resume**: ${interview.resume_text}
      - 🎯 **Interview Type**: ${interview.interview_type.toUpperCase()}
      - 🎯 **Focus Areas**: ${interview.custom_focus_areas || "None specified"}
      - 🧪 **Difficulty Level**: ${interview.difficulty_level}
      - ⏱️ **Interview Duration**: ${interview.duration} minutes
      - 🧠 **Preferred Language**: Ask the user if not already known
      
      You must simulate the style, tone, and expectations of a real human interviewer at **${
        interview.company_name
      }**, drawing on the job description, role, and industry standard for such positions.
      
      ---
      
      🎭 Tone & Persona Style:
      
      Personality Selected → "${interview.interviewer_personality}"
      
      Apply the following tone profile **consistently** across all responses:
      
      ${
        {
          "Friendly Dev":
            "Be warm and helpful like a friendly senior developer. Offer support, clarify confusion, and keep the experience calm and reassuring.",
          "Strict HR":
            "Be direct, minimal, and formal. Ask no-nonsense questions with high expectations and keep answers short and precise.",
          "Calm Manager":
            "Be patient and observant. Focus on emotional intelligence, leadership, communication, and thoughtful responses.",
          "Fast-Paced Tech Lead":
            "Act like a sharp, time-bound tech lead. Prioritize technical depth, quick decisions, and stress management. Push for efficiency and clarity.",
        }[interview.interviewer_personality]
      }
      
      ---
      
      📌 Golden Rules of CodeReflex:
      
      1. You are always the **interviewer**, not a solution assistant.
      2. NEVER provide full solutions (neither code nor full answers).
      3. All output must follow **strict JSON format** — no Markdown, no extra keys.
      
      \`\`\`json
      {
        "text": "Your spoken response or question",
        "code": "Starter code or null"
      }
      \`\`\`
      
      ---
      
      🎯 Adaptive Interview Flow:
      
      ${
        isCodeSubmission
          ? `
      🧪 Candidate has submitted code. Your job now:
      
      - Think like a senior ${interview.job_role} at ${interview.company_name}
      - Analyze:
        - 🔍 Correctness
        - ⚡ Time and space complexity
        - 📐 Code structure, modularity, naming
      - Ask one **advanced** follow-up:
        - Edge cases, trade-offs, scalability or system fit
      - Do NOT suggest fixes or write code
      - Set "code": null
      `
          : `
      🧭 Interview is live. Continue based on flow logic:
      
      Ask preferred language if unknown. Then, follow the logic below based on the interview_type:
      
      🔹 **DSA**:
      - Ask progressively challenging problems based on ${
        interview.focus_areas || "standard patterns"
      }.
      - Keep each question aligned with the role and company.
      - Provide **only function signature + docstring** in the "code" field.
      
      🔹 **HR**:
      - Focus on integrity, values, and team fit based on the company’s culture.
      - Pull questions from resume experiences, transitions, or job expectations.
      
      🔹 **Behavioral**:
      - Ask scenario-based questions using the **STAR format**.
      - Use resume entries to generate custom situations (conflict, failure, growth, etc.).
      
      🔹 **System Design**:
      - Ask high-level architecture questions tailored to ${
        interview.company_name
      }.
      - Ask about design decisions, trade-offs, scaling, fault tolerance.
      - Avoid code completely — keep "code": null.
      
      🔹 **Full Stack**:
      - Dive into frontend/backend, APIs, microservices, database choices.
      - Tie questions to experience from resume or tools in the job description.
      - Use code block if asking logic; otherwise "code": null.
      
      🔹 **Mixed**:
      - Blend technical (DSA/System Design) and soft skills (HR/Behavioral) questions.
      - Maintain natural conversation flow, don’t jump randomly between topics.
      - Build on earlier answers and responses.
      
      🧠 For all types, tailor questions to:
      - Their resume projects or internships
      - Company mission and expectations
      - Real interview pacing — not robotic
      
      ⚡ If user gives vague or weak answers, respectfully ask for clarification or deeper explanation.
      
      📈 Escalate difficulty naturally over time — start basic, go deep.
      
      `
      }
      
      ---
      
      🧠 Intelligence Layer:
      
      - Prioritize **contextual depth** over quantity.
      - Don’t repeat past questions or topics from earlier context.
      - Vary formats: some direct, some scenario, some "what if" based.
      - Detect when user is stuck or repeating — adapt naturally.
      - Mention relevant company products, tools, or expectations where suitable.
      
      ---
      
      🧩 Output Format (Mandatory):
      
      Use this exact structure. No extra keys, no commentary, no markdown.
      
      \`\`\`json
      {
        "text": "Next question or follow-up...",
        "code": "Starter function, or null"
      }
      \`\`\`
      
      ---
      
      💬 Conversation So Far:
      ${conversationHistory || "No prior conversation yet."}
      
      Continue from the last exchange.
      
      --- End of Prompt ---
      `;

    const apiMessages = currentConversation.map((msg) => ({
      role: msg.sender === "ai" ? "assistant" : "user",
      content: msg.text,
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "system", content: systemPrompt }, ...apiMessages],
        }),
      });

      if (!response.ok) {
        // Log the server's error response for better debugging
        const errorBody = await response.json();
        console.error("Server responded with an error:", errorBody);
        throw new Error(
          `AI response failed: ${errorBody.error || response.statusText}`
        );
      }

      const aiMessage = await response.json();
      // console.log(aiMessage);
      // It's possible the model doesn't respect the JSON format perfectly.
      try {
        const aiContent =
          typeof aiMessage.content === "string"
            ? JSON.parse(aiMessage.content)
            : aiMessage.content;

        setConversationLog((prev) => [
          ...prev,
          {
            sender: "ai",
            text: aiContent.text,
            code: aiContent.code || null,
          },
        ]);

        if (aiContent.code) {
          setCode(aiContent.code);
        }
      } catch (parseError) {
        console.error(
          "Failed to parse AI response as JSON:",
          aiMessage.content
        );
        // Handle non-JSON response from AI
        setConversationLog((prev) => [
          ...prev,
          { sender: "ai", text: aiMessage.content, code: null },
        ]);
      }
    } catch (err) {
      console.error("Error fetching AI response:", err);
      setConversationLog((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I'm sorry, I encountered an error. Could you please repeat that?",
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Kicks off the interview once permissions are granted
  useEffect(() => {
    if (permissionsGranted && interview && conversationLog.length === 0) {
      getAiResponse([]);
    }
  }, [permissionsGranted, interview, conversationLog.length]);

  // This hook now reliably speaks only new AI messages and is immune to re-render loops.
  useEffect(() => {
    if (conversationLog.length === 0) return;

    const lastMessage = conversationLog[conversationLog.length - 1];

    // 1. Only act on messages from the AI.
    if (lastMessage.sender !== "ai") return;

    // 2. If this is the same text we were last told to speak, do nothing. This prevents the loop.
    if (lastMessage.text === lastSpokenTextRef.current) return;

    // 3. If we're here, it's a new message. Cancel any prior speech.
    cancelSpeech();

    // 4. Update our reference to the new text and speak it.
    lastSpokenTextRef.current = lastMessage.text;
    speak(lastMessage.text, { voiceURI });
  }, [conversationLog, speak, cancelSpeech, voiceURI]); // Note: isSpeaking is NOT in the dependency array.

  // Processes the user's spoken response
  useEffect(() => {
    if (userSpeech && !isListening) {
      // Functional update to prevent race conditions and remove `conversationLog` from dependencies.
      setConversationLog((prevLog) => {
        const lastMessage =
          prevLog.length > 0 ? prevLog[prevLog.length - 1] : null;
        // Only add the user's speech if the last message was from the AI.
        if (lastMessage && lastMessage.sender === "ai") {
          return [...prevLog, { sender: "user", text: userSpeech }];
        }
        // Otherwise, do not update the log.
        return prevLog;
      });
      // Clear the transcript immediately after processing.
      setUserSpeech("");
    }
  }, [userSpeech, isListening, setUserSpeech]);

  // Triggers the AI response after user speaks OR code is submitted
  useEffect(() => {
    if (conversationLog.length > 0) {
      const lastMessage = conversationLog[conversationLog.length - 1];
      if (lastMessage.sender === "user") {
        getAiResponse(conversationLog);
      }
    }
  }, [conversationLog, interview]); // Now also triggers on code submission

  // Add error handling for speech recognition
  useEffect(() => {
    if (speechError) {
      console.error("Speech recognition error:", speechError);
      // Show error in toast
      setLiveFeedback(`Speech recognition error: ${speechError}`);
    }
  }, [speechError]);

  // Add error handling for speech synthesis
  useEffect(() => {
    if (speechSynthesisError) {
      console.error("Speech synthesis error:", speechSynthesisError);
      // Show error in toast
      setLiveFeedback(`Speech synthesis error: ${speechSynthesisError}`);
    }
  }, [speechSynthesisError]);

  // Update handlePermissionsGranted to handle errors better
  const handlePermissionsGranted = async () => {
    try {
      const constraints = {
        audio: true,
        video: interview.enable_webcam && requestCamera,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (constraints.video) {
        setVideoStream(stream);
      } else {
        // If video is not enabled for the interview, stop the video track immediately.
        stream.getVideoTracks().forEach((track) => track.stop());
      }

      console.log("Permissions granted successfully!");
      setPermissionsGranted(true);
      setLiveFeedback("Microphone and camera permissions granted successfully");
    } catch (err) {
      const errorMessage =
        err.name === "NotAllowedError"
          ? "You must grant at least microphone access to continue."
          : `Permission error: ${err.message}`;
      setLiveFeedback(errorMessage);
      console.error("Permission error:", err);
    }
  };

  const handleEmotionLogUpdate = useCallback((newLog) => {
    setEmotionLog((prev) => [...prev, newLog]);
  }, []);

  const handleSubmitCode = (submittedCode) => {
    if (isListening) {
      stopListening();
    }

    // Add to code log with timestamp
    const codeSubmission = {
      timestamp: new Date().toISOString(),
      code: submittedCode,
      question:
        conversationLog[conversationLog.length - 1]?.text || "Unknown Question",
    };

    setCodeLog((prev) => [...prev, codeSubmission]);

    const newConversationLog = [
      ...conversationLog,
      {
        sender: "user",
        text: "I have finished writing my code. Here is my solution.",
        code: submittedCode,
      },
    ];
    setConversationLog(newConversationLog);
  };

  const handleSubmitInterview = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmation(false);

    // Stop any active listening or speaking
    if (isListening) {
      stopListening();
    }
    cancelSpeech();

    try {
      // 1. Gather all data
      setSubmissionFeedback("Analyzing your interview transcript...");
      const finalTranscript = conversationLog;

      // 2. Get Final AI Feedback
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

Return only the JSON response.
`;

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

      // 3. Update Supabase
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

      // 4. Redirect
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
    code,
    id,
    router,
    cancelSpeech,
    emotionLog,
    codeLog,
  ]);

  const handleTimeUp = useCallback(() => {
    handleSubmitInterview();
  }, [handleSubmitInterview]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  // New function to handle the initial submit click
  const handleSubmitClick = () => {
    setShowConfirmation(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
            <span className="text-white font-bold text-2xl">CR</span>
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            CodeReflex
          </span>
        </div>
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-indigo-400 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <div className="text-lg font-medium tracking-wide mb-1">
            Loading your interview...
          </div>
          <div className="text-sm text-gray-400">
            Setting up your personalized experience. Please wait.
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    notFound(); // Redirect to a 404 page if interview is not found or an error occurs
  }

  const messagesForChat = conversationLog.map((msg) => ({
    role: msg.sender === "ai" ? "assistant" : "user",
    content: msg.text,
  }));

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {isSubmitting && <SubmissionOverlay feedback={submissionFeedback} />}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleSubmitInterview}
      />
      {!permissionsGranted && interview && (
        <PermissionsPrompt
          onPermissionsGranted={handlePermissionsGranted}
          isCameraEnabled={interview.enable_webcam}
          requestCamera={requestCamera}
          setRequestCamera={setRequestCamera}
        />
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header Section */}
        <header className="flex justify-between items-center bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/50">
          <div className="flex items-center space-x-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {interview.job_role}
              </h1>
              <p className="text-gray-400">{interview.company_name}</p>
            </div>
            <div className="h-8 w-px bg-gray-700"></div>
            <div className="text-sm text-gray-400">
              <p>
                Difficulty:{" "}
                <span className="text-indigo-400">
                  {interview.difficulty_level}
                </span>
              </p>
              <p>
                Duration:{" "}
                <span className="text-indigo-400">
                  {interview.duration} minutes
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {permissionsGranted && (
              <Timer duration={interview.duration} onTimeUp={handleTimeUp} />
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmitClick}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-6 py-2 rounded-lg flex items-center space-x-2 shadow-lg shadow-indigo-500/20"
            >
              <span>Submit Interview</span>
            </motion.button>
          </div>
        </header>

        {permissionsGranted && (
          <main className="space-y-6">
            {/* Interview Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column - Interview Panel */}
              <div className="lg:col-span-9 space-y-6">
                {/* AI and User Panels */}
                <div className="grid grid-cols-2 gap-6">
                  {/* AI Panel */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">AI Interviewer</h3>
                        <p className="text-sm text-gray-400">
                          {interview.interviewer_personality}
                        </p>
                      </div>
                    </div>
                    <div className="h-24 bg-gray-700/30 rounded-lg flex items-center justify-center">
                      {/* Waveform visualization - only animate when AI is speaking */}
                      <div className="flex items-center space-x-1">
                        {[...Array(20)].map((_, i) => (
                          <motion.div
                            key={`ai-waveform-${i}`}
                            className="w-1 bg-indigo-500 rounded-full"
                            animate={
                              isSpeaking
                                ? {
                                    height: [20, 40, 20],
                                  }
                                : {
                                    height: 20,
                                  }
                            }
                            transition={{
                              duration: 1,
                              repeat: isSpeaking ? Infinity : 0,
                              delay: i * 0.05,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* User Panel */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          You
                        </h3>
                        <p className="text-sm text-gray-400">
                          {interview.enable_webcam && videoStream ? (
                            <span className="flex items-center space-x-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <span>Camera Enabled</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1">
                              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                              <span>Camera Disabled</span>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`${
                        interview.enable_webcam && videoStream ? "h-48" : "h-24"
                      } bg-gray-700/30 rounded-lg flex items-center justify-center overflow-hidden`}
                    >
                      {interview.enable_webcam && videoStream ? (
                        <FacialFeedback
                          stream={videoStream}
                          onEmotionLogUpdate={handleEmotionLogUpdate}
                          isInterviewActive={permissionsGranted}
                          onFeedbackChange={setLiveFeedback}
                        />
                      ) : (
                        <div className="flex items-center space-x-1">
                          {[...Array(20)].map((_, i) => (
                            <motion.div
                              key={`user-waveform-${i}`}
                              className="w-1 bg-purple-500 rounded-full"
                              animate={
                                isListening
                                  ? {
                                      height: [20, 40, 20],
                                    }
                                  : {
                                      height: 20,
                                    }
                              }
                              transition={{
                                duration: 1,
                                repeat: isListening ? Infinity : 0,
                                delay: i * 0.05,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Question Section */}
                <InterviewerChatArea
                  messages={messagesForChat}
                  isAiTyping={isAiTyping}
                />
              </div>

              {/* Right Column - Mic Controls */}
              <div className="lg:col-span-3 space-y-4">
                {/* Mic Controls Box */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                  <UserTranscriptArea
                    isListening={isListening}
                    transcript={userSpeech}
                    startListening={() => {
                      cancelSpeech();
                      startListening();
                    }}
                    stopListening={stopListening}
                  />
                </div>

                {/* Live Transcript Preview - Only show when speaking */}
                {isListening && userSpeech && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <h4 className="text-sm font-medium text-gray-400">
                        Recording...
                      </h4>
                    </div>
                    <p
                      className="text-gray-300 text-sm leading-relaxed max-h-32 overflow-y-auto custom-scrollbar"
                      style={{ wordBreak: "break-word" }}
                    >
                      {userSpeech}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Code Editor - Full Width */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <CodeEditor
                initialCode={code}
                onCodeChange={handleCodeChange}
                onSubmitCode={handleSubmitCode}
              />
            </div>
          </main>
        )}

        {/* Toast Notifications - Show mic status, facial feedback, and errors */}
        <div className="fixed bottom-4 left-4 space-y-2">
          <AnimatePresence>
            {isListening && (
              <motion.div
                key="mic-status"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2"
              >
                <Mic className="h-4 w-4" />
                <span>Mic On</span>
              </motion.div>
            )}
            {liveFeedback && (
              <motion.div
                key="live-feedback"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`${
                  speechError || speechSynthesisError
                    ? "bg-red-600/90"
                    : "bg-gray-800/90"
                } backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 border border-gray-700/50`}
              >
                {speechError || speechSynthesisError ? (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                ) : (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
                <span>{liveFeedback}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

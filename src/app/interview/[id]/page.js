"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { notFound, useParams } from "next/navigation";
import { Mic, Bot, User } from "lucide-react";
import { Timer } from "@/components/Timer";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { UserTranscriptArea } from "@/components/UserTranscriptArea";
import { InterviewerChatArea } from "@/components/InterviewerChatArea";
import { CodeEditor } from "@/components/CodeEditor";
import FacialFeedback from "@/components/FacialFeedback";
import { motion, AnimatePresence } from "framer-motion";
import { useInterview } from "@/hooks/useInterview";
import { useInterviewFlow } from "@/hooks/useInterviewFlow";
import { useFeedback } from "@/hooks/useFeedback";
import { useSubmission } from "@/hooks/useSubmission";
import { useSpeechEvents } from "@/hooks/useSpeechEvents";
import { PermissionsPrompt } from "@/components/PermissionsPrompt";
import {
  SubmissionOverlay,
  ConfirmationModal,
} from "@/components/InterviewModals";

export default function InterviewPage() {
  const { id } = useParams();
  const { interview, loading, error } = useInterview(id);
  const {
    conversationLog,
    isAiTyping,
    code,
    setCode,
    startInterview,
    addUserMessage,
  } = useInterviewFlow(interview);

  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [requestCamera, setRequestCamera] = useState(true);
  const [codeLog, setCodeLog] = useState([]);
  const [emotionLog, setEmotionLog] = useState([]);
  const [videoStream, setVideoStream] = useState(null);
  const lastSpokenTextRef = useRef(null);

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

  const { liveFeedback, setLiveFeedback } = useFeedback(
    speechError,
    speechSynthesisError
  );

  const {
    isSubmitting,
    submissionFeedback,
    showConfirmation,
    handleSubmitClick,
    handleConfirmSubmission,
    handleCloseConfirmation,
  } = useSubmission({
    id,
    conversationLog,
    codeLog,
    emotionLog,
    isListening,
    stopListening,
    cancelSpeech,
  });

  const [voiceURI, setVoiceURI] = useState("");

  // This hook now centralizes the logic for speech interaction
  useSpeechEvents({
    conversationLog,
    speak,
    cancelSpeech,
    voiceURI,
    lastSpokenTextRef,
    userSpeech,
    isListening,
    setUserSpeech,
    addUserMessage,
  });

  // Effect for one-time initialization of the speaker's voice
  useEffect(() => {
    const savedVoice = localStorage.getItem("interviewer_voice_uri");
    if (savedVoice) {
      setVoiceURI(savedVoice);
    }
  }, []);

  // Effect to coordinate the start of the interview
  useEffect(() => {
    if (permissionsGranted && interview) {
      startInterview();
    }
  }, [permissionsGranted, interview, startInterview]);

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
    const codeSubmission = {
      timestamp: new Date().toISOString(),
      code: submittedCode,
      question:
        conversationLog[conversationLog.length - 1]?.text ||
        "Unknown Question",
    };
    setCodeLog((prev) => [...prev, codeSubmission]);
    addUserMessage(
      "I have finished writing my code. Here is my solution.",
      submittedCode
    );
  };

  const handleTimeUp = useCallback(() => {
    handleConfirmSubmission();
  }, [handleConfirmSubmission]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
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
    notFound();
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
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmSubmission}
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-9 space-y-6">
                <div className="grid grid-cols-2 gap-6">
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

                <InterviewerChatArea
                  messages={messagesForChat}
                  isAiTyping={isAiTyping}
                />
              </div>

              <div className="lg:col-span-3 space-y-4">
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

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <CodeEditor
                initialCode={code}
                onCodeChange={handleCodeChange}
                onSubmitCode={handleSubmitCode}
              />
            </div>
          </main>
        )}

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
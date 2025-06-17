'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Bot, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export function InterviewerChatArea({ messages, isAiTyping }) {
  const [showFullTranscript, setShowFullTranscript] = useState(false)

  return (
    <div className="space-y-4">
      {/* Latest Message */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-gray-300">
              {messages.length > 0 ? messages[messages.length - 1].content : "Welcome to your interview!"}
            </p>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setShowFullTranscript(!showFullTranscript)}
        className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition-colors"
      >
        {showFullTranscript ? (
          <>
            <ChevronUp className="w-4 h-4" />
            <span>Show Latest Only</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            <span>Show Full Transcript</span>
          </>
        )}
      </button>

      {/* Full Transcript */}
      <AnimatePresence>
        {showFullTranscript && (
          <motion.div
            key="full-transcript"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {messages.map((message, index) => (
                <motion.div
                  key={`${message.role}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start space-x-3 ${
                    message.role === 'assistant' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <>
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 max-w-[80%]">
                        <p className="text-gray-300">{message.content}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-indigo-500/20 backdrop-blur-sm rounded-xl p-3 max-w-[80%]">
                        <p className="text-gray-300">{message.content}</p>
                      </div>
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium">You</span>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typing Indicator */}
      {isAiTyping && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-2 text-gray-400"
        >
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={`typing-${i}`}
                className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <span>AI is typing...</span>
        </motion.div>
      )}

      {/* Add custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 3px;
          transition: all 0.2s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(99, 102, 241, 0.5) rgba(31, 41, 55, 0.3);
        }
      `}</style>
    </div>
  )
} 
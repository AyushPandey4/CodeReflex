'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'

export function UserTranscriptArea({ isListening, transcript, startListening, stopListening }) {
  return (
    <div className="flex flex-col items-center">
      {/* Mic Button with Animation */}
      <motion.div
        className="relative"
        initial={{ width: "auto" }}
        animate={{ 
          width: isListening ? "200px" : "auto",
          transition: { duration: 0.3, ease: "easeInOut" }
        }}
      >
        <motion.button
          onClick={isListening ? stopListening : startListening}
          className={`relative flex items-center justify-center p-3 rounded-full transition-colors ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-indigo-500 hover:bg-indigo-600'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isListening ? (
            <MicOff className="h-6 w-6 text-white" />
          ) : (
            <Mic className="h-6 w-6 text-white" />
          )}
        </motion.button>

        {/* Recording Indicator - Only shows when expanded */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              key="recording-indicator"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-y-0 left-full flex items-center ml-3"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Recording...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
} 
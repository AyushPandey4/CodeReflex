import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit } from "lucide-react";

export const SubmissionOverlay = ({ feedback }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-50 p-4">
    <BrainCircuit className="h-16 w-16 text-blue-500 mb-6 animate-pulse" />
    <h2 className="text-3xl font-bold text-white mb-4">
      Generating Your Feedback...
    </h2>
    <p className="text-gray-300 text-lg text-center max-w-2xl">{feedback}</p>
  </div>
);

export const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => (
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
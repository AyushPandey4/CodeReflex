import { motion } from "framer-motion";
import { Mic, Video } from "lucide-react";

export const PermissionsPrompt = ({
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
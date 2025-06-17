'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code, ChevronDown, ChevronUp, Play } from 'lucide-react'
import Editor from '@monaco-editor/react'

export function CodeEditor({ initialCode, onCodeChange, onSubmitCode, readOnly = false }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [code, setCode] = useState(initialCode)

  useEffect(() => {
    setCode(initialCode)
  }, [initialCode])

  const handleEditorChange = useCallback((value) => {
    setCode(value)
    onCodeChange(value)
  }, [onCodeChange])

  const handleSubmit = useCallback(() => {
    onSubmitCode(code)
  }, [code, onSubmitCode])

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Editor Header */}
      <div 
        className="flex items-center justify-between p-3 bg-gray-800/80 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Code className="w-5 h-5 text-indigo-400" />
          <span className="text-gray-300">Code Editor</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="text-gray-400 hover:text-gray-300"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* Editor Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="editor-content"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="h-[400px]">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={code}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  readOnly: readOnly
                }}
              />
            </div>
            {!readOnly && (
              <div className="p-3 bg-gray-800/80 border-t border-gray-700/50">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Submit Code</span>
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
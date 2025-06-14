'use client'

import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Code, ChevronDown, ChevronUp } from 'lucide-react'

export function CodeEditor({ initialCode, onCodeChange, readOnly = false, onSubmitCode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [code, setCode] = useState(initialCode || '// Your code here...')

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode)
    }
  }, [initialCode])

  const handleEditorChange = (value) => {
    setCode(value)
    if (onCodeChange) {
      onCodeChange(value)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex justify-between items-center p-4 bg-gray-700 rounded-t-lg"
      >
        <div className="flex items-center">
          <Code className="h-5 w-5 mr-2" />
          <h3 className="text-lg font-semibold">Code Editor</h3>
        </div>
        {isCollapsed ? <ChevronDown /> : <ChevronUp />}
      </button>

      {!isCollapsed && (
        <div className="border-t border-gray-600">
          <div>
            <Editor
              height="400px"
              language="javascript"
              theme="vs-dark"
              value={code}
              onChange={handleEditorChange}
              options={{
                readOnly: readOnly,
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
              }}
            />
          </div>
          {!readOnly && (
            <div className="p-2 bg-gray-700/50 flex justify-end border-t border-gray-600">
              <button 
                onClick={() => onSubmitCode(code)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-white text-sm"
              >
                Submit Code
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
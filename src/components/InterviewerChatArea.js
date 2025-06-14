'use client'

import { Bot } from 'lucide-react'

const TypingIndicator = () => (
  <div className="flex items-center space-x-2">
    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
  </div>
);

export function InterviewerChatArea({ messages, isAiTyping }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg min-h-[200px] flex flex-col">
      <h3 className="text-lg font-semibold mb-2">Interviewer</h3>
      <div className="space-y-4 flex-grow">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start space-x-3 ${msg.role === 'user' ? 'hidden' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="p-2 bg-blue-600 rounded-full">
                <Bot className="h-6 w-6" />
              </div>
            )}
            <div className="bg-gray-700 p-3 rounded-lg max-w-xl">
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {isAiTyping && (
           <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-600 rounded-full">
              <Bot className="h-6 w-6" />
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
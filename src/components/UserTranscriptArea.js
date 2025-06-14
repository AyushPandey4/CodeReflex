'use client'

import { Mic, MicOff } from 'lucide-react'

export function UserTranscriptArea({ isListening, transcript, startListening, stopListening }) {

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Your Response</h3>
        <button 
          onClick={isListening ? stopListening : startListening}
          className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-600 animate-pulse' : 'bg-blue-600'}`}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
      </div>
      <p className="text-gray-300 min-h-[50px] italic">
        {transcript ? transcript : 'Click the mic to start speaking...'}
      </p>
    </div>
  )
} 
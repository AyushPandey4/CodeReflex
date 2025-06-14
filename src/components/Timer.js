'use client'

import { useState, useEffect } from 'react'

export function Timer({ duration, onTimeUp }) {
  const [secondsLeft, setSecondsLeft] = useState(duration * 60)

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeUp()
      return
    }

    const intervalId = setInterval(() => {
      setSecondsLeft(secondsLeft - 1)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [secondsLeft, onTimeUp])

  const formatTime = () => {
    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  
  const timeColor = secondsLeft < 60 ? 'text-red-500' : 'text-white';

  return (
    <div className={`text-2xl font-mono ${timeColor}`}>
      {formatTime()}
    </div>
  )
} 
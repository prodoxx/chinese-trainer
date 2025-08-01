'use client'

import { useState, useEffect } from 'react'

interface AnimatedCursorProps {
  targetX: number
  targetY: number
  isVisible: boolean
  isClicking: boolean
  speed?: number
  onReachTarget?: () => void
}

export default function AnimatedCursor({ 
  targetX, 
  targetY, 
  isVisible, 
  isClicking, 
  speed = 800,
  onReachTarget 
}: AnimatedCursorProps) {
  const [position, setPosition] = useState({ x: targetX, y: targetY })
  const [isMoving, setIsMoving] = useState(false)

  useEffect(() => {
    if (!isVisible) return

    const currentX = position.x
    const currentY = position.y
    const deltaX = targetX - currentX
    const deltaY = targetY - currentY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (distance < 2) {
      onReachTarget?.()
      return
    }

    setIsMoving(true)
    const duration = Math.min(distance / speed * 1000, 2000) // Max 2 seconds

    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth movement
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      const newX = currentX + deltaX * easeProgress
      const newY = currentY + deltaY * easeProgress
      
      setPosition({ x: newX, y: newY })
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsMoving(false)
        onReachTarget?.()
      }
    }
    
    requestAnimationFrame(animate)
  }, [targetX, targetY, speed, onReachTarget])

  if (!isVisible) return null

  return (
    <div
      className="fixed pointer-events-none z-50 transition-transform duration-100"
      style={{
        left: position.x - 12,
        top: position.y - 4,
        transform: isClicking ? 'scale(0.9)' : 'scale(1)',
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`drop-shadow-lg ${isMoving ? 'animate-pulse' : ''}`}
      >
        <path
          d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"
          fill="white"
          stroke="black"
          strokeWidth="1"
        />
      </svg>
      
      {/* Click effect */}
      {isClicking && (
        <div className="absolute -top-2 -left-2 w-8 h-8 border-2 border-[#f7cc48] rounded-full animate-ping" />
      )}
    </div>
  )
}
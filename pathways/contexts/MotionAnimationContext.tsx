// motion-context.tsx
"use client"
import React, { createContext, useContext, useState } from "react"

const MotionContext = createContext({ isAnimating: false })

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [isAnimating, setIsAnimating] = useState(false)

  return (
    <MotionContext.Provider value={{ isAnimating, setIsAnimating }}>
      {children}
    </MotionContext.Provider>
  )
}

export function useMotionAnimation() {
  return useContext(MotionContext)
}

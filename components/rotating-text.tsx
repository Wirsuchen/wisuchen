'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

export type RotatingTextProps = {
  words?: string[]
  intervalMs?: number
  className?: string
  shuffle?: boolean
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function RotatingText({
  words = [
    'Opportunity',
    'Job',
    'Role',
    'Deal',
    'Offer',
    'Career',
    'Savings',
    'Promotion',
    'Contract',
    'Internship',
    'Remote Role',
    'Freelance Gig',
  ],
  intervalMs = 1800,
  className,
  shuffle = true,
}: RotatingTextProps) {
  const sequence = useMemo(() => (shuffle ? shuffleArray(words) : words), [words, shuffle])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (sequence.length <= 1) return
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % sequence.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [sequence, intervalMs])

  const current = sequence[idx] ?? ''

  return (
    <span className={className} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
          transition={{ type: 'spring', stiffness: 260, damping: 22, mass: 0.6 }}
          className="inline-block"
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

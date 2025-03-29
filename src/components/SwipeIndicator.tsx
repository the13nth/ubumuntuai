import { useLocation } from "react-router-dom"
import { IconChevronRight, IconChevronLeft } from "@tabler/icons-react"

export function SwipeIndicator({ swipeAmount = 0 }) {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="fixed top-1/2 -translate-y-1/2 pointer-events-none">
      {isHome ? (
        <div 
          className="right-4 fixed transition-opacity duration-200"
          style={{ opacity: Math.min(Math.abs(swipeAmount) / 50, 0.5) }}
        >
          <IconChevronRight className="text-zinc-400" size={32} />
        </div>
      ) : (
        <div 
          className="left-4 fixed transition-opacity duration-200"
          style={{ opacity: Math.min(Math.abs(swipeAmount) / 50, 0.5) }}
        >
          <IconChevronLeft className="text-zinc-400" size={32} />
        </div>
      )}
    </div>
  )
} 
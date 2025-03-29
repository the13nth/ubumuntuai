import { BrowserRouter as Router, Routes, Route, useLocation, Link, useNavigate } from "react-router-dom"
import { AppDashboard } from "./components/AppDashboard"
import { Context } from "./components/Context"
import { IconHome, IconBrain } from "@tabler/icons-react"
import { useSwipeable } from "react-swipeable"
import { SwipeIndicator } from "./components/SwipeIndicator"
import { useState } from "react"

function Navigation() {
  const location = useLocation()
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 p-3 sm:p-4">
      <div className="flex justify-around items-center max-w-sm mx-auto">
        <Link 
          to="/" 
          className={`p-1.5 sm:p-2 ${location.pathname === '/' ? 'text-zinc-100' : 'text-zinc-400'} hover:text-zinc-100`}
        >
          <IconHome size={22} />
        </Link>
        <Link 
          to="/context" 
          className={`p-1.5 sm:p-2 ${location.pathname === '/context' ? 'text-zinc-100' : 'text-zinc-400'} hover:text-zinc-100`}
        >
          <IconBrain size={22} />
        </Link>
      </div>
    </nav>
  )
}

function SwipeableRoutes() {
  const location = useLocation()
  const navigate = useNavigate()
  const [swipeAmount, setSwipeAmount] = useState(0)

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (location.pathname === '/') {
        navigate('/context')
      }
      setSwipeAmount(0)
    },
    onSwipedRight: () => {
      if (location.pathname === '/context') {
        navigate('/')
      }
      setSwipeAmount(0)
    },
    onSwiping: (data) => {
      setSwipeAmount(data.deltaX)
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  })

  return (
    <div {...handlers} className="h-full">
      <Routes>
        <Route path="/" element={<AppDashboard />} />
        <Route path="/context" element={<Context />} />
      </Routes>
      <SwipeIndicator swipeAmount={swipeAmount} />
    </div>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black">
        <SwipeableRoutes />
        <Navigation />
      </div>
    </Router>
  )
}

export default App

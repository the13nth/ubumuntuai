import { BrowserRouter as Router, Routes, Route, useLocation, Link, useNavigate } from "react-router-dom"
import { DashboardWrapper } from "./components/DashboardWrapper"
import { Context as ContextPage } from "./components/Context"
import { useSwipeable } from "react-swipeable"
import { SwipeIndicator } from "./components/SwipeIndicator"
import { useState } from "react"
import { HistoryPage } from './pages/HistoryPage'
import RagPage from './components/RagPage'

function Navigation() {
  const location = useLocation()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
      <div className="max-w-xl mx-auto flex justify-center space-x-6 p-4">
        <Link 
          to="/" 
          className={`text-sm ${location.pathname === '/' ? 'text-zinc-200' : 'text-zinc-500'}`}
        >
          Home
        </Link>
        <Link 
          to="/context" 
          className={`text-sm ${location.pathname === '/context' ? 'text-zinc-200' : 'text-zinc-500'}`}
        >
          Context
        </Link>
        <Link 
          to="/history" 
          className={`text-sm ${location.pathname === '/history' ? 'text-zinc-200' : 'text-zinc-500'}`}
        >
          Query History
        </Link>
        <Link 
          to="/rag" 
          className={`text-sm ${location.pathname === '/rag' ? 'text-zinc-200' : 'text-zinc-500'}`}
        >
          RAG Analytics
        </Link>
      </div>
    </div>
  )
}

function SwipeableRoutes() {
  const navigate = useNavigate()
  const location = useLocation()
  const [swipeAmount, setSwipeAmount] = useState(0)

  const handlers = useSwipeable({
    onSwiping: (event) => {
      if (location.pathname === "/" && event.deltaX < 0) {
        setSwipeAmount(event.deltaX)
      } else if (location.pathname === "/context" && event.deltaX > 0) {
        setSwipeAmount(event.deltaX)
      }
    },
    onSwipedLeft: () => {
      if (location.pathname === "/") {
        navigate("/context")
      }
    },
    onSwipedRight: () => {
      if (location.pathname === "/context") {
        navigate("/")
      }
    },
    onTouchEndOrOnMouseUp: () => {
      setSwipeAmount(0)
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  })

  return (
    <div {...handlers}>
      <SwipeIndicator swipeAmount={swipeAmount} />
      <Routes>
        <Route path="/" element={<DashboardWrapper />} />
        <Route path="/context" element={<ContextPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/rag" element={<RagPage />} />
      </Routes>
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

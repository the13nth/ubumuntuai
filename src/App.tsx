import { BrowserRouter as Router, Routes, Route, useLocation, Link, useNavigate } from "react-router-dom"
import { DashboardWrapper } from "./components/DashboardWrapper"
import { Context } from "./components/Context"
import { useSwipeable } from "react-swipeable"
import { SwipeIndicator } from "./components/SwipeIndicator"
import { useState } from "react"

function Navigation() {
  const location = useLocation()
  const isHome = location.pathname === "/"
  const isContext = location.pathname === "/context"

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex justify-center space-x-8">
          <Link
            to="/"
            className={`text-sm ${isHome ? "text-zinc-300" : "text-zinc-500"} hover:text-zinc-300 transition-colors`}
          >
            Home
          </Link>
          <Link
            to="/context"
            className={`text-sm ${isContext ? "text-zinc-300" : "text-zinc-500"} hover:text-zinc-300 transition-colors`}
          >
            Context
          </Link>
        </div>
      </div>
    </nav>
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
        <Route path="/context" element={<Context />} />
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

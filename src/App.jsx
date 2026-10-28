
import { useState } from 'react'
import BranchSelector from './components/BranchSelector.jsx'
import Login from './components/Login.jsx'
import HeaderBar from './components/HeaderBar.jsx'
import Dashboard from './components/Dashboard.jsx'

function App() {
  const [loginData, setLoginData] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [delayEnded, setDelayEnded] = useState(false)

  return (
    <main className="container py-5">
      {isLoggedIn ? (
        delayEnded ? (
          <Dashboard />
        ) : (
          <HeaderBar delay={5} onDelayEnded={setDelayEnded} />
        )
      ) : loginData ? (
        <BranchSelector
          branches={loginData.branches}
          token={loginData.access_token}
          onLogin={setIsLoggedIn}
        />
      ) : (
        <Login onLogin={setLoginData} />
      )}
    </main>
  )
}

export default App
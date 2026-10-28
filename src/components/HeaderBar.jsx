import { useEffect, useState } from 'react'

function HeaderBar({ delay = 5, onDelayEnded }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(false)
      onDelayEnded?.(true)
    }, delay * 1000)

    return () => window.clearTimeout(timeoutId)
  }, [delay, onDelayEnded])

  if (!isVisible) {
    return null
  }

  return (
    <div className="alert alert-success text-center" role="status">
      Logged in successfully.
      <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" />
    </div>
  )
}

export default HeaderBar
import { useState } from 'react'
import { login } from '../api/auth.js'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
          event.preventDefault()
          setError('')
          setIsSubmitting(true)

          let loginData
          try {
              loginData = await login(username, password)
          } catch (loginError) {
              setError(loginError instanceof Error ? loginError.message : 'Login failed.')
                return false
          } finally {
              setIsSubmitting(false)
              console.log("finished submitting")
          }

          onLogin?.(loginData)
             return true
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-sm-9 col-md-6 col-lg-4">
        <section className="card shadow-sm">
          <div className="card-body p-4">
            <h1 className="h3 card-title text-center mb-4">Sign in</h1>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  id="username"
                  className="form-control"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  className="form-control"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <button
                className="btn btn-primary w-100"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login

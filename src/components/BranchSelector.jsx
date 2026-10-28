import { useState } from 'react'
import { loginToBranch } from '../api/auth.js'

function BranchSelector({ branches, token, onLogin }) {
  const [selectedBranch, setSelectedBranch] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await loginToBranch(selectedBranch, token)
      console.log('Branch login successful 1')
      onLogin(true)
    } catch (loginError) {
      console.log('Error1')
      setError(
        loginError instanceof Error ? loginError.message : 'Branch login failed.',
      )
    } finally {
      console.log('Finally block executed')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-sm-9 col-md-6 col-lg-4">
        <section className="card shadow-sm">
          <div className="card-body p-4">
            <h1 className="h3 card-title text-center mb-4">Choose a branch</h1>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {branches.length === 0 ? (
              <p className="mb-0">No branches are available for this account.</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <fieldset className="mb-4">
                  <legend className="fs-6">Available branches</legend>
                  {branches.map((branch) => (
                    <div className="form-check mb-4" key={branch.id} >
                      <input
                        className="form-check-input"
                        type="radio"
                        name="branch"
                        id={`branch-${branch.id}`}
                        value={branch.id}
                        checked={selectedBranch === String(branch.id)}
                        onChange={(event) => setSelectedBranch(event.target.value)}
                        required
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`branch-${branch.id}`}
                      >
                        {branch.branchName}
                      </label>
                    </div>
                  ))}
                </fieldset>

                <button
                  className="btn btn-primary w-100"
                  type="submit"
                  disabled={isSubmitting || !selectedBranch}
                >
                  {isSubmitting ? 'Signing in…' : 'Continue'}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default BranchSelector

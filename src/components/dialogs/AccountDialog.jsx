import { useEffect, useState } from 'react'
import { getRestData, getSelectedBranch, api_cradle } from '../../api/auth.js'

function getFormValue(value) {
  if (value == null || typeof value === 'string' || typeof value === 'number') {
    return String(value ?? '')
  }

  if (typeof value === 'object') {
    return String(value.id ?? '')
  }

  return ''
}

function AccountDialog({
  account,
  isSaving,
  error,
  successMsg,
  onClose,
  onSave,
  onInputChange,
}) {
  const [accountGroups, setAccountGroups] = useState([])
  const [isLoadingGroups, setIsLoadingGroups] = useState(true)
  const [groupError, setGroupError] = useState('')
  const [form, setForm] = useState({
    id:account?.id ?? '',
    accDescription: account?.accDescription ?? '',
    accCode: getFormValue(account?.accCode),
    custCode: getFormValue(account?.accCode),
    grpCode: getFormValue(account?.grpCode),
  })

  useEffect(() => {
    let isMounted = true

    async function loadAccountGroups() {
      try {
        const branchId = getSelectedBranch()
        if (branchId == null) {
          throw new Error('No branch is selected.')
        }

        const endpoint = new URL(
            api_cradle.getAccountGroups
        )
        endpoint.searchParams.set('X-Branch-Id', String(branchId))

        const response = await getRestData(endpoint, { method: 'GET' })
        const groups = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : null

        if (!groups) {
          throw new Error('The account group response was not a list.')
        }

        if (isMounted) {
          setAccountGroups(groups)
        }
      } catch (loadError) {
        if (isMounted) {
          setGroupError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load account groups.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingGroups(false)
        }
      }
    }

    loadAccountGroups()

    return () => {
      isMounted = false
    }
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    onInputChange?.()
  }

  function clearForm() {
    setForm((current) => ({
      ...current,
      accDescription: '',
      accCode: '',
      custCode: '',
      grpCode: '',
    }))
    setGroupError('')
    onInputChange?.()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const selectedGroupId = Number(form.grpCode)
    if (
      !Number.isInteger(selectedGroupId) ||
      !accountGroups.some((group) => Number(group.id) === selectedGroupId)
    ) {
      setGroupError('Select a valid account group.')
      return
    }

    const saved = await onSave({
      data: {
          id: form.id,
          accDescription: form.accDescription,
          accCode: form.accCode,
          custCode: form.accCode,
          grpCodeId: selectedGroupId,
          grpCode: String(selectedGroupId)
      }
    })
    if (saved) {
      clearForm()
    }
  }

  return (
    <>
      <div className="modal-backdrop show account-dialog-backdrop" />
      <div
        className="modal d-block account-dialog-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-dialog-title"
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content account-dialog-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2 className="modal-title fs-5" id="account-dialog-title">
                  {account ? 'Edit Account' : 'Add Account'}
                </h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={onClose}
                  disabled={isSaving}
                />
              </div>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger" role="alert">{error}</div>
                )}
                {groupError && (
                  <div className="alert alert-danger" role="alert">{groupError}</div>
                )}
                {successMsg && (
                  <div className="alert alert-success" role="alert">{successMsg}</div>
                )}
                <div className="row g-3">
                  <div className="col-12">
                    <label htmlFor="account-description" className="form-label">
                      Account description
                    </label>
                    <input
                      id="account-description"
                      name="accDescription"
                      className="form-control"
                      value={form.accDescription}
                      onChange={updateField}
                      required
                      autoFocus
                      autoComplete='off'
                    />
                  </div>
                 
                  <div className="col-md-6">
                    <label htmlFor="account-group-code" className="form-label">
                      Account group
                    </label>
                    <select
                      id="account-group-code"
                      name="grpCode"
                      className="form-select"
                      value={form.grpCode}
                      onChange={updateField}
                      required
                      disabled={isLoadingGroups || Boolean(groupError)}
                    >
                      <option value="">
                        {isLoadingGroups
                          ? 'Loading account groups…'
                          : 'Select an account group'}
                      </option>
                      {accountGroups.map((group, index) => {
                        const groupCode = getFormValue(group.grpCode)
                        return (
                          <option
                            key={group.id ?? index}
                            value={String(group.id)}
                          >
                            {group.accDescription
                              ? `${groupCode} - ${group.accDescription}`
                              : groupCode || group.id}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="account-code" className="form-label">
                      Account code
                    </label>
                    <input
                      id="account-code"
                      name="accCode"
                      className="form-control"
                      value={form.accCode}
                      onChange={updateField}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-danger me-auto"
                  onClick={clearForm}
                  disabled={isSaving}
                >
                  Clear form
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving || isLoadingGroups || Boolean(groupError)}
                >
                  {isSaving ? 'Saving…' : account ? 'Save changes' : 'Add account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default AccountDialog

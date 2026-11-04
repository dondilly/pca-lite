import { useEffect, useState } from 'react'
import { api_cradle, getRestData, getSelectedBranch } from '../../api/auth.js'

function getAccountTypeId(value) {
  if (value == null || typeof value !== 'object') {
    return String(value ?? '')
  }
  return String(value.id ?? '')
}

function AccountGroupsDialog({
  account,
  isSaving,
  error,
  successMsg,
  onClose,
  onSave,
  onInputChange,
}) {
  const [accountTypes, setAccountTypes] = useState([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)
  const [typeError, setTypeError] = useState('')
  const [form, setForm] = useState({
    id: account?.id ?? '',
    accDescription: account?.accDescription ?? '',
    grpCode: account?.grpCode ?? '',
    accTypeId: getAccountTypeId(account?.accType),
  })

  useEffect(() => {
    let isMounted = true

    async function loadAccountTypes() {
      try {
        const branchId = getSelectedBranch()
        if (branchId == null) {
          throw new Error('No branch is selected.')
        }

        const endpoint = new URL(api_cradle.getAccountTypes)
        endpoint.searchParams.set('X-Branch-Id', String(branchId))
        const response = await getRestData(endpoint)
        const types = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : null

        if (!types) {
          throw new Error('The account type response was not a list.')
        }

        if (isMounted) {
          setAccountTypes(types)
        }
      } catch (loadError) {
        if (isMounted) {
          setTypeError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load account types.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingTypes(false)
        }
      }
    }

    loadAccountTypes()
    return () => {
      isMounted = false
    }
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    onInputChange?.()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const selectedTypeId = Number(form.accTypeId)
    if (
      !Number.isInteger(selectedTypeId) ||
      !accountTypes.some((type) => Number(type.id) === selectedTypeId)
    ) {
      setTypeError('Select a valid account type.')
      return
    }

    await onSave({
      data : {
          id: form.id,
          accDescription: form.accDescription,
          grpCode: form.grpCode,
          custCode:form.grpCode,
          accType: selectedTypeId
      }
    })
  }

  return (
    <>
      <div className="modal-backdrop show account-dialog-backdrop" />
      <div
        className="modal d-block account-dialog-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-group-dialog-title"
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content account-dialog-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2 className="modal-title fs-5" id="account-group-dialog-title">
                  {account ? 'Edit Account Group' : 'Add Account Group'}
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
                {error && <div className="alert alert-danger" role="alert">{error}</div>}
                {typeError && <div className="alert alert-danger" role="alert">{typeError}</div>}
                {successMsg && <div className="alert alert-success" role="alert">{successMsg}</div>}
                <div className="mb-3">
                  <label htmlFor="account-group-description" className="form-label">
                    Account group description
                  </label>
                  <input
                    id="account-group-description"
                    name="accDescription"
                    className="form-control"
                    value={form.accDescription}
                    onChange={updateField}
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="account-group-code" className="form-label">
                      Group code
                    </label>
                    <input
                      id="account-group-code"
                      name="grpCode"
                      className="form-control"
                      value={form.grpCode}
                      onChange={updateField}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="account-group-type" className="form-label">
                      Account type
                    </label>
                    <select
                      id="account-group-type"
                      name="accTypeId"
                      className="form-select"
                      value={form.accTypeId}
                      onChange={updateField}
                      disabled={isLoadingTypes || Boolean(typeError)}
                      required
                    >
                      <option value="">
                        {isLoadingTypes ? 'Loading account types…' : 'Select an account type'}
                      </option>
                      {accountTypes.map((type) => (
                        <option key={type.id} value={String(type.id)}>
                          {type.accDescription ?? type.accType ?? type.code ?? type.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
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
                  disabled={isSaving || isLoadingTypes || Boolean(typeError)}
                >
                  {isSaving ? 'Saving…' : account ? 'Save changes' : 'Add account group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default AccountGroupsDialog

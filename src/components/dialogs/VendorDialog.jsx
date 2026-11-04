import { useState } from 'react'

const emptyVendor = {
  companyName: '',
  phoneNumber: '',
  email: '',
  address: '',
  currency: '',
}

function getInitialForm(vendor) {
  return {
    id: vendor?.id ?? '',
    ...Object.fromEntries(
      Object.keys(emptyVendor).map((field) => [
        field,
        vendor?.[field] == null ? '' : String(vendor[field]),
      ]),
    ),
  }
}

function VendorDialog({
  vendor,
  isSaving,
  error,
  successMsg,
  onClose,
  onSave,
  onInputChange,
}) {
  const [form, setForm] = useState(() => getInitialForm(vendor))

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    onInputChange?.()
  }

  function clearForm() {
    setForm((current) => ({ ...current, ...emptyVendor }))
    onInputChange?.()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const saved = await onSave({ data: { ...form } })
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
        aria-labelledby="vendor-dialog-title"
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content account-dialog-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2 className="modal-title fs-5" id="vendor-dialog-title">
                  {vendor ? 'Edit Vendor' : 'Add Vendor'}
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
                {successMsg && <div className="alert alert-success" role="alert">{successMsg}</div>}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="vendor-name" className="form-label">
                      Vendor name
                    </label>
                    <input
                      id="vendor-name"
                      name="companyName"
                      className="form-control"
                      value={form.companyName}
                      onChange={updateField}
                      autoComplete="off"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="vendor-phone" className="form-label">
                      Phone number
                    </label>
                    <input
                      id="vendor-phone"
                      name="phoneNumber"
                      type="tel"
                      className="form-control"
                      value={form.phoneNumber}
                      onChange={updateField}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="vendor-email" className="form-label">
                      Email
                    </label>
                    <input
                      id="vendor-email"
                      name="email"
                      type="email"
                      className="form-control"
                      value={form.email}
                      onChange={updateField}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="vendor-currency" className="form-label">
                      Currency
                    </label>
                    <input
                      id="vendor-currency"
                      name="currency"
                      className="form-control"
                      value={form.currency}
                      onChange={updateField}
                    />
                  </div>
                  <div className="col-12">
                    <label htmlFor="vendor-address" className="form-label">
                      Address
                    </label>
                    <textarea
                      id="vendor-address"
                      name="address"
                      className="form-control"
                      rows="2"
                      value={form.address}
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
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving…' : vendor ? 'Save changes' : 'Add vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default VendorDialog

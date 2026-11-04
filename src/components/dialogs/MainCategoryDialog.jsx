import { useState } from 'react'

const emptyMainCategory = {
  itemCategoryName: '',
  discontinued: false,
}

function getInitialForm(category) {
  return {
    id: category?.id ?? '',
    itemCategoryName: category?.itemCategoryName ?? '',
    discontinued:
      category?.discontinued === true ||
      category?.discontinued === 1 ||
      ['true', '1', 'yes', 'y'].includes(
        String(category?.discontinued ?? '').toLowerCase(),
      ),
  }
}

function MainCategoryDialog({
  category,
  isSaving,
  error,
  successMsg,
  onClose,
  onSave,
  onInputChange,
}) {
  const [form, setForm] = useState(() => getInitialForm(category))

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
    onInputChange?.()
  }

  function clearForm() {
    setForm((current) => ({ ...current, ...emptyMainCategory }))
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
        aria-labelledby="main-category-dialog-title"
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content account-dialog-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2 className="modal-title fs-5" id="main-category-dialog-title">
                  {category ? 'Edit Main Category' : 'Add Main Category'}
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
                  <div className="col-12">
                    <label htmlFor="main-category-name" className="form-label">
                      Main category name
                    </label>
                    <input
                      id="main-category-name"
                      name="itemCategoryName"
                      className="form-control"
                      value={form.itemCategoryName}
                      onChange={updateField}
                      autoComplete="off"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="col-12">
                    <div className="form-check">
                      <input
                        id="main-category-discontinued"
                        name="discontinued"
                        type="checkbox"
                        className="form-check-input"
                        checked={form.discontinued}
                        onChange={updateField}
                      />
                      <label
                        htmlFor="main-category-discontinued"
                        className="form-check-label"
                      >
                        Discontinued
                      </label>
                    </div>
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
                  {isSaving ? 'Saving…' : category ? 'Save changes' : 'Add category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default MainCategoryDialog

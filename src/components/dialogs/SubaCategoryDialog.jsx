import { useEffect, useState } from 'react'
import { api_cradle, getRestData, getSelectedBranch } from '../../api/auth.js'

const emptySubCategory = {
  itemSubCategoryName: '',
  category: '',
  priceCode: '',
  discontinued: false,
}

function getCategoryId(category) {
  if (category == null) {
    return ''
  }
  if (typeof category === 'object') {
    return String(category.id ?? '')
  }
  return String(category)
}

function getInitialForm(category) {
  return {
    id: category?.id ?? '',
    itemSubCategoryName: category?.itemSubCategoryName ?? '',
    category: getCategoryId(category?.category ?? category?.categoryId),
    priceCode: category?.priceCode ?? '',
    discontinued:
      category?.discontinued === true ||
      category?.discontinued === 1 ||
      ['true', '1', 'yes', 'y'].includes(
        String(category?.discontinued ?? '').toLowerCase(),
      ),
  }
}

function SubaCategoryDialog({
  category,
  isSaving,
  error,
  successMsg,
  onClose,
  onSave,
  onInputChange,
}) {
  const [form, setForm] = useState(() => getInitialForm(category))
  const [mainCategories, setMainCategories] = useState([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [categoryError, setCategoryError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadMainCategories() {
      try {
        const branchId = getSelectedBranch()
        if (branchId == null) {
          throw new Error('No branch is selected.')
        }

        const endpoint = new URL(api_cradle.getMainCategories)
        endpoint.searchParams.set('X-Branch-Id', String(branchId))
        const response = await getRestData(endpoint)
        const categories = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : null

        if (!categories) {
          throw new Error('The main category response was not a list.')
        }

        if (isMounted) {
          setMainCategories(categories)
          setForm((current) => {
            if (
              categories.some(
                (mainCategory) => String(mainCategory.id) === current.category,
              )
            ) {
              return current
            }

            const matchingCategory = categories.find(
              (mainCategory) =>
                mainCategory.itemCategoryName === current.category,
            )
            return matchingCategory
              ? { ...current, category: String(matchingCategory.id) }
              : current
          })
        }
      } catch (loadError) {
        if (isMounted) {
          setCategoryError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load main categories.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false)
        }
      }
    }

    loadMainCategories()
    return () => {
      isMounted = false
    }
  }, [])

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
    onInputChange?.()
  }

  function clearForm() {
    setForm((current) => ({ ...current, ...emptySubCategory }))
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
        aria-labelledby="sub-category-dialog-title"
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content account-dialog-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2 className="modal-title fs-5" id="sub-category-dialog-title">
                  {category ? 'Edit Subcategory' : 'Add Subcategory'}
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
                {categoryError && (
                  <div className="alert alert-danger" role="alert">{categoryError}</div>
                )}
                {successMsg && <div className="alert alert-success" role="alert">{successMsg}</div>}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="sub-category-name" className="form-label">
                      Subcategory name
                    </label>
                    <input
                      id="sub-category-name"
                      name="itemSubCategoryName"
                      className="form-control"
                      value={form.itemSubCategoryName}
                      onChange={updateField}
                      autoComplete="off"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="sub-category-main-category" className="form-label">
                      Main category
                    </label>
                    <select
                      id="sub-category-main-category"
                      name="category"
                      className="form-select"
                      value={form.category}
                      onChange={updateField}
                      required
                      disabled={isLoadingCategories || Boolean(categoryError)}
                    >
                      <option value="">
                        {isLoadingCategories
                          ? 'Loading main categories…'
                          : 'Select a main category'}
                      </option>
                      {mainCategories.map((mainCategory, index) => (
                        <option
                          key={mainCategory.id ?? index}
                          value={String(mainCategory.id)}
                        >
                          {mainCategory.itemCategoryName || mainCategory.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="sub-category-price-code" className="form-label">
                      Price code
                    </label>
                    <input
                      id="sub-category-price-code"
                      name="priceCode"
                      className="form-control"
                      value={form.priceCode}
                      onChange={updateField}
                    />
                  </div>
                  <div className="col-12">
                    <div className="form-check">
                      <input
                        id="sub-category-discontinued"
                        name="discontinued"
                        type="checkbox"
                        className="form-check-input"
                        checked={form.discontinued}
                        onChange={updateField}
                      />
                      <label
                        htmlFor="sub-category-discontinued"
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
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving || isLoadingCategories || Boolean(categoryError)}
                >
                  {isSaving ? 'Saving…' : category ? 'Save changes' : 'Add subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default SubaCategoryDialog

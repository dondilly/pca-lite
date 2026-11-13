import { useState, useEffect } from 'react'
import { getRestData, getSelectedBranch, api_cradle } from '../../api/auth.js'
import { ImageUpload } from '../utilityComponents/ImageUpload.jsx'


const emptyItem = {
  itemName: '',
  itemDescription: '',
  itemType: '',
  qtyUnit: '',
  category: '',
  sku: '',
  costPrice: '',
  sellingPrice: '',
  imageStr: '',
  imageThumbnail: '',
}

function getInitialForm(item) {
  return {
    id: item?.id ?? '',
    ...Object.fromEntries(
      Object.keys(emptyItem).map((field) => [
        field,
        item?.[field] == null ? '' : String(item[field]),
      ]),
    ),
  }
}

function ItemDialog({
  item,
  isSaving,
  error,
  successMsg,
  onClose,
  onSave,
  onInputChange,
}) {
  const [form, setForm] = useState(() => getInitialForm(item))
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(
    item?.imageThumbnail || item?.imageStr || '',
  )
  const [imageError, setImageError] = useState('')
 
  const [isLoadingItemTypes, setIsLoadingItemTypes] = useState(true)
  const [itemTypes, setItemTypes] = useState([])
  const [qtyUnits, setQtyUnits] = useState([])
  const [categories, setCategories] = useState([])
  const [groupError, setGroupError] = useState('')

  useEffect(() => {
      let isMounted = true
  
      async function loadItemTypes() {
        try {
          const branchId = getSelectedBranch()
          if (branchId == null) {
            throw new Error('No branch is selected.')
          }
  
          const endpoint = new URL(api_cradle.getItemTypes)
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
            setItemTypes(types)
          }
           const endpoint2 = new URL(api_cradle.getPackageUnits)
          endpoint2.searchParams.set('X-Branch-Id', String(branchId))
          const response2 = await getRestData(endpoint2)
          const pkgUnits = Array.isArray(response2)
            ? response2
            : Array.isArray(response2?.data)
              ? response2.data
              : null
  
          if (!pkgUnits) {
            throw new Error('The package unit response was not a list.')
          }
          if (isMounted) {
            setQtyUnits(pkgUnits)
          }

          const endpoint3 = new URL(api_cradle.getSubCategories)
          endpoint3.searchParams.set('X-Branch-Id', String(branchId))
          const response3 = await getRestData(endpoint3)
          const categories = Array.isArray(response3)
            ? response3
            : Array.isArray(response3?.data)
              ? response3.data
              : null
  
          if (!categories) {
            throw new Error('The categories response was not a list.')
          }
          if (isMounted) {
             setCategories(categories)
          }
        } catch (loadError) {
          if (isMounted) {
            setGroupError(
              loadError instanceof Error
                ? loadError.message
                : 'Unable to load.',
            )
          }
        } finally {
          if (isMounted) {
            setIsLoadingItemTypes(false)
          }
        }
      }
  
      loadItemTypes()
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
      ...emptyItem,
    }))
    setImageFile(null)
    setImagePreview('')
    setImageError('')
    onInputChange?.()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (imageError) {
      return
    }

    const itemData = { 
         data: {
              ...form
         }

     }
    for (const field of ['costPrice', 'sellingPrice']) {
      if (itemData.data[field] !== '') {
        const numericValue = Number(itemData.data[field])
        if (!Number.isFinite(numericValue)) {
          return
        }
        itemData.data[field] = numericValue
      }
    }

    const saved = await onSave({ data: itemData, imageFile })
    if (saved && typeof saved === 'object' && saved.imageStr) {
      setForm((current) => ({ ...current, imageStr: saved.imageStr }))
      setImagePreview(saved.imageStr)
      setImageFile(null)
      setImageError('')
    }

    if (saved && !item) {
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
        aria-labelledby="item-dialog-title"
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content account-dialog-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2 className="modal-title fs-5" id="item-dialog-title">
                  {item ? 'Edit Item' : 'Add Item'}
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
                {groupError && <div className="alert alert-danger" role="alert">{groupError}</div>}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="item-name" className="form-label">Item code/name</label>
                    <input
                      id="item-name"
                      name="itemName"
                      className="form-control"
                      value={form.itemName}
                      onChange={updateField}
                      autoComplete="off"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="item-type" className="form-label">
                      Item Type
                    </label>
                    <select
                      id="item-type"
                      name="itemType"
                      className="form-select"
                      value={form.itemType}
                      onChange={updateField}
                      required
                      disabled={isLoadingItemTypes|| Boolean(groupError)}
                    >
                      <option value="">
                        {isLoadingItemTypes
                          ? 'Loading item Types…'
                          : 'Select an item type'}
                      </option>
                      {itemTypes.map((itmTyp, index) => (
                          <option
                            key={itmTyp.id ?? index}
                            value={String(itmTyp.id)}
                          >
                            {itmTyp.itemType
                              ? `${itmTyp.itemType}`
                              : `${itmTyp.id}` }
                          </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label htmlFor="item-description" className="form-label">Description</label>
                    <textarea
                      id="item-description"
                      name="itemDescription"
                      className="form-control"
                      rows="2"
                      value={form.itemDescription}
                      required
                      onChange={updateField}
                    />
                  </div>
                 <div className="col-md-6">
                    <label htmlFor="qtyUnit" className="form-label">
                      Pkg. Units
                    </label>
                    <select
                      id="qty-unit"
                      name="qtyUnit"
                      className="form-select"
                      value={form.qtyUnit}
                      onChange={updateField}
                      required
                      disabled={isLoadingItemTypes|| Boolean(groupError)}
                    >
                      <option value="">
                        {isLoadingItemTypes
                          ? 'Loading Package Units'
                          : 'Select Package Unit'}
                      </option>
                      {qtyUnits.map((qu, index) => (
                          <option
                            key={qu.id ?? index}
                            value={String(qu.id)}
                          >
                            {qu
                              ? `${qu.quantityUnitName}`
                              : `${qu.id}` }
                          </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <ImageUpload
                      imageFile={imageFile}
                      setImageFile={setImageFile}
                      imagePreview={imagePreview}
                      setImagePreview={setImagePreview}
                      imageError={imageError}
                      setImageError={setImageError}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="categories" className="form-label">
                      Item Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      className="form-select"
                      value={form.category}
                      onChange={updateField}
                      required
                      disabled={isLoadingItemTypes|| Boolean(groupError)}
                    >
                      <option value="">
                        {isLoadingItemTypes
                          ? 'Loading Item Categories'
                          : 'Select Item Category'}
                      </option>
                      {categories.map((ct, index) => (
                          <option
                            key={ct.id ?? index}
                            value={String(ct.id)}
                          >
                            {ct
                              ? `${ct.itemSubCategoryName}`
                              : `${ct.id}` }
                          </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="item-sku" className="form-label">SKU</label>
                    <input
                      id="item-sku"
                      name="sku"
                      className="form-control"
                      value={form.sku}
                      onChange={updateField}
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="item-unit-cost" className="form-label">Unit cost</label>
                    <input
                      id="item-unit-cost"
                      name="costPrice"
                      type="number"
                      min="0"
                      step="any"
                      className="form-control"
                      value={form.costPrice}
                      onChange={updateField}
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="item-unit-price" className="form-label">Unit price</label>
                    <input
                      id="item-unit-price"
                      name="sellingPrice"
                      type="number"
                      min="0"
                      step="any"
                      className="form-control"
                      value={form.sellingPrice}
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
                  {isSaving ? 'Saving…' : item ? 'Save changes' : 'Add item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default ItemDialog
import { useEffect, useState } from 'react'
import { getRestData, getSelectedBranch, postRestData } from '../api/auth.js'
import DataTable from './DataTable.jsx'
import SubaCategoryDialog from './dialogs/SubaCategoryDialog.jsx'

const subCategoryColumns = [
  {
    id: 'subCategoryName',
    name: 'Sub Category',
    selector: (category) => category.itemSubCategoryName ?? '',
    sortable: true,
  },
  {
    id: 'mainCategoryName',
    name: 'Main Category',
    selector: (category) => category.category ?? '',
    sortable: true,
  },
  {
    id: 'priceCode',
    name: 'Price Code',
    selector: (category) => category.priceCode ?? '',
    sortable: true,
  },
  {
    id: 'discontinued',
    name: 'Discontinued',
    selector: (category) => category.discontinued ?? '',
    sortable: true,
  },
]

async function getSubCategories() {
  const branchId = getSelectedBranch()
  if (branchId == null) {
    throw new Error('No branch is selected.')
  }

  const endpoint = new URL(
    'http://localhost:8080/Inventory/api/itemSubCategories/getItemSubCategories',
  )
  endpoint.searchParams.set('X-Branch-Id', String(branchId))

  const response = await getRestData(endpoint)
  const subCategories = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : null

  if (!subCategories) {
    throw new Error('The subcategory response was not a list.')
  }

  return subCategories
}

function SubCategories() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [subCategories, setSubCategories] = useState([])
  const [dialogCategory, setDialogCategory] = useState(undefined)
  const [dialogError, setDialogError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSubCategories() {
      try {
        const categoryData = await getSubCategories()
        if (isMounted) {
          setSubCategories(categoryData)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load subcategories.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSubCategories()

    return () => {
      isMounted = false
    }
  }, [])

  function openAddDialog() {
    setDialogError('')
    setSuccessMsg('')
    setDialogCategory(null)
  }

  function openEditDialog(category) {
    setDialogError('')
    setSuccessMsg('')
    setDialogCategory(category)
  }

  async function saveSubCategory(form) {
    const branchId = getSelectedBranch()
    if (branchId == null) {
      setDialogError('No branch is selected.')
      return false
    }

    const isEditing = dialogCategory !== null
    if (isEditing && (dialogCategory?.id == null || dialogCategory.id === '')) {
      setDialogError('This subcategory does not have an ID and cannot be updated.')
      return false
    }

    const endpoint = new URL(
      'http://localhost:8080/Inventory/api/itemSubCategories/saveData',
    )
    endpoint.searchParams.set('X-Branch-Id', String(branchId))
    if (isEditing) {
      endpoint.searchParams.set('id', String(dialogCategory.id))
    }

    const payload = {
      ...(isEditing ? dialogCategory : {}),
      ...form,
    }

    setIsSaving(true)
    setDialogError('')
    try {
      const result = await postRestData(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        body: payload,
      })
      if (result && !result.code) {
        setDialogError(result.errs || result.msg || 'Unable to save the subcategory.')
        return false
      }

      const refreshedCategories = await getSubCategories()
      setSubCategories(refreshedCategories)
      setSuccessMsg(result?.msg || 'Subcategory saved successfully.')
      return true
    } catch (saveError) {
      setDialogError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save the subcategory.',
      )
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container-fluid p-4 p-lg-4">
      <div className="mb-4">
        <h1 className="h3 mb-0">Sub Category</h1>
      </div>
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary" onClick={openAddDialog}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Add Subcategory
        </button>
      </div>
      <DataTable
        title="Subcategories"
        data={subCategories}
        columns={subCategoryColumns}
        fileName="sub-categories"
        searchPlaceholder="Search subcategories"
        emptyMessage="No subcategory data available."
        isLoading={isLoading}
        error={error}
        onEdit={openEditDialog}
      />
      {dialogCategory !== undefined && (
        <SubaCategoryDialog
          key={dialogCategory?.id ?? 'new-sub-category'}
          category={dialogCategory}
          isSaving={isSaving}
          error={dialogError}
          successMsg={successMsg}
          onClose={() => {
            setDialogCategory(undefined)
            setDialogError('')
          }}
          onSave={saveSubCategory}
          onInputChange={() => setSuccessMsg('')}
        />
      )}
    </div>
  )
}

export default SubCategories
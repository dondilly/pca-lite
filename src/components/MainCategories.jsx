import { useEffect, useState } from 'react'
import { getRestData, getSelectedBranch, postRestData } from '../api/auth.js'
import DataTable from './DataTable.jsx'
import MainCategoryDialog from './dialogs/MainCategoryDialog.jsx'

const mainCategoryColumns = [
  {
    id: 'itemCategoryName',
    name: 'Main Category',
    selector: (category) => category.itemCategoryName ?? '',
    sortable: true,
  },
  {
    id: 'discontinued',
    name: 'Discontinued',
    selector: (category) => category.discontinued ?? '',
    sortable: true,
  },
]

async function getMainCategories() {
  const branchId = getSelectedBranch()
  if (branchId == null) {
    throw new Error('No branch is selected.')
  }

  const endpoint = new URL(
    'http://localhost:8080/Inventory/api/itemCategories/getItemCategories'
  )
  endpoint.searchParams.set('X-Branch-Id', String(branchId))

  const response = await getRestData(endpoint)
  const mainCategories = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : null

  if (!mainCategories) {
    throw new Error('The main category response was not a list.')
  }

  return mainCategories
}

function MainCategories() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [mainCategories, setMainCategories] = useState([])
  const [dialogCategory, setDialogCategory] = useState(undefined)
  const [dialogError, setDialogError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadMainCategories() {
      try {
        const categoryData = await getMainCategories()
        if (isMounted) {
          setMainCategories(categoryData)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load main categories.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadMainCategories()

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

  async function saveMainCategory(form) {
    const branchId = getSelectedBranch()
    if (branchId == null) {
      setDialogError('No branch is selected.')
      return false
    }

    const isEditing = dialogCategory !== null
    if (isEditing && (dialogCategory?.id == null || dialogCategory.id === '')) {
      setDialogError('This main category does not have an ID and cannot be updated.')
      return false
    }

    const endpoint = new URL(
      'http://localhost:8080/Inventory/api/itemCategories/saveData',
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
        setDialogError(result.errs || result.msg || 'Unable to save the main category.')
        return false
      }

      const refreshedCategories = await getMainCategories()
      setMainCategories(refreshedCategories)
      setSuccessMsg(result?.msg || 'Main category saved successfully.')
      return true
    } catch (saveError) {
      setDialogError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save the main category.',
      )
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container-fluid p-4 p-lg-4">
      <div className="mb-4">
        <h1 className="h3 mb-0">Main Category</h1>
      </div>
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary" onClick={openAddDialog}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Add Main Category
        </button>
      </div>
      <DataTable
        title="Main Categories"
        data={mainCategories}
        columns={mainCategoryColumns}
        fileName="main-categories"
        searchPlaceholder="Search main categories"
        emptyMessage="No main category data available."
        isLoading={isLoading}
        error={error}
        onEdit={openEditDialog}
      />
      {dialogCategory !== undefined && (
        <MainCategoryDialog
          key={dialogCategory?.id ?? 'new-main-category'}
          category={dialogCategory}
          isSaving={isSaving}
          error={dialogError}
          successMsg={successMsg}
          onClose={() => {
            setDialogCategory(undefined)
            setDialogError('')
          }}
          onSave={saveMainCategory}
          onInputChange={() => setSuccessMsg('')}
        />
      )}
    </div>
  )
}

export default MainCategories
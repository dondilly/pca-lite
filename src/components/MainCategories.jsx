import { useEffect, useState } from 'react'
import { getRestData, getSelectedBranch } from '../api/auth.js'
import DataTable from './DataTable.jsx'

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

  return (
    <div className="container-fluid p-4 p-lg-4">
      <div className="mb-4">
        <h1 className="h3 mb-0">Main Category</h1>
      </div>
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary">
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
      />
    </div>
  )
}

export default MainCategories
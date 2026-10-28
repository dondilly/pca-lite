import { useEffect, useState } from 'react'
import { getRestData, getSelectedBranch } from '../api/auth.js'
import DataTable from './DataTable.jsx'

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

  return (
    <div className="container-fluid p-4 p-lg-4">
      <div className="mb-4">
        <h1 className="h3 mb-0">Sub Category</h1>
      </div>
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary">
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
      />
    </div>
  )
}

export default SubCategories
import { useEffect, useState } from 'react'
import { getRestData, getSelectedBranch } from '../api/auth.js'
import DataTable from './DataTable.jsx'

const itemColumns = [
  {
    id: 'itemName',
    name: 'Item Code/Name',
    selector: (item) => item.itemName ?? '',
    sortable: true,
  },
  {
    id: 'itemDescription',
    name: 'Description',
    selector: (item) => item.itemDescription ?? '',
    sortable: true,
  },
  {
    id: 'itemType',
    name: 'Type',
    selector: (item) => item.itemType ?? '',
    sortable: true,
  },
  {
    id: 'qtyUnit',
    name: 'Quantity Unit',
    selector: (item) => item.qtyUnit ?? '',
    sortable: true,
  },
  {
    id: 'category',
    name: 'Category',
    selector: (item) => item.category ?? '',
    sortable: true,
  },
  {
    id: 'sku',
    name: 'SKU',
    selector: (item) => item.sku ?? '',
    sortable: true,
  },
  {
    id: 'unitCost',
    name: 'Unit Cost',
    selector: (item) => item.unitCost ?? '',
    sortable: true,
  },
  {
    id: 'unitPrice',
    name: 'Unit Price',
    selector: (item) => item.unitPrice ?? '',
    sortable: true,
  },
]

async function getItems() {
  const branchId = getSelectedBranch()
  if (branchId == null) {
    throw new Error('No branch is selected.')
  }

  const endpoint = new URL(
    'http://localhost:8080/Inventory/api/items/getItems',
  )
  endpoint.searchParams.set('X-Branch-Id', String(branchId))

  const response = await getRestData(endpoint)
  const items = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : null

  if (!items) {
    throw new Error('The items response was not a list.')
  }

  return items
}

function Items() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])

  useEffect(() => {
    let isMounted = true

    async function loadItems() {
      try {
        const itemData = await getItems()
        if (isMounted) {
          setItems(itemData)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load items.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadItems()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="container-fluid p-4 p-lg-4">
      <div className="mb-4">
        <h1 className="h3 mb-0">Items</h1>
      </div>
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Add Item
        </button>
      </div>
      <DataTable
        title="Items ranked by sales"
        data={items}
        columns={itemColumns}
        fileName="items"
        searchPlaceholder="Search items"
        emptyMessage="No item data available."
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}

export default Items

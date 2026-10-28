import { useEffect, useState } from 'react'
import { getRestData, getSelectedBranch } from '../api/auth.js'
import DataTable from './DataTable.jsx'

const customerColumns = [
  {
    id: 'customer',
    name: 'Customer Name',
    selector: (customer) => customer.customersName ?? '',
    sortable: true,
  },
  {
    id: 'phoneNumber',
    name: 'Phone #',
    selector: (customer) => customer.phoneNumber ?? '',
    sortable: true,
  },
  {
    id: 'email',
    name: 'Email',
    selector: (customer) => customer.email ?? '',
    sortable: true,
  },
  {
    id: 'address',
    name: 'Address',
    selector: (customer) => customer.address ?? '',
    sortable: true,
  },
  {
    id: 'currency',
    name: 'Currency',
    selector: (customer) => customer.currency ?? '',
    sortable: true,
  },
]

async function getCustomers() {
  const branchId = getSelectedBranch()
  if (branchId == null) {
    throw new Error('No branch is selected.')
  }

  const endpoint = new URL(
    'http://localhost:8080/Inventory/api/customers/getCustomers',
  )
  endpoint.searchParams.set('X-Branch-Id', String(branchId))

  const response = await getRestData(endpoint)
  const customers = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : null

  if (!customers) {
    throw new Error('The customer response was not a list.')
  }

  return customers
}

function Customers() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    let isMounted = true

    async function loadCustomers() {
      try {
        const customerData = await getCustomers()
        if (isMounted) {
          setCustomers(customerData)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load customers.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadCustomers()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="container-fluid p-4 p-lg-4">
      <div className="mb-4">
        <h1 className="h3 mb-0">Customers</h1>
      </div>
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Add Customer
        </button>
      </div>
      <DataTable
        title="Customers ranked by sales"
        data={customers}
        columns={customerColumns}
        fileName="customers"
        searchPlaceholder="Search customers"
        emptyMessage="No customer data available."
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}

export default Customers

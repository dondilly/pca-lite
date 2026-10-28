import { useEffect, useState } from 'react'
import { getRestData, getSelectedBranch } from '../api/auth.js'
import DataTable from './DataTable.jsx'

const vendorColumns = [
  {
    id: 'companyName',
    name: 'Vendor Name',
    selector: (vendor) => vendor.companyName ?? '',
    sortable: true,
  },
  {
    id: 'phoneNumber',
    name: 'Phone #',
    selector: (vendor) => vendor.phoneNumber ?? '',
    sortable: true,
  },
  {
    id: 'email',
    name: 'Email',
    selector: (vendor) => vendor.email ?? '',
    sortable: true,
  },
  {
    id: 'address',
    name: 'Address',
    selector: (vendor) => vendor.address ?? '',
    sortable: true,
  },
  {
    id: 'currency',
    name: 'Currency',
    selector: (vendor) => vendor.currency ?? '',
    sortable: true,
  },
]

async function getVendors() {
  const branchId = getSelectedBranch()
  if (branchId == null) {
    throw new Error('No branch is selected.')
  }

  const endpoint = new URL(
    'http://localhost:8080/Inventory/api/vendors/getVendors',
  )
  endpoint.searchParams.set('X-Branch-Id', String(branchId))

  const response = await getRestData(endpoint)
  const vendors = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : null

  if (!vendors) {
    throw new Error('The vendor response was not a list.')
  }

  return vendors
}

function Vendors() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [vendors, setVendors] = useState([])

  useEffect(() => {
    let isMounted = true

    async function loadVendors() {
      try {
        const vendorData = await getVendors()
        if (isMounted) {
          setVendors(vendorData)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load vendors.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadVendors()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="container-fluid p-4 p-lg-4">
      <div className="mb-4">
        <h1 className="h3 mb-0">Vendors</h1>
      </div>
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Add Vendor
        </button>
      </div>
      <DataTable
        title="Vendors"
        data={vendors}
        columns={vendorColumns}
        fileName="vendors"
        searchPlaceholder="Search vendors"
        emptyMessage="No vendor data available."
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}

export default Vendors
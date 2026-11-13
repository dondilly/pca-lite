import { useEffect, useState } from 'react'
import { getRestData, getSelectedBranch, postRestData,api_cradle } from '../api/auth.js'
import DataTable from './DataTable.jsx'
import VendorDialog from './dialogs/VendorDialog.jsx'

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
    api_cradle.getVendors
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
  const [dialogVendor, setDialogVendor] = useState(undefined)
  const [dialogError, setDialogError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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

  function openAddDialog() {
    setDialogError('')
    setSuccessMsg('')
    setDialogVendor(null)
  }

  function openEditDialog(vendor) {
    setDialogError('')
    setSuccessMsg('')
    setDialogVendor(vendor)
  }

  async function saveVendor(form) {
    const branchId = getSelectedBranch()
    if (branchId == null) {
      setDialogError('No branch is selected.')
      return false
    }

    const isEditing = dialogVendor !== null
    if (isEditing && (dialogVendor?.id == null || dialogVendor.id === '')) {
      setDialogError('This vendor does not have an ID and cannot be updated.')
      return false
    }

    const endpoint = new URL(
      api_cradle.postVendorsUrl,
    )
    endpoint.searchParams.set('X-Branch-Id', String(branchId))
    if (isEditing) {
      endpoint.searchParams.set('id', String(dialogVendor.id))
    }

    const payload = {
      ...(isEditing ? dialogVendor : {}),
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
        setDialogError(result.errs || result.msg || 'Unable to save the vendor.')
        return false
      }

      const refreshedVendors = await getVendors()
      setVendors(refreshedVendors)
      setSuccessMsg(result?.msg || 'Vendor saved successfully.')
      return true
    } catch (saveError) {
      setDialogError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save the vendor.',
      )
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container-fluid p-4 p-lg-4">
      <div className="mb-4">
        <h1 className="h3 mb-0">Vendors</h1>
      </div>
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary" onClick={openAddDialog}>
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
        onEdit={openEditDialog}
      />
      {dialogVendor !== undefined && (
        <VendorDialog
          key={dialogVendor?.id ?? 'new-vendor'}
          vendor={dialogVendor}
          isSaving={isSaving}
          error={dialogError}
          successMsg={successMsg}
          onClose={() => {
            setDialogVendor(undefined)
            setDialogError('')
          }}
          onSave={saveVendor}
          onInputChange={() => setSuccessMsg('')}
        />
      )}
    </div>
  )
}

export default Vendors
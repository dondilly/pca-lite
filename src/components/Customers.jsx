import { useEffect, useState } from 'react'
import {
  api_cradle,
  getRestData,
  getSelectedBranch,
  postRestData,
} from '../api/auth.js'
import DataTable from './DataTable.jsx'
import CustomerDialog from './dialogs/CustomerDialog.jsx'

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

  const endpoint = new URL(api_cradle.getCustomers)
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
  const [dialogCustomer, setDialogCustomer] = useState(undefined)
  const [dialogError, setDialogError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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

  function openAddDialog() {
    setDialogError('')
    setSuccessMsg('')
    setDialogCustomer(null)
  }

  function openEditDialog(customer) {
    setDialogError('')
    setSuccessMsg('')
    setDialogCustomer(customer)
  }

  async function saveCustomer(form) {
    const branchId = getSelectedBranch()
    if (branchId == null) {
      setDialogError('No branch is selected.')
      return false
    }

    const isEditing = dialogCustomer !== null
    if (isEditing && (dialogCustomer?.id == null || dialogCustomer.id === '')) {
      setDialogError('This customer does not have an ID and cannot be updated.')
      return false
    }

    const endpoint = new URL(api_cradle.postCustomersUrl)
    endpoint.searchParams.set('X-Branch-Id', String(branchId))
    if (isEditing) {
      endpoint.searchParams.set('id', String(dialogCustomer.id))
    }

    const payload = {
      ...(isEditing ? dialogCustomer : {}),
      ...form,
    }

    setIsSaving(true)
    setDialogError('')
    try {
      const result = await postRestData(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        body: payload,
      })

      if (result?.code) {
        setSuccessMsg(result.msg || 'Customer saved successfully.')
        const refreshedCustomers = await getCustomers()
        setCustomers(refreshedCustomers)
        return true
      }

      if (result) {
        setDialogError(result.errs || 'Unable to save the customer.')
        return false
      }

      const refreshedCustomers = await getCustomers()
      setCustomers(refreshedCustomers)
      setSuccessMsg('Customer saved successfully.')
      return true
    } catch (saveError) {
      setDialogError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save the customer.',
      )
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container-fluid p-4 p-lg-4">
      <div className="mb-4">
        <h1 className="h3 mb-0">Customers</h1>
      </div>
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary" onClick={openAddDialog}>
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
        onEdit={openEditDialog}
      />
      {dialogCustomer !== undefined && (
        <CustomerDialog
          key={dialogCustomer?.id ?? 'new-customer'}
          customer={dialogCustomer}
          isSaving={isSaving}
          error={dialogError}
          successMsg={successMsg}
          onClose={() => {
            setDialogCustomer(undefined)
            setDialogError('')
          }}
          onSave={saveCustomer}
          onInputChange={() => setSuccessMsg('')}
        />
      )}
    </div>
  )
}

export default Customers

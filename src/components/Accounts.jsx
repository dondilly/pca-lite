import { useEffect, useState } from 'react'
import { postRestData, getSelectedBranch } from '../api/auth.js'
import AccountDialog from './AccountDialog.jsx'
import DataTable from './DataTable.jsx'

const accountColumns = [
  {
    id: 'accDescription',
    name: 'Account Description',
    selector: (account) => account.accDescription ?? '',
    sortable: true,
  },
  {
    id: 'accNo',
    name: 'Account Number',
    selector: (account) => account.accNo ?? '',
    sortable: true,
  },
 
  {
    id: 'grpAccDescription',
    name: 'Account Group',
    selector: (account) => account.grpAccDescription ?? '',
    sortable: true,
  },
  {
    id: 'accTypeDescription',
    name: 'Account Type',
    selector: (account) => account.accTypeDescription ?? '',
    searchable: true,
    sortable: true,
  },
   {
     id: 'lastUpdated',
     name: 'Time Stamp',
     selector: (account) => account.lastUpdated ?? account.grpCode?.lastUpdated ?? '',
     sortable: true,
   },
]

async function getAccounts() {
  const branchId = getSelectedBranch()
  if (branchId == null) {
    throw new Error('No branch is selected.')
  }

  const endpoint = new URL(
    'http://localhost:8080/Inventory/api/general/accountsAsJSON',
  )
  endpoint.searchParams.set('X-Branch-Id', String(branchId))

  const response = await postRestData(endpoint)
  const accounts = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : null

  if (!accounts) {
    throw new Error('The account response was not a list.')
  }

  return accounts
}

function Accounts() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [accounts, setAccounts] = useState([])
  const [dialogAccount, setDialogAccount] = useState(undefined)
  const [dialogError, setDialogError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadAccounts() {
      try {
        const accountData = await getAccounts()
        if (isMounted) {
          setAccounts(accountData)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load accounts.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadAccounts()

    return () => {
      isMounted = false
    }
  }, [])

  function openAddDialog() {
    setDialogError('')
    setDialogAccount(null)
  }

  function openEditDialog(account) {
    setDialogError('')
    setDialogAccount(account)
  }

  async function saveAccount(form) {
    console.log("entourage")
    console.log(form)
    const branchId = getSelectedBranch()
    if (branchId == null) {
      setDialogError('No branch is selected.')
      return
    }

    const isEditing = dialogAccount !== null
    if (isEditing && (dialogAccount?.id == null || dialogAccount.id === '')) {
      setDialogError('This account does not have an ID and cannot be updated.')
      return
    }

    const endpoint = new URL('http://localhost:8080/Inventory/api/accounts')
    endpoint.searchParams.set('X-Branch-Id', String(branchId))
    if (isEditing) {
      endpoint.searchParams.set('id', String(dialogAccount.id))
    }

    const payload = {
      ...(isEditing ? dialogAccount : {}),
      ...form,
    }
    delete payload.grpCode

    setIsSaving(true)
    setDialogError('')
    try {
      await postRestData(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        body: payload,
      })
      const refreshedAccounts = await getAccounts()
      setAccounts(refreshedAccounts)
      setDialogAccount(undefined)
    } catch (saveError) {
      setDialogError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save the account.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container-fluid p-4 p-lg-4">
      <div className="mb-4">
        <h1 className="h3 mb-0">Accounts</h1>
      </div>
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary" onClick={openAddDialog}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Add Account
        </button>
      </div>
      <DataTable
        title="Accounts"
        data={accounts}
        columns={accountColumns}
        fileName="accounts"
        searchPlaceholder="Search accounts"
        emptyMessage="No account data available."
        isLoading={isLoading}
        error={error}
        onEdit={openEditDialog}
      />
      {dialogAccount !== undefined && (
        <AccountDialog
          key={dialogAccount?.id ?? 'new-account'}
          account={dialogAccount}
          isSaving={isSaving}
          error={dialogError}
          onClose={() => {
            setDialogAccount(undefined)
            setDialogError('')
          }}
          onSave={saveAccount}
        />
      )}
    </div>
  )
}

export default Accounts
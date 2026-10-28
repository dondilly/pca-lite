import { useEffect, useState } from 'react'
import { getRestData, getSelectedBranch } from '../api/auth.js'
import DataTable from './DataTable.jsx'

const accountGroupColumns = [
  {
    id: 'accDescription',
    name: 'Account Description',
    selector: (group) => group.accDescription ?? '',
    sortable: true,
  },
  {
    id: 'grpCode',
    name: 'Group Code',
    selector: (group) => group.grpCode ?? '',
    sortable: true,
  },
  {
    id: 'accType',
    name: 'Account Type',
    selector: (group) => group.accTypeDescription ?? '',
    sortable: true,
  },
  
  {
    id: 'lastUpdated',
    name: 'Time Stamp',
    selector: (group) => group.lastUpdated ?? '',
    sortable: true,
  },
]

async function getAccountGroups() {
  const branchId = getSelectedBranch()
  if (branchId == null) {
    throw new Error('No branch is selected.')
  }

  const endpoint = new URL(
    'http://localhost:8080/Inventory/api/general/accountGroupsAsJSON',
  )
  endpoint.searchParams.set('X-Branch-Id', String(branchId))

  const response = await getRestData(endpoint)
  const accountGroups = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : null

  if (!accountGroups) {
    throw new Error('The account group response was not a list.')
  }

  return accountGroups
}

function AccountGroup() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [accountGroups, setAccountGroups] = useState([])

  useEffect(() => {
    let isMounted = true

    async function loadAccountGroups() {
      try {
        const groupData = await getAccountGroups()
        if (isMounted) {
          setAccountGroups(groupData)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load account groups.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadAccountGroups()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="container-fluid p-4 p-lg-4">
      <div className="mb-4">
        <h1 className="h3 mb-0">Account Groups</h1>
      </div>
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Add Account Group
        </button>
      </div>
      <DataTable
        title="Account Groups"
        data={accountGroups}
        columns={accountGroupColumns}
        fileName="account-groups"
        searchPlaceholder="Search account groups"
        emptyMessage="No account group data available."
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}

export default AccountGroup
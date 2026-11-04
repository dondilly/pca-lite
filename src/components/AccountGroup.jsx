import { useCallback, useEffect, useState } from 'react'
import { api_cradle, getRestData, getSelectedBranch, postRestData } from '../api/auth.js'
import AccountGroupsDialog from './dialogs/AccountGroupsDialog.jsx'
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
    selector: (group) => group.accType?.accDescription ?? '',
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

  const endpoint = new URL(api_cradle.getAccountGroups)
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
  const [successMsg, setSuccessMsg] = useState('')
  const [accountGroups, setAccountGroups] = useState([])
  const [dialogAccountGroup, setDialogAccountGroup] = useState(undefined)
  const [dialogError, setDialogError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const reloadAccountGroups = useCallback(async () => {
    const groups = await getAccountGroups()
    setAccountGroups(groups)
  }, [])

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

  function openAddDialog() {
    setDialogError('')
    setSuccessMsg('')
    setDialogAccountGroup(null)
  }

  function openEditDialog(accountGroup) {
    setDialogError('')
    setSuccessMsg('')
    setDialogAccountGroup(accountGroup)
  }

  async function saveAccountGroup(form) {
    const branchId = getSelectedBranch()
    if (branchId == null) {
      setDialogError('No branch is selected.')
      return false
    }

    const isEditing = dialogAccountGroup !== null
    if (
      isEditing &&
      (dialogAccountGroup?.id == null || dialogAccountGroup.id === '')
    ) {
      setDialogError('This account group does not have an ID and cannot be updated.')
      return false
    }

    const endpoint = new URL(api_cradle.postAccGroupUrl)
    endpoint.searchParams.set('X-Branch-Id', String(branchId))
    if (isEditing) {
      endpoint.searchParams.set('id', String(dialogAccountGroup.id))
    }

    const payload = {
      ...(isEditing ? dialogAccountGroup : {}),
      ...form,
    }
    delete payload.accType

    setIsSaving(true)
    setDialogError('')
    try {
      let result = await postRestData(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        body: payload,
      })
      if(result){
          if (result.code){
              setSuccessMsg(result.msg)
              await reloadAccountGroups()
              return true
          }
          else{
              setDialogError(result.errs)
              return false
          }
      }
      await reloadAccountGroups()
      setSuccessMsg('Account group saved successfully.')
      return true
    } catch (saveError) {
      setDialogError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save the account group.',
      )
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="container-fluid p-4 p-lg-4">
        <div className="mb-4">
          <h1 className="h3 mb-0">Account Groups</h1>
        </div>
         
        <div className="d-flex justify-content-between mb-3">
           <button
            type="button"
            className="btn btn-primary"
            onClick={reloadAccountGroups}
          >
            <i className="bi bi-view-list me-2" aria-hidden="true"  />
            Preview
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddDialog}
          >
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
          onEdit={openEditDialog}
        />
      </div>
      {dialogAccountGroup !== undefined && (
        <AccountGroupsDialog
          key={dialogAccountGroup?.id ?? 'new-account-group'}
          account={dialogAccountGroup}
          isSaving={isSaving}
          error={dialogError}
          successMsg={successMsg}
          onClose={() => {
            setDialogAccountGroup(undefined)
            setDialogError('')
          }}
          onSave={saveAccountGroup}
          onInputChange={() => successMsg ? setSuccessMsg(null) : ''} //clear the  amert ms once the user start typing
        />
      )}
    </>
  )
}

export default AccountGroup

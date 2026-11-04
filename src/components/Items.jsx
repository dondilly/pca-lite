import { useCallback , useEffect, useState} from 'react'
import { api_cradle, getRestData, getSelectedBranch, postRestData } from '../api/auth.js'
import DataTable from './DataTable.jsx'
import ItemDialog from './dialogs/ItemDialog.jsx'

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
  {
    id: 'imageStr',
    name: 'imageStr',
    selector: (item) => item.imageStr ?? '',
    sortable: true,
  },
  {
    id: 'imageThumbnail',
    name: 'image Thumbnail',
    selector: (item) => item.imageThumbnail ?? '',
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

function getSavedItemId(result) {
  const savedItem = result?.data?.item ?? result?.data ?? result?.item ?? result
  return savedItem?.id ?? savedItem?.itemId ?? result?.itemId
}



function Items() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [dialogItem, setDialogItem] = useState(undefined)
  const [dialogError, setDialogError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isSaving, setIsSaving] = useState(false)


  const reloadItems = useCallback(async () => {
    const itm = await getItems()
    setItems(itm)
  }, [])

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

  function openAddDialog() {
    setDialogError('')
    setSuccessMsg('')
    setDialogItem(null)
  }

  function openEditDialog(item) {
    setDialogError('')
    setSuccessMsg('')
    setDialogItem(item)
  }

  async function saveItem({ data, imageFile }) {
    const branchId = getSelectedBranch()
    if (branchId == null) {
      setDialogError('No branch is selected.')
      return false
    }

   

    const isEditing = dialogItem !== null
    if (isEditing && (dialogItem?.id == null || dialogItem.id === '')) {
      setDialogError('This item does not have an ID and cannot be updated.')
      return false
    }

    const endpoint = new URL(api_cradle.postItemsUrl)
    endpoint.searchParams.set('X-Branch-Id', String(branchId))
    if (isEditing) {
      endpoint.searchParams.set('id', String(dialogItem.id))
    }

    const payload = {
      ...(isEditing ? dialogItem : {}),
      ...data,
      ...(imageFile
        ? { imageThumbnail: isEditing ? dialogItem.imageThumbnail ?? '' : '' }
        : {}),
    }

    setIsSaving(true)
    setDialogError('')
    let newlyCreatedItemId = null
    let itemWasSaved = false
    let uploadedImageUrl = ''
    try {
      const result = await postRestData(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        body: payload,
      })

      if (result && Object.hasOwn(result, 'code') && !result.code) {
        setDialogError(result.errs || result.msg || 'Unable to save the item.')
        return false
      }

      itemWasSaved = true
      const itemId = isEditing ? dialogItem.id : getSavedItemId(result)
      if (imageFile) {
        if (itemId == null || itemId === '') {
          throw new Error(
            'The item was saved, but the API did not return its ID for image upload.',
          )
        }

        if (!isEditing) {
          newlyCreatedItemId = itemId
        }

        const imageEndpoint = new URL(api_cradle.R2Storage)
        imageEndpoint.searchParams.set('X-Branch-Id', String(branchId))
        const imageForm = new FormData()
        imageForm.append('file', imageFile)
        imageForm.append('itemId', String(itemId))
        const imageResult = await postRestData(imageEndpoint, {
          body: imageForm,
        })

        if (imageResult?.code === false) {
          throw new Error(
            imageResult.errs ||
              imageResult.msg ||
              'Unable to upload the item image.',
          )
        }

        const imageUrl = imageResult?.imageUrl
        if (typeof imageUrl !== 'string' || !imageUrl) {
          throw new Error(
            'The image upload response did not include data.imageUrl.',
          )
        }
        uploadedImageUrl = imageUrl

        const imageSaveEndpoint = new URL(api_cradle.postItemsUrl)
        imageSaveEndpoint.searchParams.set('X-Branch-Id', String(branchId))
        imageSaveEndpoint.searchParams.set('id', String(itemId))
        const imageSaveResult = await postRestData(imageSaveEndpoint, {
          method: 'PUT',
          body: {
            ...payload,
            id: itemId,
            imageStr: imageUrl,
          },
        })

        if (
          imageSaveResult &&
          Object.hasOwn(imageSaveResult, 'code') &&
          !imageSaveResult.code
        ) {
          throw new Error(
            imageSaveResult.errs ||
              imageSaveResult.msg ||
              'The image uploaded, but its URL could not be saved to the item.',
          )
        }
      }

      await reloadItems()
      setSuccessMsg(result?.msg || 'Item saved successfully.')
      return uploadedImageUrl ? { imageStr: uploadedImageUrl } : true
    } catch (saveError) {
      if (newlyCreatedItemId != null) {
        setDialogItem({ ...payload, id: newlyCreatedItemId })
      }
      if (itemWasSaved) {
        try {
          await reloadItems()
        } catch (reloadError) {
          setError(
            reloadError instanceof Error
              ? reloadError.message
              : 'Unable to refresh items after saving.',
          )
        }
      }
      setDialogError(
        itemWasSaved && imageFile
          ? `The item was saved, but image processing failed: ${
              saveError instanceof Error
                ? saveError.message
                : 'Unable to save the item image.'
            }`
          : saveError instanceof Error
            ? saveError.message
            : 'Unable to save the item.',
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
          <h1 className="h3 mb-0">Items</h1>
        </div>
        <div className="d-flex justify-content-end mb-3">
          <button type="button" className="btn btn-primary" onClick={openAddDialog}>
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            Add Item
          </button>
        </div>
        <DataTable
          title="Items"
          data={items}
          columns={itemColumns}
          fileName="items"
          searchPlaceholder="Search items"
          emptyMessage="No item data available."
          isLoading={isLoading}
          error={error}
          onEdit={openEditDialog}
        />
      </div>
      {dialogItem !== undefined && (
        <ItemDialog
          key={dialogItem?.id ?? 'new-item'}
          item={dialogItem}
          isSaving={isSaving}
          error={dialogError}
          successMsg={successMsg}
          onClose={() => {
            setDialogItem(undefined)
            setDialogError('')
          }}
          onSave={saveItem}
          onInputChange={() => setSuccessMsg('')}
        />
      )}
    </>
  )
}

export default Items

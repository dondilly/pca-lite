import { useCallback, useEffect, useState } from 'react'
import { api_reports, getRestData, getSelectedBranch, formatDate, api_cradle } from '../../api/auth.js'
import DataTable from '../DataTable.jsx'
import DatePicker from 'react-datepicker'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../ui/combobox.jsx'

const entityOptions = [
  { value: '0', label: 'Select an entity' },
  { value: 'Branch:branchName', label: 'Branch' },
  { value: 'Items:itemName', label: 'Item' },
  { value: 'ItemSubCategories:itemSubCategoryName', label: 'Item Sub Category' },
  { value: 'ItemCategories:itemCategoryName', label: 'Item Category' },
  { value: 'WarehouseLocation:locationName', label: 'Warehouse Location' },
]

const stockDataColumns = [
  {
    id: 'branch',
    name: 'Branch',
    selector: (result) => result.branchName ?? '',
    sortable: true,
  },
//   {
//     id: 'stockLocation',
//     name: 'Stock Location',
//     selector: (result) => result.whLocation ?? '',
//     sortable: true,
//   },
  {
    id: 'item',
    name: 'Item',
    selector: (result) => result.itemName ?? '',
    sortable: true,
  },
  {
    id: 'category',
    name: 'Category',
    selector: (result) => result.category ?? '',
    sortable: true,
  },
  {
    id: 'stockBalance',
    name: 'Stock Balance',
    selector: (result) => result.balance?? '',
    sortable: true,
  },
]




 

function InventoryStatus() {
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [endDate, setEndDate] = useState(new Date())
  const [subItems, setSubItems] = useState([])
  const [viewType, setViewType] = useState('0')
  const [selectedEntityItem, setSelectedEntityItem] = useState(null)
  const [groupError, setGroupError] = useState('')
  const [previewable, setPreviewable] = useState(false)



  const entityItemOptions = subItems.map((item, index) => ({
    value: String(item.id ?? index),
    label: item.fieldName
      ? `${item.fieldName}${item.fields ? ` - ${item.fields}` : ''}`
      : String(item.id ?? ''),
  }))
  const selectedEntityOption = entityOptions.find(
    (option) => option.value === viewType,
  )
  const selectedEntityItemOption = entityItemOptions.find(
    (option) => option.value === selectedEntityItem,
  ) ?? null

  const reloadInventoryStatus = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setResults(await getInventoryStatus(endDate, api_reports.getCurrentBranchStockStatus))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load inventory status.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [endDate])

  useEffect(() => {
    let isMounted = true

    async function loadInventoryStatus() {
      setIsLoading(true)
      setError('')
      try {
        const inventory = await getInventoryStatus(endDate, api_reports.getCurrentBranchStockStatus)
        if (isMounted) {
          setResults(inventory)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load inventory status.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInventoryStatus()
    return () => {
      isMounted = false
    }
  }, [endDate])


  async function verifyEntryType(selectedValue) {
    setViewType(selectedValue)
    setGroupError('')
    setSelectedEntityItem(null)

    const branchId = getSelectedBranch()
    if (branchId == null) {
      setGroupError('No branch is selected.')
      setSubItems([])
      return
    }

    if (!selectedValue || selectedValue === '0') {
      setSubItems([])
      return
    }

    try {
      const endpoint = new URL(api_cradle.getStockReportEntityItems)
      endpoint.searchParams.set('X-Branch-Id', String(branchId))
      endpoint.searchParams.set('viewType', selectedValue)
      const response = await getRestData(endpoint)
      const entityItems = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : null

      if (!entityItems) {
        throw new Error('The entity items response was not a list.')
      }

      setSubItems(entityItems)
    } catch (loadError) {
      setSubItems([])
      setGroupError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load entity items.',
      )
    }
  }


  async function getInventoryStatus(endDate,url) {
  const branchId = getSelectedBranch()
  if (branchId == null) {
    throw new Error('No branch is selected.')
  }

  const endpoint = new URL(url)
  endpoint.searchParams.set('X-Branch-Id', String(branchId))
  endpoint.searchParams.set('endDate', formatDate(endDate))

  

  if (!(selectedEntityOption === undefined) || !(selectedEntityOption === '0')  ) {
      endpoint.searchParams.set('viewType', selectedEntityOption?.value)
      endpoint.searchParams.set('id',selectedEntityItemOption?.value)
  }
  

  const response = await getRestData(endpoint)
  const inventory = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : null

  if (!inventory) {
    throw new Error('The inventory status response was not a list.')
  }

  return inventory
}


  function handleEntityItemChange(option) {
    setSelectedEntityItem(option?.value ?? null)
  }

  async function loadEntityStockStatus(){
      setIsLoading(true)
      let inventory =   await getInventoryStatus(endDate, api_reports.inventoryStatusReport)
      setResults(inventory)
      setIsLoading(false)
      
}



  return (
    <section aria-labelledby="inventory-status-title">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <h1 className="h3 mb-0" id="inventory-status-title">
          Inventory Status
        </h1>
        <div className="row align-items-end g-3 mb-3">
                {error && <div className="alert alert-danger" role="alert">{error}</div>}
               
                {groupError && <div className="alert alert-danger" role="alert">{groupError}</div>}
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={reloadInventoryStatus}
          disabled={isLoading}
        >
          <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />
          Refresh
        </button>
      </div>
      <div className="row align-items-end g-3 mb-3">
           <div className="col-sm-4 col-lg-3">
           <label htmlFor="sales-end-date" className="form-label">
              Inventory Status Date
           </label>
           <DatePicker
                       id="sales-end-date"
                       selected={endDate}
                       onChange={(date) => setEndDate(date ?? new Date())}
                       dateFormat="dd-MM-yyyy"
                       placeholderText="Select end date"
                       className="form-control"
                       wrapperClassName="w-100"
                       autoComplete="off"
                       isClearable
              />
          </div>
          <div className="col-sm-4 col-lg-3">
            <label htmlFor="viewType" className="form-label">Select Entity</label>
            <Combobox
              items={entityOptions}
              value={selectedEntityOption}
              onValueChange={(option) => verifyEntryType(option?.value ?? '0')}
              itemToStringLabel={(option) => option?.label ?? ''}
              isItemEqualToValue={(item, value) => item.value === value.value}
            >
              <ComboboxInput
                id="viewType"
                name="viewType"
                className="w-full"
                placeholder="Select an entity"
                aria-label="Select Entity"
              />
              <ComboboxContent>
                <ComboboxEmpty>No entities found.</ComboboxEmpty>
                <ComboboxList>
                  {(option) => (
                    <ComboboxItem key={option.value} value={option}>
                      {option.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div className="col-sm-4 col-lg-3">
            <label htmlFor="entityList" className="form-label">Select Entity Item</label>
            <Combobox
              items={entityItemOptions}
              value={selectedEntityItemOption}
              onValueChange={(option) => setSelectedEntityItem(option?.value ?? null)}
              itemToStringLabel={(option) => option?.label ?? ''}
              isItemEqualToValue={(item, value) => item.value === value.value}
              disabled={isLoading || Boolean(groupError) || entityItemOptions.length === 0}
            >
              <ComboboxInput
                id="entityList"
                name="entityList"
                className="w-full"
                placeholder={isLoading ? 'Loading entity items…' : 'Select an entity item'}
                aria-label="Select Entity Item"
                disabled={isLoading || Boolean(groupError) || entityItemOptions.length === 0}
              />
              <ComboboxContent>
                <ComboboxEmpty>No entity items found.</ComboboxEmpty>
                <ComboboxList>
                  {(option) => (
                    <ComboboxItem key={option.value} value={option}>
                      {option.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
         </div>
         <div className="col-sm-4 col-lg-3">
            <button
                type="button"
                className="btn btn-primary"
                onClick={loadEntityStockStatus}
                disabled={false}
                >
                <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />
                Preview
            </button>
          </div>
          
      </div>
      <DataTable
        title="Inventory status"
        data={results}
        columns={stockDataColumns}
        fileName="inventoryStatus"
        searchPlaceholder="Search inventory"
        emptyMessage="No inventory status available."
        isLoading={isLoading}
        error={error}
      />
    </section>
  )
}

export default InventoryStatus

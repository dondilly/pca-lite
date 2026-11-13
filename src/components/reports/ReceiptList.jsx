import { useCallback, useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { api_reports, getRestData, getSelectedBranch, formatDate, api_delete, todatFormattedDate } from '../../api/auth.js'
import DataTable from '../DataTable.jsx'
import ConfirmationDialog from "../utilityComponents/ConfirmationDialog.jsx"


const salesDataColumns = [
  {
    id: 'date',
    name: 'Date',
    selector: (result) => result.date ?? '',
    sortable: true,
  },
  {
    id: 'customer',
    name: 'Customer',
    selector: (result) => result.customer ?? '',
    sortable: true,
  },
  {
    id: 'receiptNo',
    name: 'Receipt No',
    selector: (result) => result.receiptNo ?? '',
    sortable: true,
  },
  {
    id: 'invoiceNo',
    name: 'Invoice No',
    selector: (result) => result.invoiceNo ?? '',
    sortable: true,
  },
  {
    id: 'amount',
    name: 'Amount',
    selector: (result) => result.amount ?? '',
    cell: result => result.amount?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) ?? '',
    sortable: true,
  },
  
  {
    id: 'userlog',
    name: 'Userlog',
    selector: (result) => result.userlog ?? '',
    sortable: true,
  },
]



async function getReceiptsData(startDate = '', endDate = '') {
  const branchId = getSelectedBranch()
  if (branchId == null) {
    throw new Error('No branch is selected.')
  }

  const endpoint = new URL(api_reports.receiptReport)
  endpoint.searchParams.set('X-Branch-Id', String(branchId))
  if (startDate) {
    endpoint.searchParams.set('startDate', startDate)
  }
  if (endDate) {
    endpoint.searchParams.set('endDate', endDate)
  }

  const response = await getRestData(endpoint)
  const results = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : null

  if (!results) {
    throw new Error('The receipt report response was not a list.')
  }

  return results
}

function ReceiptList() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [receiptToDelete, setReceiptToDelete] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [groupError, setGroupError] = useState('')

  function deleteReceipt(receipt) {
    setError('')
    setReceiptToDelete(receipt)
  }

  async function confirmDeleteReceipt() {
    setReceiptToDelete(null)
    setError('')
    if (getSelectedBranch() == null) {
      setError('No branch is selected.')
      return
    }
    let data = await getRestData(`${api_delete.deleteReceipt}?receiptNo=${receiptToDelete.receiptNo}&X-Branch-Id=${getSelectedBranch()}`, 'DELETE')
    if (data?.code) {
      setSuccessMsg(`Receipt ${receiptToDelete.receiptNo} deleted successfully.`)   
    }
    reloadReceiptsData()
    setError(data.errs)
  }

  const reloadReceiptsData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getReceiptsData(formatDate(startDate), formatDate(endDate))
      setResults(data)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load sales data.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    let isMounted = true

    async function loadReports() {
      try {
        const salesData = await getReceiptsData()
        if (isMounted) {
          setResults(salesData)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load sales data.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadReports()

    return () => {
      isMounted = false
    }
  }, [])


  return (
    <div className="container-fluid p-4 p-lg-4">
      <div className="mb-4">
        <h1 className="h3 mb-0">Receipt Report (Payments Received) </h1>
      </div>
      <div className="row align-items-end g-3 mb-3">
                {error && <div className="alert alert-danger" role="alert">{error}</div>}
                {successMsg && <div className="alert alert-success" role="alert">{successMsg}</div>}
                {groupError && <div className="alert alert-danger" role="alert">{groupError}</div>}
      </div>
      <div className="row align-items-end g-3 mb-3">
    
        <div className="col-sm-6 col-lg-3">
          <label htmlFor="sales-start-date" className="form-label">
            Start date
          </label>
          <DatePicker
            id="sales-start-date"
            selected={startDate}
            onChange={setStartDate}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            maxDate={endDate ?? undefined}
            dateFormat="dd-MM-yyyy"
            placeholderText="Select start date"
            className="form-control"
            wrapperClassName="w-100"
            autoComplete="off"
            isClearable
          />
        </div>
        <div className="col-sm-6 col-lg-3">
          <label htmlFor="sales-end-date" className="form-label">
            End date
          </label>
          <DatePicker
            id="sales-end-date"
            selected={endDate}
            onChange={setEndDate}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate ?? undefined}
            dateFormat="dd-MM-yyyy"
            placeholderText="Select end date"
            className="form-control"
            wrapperClassName="w-100"
            autoComplete="off"
            isClearable
          />
        </div>
        <div className="col-sm-auto">
          <button
            type="button"
            className="btn btn-primary"
            onClick={reloadReceiptsData}
            disabled={isLoading}
          >
            <i className="bi bi-view-list me-2" aria-hidden="true" />
            Preview
          </button>
        </div>
        <div className="col-sm-auto ms-lg-auto">
          <button type="button" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            Add Receipt
          </button>
        </div>
      </div>
      <DataTable
        title="Sales report"
        data={results}
        columns={salesDataColumns}
        fileName="salesReport"
        searchPlaceholder="Search report"
        emptyMessage="No sales data available for this period"
        isLoading={isLoading}
        error={error}
        onDelete={deleteReceipt}
      />
      <ConfirmationDialog
        open={receiptToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReceiptToDelete(null)
          }
        }}
        title="Confirm receipt deletion"
        message={`Are you sure you want to delete receipt ${
          receiptToDelete?.receiptNo ?? ''
        }?`}
        confirmLabel="Delete receipt"
        onConfirm={confirmDeleteReceipt}
      />
    </div>
  )
}

export default ReceiptList
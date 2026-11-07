import { useCallback, useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { api_reports, getRestData, getSelectedBranch } from '../../api/auth.js'
import DataTable from '../DataTable.jsx'

const salesDataColumns = [
  {
    id: 'date',
    name: 'Date',
    selector: (result) => new Intl.DateTimeFormat('en-NG').format(new Date(result.date)) ?? '',
    sortable: true,
  },
  {
    id: 'customer',
    name: 'Customer',
    selector: (result) => result.customer ?? '',
    sortable: true,
  },
  {
    id: 'invoiceNo',
    name: 'Invoice No',
    selector: (result) => result.invoiceNo ?? '',
    sortable: true,
  },
  {
    id: 'refNo',
    name: 'Ref No',
    selector: (result) => result.ref ?? '',
    sortable: true,
  },
  {
    id: 'invoiceValue',
    name: 'Invoice Value',
    selector: (result) => result.invoiceTotal ?? '',
    cell: result => result.invoiceTotal?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) ?? '',
    sortable: true,
  },
  {
    id: 'userlog',
    name: 'Userlog',
    selector: (result) => result.userlog ?? '',
    sortable: true,
  },
]

function formatDate(date) {
  if (!date) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}-${month}-${year}`
}

async function getSalesData(startDate = '', endDate = '') {
  const branchId = getSelectedBranch()
  if (branchId == null) {
    throw new Error('No branch is selected.')
  }

  const endpoint = new URL(api_reports.salesReport)
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
    throw new Error('The sales report response was not a list.')
  }

  return results
}



function InvoiceList() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)

  const reloadSalesData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getSalesData(formatDate(startDate), formatDate(endDate))
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
        const salesData = await getSalesData()
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
        <h1 className="h3 mb-0">Sales Report</h1>
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
            onClick={reloadSalesData}
            disabled={isLoading}
          >
            <i className="bi bi-view-list me-2" aria-hidden="true" />
            Preview
          </button>
        </div>
        <div className="col-sm-auto ms-lg-auto">
          <button type="button" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            Add Sales
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
      />
    </div>
  )
}

export default InvoiceList
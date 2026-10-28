import { useId, useMemo, useState } from 'react'
import ReactDataTable from 'react-data-table-component'

function downloadTextFile(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function toExportValue(value) {
  if (value == null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value ?? ''
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return ''
}

function toSearchText(value, seen = new WeakSet()) {
  if (value == null) {
    return ''
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (typeof value !== 'object' || seen.has(value)) {
    return ''
  }

  seen.add(value)
  return Object.values(value)
    .map((item) => toSearchText(item, seen))
    .join(' ')
}

function compareValues(left, right) {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right
  }

  return String(left ?? '').localeCompare(String(right ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

function DataTable({
  title,
  data,
  columns,
  isLoading = false,
  error = '',
  fileName = 'data',
  keyField = 'id',
  searchPlaceholder = 'Search',
  emptyMessage = 'No data available.',
  onEdit,
  onDelete,
}) {
  const searchId = useId()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState(null)
  const [paginationReset, setPaginationReset] = useState(false)
  const [exportError, setExportError] = useState('')
  const exportColumns = useMemo(
    () => columns.filter((column) => column.exportable !== false),
    [columns],
  )
  const tableColumns = useMemo(
    () => [
      ...columns,
      {
        id: 'rowActions',
        name: 'Actions',
        button: true,
        ignoreRowClick: true,
        allowOverflow: true,
        width: '120px',
        sortable: false,
        searchable: true,
        exportable: false,
        cell: (row) => (
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              aria-label={`Edit ${title}`}
              title="Edit"
              disabled={!onEdit}
              onClick={() => onEdit?.(row)}
            >
              <i className="bi bi-pencil" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              aria-label={`Delete ${title}`}
              title="Delete"
              disabled={!onDelete}
              onClick={() => onDelete?.(row)}
            >
              <i className="bi bi-trash" aria-hidden="true" />
            </button>
          </div>
        ),
      },
    ],
    [columns, onDelete, onEdit, title],
  )

  const filteredData = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) {
      return data
    }

    return data.filter((row) =>
      columns.some((column) => {
        if (column.searchable === false) {
          return false
        }
        const value = column.searchValue
          ? column.searchValue(row)
          : column.selector
            ? column.selector(row)
            : row[column.id]
        return toSearchText(value).toLocaleLowerCase().includes(query)
      }),
    )
  }, [columns, data, search])

  const sortedData = useMemo(() => {
    if (!sort) {
      return filteredData
    }

    const column = columns.find(
      (item) => (item.sortField ?? item.id) === sort.field,
    )
    if (!column?.selector) {
      return filteredData
    }

    const direction = sort.direction === 'asc' ? 1 : -1
    return [...filteredData].sort(
      (left, right) =>
        compareValues(column.selector(left), column.selector(right)) * direction,
    )
  }, [columns, filteredData, sort])

  const exportHeaders = exportColumns.map((column) => column.name)
  const exportRows = sortedData.map((row) =>
    exportColumns.map((column) =>
      toExportValue(
        column.exportValue ? column.exportValue(row) : column.selector?.(row),
      ),
    ),
  )
  const hasExportData = !isLoading && !error && sortedData.length > 0

  function exportCsv() {
    try {
      setExportError('')
      const escapeCsvValue = (value) =>
        `"${String(value).replaceAll('"', '""')}"`
      const content = [exportHeaders, ...exportRows]
        .map((row) => row.map(escapeCsvValue).join(','))
        .join('\r\n')
      downloadTextFile(content, 'text/csv;charset=utf-8', `${fileName}.csv`)
    } catch (failure) {
      setExportError(
        failure instanceof Error ? failure.message : 'Unable to export CSV.',
      )
    }
  }

  function exportTxt() {
    try {
      setExportError('')
      const content = [exportHeaders, ...exportRows]
        .map((row) =>
          row
            .map((value) => String(value).replaceAll(/\t|\r?\n/g, ' '))
            .join('\t'),
        )
        .join('\r\n')
      downloadTextFile(content, 'text/plain;charset=utf-8', `${fileName}.txt`)
    } catch (failure) {
      setExportError(
        failure instanceof Error ? failure.message : 'Unable to export TXT.',
      )
    }
  }

  async function exportXlsx() {
    try {
      setExportError('')
      const XLSX = await import('@e965/xlsx')
      const worksheet = XLSX.utils.aoa_to_sheet([exportHeaders, ...exportRows])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, fileName.slice(0, 31))
      XLSX.writeFile(workbook, `${fileName}.xlsx`)
    } catch (failure) {
      setExportError(
        failure instanceof Error ? failure.message : 'Unable to export XLSX.',
      )
    }
  }

  async function exportPdf() {
    try {
      setExportError('')
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ])
      const document = new jsPDF({ orientation: 'landscape' })
      autoTable(document, {
        head: [exportHeaders],
        body: exportRows,
        styles: { overflow: 'linebreak' },
      })
      document.save(`${fileName}.pdf`)
    } catch (failure) {
      setExportError(
        failure instanceof Error ? failure.message : 'Unable to export PDF.',
      )
    }
  }

  return (
    <section className="card">
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-3">
        <h2 className="card-title">{title}</h2>
        <div className="d-flex flex-wrap gap-2" aria-label={`Export ${title}`}>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={exportPdf} disabled={!hasExportData}>PDF</button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={exportXlsx} disabled={!hasExportData}>XLSX</button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={exportCsv} disabled={!hasExportData}>CSV</button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={exportTxt} disabled={!hasExportData}>TXT</button>
        </div>
      </div>
      {exportError && (
        <div className="alert alert-danger m-3 mb-0" role="alert">
          {exportError}
        </div>
      )}
      <div className="card-body border-bottom">
        <div className="row justify-content-end">
          <div className="col-12 col-sm-8 col-md-6 col-lg-4">
            <label htmlFor={searchId} className="form-label">
              {searchPlaceholder}
            </label>
            <input
              id={searchId}
              type="search"
              className="form-control"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPaginationReset((value) => !value)
              }}
              aria-label={searchPlaceholder}
            />
          </div>
        </div>
      </div>
      <ReactDataTable
        columns={tableColumns}
        data={sortedData}
        keyField={keyField}
        defaultSortFieldId={columns.find((column) => column.sortable)?.id}
        defaultSortAsc
        sortServer
        onSort={(column, direction) => {
          const field = column.sortField ?? column.id
          if (field && column.sortable) {
            setSort({ field, direction })
          }
        }}
        pagination
        paginationPerPage={10}
        paginationRowsPerPageOptions={[10, 25, 50, 100]}
        paginationComponentOptions={{
          rowsPerPageText: 'Rows per page:',
          rangeSeparatorText: 'of',
          selectAllRowsItem: false,
        }}
        paginationResetDefaultPage={paginationReset}
        progressPending={isLoading}
        progressComponent={<div className="py-4 text-center">Loading…</div>}
        noDataComponent={
          <div
            className={`py-4 text-center ${error ? 'text-danger' : ''}`}
            role={error ? 'alert' : undefined}
          >
            {error || (search ? `No results match "${search}".` : emptyMessage)}
          </div>
        }
        responsive
        highlightOnHover
        striped
        persistTableHead
      />
    </section>
  )
}

export default DataTable

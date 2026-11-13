import { useEffect, useMemo, useState } from 'react'
import { api_cradle, getRestData, getSelectedBranch,formatDate,postRestData } from '../api/auth.js'

const HELD_SALES_KEY = 'pca-lite-pos-held-sales'
const RECEIPTS_KEY = 'pca-lite-pos-receipts'
const RETURNS_KEY = 'pca-lite-pos-returns'
const PACKAGE_CONFIG_KEY = 'pca-lite-pos-sale-packages'

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
})

function readLocalRecords(key) {
  const savedRecords = window.localStorage.getItem(key)
  if (!savedRecords) {
    return []
  }

  const records = JSON.parse(savedRecords)
  if (!Array.isArray(records)) {
    throw new Error('Saved POS data is invalid. Clear the browser POS data before continuing.')
  }

  return records
}

function saveLocalRecords(key, records) {
  window.localStorage.setItem(key, JSON.stringify(records))
}




async function saveOnlineReceipt(url,receipt) {
    console.log(receipt.lines)
    const rcpt ={
          data : {
              
              date: formatDate(new Date(receipt.createdAt)),
              customerName: receipt.customerName,
              paidAmount: receipt.amountTendered,
              changeDispensed: receipt.changeDue,
              discount: receipt.discount ?? 0,
              paymentTag: receipt.paymentMethod,
              receivedAmount: receipt.amountTendered,
              salesIncomeAcc: receipt.salesIncomeAcc ?? null,
              lineItems : receipt.lines,
              accNo:'020101'

          }

        }
        
        const  newLineItems = receipt.lines.map(line  => ({
              item: line.name,
              itemName: line.name,
              itemId: line.itemId,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
              total: line.unitPrice * line.quantity,
              qtyUnit: line.packageName ?? line.baseUnitName ?? 'unit',
              tax: line?.tax ?? 0,
              discountOnItem:line?.discount
              

             
           }))
        rcpt.lineItems = newLineItems
        console.log(rcpt)
            
    
    let response = await postRestData(url, {
        body: rcpt,
    })
 
}

function getLocalPackageConfig(key) {
  const savedConfig = window.localStorage.getItem(key)
  if (!savedConfig) {
    return {}
  }

  const config = JSON.parse(savedConfig)
  if (!config || Array.isArray(config) || typeof config !== 'object') {
    throw new Error('Saved package data is invalid. Clear the browser POS data before continuing.')
  }
  for (const packages of Object.values(config)) {
    if (
      !Array.isArray(packages) ||
      packages.some(
        (salePackage) =>
          !salePackage ||
          typeof salePackage.id !== 'string' ||
          typeof salePackage.name !== 'string' ||
          !Number.isFinite(salePackage.quantityInBase) ||
          salePackage.quantityInBase <= 1 ||
          !Number.isFinite(salePackage.unitPrice) ||
          salePackage.unitPrice < 0,
      )
    ) {
      throw new Error('Saved package data is invalid. Clear the browser POS data before continuing.')
    }
  }

  return config
}

function getArrayResponse(response, errorMessage) {
  const records = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : null
  if (!records) {
    throw new Error(errorMessage)
  }
  return records
}

function getRelationId(value) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  return value?.id ?? value?.itemId ?? value?.value ?? null
}

function getDistributionItemId(record) {
  const itemRelation =
    record.item ?? record.inventoryItem ?? record.product ?? record.stockItem
  const itemId =
    record.itemId ??
    record.inventoryItemId ??
    record.productId ??
    record.stockItemId ??
    getRelationId(itemRelation)
  return itemId == null ? null : String(itemId)
}

function getDistributionUnitName(value) {
  if (typeof value === 'string') {
    return value
  }
  return (
    value?.quantityUnitName ??
    value?.name ??
    value?.unitName ??
    (value?.id != null ? String(value.id) : '')
  )
}

function mapPackageDistribution(records, items) {
  const itemsById = new Map(items.map((item) => [getItemId(item), item]))
  return records.reduce((packagesByItem, record, index) => {
    const itemId = getDistributionItemId(record)
    const item = itemId == null ? null : itemsById.get(itemId)
    const quantityInBase = Number(record.baseUnitQty)
    const unitPrice = Number(record.unitPrice)
    const unitCost = Number(record.unitCost ?? 0)
    const unitName = getDistributionUnitName(record.qtyUnitName)
    const name =
      typeof record.pkgNarrative === 'string' && record.pkgNarrative.trim()
        ? record.pkgNarrative.trim()
        : unitName

    if (
      itemId == null ||
      !item ||
      !name ||
      !Number.isFinite(quantityInBase) ||
      quantityInBase <= 0 ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      !Number.isFinite(unitCost) ||
      unitCost < 0
    ) {
      throw new Error(
        `Package distribution record ${index + 1} is missing its item, unit, quantity, or valid price.`,
      )
    }

    const packageUnitId = getRelationId(record.qtyUnitName)
    const salePackage = {
      id: `api-${record.id ?? `${packageUnitId ?? unitName}-${index}`}`,
      name,
      packageUnitName: unitName || name,
      pkgNarrative: record.pkgNarrative ?? '',
      baseUnitId: getBaseUnitId(item),
      quantityInBase,
      unitPrice,
      unitCost,
      isBaseUnit: false,
      source: 'api',
    }

    packagesByItem[itemId] ??= []
    packagesByItem[itemId].push(salePackage)
    return packagesByItem
  }, {})
}

function getItemId(item) {
  return String(item.id ?? item.itemId ?? item.itemName)
}

function getItemName(item) {
  return item.itemName ?? item.name ?? 'Unnamed item'
}

function getItemPrice(item) {
  const price = Number(item.sellingPrice ?? item.price ?? 0)
  return Number.isFinite(price) && price >= 0 ? price : 0
}

function getBaseUnitId(item) {
  return String(item.qtyUnit?.id ?? item.qtyUnit ?? '')
}

function getLineId(line) {
  return line.lineId ?? `${line.itemId}:base`
}

function getReturnedQuantity(receipt, line) {
  const lineId = getLineId(line)
  const returnedQuantities = receipt.returnedQuantities ?? {}
  const value = Object.hasOwn(returnedQuantities, lineId)
    ? returnedQuantities[lineId]
    : line.lineId
      ? 0
      : returnedQuantities[line.itemId]
  return Number(value ?? 0)
}

function getItemCategory(item) {
  const category = item.category ?? item.categoryName ?? item.itemCategory
  return typeof category === 'string' && category.trim() ? category : 'Other'
}

function getItemImage(item) {
  const image = item.imageThumbnail || item.imageStr
  return typeof image === 'string' ? image : ''
}

function createTransactionId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

function PosInvoicing() {
  const branchId = getSelectedBranch()
  const packageConfigKey = `${PACKAGE_CONFIG_KEY}-${branchId ?? 'no-branch'}`
  const [items, setItems] = useState([])
  const [packageUnits, setPackageUnits] = useState([])
  const [apiPackagesByItem, setApiPackagesByItem] = useState({})
  const [packagesByItem, setPackagesByItem] = useState({})
  const [packageItem, setPackageItem] = useState(null)
  const [isManagingPackages, setIsManagingPackages] = useState(false)
  const [packageName, setPackageName] = useState('')
  const [packageFactor, setPackageFactor] = useState('')
  const [packagePrice, setPackagePrice] = useState('')
  const [cart, setCart] = useState([])
  const [heldSales, setHeldSales] = useState([])
  const [receipts, setReceipts] = useState([])
  const [returns, setReturns] = useState([])
  const [activeTab, setActiveTab] = useState('sale')
  const [activeCategory, setActiveCategory] = useState('All items')
  const [search, setSearch] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [amountTendered, setAmountTendered] = useState('')
  const [selectedReturnReceipt, setSelectedReturnReceipt] = useState('')
  const [returnQuantities, setReturnQuantities] = useState({})
  const [lastReceipt, setLastReceipt] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [packageError, setPackageError] = useState('')
  const [notice, setNotice] = useState('')
  const [account,setAccount] = useState(null)
  const [paymentMethods,setPaymentMethods] = useState([])

  useEffect(() => {
    let isMounted = true

    async function loadPosData() {
      try {
        const [savedHeldSales, savedReceipts, savedReturns] = [
          readLocalRecords(HELD_SALES_KEY),
          readLocalRecords(RECEIPTS_KEY),
          readLocalRecords(RETURNS_KEY),
        ]
        const savedPackageConfig = getLocalPackageConfig(packageConfigKey)
        if (isMounted) {
          setHeldSales(savedHeldSales)
          setReceipts(savedReceipts)
          setReturns(savedReturns)
          setPackagesByItem(savedPackageConfig)
        }

        if (branchId == null) {
          throw new Error('Select a branch before opening the POS.')
        }
        getPaymentMethods()
        const endpoint = new URL(api_cradle.getItems)
        endpoint.searchParams.set('X-Branch-Id', String(branchId))
        const unitsEndpoint = new URL(api_cradle.getPackageUnits)
        unitsEndpoint.searchParams.set('X-Branch-Id', String(branchId))
        const distributionEndpoint = new URL(api_cradle.getPackageDistribution)
        distributionEndpoint.searchParams.set('X-Branch-Id', String(branchId))
        const [itemsResult, unitsResult, distributionsResult] = await Promise.allSettled([
          getRestData(endpoint),
          getRestData(unitsEndpoint),
          getRestData(distributionEndpoint),
        ])
        if (itemsResult.status === 'rejected') {
          throw itemsResult.reason
        }
        if (unitsResult.status === 'rejected') {
          throw unitsResult.reason
        }

        const itemList = getArrayResponse(
          itemsResult.value,
          'The items response was not a list.',
        )
        const unitList = getArrayResponse(
          unitsResult.value,
          'The package unit response was not a list.',
        )
        let packageMap = {}
        let packageLoadError = ''
        if (distributionsResult.status === 'rejected') {
          packageLoadError =
            distributionsResult.reason instanceof Error
              ? distributionsResult.reason.message
              : 'Unable to load package distributions.'
        } else {
          try {
            const distributionList = getArrayResponse(
              distributionsResult.value,
              'The package distribution response was not a list.',
            )
            packageMap = mapPackageDistribution(distributionList, itemList)
          } catch (packageLoadFailure) {
            packageLoadError =
              packageLoadFailure instanceof Error
                ? packageLoadFailure.message
                : 'Unable to map package distributions.'
          }
        }

        if (isMounted) {
          setItems(itemList)
          setPackageUnits(unitList)
          setApiPackagesByItem(packageMap)
          setPackageError(packageLoadError)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load POS data.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPosData()
    return () => {
      isMounted = false
    }
  }, [branchId, packageConfigKey])

  const categories = useMemo(
    () => ['All items', ...new Set(items.map(getItemCategory))],
    [items],
  )

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === 'All items' || getItemCategory(item) === activeCategory
      const matchesSearch =
        !query ||
        `${getItemName(item)} ${item.sku ?? ''} ${getItemCategory(item)} ${item.barcode ?? ''}`
          .toLocaleLowerCase()
          .includes(query)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, items, search])

  const subtotal = cart.reduce(
    (total, line) => total + line.unitPrice * line.quantity,
    0,
  )
  const tendered = Number(amountTendered)
  const changeDue = Number.isFinite(tendered) ? Math.max(tendered - subtotal, 0) : 0

  function getBaseUnitName(item) {
    const unitId = item.qtyUnit?.id ?? item.qtyUnit
    const unit = packageUnits.find((candidate) =>
      String(candidate.id) === String(unitId),
    )
    return item.quantityUnitName ?? item.qtyUnitName ?? unit?.quantityUnitName ?? 'unit'
  }

  function getItemPackages(item) {
    const itemId = getItemId(item)
    const baseUnit = getBaseUnitName(item)
    const baseUnitId = getBaseUnitId(item)
    const configuredPackages = [
      ...(apiPackagesByItem[itemId] ?? []),
      ...(packagesByItem[itemId] ?? []),
    ]
    return [
      {
        id: 'base',
        name: baseUnit,
        quantityInBase: 1,
        unitPrice: getItemPrice(item),
        isBaseUnit: true,
      },
      ...configuredPackages.filter(
        (salePackage) =>
          !salePackage.baseUnitId ||
          salePackage.baseUnitId === baseUnitId,
      ),
    ]
  }

  function addToCart(item, salePackage) {
    const itemId = getItemId(item)
    const packageId = salePackage?.id ?? 'base'
    const lineId = `${itemId}:${packageId}`
    setNotice('')
    setCart((current) => {
      const existingLine = current.find((line) => getLineId(line) === lineId)
      if (existingLine) {
        return current.map((line) =>
          getLineId(line) === lineId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        )
      }
      return [
        ...current,
        {
          lineId,
          itemId,
          name: getItemName(item),
          packageId,
          packageName: salePackage?.name ?? getBaseUnitName(item),
          packageUnitName: salePackage?.packageUnitName ?? getBaseUnitName(item),
          pkgNarrative: salePackage?.pkgNarrative ?? '',
          quantityInBase: salePackage?.quantityInBase ?? 1,
          baseUnitName: getBaseUnitName(item),
          unitPrice: salePackage?.unitPrice ?? getItemPrice(item),
          unitCost: salePackage?.unitCost ?? Number(item.unitCost ?? item.costPrice ?? 0),
          image: getItemImage(item),
          quantity: 1,
        },
      ]
    })
  }

  function updateCartQuantity(lineId, quantity) {
    if (quantity <= 0) {
      setCart((current) => current.filter((line) => getLineId(line) !== lineId))
      return
    }
    setCart((current) =>
      current.map((line) =>
        getLineId(line) === lineId ? { ...line, quantity } : line,
      ),
    )
  }

  function openPackagePicker(item) {
    setPackageItem(item)
    setIsManagingPackages(false)
    setPackageName('')
    setPackageFactor('')
    setPackagePrice('')
    setError('')
    setNotice('')
  }

  function addSalePackage(event) {
    event.preventDefault()
    if (!packageItem) {
      return
    }

    const name = packageName.trim()
    const factor = Number(packageFactor)
    const price = Number(packagePrice)
    if (!name || !Number.isFinite(factor) || factor <= 1 || !Number.isFinite(price) || price < 0) {
      setError('Enter a package name, a base-unit quantity greater than 1, and a valid price.')
      return
    }

    const itemId = getItemId(packageItem)
    const newPackage = {
      id: createTransactionId('PKG'),
      name,
      baseUnitId: getBaseUnitId(packageItem),
      quantityInBase: factor,
      unitPrice: price,
      isBaseUnit: false,
    }
    const nextConfig = {
      ...packagesByItem,
      [itemId]: [...(packagesByItem[itemId] ?? []), newPackage],
    }
    try {
      saveLocalRecords(packageConfigKey, nextConfig)
      setPackagesByItem(nextConfig)
      setPackageName('')
      setPackageFactor('')
      setPackagePrice('')
      setError('')
      setNotice('Sale package saved in this browser for this branch.')
    } catch {
      setError('Unable to save the sale package in browser storage.')
    }
  }

  async function getPaymentMethods(){
    const branchId = getSelectedBranch()
    if (branchId == null) {
      setError('No branch is selected.')
      return false
    }
    const endpoint = new URL(api_cradle.getPaymentMethods)
    endpoint.searchParams.set('X-Branch-Id', String(branchId))
    let result = await getRestData(endpoint)
    if(result){setPaymentMethods(result)}
  }


  async function persist(url,receipt){
    const branchId = getSelectedBranch()
    if (branchId == null) {
      setError('No branch is selected.')
      return false
    }

   

   
    const endpoint = new URL(url)
    endpoint.searchParams.set('X-Branch-Id', String(branchId))
    // if (isEditing) {
    //   endpoint.searchParams.set('id', String(dialogItem.id))
    // }

    let result = await saveOnlineReceipt(endpoint,receipt)
    if(result){}//if succesful
    setNotice("Successfully Posted")
  }

  function removeSalePackage(itemId, packageId) {
    const nextConfig = {
      ...packagesByItem,
      [itemId]: (packagesByItem[itemId] ?? []).filter((item) => item.id !== packageId),
    }
    try {
      saveLocalRecords(packageConfigKey, nextConfig)
      setPackagesByItem(nextConfig)
      setError('')
    } catch {
      setError('Unable to remove the sale package from browser storage.')
    }
  }

  function holdSale() {
    if (cart.length === 0) {
      setError('Add at least one item before holding a sale.')
      return
    }
    const heldSale = {
      id: createTransactionId('HOLD'),
      customerName: customerName.trim(),
      lines: cart,
      createdAt: new Date().toISOString(),
    }
    const nextHeldSales = [heldSale, ...heldSales]
    try {
      saveLocalRecords(HELD_SALES_KEY, nextHeldSales)
      setHeldSales(nextHeldSales)
      setCart([])
      setCustomerName('')
      setAmountTendered('')
      setNotice('Sale held in this browser.')
      setError('')
    } catch {
      setError('Unable to hold this sale in browser storage.')
    }
  }

  function resumeHeldSale(heldSale) {
    if (cart.length > 0 && !window.confirm('Replace the current cart with this held sale?')) {
      return
    }
    const nextHeldSales = heldSales.filter((sale) => sale.id !== heldSale.id)
    try {
      saveLocalRecords(HELD_SALES_KEY, nextHeldSales)
      setHeldSales(nextHeldSales)
      setCart(heldSale.lines)
      setCustomerName(heldSale.customerName)
      setActiveTab('sale')
      setNotice('Held sale restored.')
      setError('')
    } catch {
      setError('Unable to restore the held sale from browser storage.')
    }
  }

  function removeHeldSale(heldSaleId) {
    const nextHeldSales = heldSales.filter((sale) => sale.id !== heldSaleId)
    try {
      saveLocalRecords(HELD_SALES_KEY, nextHeldSales)
      setHeldSales(nextHeldSales)
      setError('')
    } catch {
      setError('Unable to remove the held sale from browser storage.')
    }
  }

  function completeSale() {
    if (cart.length === 0) {
      setError('Add at least one item before completing a sale.')
      return
    }
    if (paymentMethod === 'Cash' && (!Number.isFinite(tendered) || tendered < subtotal)) {
      setError('The amount received must cover the sale total.')
      return
    }

    const receipt = {
      id: createTransactionId('POS'),
      customerName: customerName.trim() || 'Walk-in customer',
      lines: cart,
      subtotal,
      paymentMethod,
      amountTendered: paymentMethod === 'Cash' ? tendered : subtotal,
      changeDue: paymentMethod === 'Cash' ? changeDue : 0,
      createdAt: new Date().toISOString(),
      returnedQuantities: {},
    }
    const nextReceipts = [receipt, ...receipts]
    try {
      persist(api_cradle.postPOSReceiptUrl,receipt)//persist to server
      saveLocalRecords(RECEIPTS_KEY, nextReceipts)
      setReceipts(nextReceipts)
      setLastReceipt(receipt)
      setCart([])
      setCustomerName('')
      setAmountTendered('')
      setActiveTab('receipts')
      setNotice('Local receipt created. It has not been saved to the server.')
      setError('')
    } catch {
      setError('Unable to save the receipt in browser storage. The cart was not cleared.')
    }
  }

  function startReturn(receiptId) {
    setSelectedReturnReceipt(receiptId)
    setReturnQuantities({})
  }

  function processReturn() {
    const receipt = receipts.find((item) => item.id === selectedReturnReceipt)
    if (!receipt) {
      setError('Choose a local receipt before processing a return.')
      return
    }
    const returnLines = receipt.lines
      .map((line) => {
        const lineId = getLineId(line)
        return {
          ...line,
          quantity: Number(
            returnQuantities[lineId] ??
              (!line.lineId ? returnQuantities[line.itemId] : undefined) ??
              0,
          ),
        }
      })
      .filter((line) => line.quantity > 0)

    if (returnLines.length === 0) {
      setError('Choose a quantity to return for at least one item.')
      return
    }

    for (const line of returnLines) {
      const lineId = getLineId(line)
      const originalLine = receipt.lines.find((item) => getLineId(item) === lineId)
      const alreadyReturned = getReturnedQuantity(receipt, line)
      if (line.quantity > originalLine.quantity - alreadyReturned) {
        setError(`Return quantity exceeds the remaining quantity for ${line.name}.`)
        return
      }
    }

    const returnRecord = {
      id: createTransactionId('RETURN'),
      receiptId: receipt.id,
      customerName: receipt.customerName,
      lines: returnLines,
      total: returnLines.reduce(
        (total, line) => total + line.unitPrice * line.quantity,
        0,
      ),
      baseQuantity: returnLines.reduce(
        (total, line) => total + line.quantity * (line.quantityInBase ?? 1),
        0,
      ),
      createdAt: new Date().toISOString(),
    }
    const nextReturns = [returnRecord, ...returns]
    const nextReceipts = receipts.map((item) => {
      if (item.id !== receipt.id) {
        return item
      }
      const returnedQuantities = { ...item.returnedQuantities }
      for (const line of returnLines) {
        const lineId = getLineId(line)
        returnedQuantities[lineId] =
          getReturnedQuantity(item, line) + line.quantity
      }
      return { ...item, returnedQuantities }
    })

    try {
      saveLocalRecords(RETURNS_KEY, nextReturns)
      saveLocalRecords(RECEIPTS_KEY, nextReceipts)
      setReturns(nextReturns)
      setReceipts(nextReceipts)
      setSelectedReturnReceipt('')
      setReturnQuantities({})
      setNotice('Local return recorded. Inventory and server records were not updated.')
      setError('')
    } catch {
      setError('Unable to save the return in browser storage.')
    }
  }

  function printReceipt(receipt) {
    setLastReceipt(receipt)
    window.setTimeout(() => window.print(), 0)
  }

  function renderReceipt(receipt) {
    return (
      <article className="pos-receipt" key={receipt.id}>
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <h3 className="h6 mb-1">Receipt {receipt.id}</h3>
            <p className="small text-muted mb-1">
              {new Date(receipt.createdAt).toLocaleString()}
            </p>
            <p className="small mb-2">{receipt.customerName}</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary pos-no-print"
            onClick={() => printReceipt(receipt)}
          >
            <i className="bi bi-printer me-1" aria-hidden="true" />
            Print
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-2">
            <thead>
              <tr><th>Item</th><th className="text-end">Qty</th><th className="text-end">Total</th></tr>
            </thead>
            <tbody>
              {receipt.lines.map((line) => (
                <tr key={getLineId(line)}>
                  <td>
                    {line.name}
                    <small className="d-block text-muted">
                      {line.packageName ?? line.baseUnitName ?? 'unit'}
                      {line.quantityInBase > 1
                        ? ` · ${line.quantityInBase} ${line.baseUnitName ?? 'units'} each`
                        : ''}
                    </small>
                  </td>
                  <td className="text-end">{line.quantity}</td>
                  <td className="text-end">{currency.format(line.unitPrice * line.quantity)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><th colSpan={2}>Total</th><th className="text-end">{currency.format(receipt.subtotal)}</th></tr>
            </tfoot>
          </table>
        </div>
        <div className="d-flex flex-wrap justify-content-between gap-2 small text-muted">
          <span>{receipt.paymentMethod} payment</span>
          <span>Change: {currency.format(receipt.changeDue)}</span>
        </div>
        <p className="small text-warning-emphasis mb-0 mt-2 pos-no-print">
          Browser-only receipt — not synced to the server.
        </p>
      </article>
    )
  }

  const returnReceipt = receipts.find((receipt) => receipt.id === selectedReturnReceipt)

  return (
    <div className="container-fluid p-3 p-lg-4 pos-page">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge text-bg-primary">POINT OF SALE</span>
            <span className="badge text-bg-warning">LOCAL MODE</span>
          </div>
          <h1 className="h3 mb-1">Sales &amp; Invoicing</h1>
          <p className="text-muted mb-0">Build a sale, manage held carts, and print local receipts.</p>
        </div>
        <div className="d-flex gap-2 pos-no-print">
          <button type="button" className="btn btn-outline-secondary" onClick={() => setActiveTab('held')}>
            <i className="bi bi-pause-circle me-2" aria-hidden="true" />
            Held <span className="badge text-bg-secondary ms-1">{heldSales.length}</span>
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => setActiveTab('receipts')}>
            <i className="bi bi-receipt me-2" aria-hidden="true" />
            Receipts
          </button>
        </div>
      </div>

      <div className="alert alert-warning d-flex gap-2 align-items-start py-2" role="status">
        <i className="bi bi-info-circle mt-1" aria-hidden="true" />
        <span>
          POS actions are stored only in this browser. Checkout, receipts, holds, and returns do not update server sales or inventory.
        </span>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      {packageError && (
        <div className="alert alert-warning" role="alert">
          Could not load API package units: {packageError}
        </div>
      )}

      <nav className="nav nav-pills gap-2 mb-3 pos-no-print" aria-label="POS sections">
        {[
          ['sale', 'New sale', 'cart3'],
          ['held', `Sales hold (${heldSales.length})`, 'pause-circle'],
          ['returns', 'Sales return', 'arrow-counterclockwise'],
          ['receipts', 'Receipts', 'receipt'],
        ].map(([tab, label, icon]) => (
          <button
            key={tab}
            type="button"
            className={`nav-link${activeTab === tab ? ' active' : ''}`}
            onClick={() => {
              setActiveTab(tab)
              setError('')
              setNotice('')
            }}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            <i className={`bi bi-${icon} me-2`} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'sale' && (
        <div className="row g-3">
          <div className="col-12 col-xxl-8">
            <section className="card h-100 pos-no-print">
              <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                  <h2 className="h5 mb-1">Tap an item to add it</h2>
                  <p className="text-muted small mb-0">{filteredItems.length} items available</p>
                </div>
                <div className="pos-search">
                  <label htmlFor="pos-item-search" className="visually-hidden">Search items</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-search" aria-hidden="true" /></span>
                    <input
                      id="pos-item-search"
                      className="form-control"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search name or SKU"
                    />
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="pos-category-tabs mb-3" role="group" aria-label="Item categories">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`btn btn-sm ${activeCategory === category ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setActiveCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                {isLoading ? (
                  <div className="text-center text-muted py-5" role="status">
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    Loading items…
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    {items.length ? 'No items match this search.' : 'No items are available for this branch.'}
                  </div>
                ) : (
                  <div className="pos-item-grid">
                    {filteredItems.map((item) => (
                      <div
                        key={getItemId(item)}
                        className="pos-item-tile"
                      >
                        <span className="pos-item-image">
                          {getItemImage(item) ? (
                            <img src={getItemImage(item)} alt="" loading="lazy" />
                          ) : (
                            <i className="bi bi-image text-muted" aria-hidden="true" />
                          )}
                        </span>
                        <span className="pos-item-name">{getItemName(item)}</span>
                        <span className="small text-muted">{item.sku || getItemCategory(item)}</span>
                        <strong className="text-primary">{currency.format(getItemPrice(item))}</strong>
                        <div className="d-flex gap-2 w-100 mt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary flex-grow-1"
                            onClick={() => addToCart(item, getItemPackages(item)[0])}
                            aria-label={`Add one ${getBaseUnitName(item)} of ${getItemName(item)}`}
                          >
                            Add {getBaseUnitName(item)}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => openPackagePicker(item)}
                            aria-label={`Choose a sale package for ${getItemName(item)}`}
                            title="Sale packages"
                          >
                            <i className="bi bi-box-seam" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="col-12 col-xxl-4">
            <section className="card pos-cart-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="h5 mb-0">Current sale</h2>
                  <small className="text-muted">{cart.reduce((count, line) => count + line.quantity, 0)} items</small>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger pos-no-print"
                  disabled={!cart.length}
                  onClick={() => setCart([])}
                >
                  Clear
                </button>
              </div>
              <div className="card-body">
                <label htmlFor="pos-customer" className="form-label">Customer</label>
                <input
                  id="pos-customer"
                  className="form-control mb-3 pos-no-print"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Walk-in customer"
                />
                {cart.length === 0 ? (
                  <div className="pos-cart-empty text-center text-muted">
                    <i className="bi bi-cart3 display-6 d-block mb-2" aria-hidden="true" />
                    Tap an item to start a sale.
                  </div>
                ) : (
                  <div className="pos-cart-lines">
                    {cart.map((line) => (
                      <div className="pos-cart-line" key={getLineId(line)}>
                        <div className="flex-grow-1 min-w-0">
                          <strong className="d-block text-truncate">{line.name}</strong>
                          <small className="text-muted">
                            {currency.format(line.unitPrice)} / {line.packageName ?? line.baseUnitName ?? 'unit'}
                            {line.quantityInBase > 1
                              ? ` · ${line.quantityInBase} ${line.baseUnitName ?? 'units'} per package`
                              : ''}
                          </small>
                        </div>
                        <div className="d-flex align-items-center gap-2 pos-no-print">
                          <div className="btn-group btn-group-sm" role="group" aria-label={`${line.name} quantity`}>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => updateCartQuantity(getLineId(line), line.quantity - 1)} aria-label={`Decrease ${line.name}`}>−</button>
                            <span className="btn btn-outline-secondary disabled">{line.quantity}</span>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => updateCartQuantity(getLineId(line), line.quantity + 1)} aria-label={`Increase ${line.name}`}>+</button>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => updateCartQuantity(getLineId(line), 0)}
                            aria-label={`Remove ${line.name} from cart`}
                            title="Remove line item"
                          >
                            <i className="bi bi-trash" aria-hidden="true" />
                          </button>
                        </div>
                        <strong className="text-nowrap">{currency.format(line.unitPrice * line.quantity)}</strong>
                      </div>
                    ))}
                  </div>
                )}
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Subtotal</span>
                  <strong>{currency.format(subtotal)}</strong>
                </div>
                <div className="pos-no-print">
                  <label htmlFor="pos-payment-method" className="form-label">Payment method</label>
                  <select
                    id="pos-payment-method"
                    className="form-select mb-3"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  >
                   {paymentMethods.map((pm, index) => (
                          <option
                            key={pm.id ?? index}
                            value={String(pm.paymentModesTag)}
                          >
                            {pm.paymentModesTag
                              ? `${pm.paymentModesTag}`
                              : `${pm.paymentModesTag}` }
                          </option>
                      ))}
                  </select>
                  <label htmlFor="pos-payment-method" className="form-label">Account</label>
                  <select
                    id="pos-payment-account"
                    className="form-select mb-3"
                    value={account}
                    onChange={(event) => setAccount(event.target.value)}
                  >
                    <option>Cash</option>
                    <option>Card</option>
                    <option>Transfer</option>
                  </select>
                  {paymentMethod === 'Cash' && (
                    <>
                      <label htmlFor="pos-amount-tendered" className="form-label">Amount received</label>
                      <input
                        id="pos-amount-tendered"
                        className="form-control mb-2"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountTendered}
                        onChange={(event) => setAmountTendered(event.target.value)}
                        placeholder="0.00"
                      />
                      <div className="d-flex justify-content-between small mb-3">
                        <span className="text-muted">Change due</span>
                        <strong>{currency.format(changeDue)}</strong>
                      </div>
                    </>
                  )}
                  <div className="d-grid gap-2">
                    <button type="button" className="btn btn-primary btn-lg" onClick={completeSale} disabled={!cart.length}>
                      <i className="bi bi-receipt me-2" aria-hidden="true" />
                      Complete sale
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={holdSale} disabled={!cart.length}>
                      <i className="bi bi-pause-circle me-2" aria-hidden="true" />
                      Hold sale
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'held' && (
        <section className="card pos-no-print">
          <div className="card-header"><h2 className="h5 mb-0">Held sales</h2></div>
          <div className="card-body">
            {heldSales.length === 0 ? (
              <p className="text-muted mb-0">There are no held sales in this browser.</p>
            ) : (
              <div className="list-group">
                {heldSales.map((sale) => (
                  <div className="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-3" key={sale.id}>
                    <div>
                      <strong>{sale.customerName || 'Walk-in customer'}</strong>
                      <div className="small text-muted">{sale.lines.length} lines · {new Date(sale.createdAt).toLocaleString()}</div>
                      <div className="fw-semibold">{currency.format(sale.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0))}</div>
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => resumeHeldSale(sale)}>Resume</button>
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeHeldSale(sale.id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'returns' && (
        <section className="card pos-no-print">
          <div className="card-header">
            <h2 className="h5 mb-0">Sales return</h2>
            <small className="text-muted">Returns can only reference receipts created in this browser.</small>
          </div>
          <div className="card-body">
            {receipts.length === 0 ? (
              <p className="text-muted mb-0">Complete a local sale first to start a return.</p>
            ) : (
              <>
                <label htmlFor="pos-return-receipt" className="form-label">Original receipt</label>
                <select
                  id="pos-return-receipt"
                  className="form-select mb-3"
                  value={selectedReturnReceipt}
                  onChange={(event) => startReturn(event.target.value)}
                >
                  <option value="">Choose a receipt</option>
                  {receipts.map((receipt) => (
                    <option key={receipt.id} value={receipt.id}>
                      {receipt.id} · {receipt.customerName} · {currency.format(receipt.subtotal)}
                    </option>
                  ))}
                </select>
                {returnReceipt && (
                  <>
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr><th>Item</th><th>Purchased</th><th>Available to return</th><th>Return qty</th></tr>
                        </thead>
                        <tbody>
                          {returnReceipt.lines.map((line) => {
                            const lineId = getLineId(line)
                            const alreadyReturned = getReturnedQuantity(returnReceipt, line)
                            const available = line.quantity - alreadyReturned
                            return (
                              <tr key={lineId}>
                                <td>
                                  {line.name}
                                  <div className="small text-muted">
                                    {currency.format(line.unitPrice)} / {line.packageName ?? line.baseUnitName ?? 'unit'}
                                    {line.quantityInBase > 1
                                      ? ` · ${line.quantityInBase} ${line.baseUnitName ?? 'units'} each`
                                      : ''}
                                  </div>
                                </td>
                                <td>{line.quantity}</td>
                                <td>{available}</td>
                                <td>
                                  <input
                                    className="form-control form-control-sm pos-return-quantity"
                                    type="number"
                                    min="0"
                                    max={available}
                                    value={returnQuantities[lineId] ?? ''}
                                    onChange={(event) => setReturnQuantities((current) => ({ ...current, [lineId]: event.target.value }))}
                                    aria-label={`Return quantity for ${line.name}`}
                                    disabled={available === 0}
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" className="btn btn-warning" onClick={processReturn}>Record local return</button>
                  </>
                )}
              </>
            )}
            {returns.length > 0 && (
              <div className="mt-4">
                <h3 className="h6">Recent local returns</h3>
                <div className="list-group">
                  {returns.slice(0, 5).map((returnRecord) => (
                    <div className="list-group-item d-flex justify-content-between gap-3" key={returnRecord.id}>
                      <span>{returnRecord.id}<small className="d-block text-muted">Receipt {returnRecord.receiptId}</small></span>
                      <strong>{currency.format(returnRecord.total)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'receipts' && (
        <section className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h2 className="h5 mb-0">Local receipts</h2>
            <span className="badge text-bg-secondary">{receipts.length}</span>
          </div>
          <div className="card-body">
            {lastReceipt && renderReceipt(lastReceipt)}
            {receipts.length === 0 ? (
              <p className="text-muted mb-0">No receipts have been created in this browser.</p>
            ) : (
              <div className="d-grid gap-3">
                {receipts
                  .filter((receipt) => receipt.id !== lastReceipt?.id)
                  .map((receipt) => renderReceipt(receipt))}
              </div>
            )}
          </div>
        </section>
      )}
      {packageItem && (
        <>
          <div className="modal-backdrop show account-dialog-backdrop" />
          <div
            className="modal d-block account-dialog-modal pos-no-print"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-package-dialog-title"
            tabIndex="-1"
          >
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content account-dialog-content">
                <div className="modal-header">
                  <div>
                    <h2 className="modal-title fs-5" id="pos-package-dialog-title">
                      Sale units · {getItemName(packageItem)}
                    </h2>
                    <p className="small text-muted mb-0">
                      Package settings are saved in this browser for this branch.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setPackageItem(null)}
                  />
                </div>
                <div className="modal-body">
                  <h3 className="h6">Choose a unit to add</h3>
                  <div className="list-group mb-3">
                    {getItemPackages(packageItem).map((salePackage) => (
                      <button
                        key={salePackage.id}
                        type="button"
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-3"
                        onClick={() => {
                          addToCart(packageItem, salePackage)
                          setPackageItem(null)
                        }}
                      >
                        <span>
                          <strong className="d-block">{salePackage.name}</strong>
                          <small className="text-muted">
                            {salePackage.quantityInBase} {getBaseUnitName(packageItem)} per package
                          </small>
                        </span>
                        <strong>{currency.format(salePackage.unitPrice)}</strong>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary mb-3"
                    onClick={() => setIsManagingPackages((current) => !current)}
                  >
                    <i className={`bi bi-${isManagingPackages ? 'chevron-up' : 'plus-lg'} me-1`} aria-hidden="true" />
                    {isManagingPackages ? 'Hide package settings' : 'Manage sale packages'}
                  </button>
                  {isManagingPackages && (
                    <div className="border rounded p-3">
                      <h3 className="h6">Add a package unit</h3>
                      <p className="small text-muted">
                        Example: package name “Pack”, base quantity 6, and the pack selling price.
                      </p>
                      <form onSubmit={addSalePackage}>
                        <div className="mb-2">
                          <label htmlFor="pos-package-name" className="form-label">Package name</label>
                          <input
                            id="pos-package-name"
                            className="form-control"
                            value={packageName}
                            onChange={(event) => setPackageName(event.target.value)}
                            placeholder="e.g. Pack"
                            required
                          />
                        </div>
                        <div className="row g-2">
                          <div className="col-6">
                            <label htmlFor="pos-package-factor" className="form-label">
                              Number of {getBaseUnitName(packageItem)}s
                            </label>
                            <input
                              id="pos-package-factor"
                              className="form-control"
                              type="number"
                              min="1.01"
                              step="any"
                              value={packageFactor}
                              onChange={(event) => setPackageFactor(event.target.value)}
                              required
                            />
                          </div>
                          <div className="col-6">
                            <label htmlFor="pos-package-price" className="form-label">Package price</label>
                            <input
                              id="pos-package-price"
                              className="form-control"
                              type="number"
                              min="0"
                              step="0.01"
                              value={packagePrice}
                              onChange={(event) => setPackagePrice(event.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm mt-3">
                          Save package
                        </button>
                      </form>
                      {packagesByItem[getItemId(packageItem)]?.length > 0 && (
                        <div className="mt-3">
                          <h4 className="small fw-semibold">Configured packages</h4>
                          <ul className="list-group list-group-flush">
                            {packagesByItem[getItemId(packageItem)].map((salePackage) => (
                              <li
                                className="list-group-item d-flex justify-content-between align-items-center gap-2 px-0"
                                key={salePackage.id}
                              >
                                <span>
                                  {salePackage.name} · {salePackage.quantityInBase} {getBaseUnitName(packageItem)} · {currency.format(salePackage.unitPrice)}
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeSalePackage(getItemId(packageItem), salePackage.id)}
                                  aria-label={`Remove ${salePackage.name} package`}
                                >
                                  <i className="bi bi-trash" aria-hidden="true" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setPackageItem(null)}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default PosInvoicing
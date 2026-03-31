import { useState, useEffect, useRef } from 'react'
import { 
  FiDownload,
  FiPrinter
} from 'react-icons/fi'
import { getSales, getExpenses, getAllPetActivities, getMedicines, getStoreItems, getClients, getPets, getStockEditHistory } from '../firebase/services'

function Reports() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month')
  const [activeTab, setActiveTab] = useState('overview')
  const [displayCountInventory, setDisplayCountInventory] = useState(20)
  const [displayCountAudit, setDisplayCountAudit] = useState(20)
  const inventoryContainerRef = useRef(null)
  const auditContainerRef = useRef(null)
  const inventorySentinelRef = useRef(null)
  const auditSentinelRef = useRef(null)
  const [data, setData] = useState({
    sales: [],
    expenses: [],
    consultations: [],
    medicines: [],
    storeItems: [],
    clients: [],
    pets: [],
    stockHistory: []
  })

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [sales, expenses, activities, medicines, storeItems, clients, pets, stockHistory] = await Promise.all([
        getSales(),
        getExpenses(),
        getAllPetActivities(),
        getMedicines(),
        getStoreItems(),
        getClients(),
        getPets(),
        getStockEditHistory()
      ])
      
      setData({ sales, expenses, consultations: activities, medicines, storeItems, clients, pets, stockHistory })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRangeFilter = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch(dateRange) {
      case 'today':
        return today
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return weekAgo
      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return monthAgo
      case 'year':
        const yearAgo = new Date(today)
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)
        return yearAgo
      default:
        return null
    }
  }

  const filterByDate = (items, dateField = 'createdAt') => {
    const rangeStart = getDateRangeFilter()
    if (!rangeStart) return items
    
    return items.filter(item => {
      const itemDate = item[dateField]?.toDate ? item[dateField].toDate() : new Date(item[dateField])
      return itemDate >= rangeStart
    })
  }

  // filteredSales: handle both consultation sales ('date' field) and POS sales ('saleDate' field)
  const filteredSales = (() => {
    const rangeStart = getDateRangeFilter()
    if (!rangeStart) return data.sales
    return data.sales.filter(s => {
      const d = s.type === 'consultation'
        ? new Date((s.date || '') + 'T00:00:00')
        : (s.saleDate?.toDate ? s.saleDate.toDate() : new Date(s.saleDate || s.createdAt))
      return !isNaN(d) && d >= rangeStart
    })
  })()
  const filteredExpenses = filterByDate(data.expenses, 'expenseDate')
  const filteredConsultations = filterByDate(data.consultations, 'createdAt')

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
  const totalProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0

  const totalConsultations = filteredConsultations.length
  const avgConsultationValue = totalConsultations > 0 ? (totalRevenue / totalConsultations) : 0

  const allInventory = [...data.medicines, ...data.storeItems]
  const lowStockItems = allInventory.filter(item => item.stockQuantity > 0 && item.stockQuantity <= 10).length
  const outOfStockItems = allInventory.filter(item => item.stockQuantity === 0).length

  const foodCategories = ['Dog Food', 'Cat Food', 'Bird Food']
  const calcItemValue = (item) => {
    if (item.medicineType === 'syrup') {
      return (item.bottleCount || 0) * (item.sellingPricePerBottle || 0)
           + (item.looseMl || 0) * (item.sellingPricePerMl || 0)
    }
    if (item.medicineType === 'tablet') {
      return (item.boxCount || 0) * (item.sellingPricePerBox || 0)
           + (item.looseTablets || 0) * (item.sellingPricePerTablet || 0)
    }
    if (item.itemName && foodCategories.includes(item.category)) {
      return (item.sacksCount || 0) * (item.sellingPricePerSack || 0)
           + (item.looseKg || 0) * (item.sellingPricePerKg || 0)
    }
    return (item.stockQuantity || 0) * (item.sellingPrice || 0)
  }
  const inventoryValue = allInventory.reduce((sum, item) => sum + calcItemValue(item), 0)

  const consultationRevenue = filteredSales.filter(s => s.type === 'consultation').reduce((sum, s) => sum + (s.totalAmount || 0), 0)
  const storeRevenue = filteredSales.filter(s => s.type !== 'consultation').reduce((sum, s) => sum + (s.totalAmount || 0), 0)

  const getStockDisplay = (item) => {
    if (item.medicineType === 'syrup') {
      const parts = []
      if (item.bottleCount) parts.push(`${item.bottleCount} bot`)
      if (item.looseMl) parts.push(`${item.looseMl} ml`)
      return parts.join(' + ') || '0'
    }
    if (item.medicineType === 'tablet') {
      const parts = []
      if (item.boxCount) parts.push(`${item.boxCount} box`)
      if (item.looseTablets) parts.push(`${item.looseTablets} tab`)
      return parts.join(' + ') || '0'
    }
    if (item.itemName && foodCategories.includes(item.category)) {
      const parts = []
      if (item.sacksCount) parts.push(`${item.sacksCount} sack`)
      if (item.looseKg) parts.push(`${item.looseKg} kg`)
      return parts.join(' + ') || '0'
    }
    return `${item.stockQuantity || 0} ${item.unit || ''}`
  }

  const getPriceDisplay = (item) => {
    if (item.medicineType === 'syrup') return item.sellingPricePerBottle ? `₱${item.sellingPricePerBottle.toLocaleString('en-US', { minimumFractionDigits: 2 })}/bot` : '—'
    if (item.medicineType === 'tablet') return item.sellingPricePerBox ? `₱${item.sellingPricePerBox.toLocaleString('en-US', { minimumFractionDigits: 2 })}/box` : '—'
    if (item.itemName && foodCategories.includes(item.category)) return item.sellingPricePerSack ? `₱${item.sellingPricePerSack.toLocaleString('en-US', { minimumFractionDigits: 2 })}/sack` : '—'
    return item.sellingPrice ? `₱${item.sellingPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'
  }

  const getPrimaryStock = (item) => {
    if (item.medicineType === 'syrup') return item.bottleCount || 0
    if (item.medicineType === 'tablet') return item.boxCount || 0
    if (item.itemName && foodCategories.includes(item.category)) return item.sacksCount || 0
    return item.stockQuantity || 0
  }

  const salesByCategory = filteredSales.reduce((acc, sale) => {
    sale.items?.forEach(item => {
      const category = item.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = { revenue: 0, quantity: 0 }
      }
      acc[category].revenue += item.subtotal || 0
      acc[category].quantity += item.quantity || 0
    })
    return acc
  }, {})

  const topCategories = Object.entries(salesByCategory)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)

  const expensesByCategory = filteredExpenses.reduce((acc, exp) => {
    const category = exp.category || 'Other'
    acc[category] = (acc[category] || 0) + parseFloat(exp.amount || 0)
    return acc
  }, {})

  const topExpenseCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Audit Trail Data
  const getAuditTrail = () => {
    const rangeStart = getDateRangeFilter()
    const auditEvents = []
    
    // Sales (both consultation and POS)
    filteredSales.forEach(sale => {
      const saleDate = sale.type === 'consultation'
        ? new Date((sale.date || '') + 'T00:00:00')
        : (sale.saleDate?.toDate ? sale.saleDate.toDate() : new Date(sale.saleDate || sale.createdAt))
      auditEvents.push({
        date: isNaN(saleDate) ? new Date() : saleDate,
        type: sale.type === 'consultation' ? 'Consultation' : 'Sale',
        description: sale.type === 'consultation'
          ? `Consultation — ${sale.clientName || 'Client'}${sale.petNames?.length ? ' (' + sale.petNames.join(', ') + ')' : ''}`
          : `POS Sale — ${sale.itemName || (sale.items?.length ? sale.items.length + ' items' : 'items')}`,
        amount: sale.totalAmount || 0,
        reference: sale.id
      })
    })
    
    // Expense activities
    filteredExpenses.forEach(exp => {
      auditEvents.push({
        date: exp.expenseDate?.toDate ? exp.expenseDate.toDate() : new Date(exp.expenseDate),
        type: 'Expense',
        description: `${exp.category || 'Expense'} — ${exp.expenseName || ''}`,
        amount: -parseFloat(exp.amount || 0),
        reference: exp.id
      })
    })
    
    // Stock edit history
    data.stockHistory.forEach(log => {
      const logDate = log.createdAt?.toDate ? log.createdAt.toDate() : new Date(log.editedAt || log.createdAt)
      if (rangeStart && logDate < rangeStart) return
      auditEvents.push({
        date: logDate,
        type: 'Stock Edit',
        description: `${log.action === 'delete' ? 'Deleted' : 'Edited'} ${log.itemType === 'medicine' ? 'medicine' : 'store item'}: ${log.itemName || ''}`,
        amount: 0,
        reference: log.id
      })
    })
    
    return auditEvents.sort((a, b) => b.date - a.date)
  }

  const auditTrail = getAuditTrail()
  const displayedInventory = allInventory.slice(0, displayCountInventory)
  const hasMoreInventory = displayCountInventory < allInventory.length
  const displayedAudit = auditTrail.slice(0, displayCountAudit)
  const hasMoreAudit = displayCountAudit < auditTrail.length

  useEffect(() => {
    const container = inventoryContainerRef.current
    const sentinel = inventorySentinelRef.current
    if (!container || !sentinel) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMoreInventory) setDisplayCountInventory(prev => prev + 20) },
      { root: container, threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMoreInventory, activeTab])

  useEffect(() => {
    const container = auditContainerRef.current
    const sentinel = auditSentinelRef.current
    if (!container || !sentinel) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMoreAudit) setDisplayCountAudit(prev => prev + 20) },
      { root: container, threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMoreAudit, activeTab])

  useEffect(() => { setDisplayCountInventory(20) }, [dateRange])
  useEffect(() => { setDisplayCountAudit(20) }, [dateRange])

  const handleExportCSV = () => {
    const esc = (v) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
      return s
    }
    const row = (cols) => cols.map(esc).join(',')
    const dateLabel = { today: 'Today', week: 'Last 7 Days', month: 'Last 30 Days', year: 'Last Year', all: 'All Time' }[dateRange] || dateRange
    const fmtDate = (d) => {
      try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) } catch { return '' }
    }
    const fmtAmt = (n) => Number(n || 0).toFixed(2)

    const sections = []

    // ── OVERVIEW SUMMARY ──
    sections.push('OVERVIEW SUMMARY')
    sections.push(row(['Period', dateLabel]))
    sections.push(row(['Total Revenue', fmtAmt(totalRevenue)]))
    sections.push(row(['Consultation Revenue', fmtAmt(consultationRevenue)]))
    sections.push(row(['Store Revenue', fmtAmt(storeRevenue)]))
    sections.push(row(['Total Expenses', fmtAmt(totalExpenses)]))
    sections.push(row(['Net Profit', fmtAmt(totalProfit)]))
    sections.push(row(['Profit Margin (%)', profitMargin]))
    sections.push(row(['Total Inventory Value', fmtAmt(inventoryValue)]))
    sections.push(row(['Total Clients', data.clients.length]))
    sections.push(row(['Total Pets', data.pets.length]))
    sections.push(row(['Total Consultations', totalConsultations]))
    sections.push(row(['Medicines in Stock', data.medicines.length]))
    sections.push(row(['Store Items in Stock', data.storeItems.length]))
    sections.push(row(['Low Stock Items', lowStockItems]))
    sections.push(row(['Out of Stock Items', outOfStockItems]))
    sections.push('')

    // ── SALES ──
    sections.push('SALES')
    sections.push(row(['Date', 'Type', 'Client', 'Pets', 'Items', 'Total Amount']))
    filteredSales.forEach(s => {
      const d = s.type === 'consultation'
        ? fmtDate((s.date || '') + 'T00:00:00')
        : fmtDate(s.saleDate?.toDate ? s.saleDate.toDate() : s.saleDate)
      const type = s.type === 'consultation' ? 'Consultation' : 'POS Sale'
      const client = s.clientName || ''
      const pets = s.petNames?.join('; ') || (s.items?.map(i => i.itemName || i.name).join('; ') || '')
      const items = s.items?.length ? s.items.map(i => `${i.quantity}x ${i.itemName || i.name}`).join('; ') : ''
      sections.push(row([d, type, client, pets, items, fmtAmt(s.totalAmount)]))
    })
    sections.push('')

    // ── EXPENSES ──
    sections.push('EXPENSES')
    sections.push(row(['Date', 'Category', 'Description', 'Amount']))
    filteredExpenses.forEach(e => {
      const d = fmtDate(e.expenseDate?.toDate ? e.expenseDate.toDate() : e.expenseDate)
      sections.push(row([d, e.category || '', e.expenseName || '', fmtAmt(e.amount)]))
    })
    sections.push('')

    // ── INVENTORY ──
    sections.push('INVENTORY')
    sections.push(row(['Name', 'Type', 'Category', 'Stock', 'Unit Price', 'Total Value', 'Status']))
    allInventory.forEach(item => {
      const name = item.medicineName || item.itemName || ''
      const type = item.medicineName ? 'Medicine' : 'Store Item'
      const stock = getStockDisplay(item)
      const price = getPriceDisplay(item)
      const value = fmtAmt(calcItemValue(item))
      const primary = getPrimaryStock(item)
      const status = primary === 0 ? 'Out of Stock' : primary <= 10 ? 'Low Stock' : 'OK'
      sections.push(row([name, type, item.category || '', stock, price, value, status]))
    })
    sections.push('')

    // ── AUDIT TRAIL ──
    sections.push('AUDIT TRAIL')
    sections.push(row(['Date', 'Type', 'Description', 'Amount']))
    getAuditTrail().forEach(e => {
      sections.push(row([
        e.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        e.type,
        e.description,
        fmtAmt(e.amount)
      ]))
    })

    const csv = sections.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `happidogs-report-${dateLabel.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'financial', label: 'Financial' },
    { id: 'sales', label: 'Sales' },
    { id: 'audit', label: 'Audit Trail' }
  ]

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-2.5 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
          <h1 className="text-lg font-semibold text-gray-900">Business Reports</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
            
            <button
              onClick={handleExportCSV}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              <FiDownload className="w-3.5 h-3.5" />
              Export
            </button>
            

          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b -mb-px overflow-x-auto whitespace-nowrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-3">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-3">
              <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500 mt-0.5">C ₱{consultationRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} · S ₱{storeRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Total Expenses</p>
                <p className="text-xl font-bold text-gray-900">₱{totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500 mt-0.5">{filteredExpenses.length} records</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Total Stocks Value</p>
                <p className="text-xl font-bold text-gray-900">₱{inventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500 mt-0.5">{allInventory.length} items</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Business Stats</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Clients</span>
                  <span className="text-lg font-bold text-gray-900">{data.clients.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Pets</span>
                  <span className="text-lg font-bold text-gray-900">{data.pets.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Medicines</span>
                  <span className="text-lg font-bold text-gray-900">{data.medicines.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Store Items</span>
                  <span className="text-lg font-bold text-gray-900">{data.storeItems.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Consultations</span>
                  <span className="text-lg font-bold text-gray-900">{totalConsultations}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Inventory Summary</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 border border-gray-200 rounded">
                  <p className="text-xs text-gray-600 mb-0.5">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{allInventory.length}</p>
                </div>
                
                <div className="p-3 border border-yellow-200 bg-yellow-50 rounded">
                  <p className="text-xs text-yellow-700 mb-0.5">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-900">{lowStockItems}</p>
                </div>
                
                <div className="p-3 border border-red-200 bg-red-50 rounded">
                  <p className="text-xs text-red-700 mb-0.5">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-900">{outOfStockItems}</p>
                </div>
                
                <div className="p-3 border border-gray-200 rounded">
                  <p className="text-xs text-gray-600 mb-0.5">Total Value</p>
                  <p className="text-xl font-bold text-gray-900">₱{inventoryValue.toLocaleString()}</p>
                </div>
              </div>

              <div ref={inventoryContainerRef} className="overflow-auto" style={{ maxHeight: '500px' }}>
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[900px] text-xs">
                  <thead className="bg-gray-800 text-white sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Item Name</th>
                      <th className="px-3 py-2 text-left font-semibold">Type</th>
                      <th className="px-3 py-2 text-left font-semibold">Category</th>
                      <th className="px-3 py-2 text-center font-semibold">Stock</th>
                      <th className="px-3 py-2 text-right font-semibold">Unit Price</th>
                      <th className="px-3 py-2 text-right font-semibold">Total Value</th>
                      <th className="px-3 py-2 text-center font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayedInventory.map((item, index) => {
                      const itemName = item.medicineName || item.itemName
                      const itemType = item.medicineName ? 'Medicine' : 'Store Item'
                      const stockValue = calcItemValue(item)
                      const primaryQty = getPrimaryStock(item)
                      const status = primaryQty === 0 ? 'Out' : primaryQty <= 10 ? 'Low' : 'OK'
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900">{itemName}</td>
                          <td className="px-3 py-2 text-gray-600">{itemType}</td>
                          <td className="px-3 py-2 text-gray-600">{item.category}</td>
                          <td className="px-3 py-2 text-center font-semibold">{getStockDisplay(item)}</td>
                          <td className="px-3 py-2 text-right">{getPriceDisplay(item)}</td>
                          <td className="px-3 py-2 text-right font-semibold">₱{stockValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                              status === 'Out' ? 'bg-red-100 text-red-800' :
                              status === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    {hasMoreInventory && (
                      <tr ref={inventorySentinelRef}>
                        <td colSpan="7" className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-2 text-gray-400">
                            <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                            <span className="text-xs">Loading more...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-3">
              <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
                <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500 mt-1">{filteredSales.length} transactions</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
                <p className="text-xs text-gray-600 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">₱{totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500 mt-1">{filteredExpenses.length} records</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
                <p className="text-xs text-gray-600 mb-1">Net Profit/Loss</p>
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  ₱{totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">Margin: {profitMargin}%</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Profit & Loss Statement</h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-2 border-b font-semibold">
                  <span>Revenue</span>
                  <span>₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="pl-4 text-xs space-y-1">
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-gray-600">Sales Revenue</span>
                    <span>₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-t font-semibold">
                  <span>Expenses</span>
                  <span>₱{totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="pl-4 text-xs space-y-1">
                  {topExpenseCategories.map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center py-1.5">
                      <span className="text-gray-600">{category}</span>
                      <span>₱{amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center py-3 border-t-2 font-bold">
                  <span>Net Profit/Loss</span>
                  <span className={totalProfit >= 0 ? 'text-gray-900' : 'text-red-600'}>
                    ₱{totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-3">
              <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
                <p className="text-xs text-gray-600 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{filteredSales.length}</p>
                <p className="text-xs text-gray-500 mt-1">Transactions</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
                <p className="text-xs text-gray-600 mb-1">Average Sale</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₱{filteredSales.length > 0 ? (totalRevenue / filteredSales.length).toLocaleString('en-US', { maximumFractionDigits: 0 }) : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per transaction</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
                <p className="text-xs text-gray-600 mb-1">Items Sold</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredSales.reduce((sum, sale) => sum + (sale.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total units</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Sales by Category</h2>
              
              <div className="space-y-3 text-sm">
                {topCategories.map(([category, data], index) => {
                  const percentage = (data.revenue / totalRevenue * 100).toFixed(1)
                  return (
                    <div key={category} className="pb-3 border-b last:border-b-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="font-medium text-gray-900">{category}</span>
                          <p className="text-xs text-gray-500">{data.quantity} items</p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-gray-900">
                            ₱{data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <p className="text-xs text-gray-500">{percentage}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Audit Trail Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Activity Audit Trail</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 border border-gray-200 rounded">
                  <p className="text-xs text-gray-600 mb-0.5">Total Activities</p>
                  <p className="text-2xl font-bold text-gray-900">{auditTrail.length}</p>
                </div>
                
                <div className="p-3 border border-green-200 bg-green-50 rounded">
                  <p className="text-xs text-green-700 mb-0.5">Sales</p>
                  <p className="text-2xl font-bold text-green-900">{filteredSales.length}</p>
                </div>
                
                <div className="p-3 border border-red-200 bg-red-50 rounded">
                  <p className="text-xs text-red-700 mb-0.5">Expenses</p>
                  <p className="text-2xl font-bold text-red-900">{filteredExpenses.length}</p>
                </div>
                
                <div className="p-3 border border-blue-200 bg-blue-50 rounded">
                  <p className="text-xs text-blue-700 mb-0.5">Stock Edits</p>
                  <p className="text-2xl font-bold text-blue-900">{data.stockHistory.length}</p>
                </div>
              </div>

              <div ref={auditContainerRef} className="overflow-auto" style={{ maxHeight: '500px' }}>
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[900px] text-xs">
                  <thead className="bg-gray-800 text-white sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Date & Time</th>
                      <th className="px-3 py-2 text-left font-semibold">Activity Type</th>
                      <th className="px-3 py-2 text-left font-semibold">Description</th>
                      <th className="px-3 py-2 text-right font-semibold">Amount</th>
                      <th className="px-3 py-2 text-left font-semibold">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayedAudit.map((event, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-700">
                          {event.date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                            event.type === 'Sale' ? 'bg-green-100 text-green-800' :
                            event.type === 'Consultation' ? 'bg-blue-100 text-blue-800' :
                            event.type === 'Stock Edit' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {event.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{event.description}</td>
                        <td className={`px-3 py-2 text-right font-semibold ${
                          event.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {event.amount >= 0 ? '+' : ''}₱{Math.abs(event.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-gray-500 font-mono text-xs">
                          {event.reference?.substring(0, 8)}...
                        </td>
                      </tr>
                    ))}
                    {hasMoreAudit && (
                      <tr ref={auditSentinelRef}>
                        <td colSpan="5" className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-2 text-gray-400">
                            <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                            <span className="text-xs">Loading more...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
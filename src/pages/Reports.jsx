import { useState, useEffect } from 'react'
import { 
  FiDownload,
  FiPrinter
} from 'react-icons/fi'
import { getSales, getExpenses, getAllPetActivities, getMedicines, getStoreItems, getClients, getPets } from '../firebase/services'

function Reports() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month')
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState({
    sales: [],
    expenses: [],
    consultations: [],
    medicines: [],
    storeItems: [],
    clients: [],
    pets: []
  })

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [sales, expenses, activities, medicines, storeItems, clients, pets] = await Promise.all([
        getSales(),
        getExpenses(),
        getAllPetActivities(), // Changed from getConsultations
        getMedicines(),
        getStoreItems(),
        getClients(),
        getPets()
      ])
      
      setData({ sales, expenses, consultations: activities, medicines, storeItems, clients, pets })
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

  const filteredSales = filterByDate(data.sales, 'saleDate')
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
  const inventoryValue = allInventory.reduce((sum, item) => sum + (item.sellingPrice * item.stockQuantity), 0)

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

  const getMonthlyTrend = () => {
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      
      const monthSales = data.sales.filter(s => {
        const saleDate = s.saleDate?.toDate ? s.saleDate.toDate() : new Date(s.saleDate)
        return saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear()
      })
      
      const monthExpenses = data.expenses.filter(e => {
        const expDate = e.expenseDate?.toDate ? e.expenseDate.toDate() : new Date(e.expenseDate)
        return expDate.getMonth() === date.getMonth() && expDate.getFullYear() === date.getFullYear()
      })
      
      const revenue = monthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
      const expenses = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
      
      months.push({
        month: monthName,
        revenue,
        expenses,
        profit: revenue - expenses
      })
    }
    
    return months
  }

  const monthlyTrend = getMonthlyTrend()
  const maxValue = Math.max(...monthlyTrend.map(m => Math.max(m.revenue, m.expenses)))

  // Audit Trail Data
  const getAuditTrail = () => {
    const auditEvents = []
    
    // Sales activities
    filteredSales.forEach(sale => {
      auditEvents.push({
        date: sale.saleDate?.toDate ? sale.saleDate.toDate() : new Date(sale.saleDate),
        type: 'Sale',
        description: `Sale transaction - ${sale.items?.length || 0} items`,
        amount: sale.totalAmount,
        reference: sale.id
      })
    })
    
    // Expense activities
    filteredExpenses.forEach(exp => {
      auditEvents.push({
        date: exp.expenseDate?.toDate ? exp.expenseDate.toDate() : new Date(exp.expenseDate),
        type: 'Expense',
        description: `${exp.category} - ${exp.expenseName}`,
        amount: -parseFloat(exp.amount),
        reference: exp.id
      })
    })
    
    // Consultation activities
    filteredConsultations.forEach(con => {
      auditEvents.push({
        date: con.createdAt?.toDate ? con.createdAt.toDate() : new Date(con.createdAt),
        type: 'Consultation',
        description: `Consultation for ${con.petName || 'Pet'}`,
        amount: con.totalCost || 0,
        reference: con.id
      })
    })
    
    return auditEvents.sort((a, b) => b.date - a.date)
  }

  const auditTrail = getAuditTrail()

  const handleExportCSV = () => {
    alert('CSV export functionality - Coming soon!')
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
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold text-gray-900">Business Reports</h1>
          
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
            
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              <FiDownload className="w-3.5 h-3.5" />
              Export
            </button>
            
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              <FiPrinter className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b -mb-px">
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
      <div className="flex-1 overflow-auto px-6 py-3">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Revenue</p>
                <p className="text-xl font-bold text-gray-900">₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500 mt-0.5">{filteredSales.length} transactions</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Expenses</p>
                <p className="text-xl font-bold text-gray-900">₱{totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500 mt-0.5">{filteredExpenses.length} records</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Net Profit</p>
                <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  ₱{totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Margin: {profitMargin}%</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Consultations</p>
                <p className="text-xl font-bold text-gray-900">{totalConsultations}</p>
                <p className="text-xs text-gray-500 mt-0.5">Avg: ₱{avgConsultationValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              {/* Monthly Trend */}
              <div className="col-span-2 bg-white border border-gray-200 rounded-md shadow-sm p-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">6-Month Performance</h2>
                
                <div className="space-y-3">
                  {monthlyTrend.map((month, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{month.month}</span>
                        <span className={`text-xs font-semibold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₱{month.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex gap-1 h-6">
                        <div className="flex-1 bg-gray-100 rounded overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${(month.revenue / maxValue) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex-1 bg-gray-100 rounded overflow-hidden">
                          <div 
                            className="h-full bg-gray-400 transition-all"
                            style={{ width: `${(month.expenses / maxValue) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                        <span>₱{month.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        <span>₱{month.expenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-600">Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-gray-400 rounded"></div>
                    <span className="text-gray-600">Expenses</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Business Stats</h2>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-xs text-gray-600">Clients</span>
                    <span className="text-sm font-semibold text-gray-900">{data.clients.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-xs text-gray-600">Pets</span>
                    <span className="text-sm font-semibold text-gray-900">{data.pets.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-xs text-gray-600">Medicines</span>
                    <span className="text-sm font-semibold text-gray-900">{data.medicines.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-xs text-gray-600">Store Items</span>
                    <span className="text-sm font-semibold text-gray-900">{data.storeItems.length}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 bg-gray-50 -mx-4 px-4 rounded">
                    <span className="text-xs font-medium text-gray-700">Total Inventory</span>
                    <span className="text-sm font-bold text-gray-900">{allInventory.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Revenue Categories */}
              <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Revenue by Category</h2>
                
                {topCategories.length > 0 ? (
                  <div className="space-y-2.5">
                    {topCategories.map(([category, data], index) => {
                      const percentage = (data.revenue / totalRevenue * 100).toFixed(1)
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">{category}</span>
                            <span className="text-xs font-semibold text-gray-900">
                              ₱{data.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-blue-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{data.quantity} items • {percentage}%</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-6">No data available</p>
                )}
              </div>

              {/* Expense Categories */}
              <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Expenses by Category</h2>
                
                {topExpenseCategories.length > 0 ? (
                  <div className="space-y-2.5">
                    {topExpenseCategories.map(([category, amount], index) => {
                      const percentage = (amount / totalExpenses * 100).toFixed(1)
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">{category}</span>
                            <span className="text-xs font-semibold text-gray-900">
                              ₱{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-gray-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{percentage}% of total</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-6">No data available</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Inventory Summary</h2>
              
              <div className="grid grid-cols-4 gap-3 mb-4">
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

              <div className="overflow-auto" style={{ maxHeight: '500px' }}>
                <table className="w-full text-xs">
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
                    {allInventory.map((item, index) => {
                      const itemName = item.medicineName || item.itemName
                      const itemType = item.medicineName ? 'Medicine' : 'Store Item'
                      const stockValue = item.sellingPrice * item.stockQuantity
                      const status = item.stockQuantity === 0 ? 'Out' : item.stockQuantity <= 10 ? 'Low' : 'OK'
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900">{itemName}</td>
                          <td className="px-3 py-2 text-gray-600">{itemType}</td>
                          <td className="px-3 py-2 text-gray-600">{item.category}</td>
                          <td className="px-3 py-2 text-center font-semibold">{item.stockQuantity} {item.unit}</td>
                          <td className="px-3 py-2 text-right">₱{item.sellingPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 mb-3">
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
            <div className="grid grid-cols-3 gap-3 mb-3">
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
              
              <div className="grid grid-cols-4 gap-3 mb-4">
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
                  <p className="text-xs text-blue-700 mb-0.5">Consultations</p>
                  <p className="text-2xl font-bold text-blue-900">{filteredConsultations.length}</p>
                </div>
              </div>

              <div className="overflow-auto" style={{ maxHeight: '500px' }}>
                <table className="w-full text-xs">
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
                    {auditTrail.map((event, index) => (
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
                            event.type === 'Expense' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
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
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
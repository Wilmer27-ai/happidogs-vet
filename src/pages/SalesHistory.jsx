// src/pages/SalesHistory.jsx
import { useState, useEffect, useRef } from 'react'
import { FiArrowLeft, FiSearch, FiCalendar } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { getSales } from '../firebase/services'

function SalesHistory() {
  const navigate = useNavigate()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [itemTypeFilter, setItemTypeFilter] = useState('all')
  
  // Lazy loading
  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    setLoading(true)
    try {
      const salesData = await getSales()
      setSales(salesData)
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDateRange = (filter) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch(filter) {
      case 'today':
        return { start: today }
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return { start: weekAgo }
      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return { start: monthAgo }
      default:
        return null
    }
  }

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sale.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = itemTypeFilter === 'all' || 
                       (itemTypeFilter === 'store' && sale.itemType === 'store') ||
                       (itemTypeFilter === 'medicine' && sale.itemType === 'medicine')
    
    const dateRange = getDateRange(dateFilter)
    const matchesDate = !dateRange || new Date(sale.saleDate) >= dateRange.start
    
    return matchesSearch && matchesType && matchesDate
  })

  // Sort by date (newest first)
  const sortedSales = [...filteredSales].sort((a, b) => 
    new Date(b.saleDate) - new Date(a.saleDate)
  )

  // Displayed sales with lazy loading
  const displayedSales = sortedSales.slice(0, displayCount)
  const hasMore = displayCount < sortedSales.length

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          setDisplayCount(prev => prev + 20)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20)
  }, [searchQuery, dateFilter, itemTypeFilter])

  // Calculate statistics
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0)
  const totalTransactions = filteredSales.length

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/pet-store')}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to POS</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-blue-600 font-medium mb-1">Total Sales</p>
            <p className="text-2xl font-bold text-blue-900">₱{totalSales.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <p className="text-sm text-green-600 font-medium mb-1">Total Profit</p>
            <p className="text-2xl font-bold text-green-900">₱{totalProfit.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-medium mb-1">Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <select
            value={itemTypeFilter}
            onChange={(e) => setItemTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            <option value="all">All Types</option>
            <option value="store">Store Items</option>
            <option value="medicine">Medicines</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-white sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Date & Time</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Item Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Quantity</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase">Amount</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase">Profit</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : displayedSales.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No sales found
                    </td>
                  </tr>
                ) : (
                  <>
                    {displayedSales.map((sale, index) => (
                      <tr key={sale.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 border-b border-gray-200">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{formatDate(sale.saleDate)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 border-b border-gray-200">
                          <p className="font-medium text-gray-900">{sale.itemName}</p>
                          {sale.brand && <p className="text-xs text-gray-500">{sale.brand}</p>}
                        </td>
                        <td className="px-4 py-2 border-b border-gray-200 text-gray-700">
                          {sale.itemType === 'medicine' ? 'Medicine' : 'Store Item'}
                        </td>
                        <td className="px-4 py-2 border-b border-gray-200 text-gray-700">
                          {sale.category}
                        </td>
                        <td className="px-4 py-2 border-b border-gray-200 text-gray-700">
                          {sale.quantity} {sale.unit}
                        </td>
                        <td className="px-4 py-2 border-b border-gray-200 text-right font-semibold text-gray-900">
                          ₱{sale.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 border-b border-gray-200 text-right font-semibold text-gray-900">
                          ₱{sale.profit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {hasMore && (
                      <tr ref={observerTarget}>
                        <td colSpan="7" className="px-4 py-4 text-center text-gray-500 text-sm">
                          Loading more...
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalesHistory
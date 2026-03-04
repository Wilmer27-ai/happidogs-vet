// src/pages/SalesHistory.jsx
import { useState, useEffect, useRef } from 'react'
import { FiSearch, FiShoppingBag } from 'react-icons/fi'
import { getSales } from '../firebase/services'

function SalesHistory() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)

  useEffect(() => { loadSales() }, [])

  const loadSales = async () => {
    setLoading(true)
    try {
      const data = await getSales()
      setSales(data)
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const parts = String(dateString).split('T')[0].split('-')
      if (parts.length === 3) {
        const [year, month, day] = parts
        return new Date(Number(year), Number(month) - 1, Number(day))
          .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return 'N/A' }
  }

  const getDateRange = (filter) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    switch (filter) {
      case 'today': return { start: today }
      case 'week': { const d = new Date(today); d.setDate(d.getDate() - 7); return { start: d } }
      case 'month': { const d = new Date(today); d.setMonth(d.getMonth() - 1); return { start: d } }
      default: return null
    }
  }

  // ── Normalize each sale — handle both consultation sales and petstore sales ──
  const normalizeSale = (sale) => {
    // Consultation sale (saved by SummaryStep via saveSalesRecord)
    if (sale.type === 'consultation') {
      return {
        ...sale,
        displayType: 'Consultation',
        displayName: sale.clientName || 'Unknown Client',
        displayItems: (sale.items || []).map(i => ({
          name: i.medicineName || i.itemName || '',
          qty: i.quantity || 0,
          unit: i.unit || '',
          amount: i.subtotal ?? ((i.pricePerUnit ?? 0) * (i.quantity || 0))
        })),
        totalAmount: sale.totalAmount ?? 0,
        date: sale.date || sale.saleDate || sale.createdAt || '',
      }
    }

    // Petstore sale (saved by handleCheckout in Petstore.jsx via addSale)
    return {
      ...sale,
      displayType: sale.itemType === 'medicine' ? 'Medicine Sale' : 'Store Sale',
      displayName: sale.itemName || 'Unknown Item',
      displayItems: [{
        name: sale.itemName || '',
        qty: sale.quantity || 0,
        unit: sale.unit || '',
        amount: sale.totalAmount ?? 0
      }],
      totalAmount: sale.totalAmount ?? 0,
      date: sale.saleDate || sale.date || sale.createdAt || '',
    }
  }

  const filteredSales = sales
    .map(normalizeSale)
    .filter(sale => {
      const matchesSearch =
        sale.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.displayType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sale.displayItems || []).some(i => i.name?.toLowerCase().includes(searchQuery.toLowerCase()))

      const dateRange = getDateRange(dateFilter)
      const saleDate = new Date(sale.date)
      const matchesDate = !dateRange || saleDate >= dateRange.start

      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'consultation' && sale.type === 'consultation') ||
        (typeFilter === 'store' && sale.type !== 'consultation')

      return matchesSearch && matchesDate && matchesType
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const displayedSales = filteredSales.slice(0, displayCount)
  const hasMore = displayCount < filteredSales.length

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore) setDisplayCount(prev => prev + 20) },
      { threshold: 0.1 }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore])

  useEffect(() => { setDisplayCount(20) }, [searchQuery, dateFilter, typeFilter])

  const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.totalAmount ?? 0), 0)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredSales.length} record{filteredSales.length !== 1 ? 's' : ''} ·
              <span className="ml-1 font-medium text-green-600">₱{totalRevenue.toLocaleString()} total</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search by client, item, or type..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
            <option value="all">All Types</option>
            <option value="consultation">Consultations</option>
            <option value="store">Store Sales</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 text-sm">Loading sales...</p>
            </div>
          </div>
        ) : displayedSales.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FiShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">No sales found</p>
              <p className="text-gray-400 text-xs mt-1">
                {searchQuery ? 'Try adjusting your search' : 'No sales recorded yet'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Date</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Type</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Client / Item</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Items Sold</th>
                  <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wide border border-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {displayedSales.map((sale, index) => (
                  <tr key={sale.id || index}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-3 py-2.5 border border-gray-200 text-gray-600 whitespace-nowrap">
                      {formatDate(sale.date)}
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        sale.type === 'consultation'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {sale.displayType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200 font-medium text-gray-900">
                      {sale.displayName}
                      {/* Show pets for consultation sales */}
                      {sale.type === 'consultation' && sale.petNames?.length > 0 && (
                        <p className="text-xs text-gray-500 font-normal mt-0.5">
                          Pets: {sale.petNames.join(', ')}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200 text-gray-700">
                      {(sale.displayItems || []).length > 0 ? (
                        <div className="space-y-0.5">
                          {sale.displayItems.slice(0, 3).map((item, i) => (
                            <div key={i} className="text-gray-700">
                              <span className="font-medium">{item.name}</span>
                              {item.qty > 0 && (
                                <span className="text-gray-500"> × {item.qty} {item.unit}</span>
                              )}
                            </div>
                          ))}
                          {sale.displayItems.length > 3 && (
                            <p className="text-gray-400 italic">+{sale.displayItems.length - 3} more</p>
                          )}
                          {/* Consultation fee line */}
                          {sale.type === 'consultation' && sale.consultationFee > 0 && (
                            <div className="text-gray-500 italic">
                              + Consultation fee ₱{sale.consultationFee.toLocaleString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200 text-right font-bold text-gray-900">
                      ₱{(sale.totalAmount ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {hasMore && (
                  <tr ref={observerTarget}>
                    <td colSpan="5" className="px-4 py-3 text-center text-xs text-gray-400">
                      Loading more...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default SalesHistory
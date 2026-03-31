import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiSearch, FiPackage } from 'react-icons/fi'
import { getStockEditHistory } from '../firebase/services'

function StockEditHistory() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)

  useEffect(() => { loadHistory() }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await getStockEditHistory()
      setHistory(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } catch { return 'N/A' }
  }

  const formatValue = (val) => {
    if (val === undefined || val === null || val === '') return '—'
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }

  const IGNORED_FIELDS = ['createdAt', 'id', '_type', 'updatedAt']

  const FIELD_LABELS = {
    medicineName: 'Medicine Name',
    itemName: 'Item Name',
    brand: 'Brand',
    category: 'Category',
    medicineType: 'Medicine Type',
    stockQuantity: 'Stock Qty',
    bottleCount: 'Sealed Bottles',
    looseMl: 'Loose ML',
    mlPerBottle: 'ML per Bottle',
    boxCount: 'Sealed Boxes',
    looseTablets: 'Loose Tablets',
    tabletsPerBox: 'Tablets per Box',
    sacksCount: 'Sealed Sacks',
    looseKg: 'Loose KG',
    kgPerSack: 'KG per Sack',
    unit: 'Unit',
    purchasePrice: 'Purchase Price',
    sellingPrice: 'Selling Price',
    sellingPricePerMl: 'Price per ML',
    sellingPricePerBottle: 'Price per Bottle',
    sellingPricePerTablet: 'Price per Tablet',
    sellingPricePerBox: 'Price per Box',
    sellingPricePerKg: 'Price per KG',
    sellingPricePerSack: 'Price per Sack',
    expirationDate: 'Expiry Date',
    supplierName: 'Supplier',
  }

  const filteredHistory = history.filter(log => {
    const matchesSearch = log.itemName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    const matchesType = typeFilter === 'all' || log.itemType === typeFilter
    return matchesSearch && matchesAction && matchesType
  })

  const displayedHistory = filteredHistory.slice(0, displayCount)
  const hasMore = displayCount < filteredHistory.length

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore) setDisplayCount(prev => prev + 20) },
      { threshold: 0.1 }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore])

  useEffect(() => { setDisplayCount(20) }, [searchQuery, actionFilter, typeFilter])

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">

      {/* Header — fixed, never scrolls */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Stock Edit History</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredHistory.length} record{filteredHistory.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/medicines-stocks')}
            className="w-full md:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to Inventory
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
            <option value="all">All Actions</option>
            <option value="edit">Edits Only</option>
            <option value="delete">Deletions Only</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
            <option value="all">All Types</option>
            <option value="medicine">Medicine</option>
            <option value="store">Store Item</option>
          </select>
        </div>
      </div>

      {/* Table — takes all remaining height */}
      <div className="flex-1 overflow-hidden min-h-0 px-4 md:px-6 py-3">
        <div className="h-full bg-white rounded-md border border-gray-200 shadow-sm flex flex-col overflow-hidden">

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading history...</p>
              </div>
            </div>

          ) : filteredHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No edit history found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery ? 'Try adjusting your search' : 'No edits recorded yet'}
                </p>
              </div>
            </div>

          ) : (
            /* ── Scrollable table only ── */
            <div className="flex-1 overflow-auto min-h-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[900px] text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-900 text-white">
                    <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-700 w-40">Date & Time</th>
                    <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-700">Item</th>
                    <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-700 w-24">Type</th>
                    <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-700 w-20">Action</th>
                    <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-700">Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedHistory.map((log, index) => {
                    const changeEntries = Object.entries(log.changes || {})
                      .filter(([key]) => !IGNORED_FIELDS.includes(key))

                    return (
                      <tr key={log.id || index}
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-100 transition-colors align-top border-b border-gray-100`}>

                        {/* Date */}
                        <td className="px-3 py-2.5 border border-gray-100 text-gray-900 whitespace-nowrap">
                          {formatDate(log.editedAt)}
                        </td>

                        {/* Item Name */}
                        <td className="px-3 py-2.5 border border-gray-100 font-medium text-gray-900">
                          {log.itemName || '—'}
                        </td>

                        {/* Item Type */}
                        <td className="px-3 py-2.5 border border-gray-100 text-gray-900">
                          {log.itemType === 'medicine' ? 'Medicine' : 'Store'}
                        </td>

                        {/* Action */}
                        <td className="px-3 py-2.5 border border-gray-100">
                          <span className={`font-semibold ${log.action === 'delete' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {log.action === 'delete' ? 'Deleted' : 'Edited'}
                          </span>
                        </td>

                        {/* Changes */}
                        <td className="px-3 py-2.5 border border-gray-100">
                          {log.action === 'delete' ? (
                            <span className="text-red-500 italic">Item permanently deleted</span>
                          ) : changeEntries.length === 0 ? (
                            <span className="text-gray-400 italic">No changes recorded</span>
                          ) : (
                            <div className="space-y-1">
                              {changeEntries.map(([key, val]) => (
                                <div key={key} className="flex items-start gap-2 flex-wrap">
                                  <span className="text-gray-900 font-medium flex-shrink-0">
                                    {FIELD_LABELS[key] || key}:
                                  </span>
                                  <span className="text-red-500 line-through">{formatValue(val.before)}</span>
                                  <span className="text-gray-400 flex-shrink-0">→</span>
                                  <span className="text-green-600 font-medium">{formatValue(val.after)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}

                  {/* Lazy load sentinel */}
                  {hasMore && (
                    <tr ref={observerTarget}>
                      <td colSpan="5" className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-400">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                          <span className="text-xs">Loading more...</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* End of list */}
                  {!hasMore && displayedHistory.length > 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-center text-xs text-gray-400">
                        Showing all {filteredHistory.length} record{filteredHistory.length !== 1 ? 's' : ''}
                      </td>
                    </tr>
                  )}
                </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StockEditHistory
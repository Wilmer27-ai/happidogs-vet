// MedicinesStocks.jsx
import { useState, useEffect, useRef } from 'react'
import { FiSearch, FiAlertCircle, FiTrendingDown, FiPackage, FiAlertTriangle, FiDollarSign } from 'react-icons/fi'
import { getMedicines, getStoreItems } from '../firebase/services'

function MedicinesStocks() {
  const [medicines, setMedicines] = useState([])
  const [storeItems, setStoreItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [stockFilter, setStockFilter] = useState('All')
  const [itemType, setItemType] = useState('All')
  
  // Lazy loading states
  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [medicinesData, itemsData] = await Promise.all([
        getMedicines(),
        getStoreItems()
      ])
      setMedicines(medicinesData)
      setStoreItems(itemsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const medicineCategories = ['Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care']
  const storeCategories = ['Dog Food', 'Cat Food', 'Bird Food', 'Treats & Snacks', 'Toys', 'Accessories', 'Grooming', 'Health & Wellness', 'Bedding', 'Other']

  // Combine medicines and store items
  const allItems = [
    ...medicines.map(med => ({ ...med, type: 'medicine', itemName: med.medicineName })),
    ...storeItems.map(item => ({ ...item, type: 'store', itemName: item.itemName }))
  ]

  // Get all unique categories
  const allCategories = ['All', ...new Set([...medicineCategories, ...storeCategories])]

  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.supplierName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesType = itemType === 'All' || 
                       (itemType === 'Medicines' && item.type === 'medicine') ||
                       (itemType === 'Store Items' && item.type === 'store')
    
    let matchesStock = true
    if (stockFilter === 'Low Stock') {
      matchesStock = item.stockQuantity > 0 && item.stockQuantity <= 10
    } else if (stockFilter === 'Out of Stock') {
      matchesStock = item.stockQuantity === 0
    } else if (stockFilter === 'Expiring Soon') {
      if (item.type === 'medicine' && item.expirationDate) {
        const expiryDate = new Date(item.expirationDate)
        matchesStock = expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      } else {
        matchesStock = false
      }
    }

    return matchesSearch && matchesCategory && matchesType && matchesStock
  })

  // Items to display with lazy loading
  const displayedItems = filteredItems.slice(0, displayCount)
  const hasMore = displayCount < filteredItems.length

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
  }, [searchQuery, activeCategory, stockFilter, itemType])

  // Statistics
  const totalItems = allItems.length
  const lowStockCount = allItems.filter(i => i.stockQuantity > 0 && i.stockQuantity <= 10).length
  const outOfStockCount = allItems.filter(i => i.stockQuantity === 0).length
  const expiringSoonCount = medicines.filter(m => {
    if (!m.expirationDate) return false
    const expiryDate = new Date(m.expirationDate)
    return expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }).length
  const totalValue = allItems.reduce((sum, i) => sum + (i.sellingPrice * i.stockQuantity), 0)

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-gray-900">Inventory Management</h1>
          
          {/* Statistics - Inline */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{lowStockCount}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 leading-none">Low Stock</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{outOfStockCount}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 leading-none">Out of Stock</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{expiringSoonCount}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 leading-none">Expiring</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₱{totalValue.toLocaleString()}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 leading-none">Total Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="All">All Types</option>
            <option value="Medicines">Medicines</option>
            <option value="Store Items">Store Items</option>
          </select>
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="All">All Status</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Expiring Soon">Expiring Soon</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6 py-3">
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="overflow-auto h-full">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Item</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Category</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Supplier</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">Price</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">Value</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-sm">Loading inventory...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <FiPackage className="w-12 h-12 text-gray-300" />
                        <span className="text-sm font-medium">No items found</span>
                        <span className="text-xs text-gray-400">Adjust your filters or add new inventory</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {displayedItems.map((item, index) => {
                      const isExpiringSoon = item.type === 'medicine' && item.expirationDate && 
                        new Date(item.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      const stockValue = item.sellingPrice * item.stockQuantity
                      
                      return (
                        <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium text-gray-900">{item.itemName}</p>
                                {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                              </div>
                              {isExpiringSoon && (
                                <FiAlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" title="Expiring Soon" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {item.type === 'medicine' ? 'Medicine' : 'Store Item'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-sm">{item.category}</td>
                          <td className="px-4 py-3">
                            {item.type === 'store' && item.packageSize && item.sellingUnit ? (
                              <div>
                                <span className={`font-semibold ${
                                  item.stockQuantity === 0 ? 'text-red-600' :
                                  item.stockQuantity <= 10 ? 'text-yellow-600' : 'text-gray-900'
                                }`}>
                                  {(item.stockQuantity * item.packageSize).toFixed(2)} {item.sellingUnit}
                                </span>
                                <p className="text-xs text-gray-500">
                                  ({item.stockQuantity} {item.unit})
                                </p>
                              </div>
                            ) : (
                              <span className={`font-semibold ${
                                item.stockQuantity === 0 ? 'text-red-600' :
                                item.stockQuantity <= 10 ? 'text-yellow-600' : 'text-gray-900'
                              }`}>
                                {item.stockQuantity} {item.unit}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-sm">
                            {item.supplierName || <span className="text-gray-400 italic">N/A</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            ₱{item.sellingPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            ₱{stockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3">
                            {item.type === 'medicine' && item.expirationDate ? (
                              <span className={`text-xs ${isExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                                {new Date(item.expirationDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            ) : <span className="text-gray-400 italic text-xs">N/A</span>}
                          </td>
                        </tr>
                      )
                    })}
                    {hasMore && (
                      <tr ref={observerTarget}>
                        <td colSpan="8" className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                            <span className="text-sm">Loading more...</span>
                          </div>
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

export default MedicinesStocks
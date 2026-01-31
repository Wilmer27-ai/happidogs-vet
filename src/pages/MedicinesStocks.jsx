// MedicinesStocks.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { FiSearch, FiFilter, FiAlertCircle, FiTrendingDown, FiPackage } from 'react-icons/fi'
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
      { threshold: 1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMore])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20)
  }, [searchQuery, activeCategory, stockFilter, itemType])

  // Statistics
  const totalItems = allItems.length
  const totalMedicines = medicines.length
  const totalStoreItems = storeItems.length
  const lowStockCount = allItems.filter(i => i.stockQuantity > 0 && i.stockQuantity <= 10).length
  const outOfStockCount = allItems.filter(i => i.stockQuantity === 0).length
  const expiringSoonCount = medicines.filter(m => {
    if (!m.expirationDate) return false
    const expiryDate = new Date(m.expirationDate)
    return expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }).length
  const totalValue = allItems.reduce((sum, i) => sum + (i.sellingPrice * i.stockQuantity), 0)

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'Out', color: 'bg-red-100 text-red-800' }
    if (quantity <= 10) return { label: 'Low', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'OK', color: 'bg-green-100 text-green-800' }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Inventory</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-5 gap-3 mb-4">
  
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
            <p className="text-xs text-yellow-600 font-medium mb-1">Low Stock</p>
            <p className="text-xl font-bold text-yellow-900">{lowStockCount}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <p className="text-xs text-red-600 font-medium mb-1">Out of Stock</p>
            <p className="text-xl font-bold text-red-900">{outOfStockCount}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
            <p className="text-xs text-orange-600 font-medium mb-1">Expiring</p>
            <p className="text-xl font-bold text-orange-900">{expiringSoonCount}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-100 col-span-2">
            <p className="text-xs text-green-600 font-medium mb-1">Total Value</p>
            <p className="text-xl font-bold text-green-900">₱{totalValue.toLocaleString()}</p>
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
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="All">All Types</option>
            <option value="Medicines">Medicines</option>
            <option value="Store Items">Store Items</option>
          </select>
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="All">All Status</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Expiring Soon">Expiring Soon</option>
          </select>
        </div>
      </div>

      {/* Table Container with Fixed Height */}
      <div className="flex-1 px-6 py-4 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No items found</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col overflow-hidden">
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs">Item</th>
                    <th className="px-4 py-2 text-left text-xs">Type</th>
                    <th className="px-4 py-2 text-left text-xs">Category</th>
                    <th className="px-4 py-2 text-left text-xs">Stock</th>
                    <th className="px-4 py-2 text-left text-xs">Supplier</th>
                    <th className="px-4 py-2 text-right text-xs">Price</th>
                    <th className="px-4 py-2 text-right text-xs">Value</th>
                    <th className="px-4 py-2 text-left text-xs">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedItems.map((item, index) => {
                    const isExpiringSoon = item.type === 'medicine' && item.expirationDate && 
                      new Date(item.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    const stockValue = item.sellingPrice * item.stockQuantity
                    
                    return (
                      <tr key={`${item.type}-${item.id}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <div>
                              <p className="font-medium text-gray-900">{item.itemName}</p>
                              {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                            </div>
                            {isExpiringSoon && (
                              <FiAlertCircle className="w-3 h-3 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            item.type === 'medicine' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type === 'medicine' ? 'Med' : 'Item'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{item.category}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${
                            item.stockQuantity === 0 ? 'text-red-600' :
                            item.stockQuantity <= 10 ? 'text-yellow-600' : 'text-gray-900'
                          }`}>
                            {item.stockQuantity} {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.supplierName ? (
                            <span className="text-xs">{item.supplierName}</span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          ₱{item.sellingPrice?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">
                          ₱{stockValue.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.type === 'medicine' && item.expirationDate ? (
                            <span className={`text-xs ${isExpiringSoon ? 'text-orange-600 font-medium' : ''}`}>
                              {new Date(item.expirationDate).toLocaleDateString()}
                            </span>
                          ) : <span className="text-gray-400 italic text-xs">N/A</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              
              {/* Loading indicator for lazy loading */}
              {hasMore && (
                <div ref={observerTarget} className="py-4 text-center">
                  <p className="text-sm text-gray-500">Loading more...</p>
                </div>
              )}
            </div>
            
            {/* Footer with item count */}
            {!hasMore && displayedItems.length > 0 && (
              <div className="py-3 text-center border-t flex-shrink-0 bg-gray-50">
                <p className="text-xs text-gray-500">Showing all {filteredItems.length} items</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicinesStocks
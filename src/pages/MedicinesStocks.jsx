// MedicinesStocks.jsx
import { useState, useEffect, useRef } from 'react'
import { FiSearch, FiAlertCircle, FiPackage } from 'react-icons/fi'
import { getMedicines, getStoreItems } from '../firebase/services'

function MedicinesStocks() {
  const [medicines, setMedicines] = useState([])
  const [storeItems, setStoreItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [stockFilter, setStockFilter] = useState('All')
  const [itemType, setItemType] = useState('All')

  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)

  const foodCategories = ['Dog Food', 'Cat Food', 'Bird Food']
  const medicineCategories = ['Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care']
  const storeCategories = ['Dog Food', 'Cat Food', 'Bird Food', 'Treats & Snacks', 'Toys', 'Accessories', 'Grooming', 'Health & Wellness', 'Bedding', 'Other']
  const allCategories = ['All', ...new Set([...medicineCategories, ...storeCategories])]

  const isFood = (item) => foodCategories.includes(item?.category)

  const getTotalStock = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') return ((item.bottleCount ?? 0) * (item.mlPerBottle ?? 0)) + (item.looseMl ?? 0)
      if (item.medicineType === 'tablet') return ((item.boxCount ?? 0) * (item.tabletsPerBox ?? 0)) + (item.looseTablets ?? 0)
      return item.stockQuantity ?? 0
    }
    if (isFood(item)) return ((item.sacksCount ?? 0) * (item.kgPerSack ?? 0)) + (item.looseKg ?? 0)
    return item.stockQuantity ?? 0
  }

  const isLowStock = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') return (item.bottleCount ?? 0) < 2
      if (item.medicineType === 'tablet') return (item.boxCount ?? 0) < 2
      return (item.stockQuantity ?? 0) <= 5
    }
    if (isFood(item)) return (item.sacksCount ?? 0) < 2 && (item.looseKg ?? 0) < (item.kgPerSack ?? 0)
    return (item.stockQuantity ?? 0) <= 3
  }

  const isOutOfStock = (item) => getTotalStock(item) === 0

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [medicinesData, itemsData] = await Promise.all([getMedicines(), getStoreItems()])
      setMedicines(medicinesData)
      setStoreItems(itemsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const allItems = [
    ...medicines.map(med => ({ ...med, _type: 'medicine', itemName: med.medicineName })),
    ...storeItems.map(item => ({ ...item, _type: 'store' }))
  ]

  const getStockDisplay = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') {
        const bottles = item.bottleCount ?? 0
        const ml = item.looseMl ?? 0
        return (
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-gray-900">{bottles} Bottle{bottles !== 1 ? 's' : ''}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-900">{ml} ml</span>
          </div>
        )
      }
      if (item.medicineType === 'tablet') {
        const boxes = item.boxCount ?? 0
        const tabs = item.looseTablets ?? 0
        return (
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-gray-900">{boxes} Box{boxes !== 1 ? 'es' : ''}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-900">{tabs} Tablets</span>
          </div>
        )
      }
      return (
        <span className="text-gray-900 whitespace-nowrap">
          {item.stockQuantity ?? 0} {item.unit ?? ''}
        </span>
      )
    }
    if (isFood(item)) {
      const sacks = item.sacksCount ?? 0
      const kg = item.looseKg ?? 0
      return (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <span className="text-gray-900">{sacks} Sack{sacks !== 1 ? 's' : ''}</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-900">{kg} Kilos</span>
        </div>
      )
    }
    return (
      <span className="text-gray-900 whitespace-nowrap">
        {item.stockQuantity ?? 0} {item.unit ?? 'pcs'}
      </span>
    )
  }

  const getSellingPriceDisplay = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') return (
        <div className="text-right leading-tight">
          <p className="text-gray-900">₱{item.sellingPricePerMl?.toLocaleString()}/ml</p>
          <p className="text-gray-900">₱{item.sellingPricePerBottle?.toLocaleString()}/bottle</p>
        </div>
      )
      if (item.medicineType === 'tablet') return (
        <div className="text-right leading-tight">
          <p className="text-gray-900">₱{item.sellingPricePerTablet?.toLocaleString()}/tablet</p>
          <p className="text-gray-900">₱{item.sellingPricePerBox?.toLocaleString()}/box</p>
        </div>
      )
      return <p className="text-right text-gray-900">₱{item.sellingPrice?.toLocaleString()}/{item.unit}</p>
    }
    if (isFood(item)) return (
      <div className="text-right leading-tight">
        <p className="text-gray-900">₱{item.sellingPricePerKg?.toLocaleString()}/kg</p>
        <p className="text-gray-900">₱{item.sellingPricePerSack?.toLocaleString()}/sack</p>
      </div>
    )
    return <p className="text-right text-gray-900">₱{item.sellingPrice?.toLocaleString()}/{item.unit ?? 'pcs'}</p>
  }

  const getTypeLabel = (item) => {
    if (item._type === 'medicine') {
      return item.medicineType
        ? item.medicineType.charAt(0).toUpperCase() + item.medicineType.slice(1)
        : 'Medicine'
    }
    return isFood(item) ? 'Food' : 'Store'
  }

  const getItemValue = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') return getTotalStock(item) * (item.sellingPricePerMl ?? 0)
      if (item.medicineType === 'tablet') return getTotalStock(item) * (item.sellingPricePerTablet ?? 0)
    }
    if (isFood(item)) return getTotalStock(item) * (item.sellingPricePerKg ?? 0)
    return (item.stockQuantity ?? 0) * (item.sellingPrice ?? 0)
  }

  const filteredItems = allItems.filter(item => {
    const matchesSearch =
      item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplierName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesType =
      itemType === 'All' ||
      (itemType === 'Medicines' && item._type === 'medicine') ||
      (itemType === 'Store Items' && item._type === 'store')

    let matchesStock = true
    if (stockFilter === 'Low Stock') matchesStock = isLowStock(item) && !isOutOfStock(item)
    else if (stockFilter === 'Out of Stock') matchesStock = isOutOfStock(item)
    else if (stockFilter === 'Expiring Soon') {
      if (item._type === 'medicine' && item.expirationDate) {
        matchesStock = new Date(item.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      } else matchesStock = false
    }

    return matchesSearch && matchesCategory && matchesType && matchesStock
  })

  const displayedItems = filteredItems.slice(0, displayCount)
  const hasMore = displayCount < filteredItems.length

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore) setDisplayCount(prev => prev + 20) },
      { threshold: 0.1 }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore])

  useEffect(() => { setDisplayCount(20) }, [searchQuery, activeCategory, stockFilter, itemType])

  const lowStockCount = allItems.filter(i => isLowStock(i) && !isOutOfStock(i)).length
  const outOfStockCount = allItems.filter(i => isOutOfStock(i)).length
  const expiringSoonCount = medicines.filter(m => {
    if (!m.expirationDate) return false
    return new Date(m.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }).length
  const totalValue = allItems.reduce((sum, i) => sum + getItemValue(i), 0)

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-gray-900">Inventory Management</h1>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{lowStockCount}</span>
              </div>
              <p className="text-xs text-gray-500">Low Stock</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{outOfStockCount}</span>
              </div>
              <p className="text-xs text-gray-500">Out of Stock</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{expiringSoonCount}</span>
              </div>
              <p className="text-xs text-gray-500">Expiring</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₱{totalValue.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500">Total Value</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
          <select value={itemType} onChange={(e) => setItemType(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-sm">
            <option value="All">All Types</option>
            <option value="Medicines">Medicines</option>
            <option value="Store Items">Store Items</option>
          </select>
          <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-sm">
            {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-sm">
            <option value="All">All Status</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Expiring Soon">Expiring Soon</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden px-6 py-3">
        <div className="bg-white rounded-md border border-gray-200 shadow-sm h-full overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Item</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Brand</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Stock</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Supplier</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">Purchase</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">Selling Price</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-sm">Loading inventory...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <FiPackage className="w-12 h-12 text-gray-300" />
                        <span className="text-sm font-medium">No items found</span>
                        <span className="text-xs text-gray-400">Adjust your filters or add new inventory</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {displayedItems.map((item) => {
                      const isExpiringSoon = item._type === 'medicine' && item.expirationDate &&
                        new Date(item.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      const low = isLowStock(item)
                      const out = isOutOfStock(item)

                      return (
                        <tr key={`${item._type}-${item.id}`} className="hover:bg-gray-50 transition-colors">

                          {/* Item Name */}
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-gray-900">{item.itemName || 'N/A'}</span>
                              {isExpiringSoon && (
                                <FiAlertCircle className="w-3 h-3 text-orange-500 flex-shrink-0" title="Expiring Soon" />
                              )}
                            </div>
                          </td>

                          {/* Brand */}
                          <td className="px-3 py-1.5 text-gray-900">
                            {item.brand || <span className="text-gray-400 italic">—</span>}
                          </td>

                          {/* Type */}
                          <td className="px-3 py-1.5 text-gray-900 whitespace-nowrap">
                            {getTypeLabel(item)}
                          </td>

                          {/* Category */}
                          <td className="px-3 py-1.5 text-gray-900">{item.category || 'N/A'}</td>

                          {/* Stock */}
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-1">
                              {(out || low) && (
                                <FiAlertCircle className={`w-3 h-3 flex-shrink-0 ${out ? 'text-red-500' : 'text-yellow-500'}`} />
                              )}
                              <div className={out ? 'text-red-600' : low ? 'text-yellow-600' : ''}>
                                {getStockDisplay(item)}
                              </div>
                            </div>
                          </td>

                          {/* Supplier */}
                          <td className="px-3 py-1.5 text-gray-900">
                            {item.supplierName || <span className="text-gray-400 italic">N/A</span>}
                          </td>

                          {/* Purchase Price */}
                          <td className="px-3 py-1.5 text-right text-gray-900">
                            ₱{item.purchasePrice?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                          </td>

                          {/* Selling Price */}
                          <td className="px-3 py-1.5 text-gray-900">
                            {getSellingPriceDisplay(item)}
                          </td>

                          {/* Expiry */}
                          <td className="px-3 py-1.5">
                            {item._type === 'medicine' && item.expirationDate ? (
                              <span className={isExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-900'}>
                                {new Date(item.expirationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            ) : <span className="text-gray-400 italic">N/A</span>}
                          </td>
                        </tr>
                      )
                    })}

                    {hasMore && (
                      <tr ref={observerTarget}>
                        <td colSpan="9" className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                            <span className="text-xs">Loading more...</span>
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
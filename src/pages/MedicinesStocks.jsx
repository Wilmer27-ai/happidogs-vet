// MedicinesStocks.jsx
import { useState, useEffect } from 'react'
import { FiSearch, FiFilter, FiAlertCircle, FiTrendingDown, FiPackage, FiEye } from 'react-icons/fi'
import { getMedicines } from '../firebase/services'

function MedicinesStocks() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [stockFilter, setStockFilter] = useState('All')
  const [viewingMedicine, setViewingMedicine] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  useEffect(() => {
    loadMedicines()
  }, [])

  const loadMedicines = async () => {
    try {
      const data = await getMedicines()
      setMedicines(data)
    } catch (error) {
      console.error('Error loading medicines:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['All', 'Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care']

  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = med.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         med.supplierName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || med.category === activeCategory
    
    let matchesStock = true
    if (stockFilter === 'Low Stock') {
      matchesStock = med.stockQuantity > 0 && med.stockQuantity <= 10
    } else if (stockFilter === 'Out of Stock') {
      matchesStock = med.stockQuantity === 0
    } else if (stockFilter === 'Expiring Soon') {
      const expiryDate = med.expirationDate ? new Date(med.expirationDate) : null
      matchesStock = expiryDate && expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }

    return matchesSearch && matchesCategory && matchesStock
  })

  // Statistics
  const totalMedicines = medicines.length
  const lowStockCount = medicines.filter(m => m.stockQuantity > 0 && m.stockQuantity <= 10).length
  const outOfStockCount = medicines.filter(m => m.stockQuantity === 0).length
  const expiringSoonCount = medicines.filter(m => {
    if (!m.expirationDate) return false
    const expiryDate = new Date(m.expirationDate)
    return expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }).length
  const totalValue = medicines.reduce((sum, m) => sum + (m.sellingPrice * m.stockQuantity), 0)

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    if (quantity <= 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' }
  }

  const handleViewMedicine = (medicine) => {
    setViewingMedicine(medicine)
    setIsViewModalOpen(true)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setViewingMedicine(null)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Medicine Stocks Inventory</h1>
            <p className="text-gray-500 mt-1">Monitor stock levels and manage inventory</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <FiPackage className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-blue-600 font-medium">Total Items</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{totalMedicines}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
              <div className="flex items-center gap-2 mb-1">
                <FiTrendingDown className="w-4 h-4 text-yellow-600" />
                <p className="text-sm text-yellow-600 font-medium">Low Stock</p>
              </div>
              <p className="text-2xl font-bold text-yellow-900">{lowStockCount}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center gap-2 mb-1">
                <FiAlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-600 font-medium">Out of Stock</p>
              </div>
              <p className="text-2xl font-bold text-red-900">{outOfStockCount}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-1">
                <FiAlertCircle className="w-4 h-4 text-orange-600" />
                <p className="text-sm text-orange-600 font-medium">Expiring Soon</p>
              </div>
              <p className="text-2xl font-bold text-orange-900">{expiringSoonCount}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-green-600 font-medium">Total Value</span>
              </div>
              <p className="text-2xl font-bold text-green-900">₱{totalValue.toLocaleString()}</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search medicines or suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <FiFilter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-600 font-medium whitespace-nowrap">Category:</span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Stock Status Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Status:</span>
              {['All', 'Low Stock', 'Out of Stock', 'Expiring Soon'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setStockFilter(filter)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    stockFilter === filter
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 px-6 py-4 overflow-hidden">
        <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Loading inventory...</p>
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No medicines found</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Medicine Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Stock Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMedicines.map((medicine) => {
                    const status = getStockStatus(medicine.stockQuantity)
                    const isExpiringSoon = medicine.expirationDate && 
                      new Date(medicine.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    const stockValue = medicine.sellingPrice * medicine.stockQuantity
                    
                    return (
                      <tr key={medicine.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{medicine.medicineName}</p>
                            {isExpiringSoon && (
                              <FiAlertCircle className="w-4 h-4 text-orange-500" title="Expiring within 30 days" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{medicine.category}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${
                            medicine.stockQuantity === 0 ? 'text-red-600' :
                            medicine.stockQuantity <= 10 ? 'text-yellow-600' : 'text-gray-900'
                          }`}>
                            {medicine.stockQuantity} {medicine.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {medicine.supplierName || <span className="text-gray-400 italic">Not assigned</span>}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          ₱{medicine.sellingPrice?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-700">
                          ₱{stockValue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {medicine.expirationDate ? (
                            <span className={isExpiringSoon ? 'text-orange-600 font-medium' : ''}>
                              {new Date(medicine.expirationDate).toLocaleDateString()}
                            </span>
                          ) : <span className="text-gray-400 italic">N/A</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => handleViewMedicine(medicine)}
                              className="text-blue-600 hover:text-blue-700 p-2"
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Medicine Details Modal */}
      {isViewModalOpen && viewingMedicine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Medicine Details</h2>
              <button onClick={handleCloseViewModal} className="text-gray-400 hover:text-gray-600">
                <FiPackage className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Medicine Name */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{viewingMedicine.medicineName}</h3>
                <p className="text-gray-600 mt-1">{viewingMedicine.category}</p>
              </div>

              {/* Stock Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Stock Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Stock</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {viewingMedicine.stockQuantity} {viewingMedicine.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatus(viewingMedicine.stockQuantity).color}`}>
                      {getStockStatus(viewingMedicine.stockQuantity).label}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stock Value</p>
                    <p className="text-lg font-semibold text-green-700">
                      ₱{(viewingMedicine.sellingPrice * viewingMedicine.stockQuantity).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expiration Date</p>
                    <p className="text-lg font-medium text-gray-900">
                      {viewingMedicine.expirationDate ? new Date(viewingMedicine.expirationDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Pricing Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Purchase Price</p>
                    <p className="text-lg font-medium text-gray-900">₱{viewingMedicine.purchasePrice?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Selling Price</p>
                    <p className="text-lg font-semibold text-gray-900">₱{viewingMedicine.sellingPrice?.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Profit Margin</p>
                    <p className="text-lg font-medium text-green-600">
                      ₱{(viewingMedicine.sellingPrice - viewingMedicine.purchasePrice).toLocaleString()} per {viewingMedicine.unit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Supplier Information</h4>
                <p className="text-gray-900">
                  {viewingMedicine.supplierName || <span className="text-gray-400 italic">No supplier assigned</span>}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleCloseViewModal}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MedicinesStocks
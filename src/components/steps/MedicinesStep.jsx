import { useState, useEffect, useRef } from 'react'
import { FiSearch, FiMinus, FiPlus, FiX } from 'react-icons/fi'
import { getMedicines } from '../../firebase/services'

function MedicinesStep({ selectedClient, selectedPets, onBack, onNext, medicinesData, setMedicinesData }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedMedicines, setSelectedMedicines] = useState(medicinesData || [])
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)

  useEffect(() => {
    loadMedicines()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && displayCount < filteredMedicines.length) {
          setDisplayCount(prev => prev + 20)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [displayCount])

  useEffect(() => {
    setDisplayCount(20)
  }, [searchQuery, activeFilter])

  useEffect(() => {
    if (setMedicinesData) {
      setMedicinesData(selectedMedicines)
    }
  }, [selectedMedicines, setMedicinesData])

  const loadMedicines = async () => {
    try {
      const data = await getMedicines()
      // Filter to only show medicines with stock
      setMedicines(data.filter(med => med.stockQuantity > 0))
    } catch (error) {
      console.error('Error loading medicines:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['All', 'Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care']

  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = med.medicineName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilter === 'All' || med.category === activeFilter
    return matchesSearch && matchesFilter
  })

  const displayedMedicines = filteredMedicines.slice(0, displayCount)
  const hasMore = displayCount < filteredMedicines.length

  const handleAddMedicine = (medicine) => {
    if (medicine.stockQuantity === 0) return
    
    const existing = selectedMedicines.find(m => m.id === medicine.id)
    
    if (existing) {
      if (existing.quantity + 1 <= medicine.stockQuantity) {
        setSelectedMedicines(selectedMedicines.map(m => 
          m.id === medicine.id ? { ...m, quantity: m.quantity + 1 } : m
        ))
      } else {
        alert(`Only ${medicine.stockQuantity} ${medicine.unit} available!`)
      }
    } else {
      setSelectedMedicines([...selectedMedicines, { ...medicine, quantity: 1 }])
    }
  }

  const handleUpdateQuantity = (id, change) => {
    const item = selectedMedicines.find(m => m.id === id)
    const stockItem = medicines.find(m => m.id === id)
    const newQuantity = item.quantity + change

    if (newQuantity <= 0) {
      handleRemoveMedicine(id)
    } else if (newQuantity <= stockItem.stockQuantity) {
      setSelectedMedicines(selectedMedicines.map(m => 
        m.id === id ? { ...m, quantity: newQuantity } : m
      ))
    } else {
      alert(`Only ${stockItem.stockQuantity} ${stockItem.unit} available!`)
    }
  }

  const handleRemoveMedicine = (id) => {
    setSelectedMedicines(selectedMedicines.filter(m => m.id !== id))
  }

  const handleQuantityInputChange = (id, value) => {
    const numValue = parseInt(value)
    if (isNaN(numValue) || numValue < 1) return

    const stockItem = medicines.find(m => m.id === id)
    if (numValue <= stockItem.stockQuantity) {
      setSelectedMedicines(selectedMedicines.map(m => 
        m.id === id ? { ...m, quantity: numValue } : m
      ))
    } else {
      alert(`Only ${stockItem.stockQuantity} ${stockItem.unit} available!`)
    }
  }

  const getTotalPrice = () => {
    return selectedMedicines.reduce((sum, med) => sum + ((med.sellingPrice || 0) * (med.quantity || 0)), 0)
  }

  const handleNext = () => {
    if (setMedicinesData) {
      setMedicinesData(selectedMedicines)
    }
    onNext()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Select Medicines</h2>
            <p className="text-sm text-gray-600">
              Client: <span className="font-medium">{selectedClient?.firstName} {selectedClient?.lastName}</span>
              {selectedPets?.length > 0 && (
                <span className="ml-2">• Pets: <span className="font-medium">{selectedPets.map(p => p.name).join(', ')}</span></span>
              )}
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Back
          </button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                activeFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-6 overflow-hidden">
        {/* Medicines Table */}
        <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-auto h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-sm">Loading medicines...</p>
              </div>
            ) : displayedMedicines.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-sm">No medicines found</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Medicine Name</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Category</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Price</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedMedicines.map(medicine => {
                    const isOutOfStock = medicine.stockQuantity === 0
                    
                    return (
                      <tr key={medicine.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className={`font-medium ${isOutOfStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {medicine.medicineName}
                            {medicine.brand && <span className="text-gray-500 ml-1">({medicine.brand})</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {medicine.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={isOutOfStock ? 'text-red-600 font-medium' : 'text-gray-700'}>
                            {medicine.stockQuantity} {medicine.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">
                            ₱{medicine.sellingPrice?.toLocaleString() || 0}/{medicine.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleAddMedicine(medicine)}
                            disabled={isOutOfStock}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs font-medium shadow-sm transition-colors"
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {hasMore && (
                    <tr ref={observerTarget}>
                      <td colSpan="5" className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                          <span className="text-sm">Loading more...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-96 bg-white rounded-lg border border-gray-200 flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Selected Medicines</h3>
                <p className="text-xs text-gray-600">{selectedMedicines.length} items</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {selectedMedicines.length === 0 ? (
              <p className="text-center text-gray-400 text-xs mt-8">No medicines selected</p>
            ) : (
              selectedMedicines.map(medicine => (
                <div key={medicine.id} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-xs">{medicine.medicineName}</p>
                      <p className="text-xs text-gray-600">{medicine.category}</p>
                      {medicine.brand && <p className="text-xs text-gray-500">{medicine.brand}</p>}
                    </div>
                    <button
                      onClick={() => handleRemoveMedicine(medicine.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateQuantity(medicine.id, -1)}
                        className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                      >
                        <FiMinus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={medicine.quantity}
                        onChange={(e) => handleQuantityInputChange(medicine.id, e.target.value)}
                        className="w-14 px-1.5 py-1 text-center text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600">{medicine.unit}</span>
                      <button
                        onClick={() => handleUpdateQuantity(medicine.id, 1)}
                        className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                      >
                        <FiPlus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-900">
                        ₱{((medicine.sellingPrice || 0) * (medicine.quantity || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-medium text-gray-700">Total:</span>
              <span className="text-xl font-bold text-gray-900">₱{getTotalPrice().toLocaleString()}</span>
            </div>

            <button
              onClick={handleNext}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm"
            >
              Continue to Summary →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MedicinesStep
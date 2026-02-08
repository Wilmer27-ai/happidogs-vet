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
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [quantityModalItem, setQuantityModalItem] = useState(null)
  const [customQuantity, setCustomQuantity] = useState('')

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
      setMedicines(data)
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

  const getStep = (medicine) => {
    return 0.5
  }

  const handleAddMedicine = (medicine) => {
    if (medicine.stockQuantity === 0) return
    
    const existing = selectedMedicines.find(m => m.id === medicine.id)
    const step = getStep(medicine)
    
    if (existing) {
      if (existing.quantity + step <= medicine.stockQuantity) {
        setSelectedMedicines(selectedMedicines.map(m => 
          m.id === medicine.id ? { ...m, quantity: parseFloat((m.quantity + step).toFixed(2)) } : m
        ))
      } else {
        alert(`Only ${medicine.stockQuantity} ${medicine.unit} available!`)
      }
    } else {
      setSelectedMedicines([...selectedMedicines, { ...medicine, quantity: step }])
    }
  }

  const handleUpdateQuantity = (id, change) => {
    const item = selectedMedicines.find(m => m.id === id)
    const stockItem = medicines.find(m => m.id === id)
    const step = getStep(stockItem)
    const newQuantity = parseFloat((item.quantity + change * step).toFixed(2))

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

  const handleCustomQuantityClick = (medicine) => {
    if (medicine.stockQuantity === 0) return
    setQuantityModalItem(medicine)
    setShowQuantityModal(true)
    setCustomQuantity('')
  }

  const handleCustomQuantitySubmit = () => {
    const quantity = parseFloat(customQuantity)
    
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity')
      return
    }

    if (quantity > quantityModalItem.stockQuantity) {
      alert(`Only ${quantityModalItem.stockQuantity} ${quantityModalItem.unit} available!`)
      return
    }

    const existing = selectedMedicines.find(m => m.id === quantityModalItem.id)
    
    if (existing) {
      setSelectedMedicines(selectedMedicines.map(m => 
        m.id === quantityModalItem.id ? { ...m, quantity } : m
      ))
    } else {
      setSelectedMedicines([...selectedMedicines, { ...quantityModalItem, quantity }])
    }

    setShowQuantityModal(false)
    setQuantityModalItem(null)
    setCustomQuantity('')
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
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Medicines List */}
        <div className="flex-1 flex flex-col bg-gray-50">
          <div className="px-6 py-3 bg-white border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Available Medicines</h3>
          
          </div>

          <div className="p-6 flex flex-col flex-1 overflow-hidden">
            {/* Search & Filters */}
            <div className="mb-3 space-y-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveFilter(category)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      activeFilter === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Medicines Table */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Loading medicines...</p>
              </div>
            ) : displayedMedicines.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400 text-sm">No medicines found</p>
              </div>
            ) : (
              <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-auto h-full">
                  <table className="w-full text-xs">
                    <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Medicine</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Category</th>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Stock</th>
                        <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide">Price</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {displayedMedicines.map((medicine) => {
                        const isOutOfStock = medicine.stockQuantity === 0
                        const isSelected = selectedMedicines.find(m => m.id === medicine.id)
                        
                        return (
                          <tr key={medicine.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-2 py-2">
                              <span className={`font-medium text-xs ${isOutOfStock ? 'text-red-600' : 'text-gray-900'}`}>
                                {medicine.medicineName || 'N/A'}
                              </span>
                            </td>
                            <td className="px-2 py-2">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {medicine.category || 'N/A'}
                              </span>
                            </td>
                            <td className="px-2 py-2">
                              <span className={`text-xs ${isOutOfStock ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                                {medicine.stockQuantity || 0} {medicine.unit || ''}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-right">
                              <div className="text-xs text-gray-900 font-medium">₱{medicine.sellingPrice?.toLocaleString() || 0}</div>
                              <div className="text-xs text-gray-500">per {medicine.unit || 'unit'}</div>
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleAddMedicine(medicine)}
                                  disabled={isOutOfStock}
                                  className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-xs font-medium"
                                >
                                  {isSelected ? 'Add' : 'Add'}
                                </button>
                                
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {hasMore && (
                    <div ref={observerTarget} className="py-4 text-center">
                      <p className="text-sm text-gray-500">Loading more...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Selected Medicines */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Prescribed Medicines</h3>
            <p className="text-sm text-gray-600">{selectedMedicines.length} items</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selectedMedicines.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-8">No medicines selected</p>
            ) : (
              selectedMedicines.map(med => (
                <div key={med.id} className="bg-gray-50 rounded-md p-3 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{med.medicineName}</p>
                      <p className="text-xs text-gray-600">{med.category}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveMedicine(med.id)}
                      className="text-red-600 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateQuantity(med.id, -1)}
                        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 transition-colors rounded text-gray-700"
                      >
                        <FiMinus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={med.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val) && val > 0 && val <= med.stockQuantity) {
                            setSelectedMedicines(selectedMedicines.map(m =>
                              m.id === med.id ? { ...m, quantity: val } : m
                            ))
                          }
                        }}
                        className="w-16 px-2 py-1 text-center text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600">{med.unit}</span>
                      <button
                        onClick={() => handleUpdateQuantity(med.id, 1)}
                        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 transition-colors rounded text-gray-700"
                      >
                        <FiPlus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ₱{((med.sellingPrice || 0) * (med.quantity || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">Total:</span>
              <span className="text-xl font-bold text-gray-900">₱{getTotalPrice().toLocaleString()}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onBack}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  )
}

export default MedicinesStep
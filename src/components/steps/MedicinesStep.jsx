import { useState, useEffect } from 'react'
import { FiSearch, FiMinus, FiPlus, FiX } from 'react-icons/fi'
import { getMedicines } from '../../firebase/services'

function MedicinesStep({ selectedClient, selectedPet, onBack, onNext, medicinesData, setMedicinesData }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedMedicines, setSelectedMedicines] = useState(medicinesData || [])
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)

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
    const matchesSearch = med.medicineName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilter === 'All' || med.category === activeFilter
    return matchesSearch && matchesFilter
  })

  const handleAddMedicine = (medicine) => {
    const existing = selectedMedicines.find(m => m.id === medicine.id)
    if (existing) {
      setSelectedMedicines(selectedMedicines.map(m => 
        m.id === medicine.id ? { ...m, quantity: m.quantity + 1 } : m
      ))
    } else {
      setSelectedMedicines([...selectedMedicines, { ...medicine, quantity: 1 }])
    }
  }

  const handleUpdateQuantity = (id, change) => {
    setSelectedMedicines(selectedMedicines.map(m => {
      if (m.id === id) {
        const newQuantity = m.quantity + change
        return newQuantity > 0 ? { ...m, quantity: newQuantity } : m
      }
      return m
    }).filter(m => m.quantity > 0))
  }

  const handleRemoveMedicine = (id) => {
    setSelectedMedicines(selectedMedicines.filter(m => m.id !== id))
  }

  const getTotalPrice = () => {
    return selectedMedicines.reduce((sum, med) => sum + ((med.sellingPrice || 0) * (med.quantity || 0)), 0)
  }

  const handleSubmit = () => {
    setMedicinesData(selectedMedicines)
    onNext()
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Left Side - Medicine List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <div className="p-4 border-b flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Select medicines administered</h3>
            
            {/* Search */}
            <div className="relative mb-3">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
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

          {/* Medicine List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Loading medicines...</p>
              </div>
            ) : filteredMedicines.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No medicines found</p>
              </div>
            ) : (
              filteredMedicines.map(medicine => (
              <div
                key={medicine.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{medicine.medicineName}</p>
                  <p className="text-xs text-gray-500">Stock: {medicine.stockQuantity}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-blue-600">₱{medicine.sellingPrice || 0}</span>
                  <button
                    onClick={() => handleAddMedicine(medicine)}
                    className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* Right Side - Selected Medicines */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <div className="p-4 border-b flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-900">
              Selected ({selectedMedicines.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedMedicines.length > 0 ? (
              selectedMedicines.map(med => (
                <div key={med.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{med.medicineName}</p>
                      <p className="text-xs text-gray-500">₱{med.sellingPrice || 0} each</p>
                    </div>
                    <button
                      onClick={() => handleRemoveMedicine(med.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(med.id, -1)}
                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                      >
                        <FiMinus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{med.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(med.id, 1)}
                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                      >
                        <FiPlus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      ₱{((med.sellingPrice || 0) * (med.quantity || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No medicines selected</p>
              </div>
            )}
          </div>

          {selectedMedicines.length > 0 && (
            <div className="p-4 border-t bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Total</span>
                <span className="text-lg font-bold text-gray-900">₱{getTotalPrice().toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onBack}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {selectedMedicines.length === 0 && (
            <div className="p-4 border-t bg-gray-50 flex-shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={onBack}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MedicinesStep
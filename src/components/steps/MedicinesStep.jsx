import { useState } from 'react'
import { FiSearch, FiMinus, FiPlus, FiX } from 'react-icons/fi'

function MedicinesStep({ selectedClient, selectedPet, onBack, onNext, medicinesData, setMedicinesData }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedMedicines, setSelectedMedicines] = useState(medicinesData || [])

  // Sample medicines data (will be replaced with Firebase)
  const sampleMedicines = [
    { id: 1, name: 'Anti-Rabies Vaccine', category: 'Vaccines', price: 350, stock: 41 },
    { id: 2, name: '5-in-1 Vaccine', category: 'Vaccines', price: 800, stock: 28 },
    { id: 3, name: 'Kennel Cough Vaccine', category: 'Vaccines', price: 500, stock: 25 },
    { id: 4, name: 'Amoxicillin 250mg', category: 'Antibiotics', price: 25, stock: 150 },
    { id: 5, name: 'Cefalexin 500mg', category: 'Antibiotics', price: 35, stock: 100 },
    { id: 6, name: 'Vitamin B Complex', category: 'Vitamins', price: 45, stock: 80 },
    { id: 7, name: 'Deworming Tablet', category: 'Dewormers', price: 50, stock: 120 },
    { id: 8, name: 'Flea Treatment', category: 'Dewormers', price: 150, stock: 60 },
  ]

  const categories = ['All', 'Vaccines', 'Antibiotics', 'Vitamins', 'Dewormers']

  const filteredMedicines = sampleMedicines.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase())
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
    return selectedMedicines.reduce((sum, med) => sum + (med.price * med.quantity), 0)
  }

  const handleSubmit = () => {
    setMedicinesData(selectedMedicines)
    onNext()
  }

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col pb-20">
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
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
            {filteredMedicines.map(medicine => (
              <div
                key={medicine.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{medicine.name}</p>
                  <p className="text-xs text-gray-500">Stock: {medicine.stock}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-blue-600">₱{medicine.price}</span>
                  <button
                    onClick={() => handleAddMedicine(medicine)}
                    className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
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
                <div key={med.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 flex-1">{med.name}</p>
                    <button
                      onClick={() => handleRemoveMedicine(med.id)}
                      className="text-gray-400 hover:text-red-600 ml-2"
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
                      ₱{(med.price * med.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No medicines selected</p>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="p-4 border-t bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-blue-600">₱{getTotalPrice().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fixed Continue Button - Full Width (accounts for sidebar) */}
      <div className="fixed bottom-0 left-0 lg:left-72 right-0 bg-blue-600 z-10">
        <button
          onClick={handleSubmit}
          className="w-full py-4 text-white font-medium text-base hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default MedicinesStep
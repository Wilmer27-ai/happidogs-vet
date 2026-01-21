// MedicinesStocks.jsx
import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi'
import { getMedicines, addMedicine, updateMedicine, deleteMedicine } from '../firebase/services'

function MedicinesStocks() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [formData, setFormData] = useState({
    medicineName: '',
    category: 'Antibiotic',
    stockQuantity: '',
    unit: 'pcs',
    expirationDate: '',
    purchasePrice: '',
    sellingPrice: '',
    supplierName: ''
  })

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const medicineData = {
        ...formData,
        stockQuantity: Number(formData.stockQuantity),
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice)
      }

      if (editingMedicine) {
        await updateMedicine(editingMedicine.id, medicineData)
      } else {
        await addMedicine(medicineData)
      }
      
      loadMedicines()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving medicine:', error)
      alert('Failed to save medicine. Please try again.')
    }
  }

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine)
    setFormData({
      medicineName: medicine.medicineName,
      category: medicine.category,
      stockQuantity: medicine.stockQuantity,
      unit: medicine.unit || 'pcs',
      expirationDate: medicine.expirationDate || '',
      purchasePrice: medicine.purchasePrice,
      sellingPrice: medicine.sellingPrice,
      supplierName: medicine.supplierName || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      try {
        await deleteMedicine(id)
        loadMedicines()
      } catch (error) {
        console.error('Error deleting medicine:', error)
        alert('Failed to delete medicine.')
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingMedicine(null)
    setFormData({
      medicineName: '',
      category: 'Antibiotic',
      stockQuantity: '',
      unit: 'pcs',
      expirationDate: '',
      purchasePrice: '',
      sellingPrice: '',
      supplierName: ''
    })
  }

  const categories = ['Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care']

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medicines & Stocks</h1>
          <p className="text-gray-500 mt-1">Manage your medicine inventory</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <FiPlus className="w-5 h-5" />
          Add Medicine
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Loading medicines...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No medicines found. Add your first medicine to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Medicine Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Purchase</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Selling</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {medicines.map((medicine) => (
                  <tr key={medicine.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{medicine.medicineName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{medicine.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className={medicine.stockQuantity < 10 ? 'text-red-600 font-semibold' : ''}>
                        {medicine.stockQuantity} {medicine.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">₱{medicine.purchasePrice?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">₱{medicine.sellingPrice?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(medicine)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(medicine.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Medicine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.medicineName}
                    onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pcs">pcs</option>
                    <option value="bottle">bottle</option>
                    <option value="vial">vial</option>
                    <option value="box">box</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MedicinesStocks
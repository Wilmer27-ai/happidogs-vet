// src/components/AddClientModal.jsx
import { FiX } from 'react-icons/fi'
import { addClient } from '../firebase/services'
import { useState } from 'react'

function AddClientModal({ isOpen, onClose, onSubmit, clientData, setClientData }) {
  const [isSaving, setIsSaving] = useState(false)
  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const newClient = await addClient(clientData)
      onSubmit(newClient)
      setClientData({ firstName: '', lastName: '', phoneNumber: '', address: '' })
    } catch (error) {
      console.error('Error adding client:', error)
      alert('Failed to add client. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Client</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={clientData.firstName}
                  onChange={(e) => setClientData({ ...clientData, firstName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="First"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={clientData.lastName}
                  onChange={(e) => setClientData({ ...clientData, lastName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Last"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                value={clientData.phoneNumber}
                onChange={(e) => setClientData({ ...clientData, phoneNumber: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="### ### ####"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={clientData.address}
                onChange={(e) => setClientData({ ...clientData, address: e.target.value })}
                rows="3"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                placeholder="Enter address..."
                required
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
            >
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddClientModal
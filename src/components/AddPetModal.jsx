// src/components/AddPetModal.jsx
import { FiX } from 'react-icons/fi'
import { addPet } from '../firebase/services'
import { useState } from 'react'

function AddPetModal({ isOpen, onClose, onSubmit, petData, setPetData, selectedClient }) {
  const [isSaving, setIsSaving] = useState(false)
  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedClient) {
      alert('Please select a client first')
      return
    }
    setIsSaving(true)
    try {
      const newPet = await addPet({
        name: petData.name,
        species: petData.species,
        breed: petData.breed,
        age: Number(petData.age),
        weight: Number(petData.weight),
        clientId: selectedClient.id
      })
      onSubmit(newPet)
      setPetData({ name: '', species: '', breed: '', age: '', weight: '' })
    } catch (error) {
      console.error('Error adding pet:', error)
      alert('Failed to add pet. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Add New Pet</h3>
            {selectedClient && (
              <p className="text-sm text-gray-500 mt-1">
                for {selectedClient.firstName} {selectedClient.lastName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pet Name *
              </label>
              <input
                type="text"
                required
                value={petData.name}
                onChange={(e) => setPetData({ ...petData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Max"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Species *
                </label>
                <select
                  required
                  value={petData.species}
                  onChange={(e) => setPetData({ ...petData, species: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Bird">Bird</option>
                  <option value="Rabbit">Rabbit</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Breed *
                </label>
                <input
                  type="text"
                  required
                  value={petData.breed}
                  onChange={(e) => setPetData({ ...petData, breed: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Golden Retriever"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age *
                </label>
                <input
                  type="text"
                  required
                  value={petData.age}
                  onChange={(e) => setPetData({ ...petData, age: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2 years"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight *
                </label>
                <input
                  type="text"
                  required
                  value={petData.weight}
                  onChange={(e) => setPetData({ ...petData, weight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 25 kg"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isSaving ? 'Adding...' : 'Add Pet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddPetModal
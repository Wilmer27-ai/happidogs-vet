import { useState } from 'react'
import { FiSearch } from 'react-icons/fi'

function PetStep({ selectedClient, onSelectPet, onBack, onNext }) {
  const [petSearchQuery, setPetSearchQuery] = useState('')

  // Sample pet data (will be replaced with Firebase)
  const samplePets = [
    { id: 1, name: 'Max', species: 'Dog', breed: 'Golden Retriever', age: '3 years', weight: '30 kg', clientId: 1 },
    { id: 2, name: 'Bella', species: 'Cat', breed: 'Persian', age: '2 years', weight: '4 kg', clientId: 1 },
    { id: 3, name: 'Charlie', species: 'Dog', breed: 'Labrador', age: '5 years', weight: '28 kg', clientId: 2 },
    { id: 4, name: 'Luna', species: 'Cat', breed: 'Siamese', age: '1 year', weight: '3.5 kg', clientId: 3 },
  ]

  const clientPets = samplePets.filter(pet => pet.clientId === selectedClient?.id)

  const filteredPets = clientPets.filter(pet =>
    pet.name.toLowerCase().includes(petSearchQuery.toLowerCase()) ||
    pet.species.toLowerCase().includes(petSearchQuery.toLowerCase()) ||
    pet.breed.toLowerCase().includes(petSearchQuery.toLowerCase())
  )

  const handleSelectPet = (pet) => {
    onSelectPet(pet)
    onNext()
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Select Pet for {selectedClient?.firstName} {selectedClient?.lastName}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Choose a pet or add a new one</p>
            </div>
            <button
              onClick={onBack}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Change Client
            </button>
          </div>
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search pets..."
              value={petSearchQuery}
              onChange={(e) => setPetSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Pet Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Species
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Breed
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Weight
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPets.length > 0 ? (
                filteredPets.map((pet) => (
                  <tr key={pet.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {pet.name[0]}
                        </div>
                        <p className="font-semibold text-gray-900">{pet.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{pet.species}</td>
                    <td className="px-6 py-4 text-gray-700">{pet.breed}</td>
                    <td className="px-6 py-4 text-gray-700">{pet.age}</td>
                    <td className="px-6 py-4 text-gray-700">{pet.weight}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSelectPet(pet)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <p className="text-sm">No pets found for this client</p>
                      <p className="text-xs mt-1">Add a new pet to continue</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PetStep
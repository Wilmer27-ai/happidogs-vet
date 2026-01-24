import { useState, useEffect } from 'react'
import { FiSearch } from 'react-icons/fi'
import { getPetsByClient } from '../../firebase/services'

function PetStep({ selectedClient, onSelectPet, onBack, onNext }) {
  const [petSearchQuery, setPetSearchQuery] = useState('')
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedClient?.id) {
      loadPets()
    }
  }, [selectedClient])

  const loadPets = async () => {
    try {
      const data = await getPetsByClient(selectedClient.id)
      setPets(data)
    } catch (error) {
      console.error('Error loading pets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPets = pets.filter(pet =>
    pet.name.toLowerCase().includes(petSearchQuery.toLowerCase()) ||
    pet.species.toLowerCase().includes(petSearchQuery.toLowerCase()) ||
    pet.breed.toLowerCase().includes(petSearchQuery.toLowerCase())
  )

  const handleSelectPet = (pet) => {
    onSelectPet(pet)
    onNext()
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
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

        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              <tr>
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
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    Loading pets...
                  </td>
                </tr>
              ) : filteredPets.length > 0 ? (
                filteredPets.map((pet) => (
                  <tr key={pet.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{pet.name}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{pet.species}</td>
                    <td className="px-6 py-4 text-gray-700">{pet.breed}</td>
                    <td className="px-6 py-4 text-gray-700">{pet.age} years</td>
                    <td className="px-6 py-4 text-gray-700">{pet.weight} kg</td>
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
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No pets found for this client
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
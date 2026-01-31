// ConsultationHistory.jsx
import { useState, useEffect } from 'react'
import { FiSearch, FiX, FiCalendar } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { getPets, getClients } from '../firebase/services'

function ConsultationHistory() {
  const navigate = useNavigate()
  const [pets, setPets] = useState([])
  const [clients, setClients] = useState([])
  const [filteredPets, setFilteredPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterPets()
  }, [pets, searchQuery])

  const loadData = async () => {
    try {
      const petsData = await getPets()
      const clientsData = await getClients()
      setPets(petsData)
      setClients(clientsData)
      setFilteredPets(petsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterPets = () => {
    let filtered = pets

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(pet => {
        const owner = getOwnerName(pet.clientId)
        return (
          pet.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.species?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.breed?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    }

    setFilteredPets(filtered)
  }

  const getOwnerName = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown'
  }

  const handlePetClick = (pet) => {
    navigate('/pet-activity', { state: { selectedPet: pet } })
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pet Records</h1>
            <p className="text-sm text-gray-500 mt-1">Select a pet to view their complete activity history</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/new-consultation')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          New Consultation
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by pet name, owner, species, or breed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Total Pets</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{pets.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Total Owners</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{clients.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Active Records</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{filteredPets.length}</p>
        </div>
      </div>

      {/* Pets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Loading pets...</p>
          </div>
        ) : filteredPets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">
              {searchQuery ? 'No pets match your search' : 'No pets found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 font-medium uppercase">Pet Name</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 font-medium uppercase">Owner</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 font-medium uppercase">Species</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 font-medium uppercase">Breed</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 font-medium uppercase">Date of Birth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPets.map((pet) => (
                  <tr 
                    key={pet.id} 
                    onClick={() => handlePetClick(pet)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                      {pet.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getOwnerName(pet.clientId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pet.species || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pet.breed || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pet.dateOfBirth ? new Date(pet.dateOfBirth).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConsultationHistory
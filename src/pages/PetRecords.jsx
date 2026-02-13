// ConsultationHistory.jsx
import { useState, useEffect, useRef } from 'react'
import { FiSearch, FiCalendar, FiHeart, FiUsers } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { getClients, getPets } from '../firebase/services'

function ConsultationHistory() {
  const navigate = useNavigate()
  const [pets, setPets] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Lazy loading state
  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [clientsData, petsData] = await Promise.all([
        getClients(),
        getPets()
      ])
      
      setClients(clientsData)
      setPets(petsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOwnerName = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown'
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A'
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let years = today.getFullYear() - birthDate.getFullYear()
    let months = today.getMonth() - birthDate.getMonth()
    
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--
      months += 12
    }
    
    if (months < 0) {
      months = 0
    }
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`
    } else if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`
    } else {
      return `${years}y ${months}m`
    }
  }

  // Filter pets based on search
  const filteredPets = pets.filter(pet => {
    const owner = getOwnerName(pet.clientId)
    return (
      pet.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.species?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Displayed pets with lazy loading
  const displayedPets = filteredPets.slice(0, displayCount)
  const hasMore = displayCount < filteredPets.length

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          setDisplayCount(prev => prev + 20)
        }
      },
      { threshold: 1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMore])

  // Reset display count when search changes
  useEffect(() => {
    setDisplayCount(20)
  }, [searchQuery])

  const handlePetClick = (pet) => {
    navigate('/pet-activity', { state: { selectedPet: pet } })
  }

  // Statistics
  const totalPets = pets.length
  const totalDogs = pets.filter(p => p.species === 'Dog').length
  const totalCats = pets.filter(p => p.species === 'Cat').length
  const totalClients = clients.length

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Pet Records</h1>

    

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by pet name, owner, species, or breed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => navigate('/new-consultation')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm whitespace-nowrap"
          >
            New Consultation
          </button>
        </div>
      </div>

      {/* Table Container with Fixed Height */}
      <div className="flex-1 px-6 py-4 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col overflow-hidden">
            <div className="overflow-auto flex-1">
              {filteredPets.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FiHeart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {searchQuery ? 'No pets match your search' : 'No pets found'}
                    </p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-white sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs">Pet Name</th>
                      <th className="px-4 py-2 text-left text-xs">Owner</th>
                      <th className="px-4 py-2 text-left text-xs">Species</th>
                      <th className="px-4 py-2 text-left text-xs">Breed</th>
                      <th className="px-4 py-2 text-left text-xs">Age</th>
                      <th className="px-4 py-2 text-left text-xs">Date of Birth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayedPets.map((pet, index) => (
                      <tr 
                        key={pet.id} 
                        onClick={() => handlePetClick(pet)}
                        className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-blue-600">{pet.name}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {getOwnerName(pet.clientId)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {pet.species || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {pet.breed || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {calculateAge(pet.dateOfBirth)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
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
              )}

              {/* Loading indicator for lazy loading */}
              {hasMore && (
                <div ref={observerTarget} className="py-4 text-center">
                  <p className="text-sm text-gray-500">Loading more...</p>
                </div>
              )}
            </div>

            {/* Footer with count */}
            {!hasMore && displayedPets.length > 0 && (
              <div className="py-3 text-center border-t flex-shrink-0 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Showing all {filteredPets.length} pets
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ConsultationHistory
// ConsultationHistory.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { FiSearch } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getClients } from '../firebase/services'

function ConsultationHistory() {
  const navigate = useNavigate()
  const [pets, setPets] = useState([])
  const [clients, setClients] = useState([])
  const [filteredPets, setFilteredPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const observerTarget = useRef(null)

  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      filterPets()
    } else {
      setFilteredPets(pets)
    }
  }, [pets, searchQuery])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !searchQuery) {
          loadMorePets()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMore, loading, loadingMore, searchQuery])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const clientsData = await getClients()
      setClients(clientsData)

      // Load first batch of pets
      const petsRef = collection(db, 'pets')
      const q = query(petsRef, orderBy('name'), limit(ITEMS_PER_PAGE))
      const snapshot = await getDocs(q)

      const petsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setPets(petsData)
      setFilteredPets(petsData)
      setLastDoc(snapshot.docs[snapshot.docs.length - 1])
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMorePets = async () => {
    if (!lastDoc || loadingMore) return

    setLoadingMore(true)
    try {
      const petsRef = collection(db, 'pets')
      const q = query(
        petsRef,
        orderBy('name'),
        startAfter(lastDoc),
        limit(ITEMS_PER_PAGE)
      )
      const snapshot = await getDocs(q)

      const newPets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setPets(prev => [...prev, ...newPets])
      setLastDoc(snapshot.docs[snapshot.docs.length - 1])
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE)
    } catch (error) {
      console.error('Error loading more pets:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const filterPets = () => {
    const filtered = pets.filter(pet => {
      const owner = getOwnerName(pet.clientId)
      return (
        pet.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.species?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.breed?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })

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
    <div className="p-6 lg:p-8 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pet Records</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredPets.length} pet{filteredPets.length !== 1 ? 's' : ''} found
            </p>
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 flex-shrink-0">
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

      {/* Pets Table with Fixed Height */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading pets...</p>
            </div>
          </div>
        ) : filteredPets.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">
              {searchQuery ? 'No pets match your search' : 'No pets found'}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50 z-10">
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

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="p-4 text-center border-t border-gray-200">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading more...</p>
              </div>
            )}

            {/* Infinite Scroll Trigger - Only show when not searching */}
            {!searchQuery && hasMore && !loadingMore && (
              <div ref={observerTarget} className="h-20 flex items-center justify-center">
                <p className="text-sm text-gray-400">Scroll for more...</p>
              </div>
            )}

            {/* End of List Message */}
            {!searchQuery && !hasMore && pets.length > 0 && (
              <div className="p-4 text-center border-t border-gray-200">
                <p className="text-sm text-gray-500">All pets loaded</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ConsultationHistory
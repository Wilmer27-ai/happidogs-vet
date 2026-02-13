// ClientsPets.jsx
import { useState, useEffect, useRef } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiUser, FiHeart } from 'react-icons/fi'
import { getClients, addClient, updateClient, deleteClient, addPet, updatePet, deletePet, getPets } from '../firebase/services'

function ClientsPets() {
  const [clients, setClients] = useState([])
  const [allPets, setAllPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('clients')
  const [searchQuery, setSearchQuery] = useState('')
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isPetModalOpen, setIsPetModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [editingPet, setEditingPet] = useState(null)
  
  // Lazy loading states
  const [displayCountClients, setDisplayCountClients] = useState(20)
  const [displayCountPets, setDisplayCountPets] = useState(20)
  const observerTarget = useRef(null)

  const [clientFormData, setClientFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: ''
  })

  const [petFormData, setPetFormData] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    dateOfBirth: '',
    clientId: ''
  })

  // Helper function to calculate age
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
      
      // Enrich pets with client names
      const enrichedPets = petsData.map(pet => {
        const client = clientsData.find(c => c.id === pet.clientId)
        return {
          ...pet,
          clientName: client ? `${client.firstName} ${client.lastName}` : 'Unknown'
        }
      })
      
      setAllPets(enrichedPets)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getClientPets = (clientId) => {
    return allPets.filter(pet => pet.clientId === clientId)
  }

  // Filter data based on search
  const filteredClients = clients.filter(client =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phoneNumber.includes(searchQuery) ||
    client.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPets = allPets.filter(pet =>
    pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Displayed items with lazy loading
  const displayedClients = filteredClients.slice(0, displayCountClients)
  const displayedPets = filteredPets.slice(0, displayCountPets)
  const hasMoreClients = displayCountClients < filteredClients.length
  const hasMorePets = displayCountPets < filteredPets.length

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          if (activeTab === 'clients' && hasMoreClients) {
            setDisplayCountClients(prev => prev + 20)
          } else if (activeTab === 'pets' && hasMorePets) {
            setDisplayCountPets(prev => prev + 20)
          }
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
  }, [hasMoreClients, hasMorePets, activeTab])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCountClients(20)
    setDisplayCountPets(20)
  }, [searchQuery, activeTab])

  // Client handlers
  const handleClientSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingClient) {
        await updateClient(editingClient.id, clientFormData)
      } else {
        await addClient(clientFormData)
      }
      await loadData()
      handleCloseClientModal()
    } catch (error) {
      console.error('Error saving client:', error)
      alert('Failed to save client. Please try again.')
    }
  }

  const handleEditClient = (client) => {
    setEditingClient(client)
    setClientFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      phoneNumber: client.phoneNumber,
      address: client.address
    })
    setIsClientModalOpen(true)
  }

  const handleDeleteClient = async (id) => {
    if (confirm('Are you sure you want to delete this client? This will also delete all associated pets.')) {
      try {
        const clientPets = allPets.filter(pet => pet.clientId === id)
        for (const pet of clientPets) {
          await deletePet(pet.id)
        }
        await deleteClient(id)
        await loadData()
      } catch (error) {
        console.error('Error deleting client:', error)
        alert('Failed to delete client.')
      }
    }
  }

  const handleCloseClientModal = () => {
    setIsClientModalOpen(false)
    setEditingClient(null)
    setClientFormData({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      address: ''
    })
  }

  // Pet handlers
  const handlePetSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingPet) {
        await updatePet(editingPet.id, petFormData)
      } else {
        await addPet(petFormData)
      }
      await loadData()
      handleClosePetModal()
    } catch (error) {
      console.error('Error saving pet:', error)
      alert('Failed to save pet. Please try again.')
    }
  }

  const handleEditPet = (pet) => {
    setEditingPet(pet)
    setPetFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      dateOfBirth: pet.dateOfBirth,
      clientId: pet.clientId
    })
    setIsPetModalOpen(true)
  }

  const handleDeletePet = async (id) => {
    if (confirm('Are you sure you want to delete this pet?')) {
      try {
        await deletePet(id)
        await loadData()
      } catch (error) {
        console.error('Error deleting pet:', error)
        alert('Failed to delete pet.')
      }
    }
  }

  const handleClosePetModal = () => {
    setIsPetModalOpen(false)
    setEditingPet(null)
    setPetFormData({
      name: '',
      species: 'Dog',
      breed: '',
      dateOfBirth: '',
      clientId: ''
    })
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
     <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Clients & Pets</h1>

      

        {/* Tab Toggle & Search */}
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'clients'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Clients
            </button>
            <button
              onClick={() => setActiveTab('pets')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'pets'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pets
            </button>
          </div>

          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={activeTab === 'clients' ? 'Search clients...' : 'Search pets...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={activeTab === 'clients' ? () => setIsClientModalOpen(true) : () => setIsPetModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm text-sm"
          >
            <FiPlus className="w-4 h-4" />
            {activeTab === 'clients' ? 'Add Client' : 'Add Pet'}
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
              {activeTab === 'clients' ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-white sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs">Name</th>
                      <th className="px-4 py-2 text-left text-xs">Phone</th>
                      <th className="px-4 py-2 text-left text-xs">Address</th>
                      <th className="px-4 py-2 text-left text-xs">Pets</th>
                      <th className="px-4 py-2 text-right text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayedClients.length > 0 ? (
                      displayedClients.map((client, index) => (
                        <tr key={client.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">
                              {client.firstName} {client.lastName}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{client.phoneNumber}</td>
                          <td className="px-4 py-3 text-gray-700">{client.address}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {getClientPets(client.id).length}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditClient(client)}
                                className="text-blue-600 hover:text-blue-700 p-1.5"
                                title="Edit"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client.id)}
                                className="text-red-600 hover:text-red-700 p-1.5"
                                title="Delete"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-12 text-center text-gray-500">
                          <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p>No clients found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-white sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs">Pet Name</th>
                      <th className="px-4 py-2 text-left text-xs">Species</th>
                      <th className="px-4 py-2 text-left text-xs">Breed</th>
                      <th className="px-4 py-2 text-left text-xs">Age</th>
                      <th className="px-4 py-2 text-left text-xs">Owner</th>
                      <th className="px-4 py-2 text-right text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayedPets.length > 0 ? (
                      displayedPets.map((pet, index) => (
                        <tr key={pet.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{pet.name}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{pet.species}</td>
                          <td className="px-4 py-3 text-gray-700">{pet.breed}</td>
                          <td className="px-4 py-3 text-gray-700">{calculateAge(pet.dateOfBirth)}</td>
                          <td className="px-4 py-3 text-gray-700">{pet.clientName}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditPet(pet)}
                                className="text-blue-600 hover:text-blue-700 p-1.5"
                                title="Edit"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePet(pet.id)}
                                className="text-red-600 hover:text-red-700 p-1.5"
                                title="Delete"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                          <FiHeart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p>No pets found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* Loading indicator for lazy loading */}
              {((activeTab === 'clients' && hasMoreClients) || (activeTab === 'pets' && hasMorePets)) && (
                <div ref={observerTarget} className="py-4 text-center">
                  <p className="text-sm text-gray-500">Loading more...</p>
                </div>
              )}
            </div>

            {/* Footer with count */}
            {((activeTab === 'clients' && !hasMoreClients && displayedClients.length > 0) ||
              (activeTab === 'pets' && !hasMorePets && displayedPets.length > 0)) && (
              <div className="py-3 text-center border-t flex-shrink-0 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Showing all {activeTab === 'clients' ? filteredClients.length : filteredPets.length}{' '}
                  {activeTab === 'clients' ? 'clients' : 'pets'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button onClick={handleCloseClientModal} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleClientSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={clientFormData.firstName}
                      onChange={(e) => setClientFormData({ ...clientFormData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={clientFormData.lastName}
                      onChange={(e) => setClientFormData({ ...clientFormData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientFormData.phoneNumber}
                    onChange={(e) => setClientFormData({ ...clientFormData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={clientFormData.address}
                    onChange={(e) => setClientFormData({ ...clientFormData, address: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full address"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseClientModal}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingClient ? 'Update Client' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Pet Modal */}
      {isPetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPet ? 'Edit Pet' : 'Add New Pet'}
              </h2>
              <button onClick={handleClosePetModal} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handlePetSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pet Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={petFormData.name}
                    onChange={(e) => setPetFormData({ ...petFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Max"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Species <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={petFormData.species}
                      onChange={(e) => setPetFormData({ ...petFormData, species: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      Breed <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={petFormData.breed}
                      onChange={(e) => setPetFormData({ ...petFormData, breed: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Golden Retriever"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={petFormData.dateOfBirth}
                    onChange={(e) => setPetFormData({ ...petFormData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {!editingPet && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Owner <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={petFormData.clientId}
                      onChange={(e) => setPetFormData({ ...petFormData, clientId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select owner</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.firstName} {client.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={handleClosePetModal}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingPet ? 'Update Pet' : 'Add Pet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientsPets
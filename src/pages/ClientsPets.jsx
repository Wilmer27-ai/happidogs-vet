// ClientsPets.jsx
import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiEye } from 'react-icons/fi'
import { getClients, addClient, updateClient, deleteClient, getPetsByClient, addPet, updatePet, deletePet } from '../firebase/services'

function ClientsPets() {
  const [clients, setClients] = useState([])
  const [allPets, setAllPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('clients')
  const [searchQuery, setSearchQuery] = useState('')
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isPetModalOpen, setIsPetModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingClient, setViewingClient] = useState(null)
  const [viewingPet, setViewingPet] = useState(null)
  const [editingClient, setEditingClient] = useState(null)
  const [editingPet, setEditingPet] = useState(null)
  const [selectedClientForPet, setSelectedClientForPet] = useState(null)
  
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
    dateOfBirth: ''
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
    try {
      const clientsData = await getClients()
      setClients(clientsData)
      
      // Load all pets
      const petsArray = []
      for (const client of clientsData) {
        const clientPets = await getPetsByClient(client.id)
        petsArray.push(...clientPets.map(pet => ({
          ...pet,
          clientName: `${client.firstName} ${client.lastName}`
        })))
      }
      setAllPets(petsArray)
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

  // Client handlers
  const handleViewClient = (client) => {
    setViewingClient(client)
    setIsViewModalOpen(true)
  }

  const handleClientSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingClient) {
        await updateClient(editingClient.id, clientFormData)
      } else {
        await addClient(clientFormData)
      }
      loadData()
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
        loadData()
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
  const handleViewPet = (pet) => {
    setViewingPet(pet)
    setIsViewModalOpen(true)
  }

  const handleOpenAddPet = () => {
    setIsPetModalOpen(true)
  }

  const handlePetSubmit = async (e) => {
    e.preventDefault()
    try {
      const petData = {
        ...petFormData,
        clientId: editingPet ? editingPet.clientId : petFormData.clientId
      }

      if (editingPet) {
        await updatePet(editingPet.id, petData)
      } else {
        await addPet(petData)
      }
      loadData()
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
        loadData()
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

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setViewingClient(null)
    setViewingPet(null)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clients & Pets</h1>
              <p className="text-gray-500 mt-1">Manage your clients and their pets</p>
            </div>
            <button
              onClick={activeTab === 'clients' ? () => setIsClientModalOpen(true) : handleOpenAddPet}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm text-sm"
            >
              <FiPlus className="w-5 h-5" />
              {activeTab === 'clients' ? 'Add Client' : 'Add Pet'}
            </button>
          </div>

          {/* Tab Toggle & Search */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('clients')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'clients'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Clients ({clients.length})
              </button>
              <button
                onClick={() => setActiveTab('pets')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'pets'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pets ({allPets.length})
              </button>
            </div>

            <div className="relative flex-1 max-w-md ml-4">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={activeTab === 'clients' ? 'Search clients...' : 'Search pets...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 px-6 py-4 overflow-hidden">
        <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'clients' ? (
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Pets
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">
                              {client.firstName} {client.lastName}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{client.phoneNumber}</td>
                          <td className="px-6 py-4 text-gray-700">{client.address}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getClientPets(client.id).length} pets
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewClient(client)}
                                className="text-gray-600 hover:text-gray-900 p-2"
                                title="View Details"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditClient(client)}
                                className="text-blue-600 hover:text-blue-700 p-2"
                                title="Edit"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client.id)}
                                className="text-red-600 hover:text-red-700 p-2"
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
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          No clients found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
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
                        Owner
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPets.length > 0 ? (
                      filteredPets.map((pet) => (
                        <tr key={pet.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{pet.name}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{pet.species}</td>
                          <td className="px-6 py-4 text-gray-700">{pet.breed}</td>
                          <td className="px-6 py-4 text-gray-700">{calculateAge(pet.dateOfBirth)}</td>
                          <td className="px-6 py-4 text-gray-700">{pet.clientName}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewPet(pet)}
                                className="text-gray-600 hover:text-gray-900 p-2"
                                title="View Details"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditPet(pet)}
                                className="text-blue-600 hover:text-blue-700 p-2"
                                title="Edit"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePet(pet.id)}
                                className="text-red-600 hover:text-red-700 p-2"
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
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                          No pets found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* View Client Modal */}
      {isViewModalOpen && viewingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Client Details</h2>
              <button onClick={handleCloseViewModal} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {viewingClient.firstName} {viewingClient.lastName}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                  <p className="text-gray-900">{viewingClient.phoneNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                  <p className="text-gray-900">{viewingClient.address}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Pets ({getClientPets(viewingClient.id).length})
                </h4>
                {getClientPets(viewingClient.id).length > 0 ? (
                  <div className="space-y-2">
                    {getClientPets(viewingClient.id).map((pet) => (
                      <div key={pet.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{pet.name}</p>
                        <p className="text-sm text-gray-600">
                          {pet.species} • {pet.breed} • {calculateAge(pet.dateOfBirth)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No pets registered for this client</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleCloseViewModal}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Pet Modal */}
      {isViewModalOpen && viewingPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Pet Details</h2>
              <button onClick={handleCloseViewModal} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{viewingPet.name}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Species</label>
                  <p className="text-gray-900">{viewingPet.species}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Breed</label>
                  <p className="text-gray-900">{viewingPet.breed}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Age</label>
                  <p className="text-gray-900">{calculateAge(viewingPet.dateOfBirth)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Owner</label>
                  <p className="text-gray-900">{viewingPet.clientName}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleCloseViewModal}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
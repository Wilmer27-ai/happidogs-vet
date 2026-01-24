// ClientsPets.jsx
import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiEye } from 'react-icons/fi'
import { getClients, addClient, updateClient, deleteClient, getPetsByClient, addPet, updatePet, deletePet } from '../firebase/services'

function ClientsPets() {
  const [clients, setClients] = useState([])
  const [allPets, setAllPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('clients') // 'clients' or 'pets'
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
    age: '',
    weight: ''
  })

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
        age: Number(petFormData.age),
        weight: Number(petFormData.weight),
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
      age: pet.age,
      weight: pet.weight,
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
      age: '',
      weight: '',
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

            <div className="relative max-w-md w-full">
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
                        Client Name
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
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {client.firstName[0]}{client.lastName[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {client.firstName} {client.lastName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{client.phoneNumber}</td>
                          <td className="px-6 py-4 text-gray-700">{client.address}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {getClientPets(client.id).length} pet(s)
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
                        Weight
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
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {pet.name[0]}
                              </div>
                              <p className="font-semibold text-gray-900">{pet.name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{pet.species}</td>
                          <td className="px-6 py-4 text-gray-700">{pet.breed}</td>
                          <td className="px-6 py-4 text-gray-700">{pet.age} years</td>
                          <td className="px-6 py-4 text-gray-700">{pet.weight} kg</td>
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
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
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

      {/* View Details Modal */}
      {isViewModalOpen && (viewingClient || viewingPet) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {viewingClient ? 'Client Details' : 'Pet Details'}
              </h2>
              <button onClick={handleCloseViewModal} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {viewingClient ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                      {viewingClient.firstName[0]}{viewingClient.lastName[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {viewingClient.firstName} {viewingClient.lastName}
                      </h3>
                      <p className="text-gray-600">{viewingClient.phoneNumber}</p>
                    </div>
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
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Pets ({getClientPets(viewingClient.id).length})</h4>
                    {getClientPets(viewingClient.id).length > 0 ? (
                      <div className="space-y-3">
                        {getClientPets(viewingClient.id).map((pet) => (
                          <div key={pet.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {pet.name[0]}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{pet.name}</p>
                                <p className="text-sm text-gray-600">
                                  {pet.species} • {pet.breed} • {pet.age} years • {pet.weight} kg
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No pets registered</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                      {viewingPet.name[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{viewingPet.name}</h3>
                      <p className="text-gray-600">{viewingPet.species} • {viewingPet.breed}</p>
                    </div>
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
                      <p className="text-gray-900">{viewingPet.age} years</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Weight</label>
                      <p className="text-gray-900">{viewingPet.weight} kg</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Owner</label>
                      <p className="text-gray-900">{viewingPet.clientName}</p>
                    </div>
                  </div>
                </div>
              )}
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button onClick={handleCloseClientModal} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleClientSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientFormData.firstName}
                    onChange={(e) => setClientFormData({ ...clientFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientFormData.lastName}
                    onChange={(e) => setClientFormData({ ...clientFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientFormData.phoneNumber}
                    onChange={(e) => setClientFormData({ ...clientFormData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    required
                    rows="3"
                    value={clientFormData.address}
                    onChange={(e) => setClientFormData({ ...clientFormData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseClientModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPet ? 'Edit Pet' : 'Add New Pet'}
              </h2>
              <button onClick={handleClosePetModal} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handlePetSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner *
                  </label>
                  <select
                    required
                    value={petFormData.clientId}
                    onChange={(e) => setPetFormData({ ...petFormData, clientId: e.target.value })}
                    disabled={editingPet}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pet Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={petFormData.name}
                    onChange={(e) => setPetFormData({ ...petFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Species *
                  </label>
                  <select
                    required
                    value={petFormData.species}
                    onChange={(e) => setPetFormData({ ...petFormData, species: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
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
                    value={petFormData.breed}
                    onChange={(e) => setPetFormData({ ...petFormData, breed: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age (years) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.1"
                      value={petFormData.age}
                      onChange={(e) => setPetFormData({ ...petFormData, age: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.1"
                      value={petFormData.weight}
                      onChange={(e) => setPetFormData({ ...petFormData, weight: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClosePetModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
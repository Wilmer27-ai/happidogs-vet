// ClientsPets.jsx
import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUser, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { getClients, addClient, updateClient, deleteClient, getPetsByClient, addPet, updatePet, deletePet } from '../firebase/services'

function ClientsPets() {
  const [clients, setClients] = useState([])
  const [pets, setPets] = useState({}) // Organized by clientId
  const [loading, setLoading] = useState(true)
  const [expandedClients, setExpandedClients] = useState({})
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isPetModalOpen, setIsPetModalOpen] = useState(false)
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
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const data = await getClients()
      setClients(data)
      
      // Load pets for each client
      const petsData = {}
      for (const client of data) {
        const clientPets = await getPetsByClient(client.id)
        petsData[client.id] = clientPets
      }
      setPets(petsData)
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleClientExpand = (clientId) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }))
  }

  // Client handlers
  const handleClientSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingClient) {
        await updateClient(editingClient.id, clientFormData)
      } else {
        await addClient(clientFormData)
      }
      loadClients()
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
        // Delete all pets for this client first
        const clientPets = pets[id] || []
        for (const pet of clientPets) {
          await deletePet(pet.id)
        }
        await deleteClient(id)
        loadClients()
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
  const handleOpenAddPet = (client) => {
    setSelectedClientForPet(client)
    setIsPetModalOpen(true)
  }

  const handlePetSubmit = async (e) => {
    e.preventDefault()
    try {
      const petData = {
        ...petFormData,
        age: Number(petFormData.age),
        weight: Number(petFormData.weight),
        clientId: editingPet ? editingPet.clientId : selectedClientForPet.id
      }

      if (editingPet) {
        await updatePet(editingPet.id, petData)
      } else {
        await addPet(petData)
      }
      loadClients()
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
      weight: pet.weight
    })
    setIsPetModalOpen(true)
  }

  const handleDeletePet = async (id) => {
    if (confirm('Are you sure you want to delete this pet?')) {
      try {
        await deletePet(id)
        loadClients()
      } catch (error) {
        console.error('Error deleting pet:', error)
        alert('Failed to delete pet.')
      }
    }
  }

  const handleClosePetModal = () => {
    setIsPetModalOpen(false)
    setEditingPet(null)
    setSelectedClientForPet(null)
    setPetFormData({
      name: '',
      species: 'Dog',
      breed: '',
      age: '',
      weight: ''
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients & Pets</h1>
          <p className="text-gray-500 mt-1">Manage your clients and their pets</p>
        </div>
        <button
          onClick={() => setIsClientModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <FiPlus className="w-5 h-5" />
          Add Client
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Loading clients...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No clients found. Add your first client to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {clients.map((client) => (
              <div key={client.id} className="p-6">
                {/* Client Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => toggleClientExpand(client.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedClients[client.id] ? (
                        <FiChevronDown className="w-5 h-5" />
                      ) : (
                        <FiChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {client.firstName[0]}{client.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {client.firstName} {client.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{client.phoneNumber}</p>
                      <p className="text-sm text-gray-500">{client.address}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {pets[client.id]?.length || 0} pet(s)
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAddPet(client)}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add Pet
                    </button>
                    <button
                      onClick={() => handleEditClient(client)}
                      className="text-blue-600 hover:text-blue-700 p-2"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pets List (Expanded) */}
                {expandedClients[client.id] && (
                  <div className="mt-4 ml-9 space-y-3">
                    {pets[client.id]?.length > 0 ? (
                      pets[client.id].map((pet) => (
                        <div
                          key={pet.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditPet(pet)}
                              className="text-blue-600 hover:text-blue-700 p-2"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePet(pet.id)}
                              className="text-red-600 hover:text-red-700 p-2"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No pets added yet</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
              {selectedClientForPet && !editingPet && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Adding pet for:</p>
                  <p className="font-medium text-gray-900">
                    {selectedClientForPet.firstName} {selectedClientForPet.lastName}
                  </p>
                </div>
              )}

              <div className="space-y-4">
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
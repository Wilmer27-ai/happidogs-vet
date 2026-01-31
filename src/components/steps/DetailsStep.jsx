import { useState, useEffect } from 'react'
import { FiPlus } from 'react-icons/fi'
import { getPetActivities, addPetActivity, getClients, getPetsByClient } from '../../firebase/services'
import AddClientModal from '../AddClientModal'
import AddPetModal from '../AddPetModal'

function DetailsStep({ selectedClient, selectedPets: propSelectedPets, onSelectClient, onSelectPets, onNext, consultationData, setConsultationData }) {
  // Client and Pet data
  const [clients, setClients] = useState([])
  const [pets, setPets] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingPets, setLoadingPets] = useState(false)

  // Search states
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [petSearchQuery, setPetSearchQuery] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showPetDropdown, setShowPetDropdown] = useState(false)

  // Modal states
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false)
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false)
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: ''
  })
  const [newPet, setNewPet] = useState({
    name: '',
    species: '',
    breed: '',
    dateOfBirth: ''
  })

  // Activity state
  const [activities, setActivities] = useState([])
  const [selectedActivities, setSelectedActivities] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Multiple pet selection - initialize from props
  const [selectedPets, setSelectedPets] = useState(propSelectedPets || [])
  
  // Mobile view toggle
  const [showForm, setShowForm] = useState(true)

  const getCurrentDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [formData, setFormData] = useState({
    activityType: 'Consultation',
    date: getCurrentDate(),
    weight: '',
    temperature: '',
    diagnosis: '',
    treatment: '',
    followUpDate: ''
  })

  // Load clients on mount
  useEffect(() => {
    loadClients()
  }, [])

  // Load pets when client is selected
  useEffect(() => {
    if (selectedClient?.id) {
      loadPets()
    } else {
      setPets([])
      setSelectedPets([])
    }
  }, [selectedClient])

  // Load activities when pets are selected
  useEffect(() => {
    if (selectedPets.length > 0) {
      loadActivities()
    } else {
      setActivities([])
      setSelectedActivities([])
    }
  }, [selectedPets])

  // Sync selectedPets with parent
  useEffect(() => {
    if (onSelectPets) {
      onSelectPets(selectedPets)
    }
  }, [selectedPets])

  const loadClients = async () => {
    try {
      const data = await getClients()
      setClients(data)
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  const loadPets = async () => {
    setLoadingPets(true)
    try {
      const data = await getPetsByClient(selectedClient.id)
      setPets(data)
    } catch (error) {
      console.error('Error loading pets:', error)
    } finally {
      setLoadingPets(false)
    }
  }

  const loadActivities = async () => {
    setLoading(true)
    try {
      // Load activities for all selected pets
      const allActivities = []
      for (const pet of selectedPets) {
        const data = await getPetActivities(pet.id)
        const activitiesWithPetName = data.map(activity => ({
          ...activity,
          petName: pet.name
        }))
        allActivities.push(...activitiesWithPetName)
      }
      
      // Sort by date descending (newest first)
      const sortedData = allActivities.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA
      })
      
      setActivities(sortedData)
      if (sortedData.length > 0) {
        setSelectedActivities([sortedData[0].id])
      }
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddClient = async (newClientData) => {
    onSelectClient(newClientData)
    setClientSearchQuery(`${newClientData.firstName} ${newClientData.lastName}`)
    setNewClient({ firstName: '', lastName: '', phoneNumber: '', address: '' })
    setIsAddClientModalOpen(false)
    await loadClients()
  }

  const handleAddPet = async (newPetData) => {
    setSelectedPets([...selectedPets, newPetData])
    setNewPet({ name: '', species: '', breed: '', dateOfBirth: '' })
    setIsAddPetModalOpen(false)
    await loadPets()
  }

  const handleClientSelect = (client) => {
    onSelectClient(client)
    setClientSearchQuery(`${client.firstName} ${client.lastName}`)
    setShowClientDropdown(false)
  }

  const togglePetSelection = (pet) => {
    setSelectedPets(prev => {
      const isSelected = prev.some(p => p.id === pet.id)
      if (isSelected) {
        return prev.filter(p => p.id !== pet.id)
      } else {
        return [...prev, pet]
      }
    })
  }

  const filteredClients = clients.filter(client =>
    `${client.firstName} ${client.lastName} ${client.phoneNumber}`.toLowerCase().includes(clientSearchQuery.toLowerCase())
  ).slice(0, 50)

  const filteredPets = pets.filter(pet =>
    `${pet.name} ${pet.species} ${pet.breed}`.toLowerCase().includes(petSearchQuery.toLowerCase())
  ).slice(0, 50)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.activityType || !formData.date) {
      alert('Please fill in all required fields')
      return
    }

    if (selectedPets.length === 0) {
      alert('Please select at least one pet')
      return
    }

    try {
      // Add activity to all selected pets
      const promises = selectedPets.map(pet => {
        const activityData = {
          petId: pet.id,
          activityType: formData.activityType,
          date: formData.date,
          weight: formData.weight || null,
          temperature: formData.temperature || null,
          diagnosis: formData.activityType === 'Consultation' ? formData.diagnosis : null,
          treatment: formData.activityType === 'Consultation' ? formData.treatment : null,
          followUpDate: formData.followUpDate || null
        }
        return addPetActivity(activityData)
      })

      await Promise.all(promises)

      setFormData({
        activityType: 'Consultation',
        date: getCurrentDate(),
        weight: '',
        temperature: '',
        diagnosis: '',
        treatment: '',
        followUpDate: ''
      })

      await loadActivities()
      setShowForm(false) // Switch to table view on mobile after adding
      alert(`Activity added successfully to ${selectedPets.length} pet(s)!`)
    } catch (error) {
      console.error('Error adding activity:', error)
      alert('Failed to add activity. Please try again.')
    }
  }

  const handleContinue = () => {
    if (!selectedClient || selectedPets.length === 0) {
      alert('Please select a client and at least one pet')
      return
    }

    const selectedActivityData = activities.filter(act => 
      selectedActivities.includes(act.id)
    )

    setConsultationData(selectedActivityData)
    onNext()
  }

  const toggleActivitySelection = (activityId) => {
    setSelectedActivities(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId)
      } else {
        return [...prev, activityId]
      }
    })
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-white">
      {/* Click outside to close dropdowns */}
      {(showClientDropdown || showPetDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowClientDropdown(false)
            setShowPetDropdown(false)
          }}
        />
      )}

      {/* Mobile Toggle Buttons */}
      <div className="lg:hidden flex border-b border-gray-300 bg-white flex-shrink-0">
        <button
          onClick={() => setShowForm(true)}
          className={`flex-1 py-3 text-sm font-semibold ${
            showForm ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Form
        </button>
        <button
          onClick={() => setShowForm(false)}
          className={`flex-1 py-3 text-sm font-semibold ${
            !showForm ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Activities
        </button>
      </div>

      {/* Left Panel - Patient Info & Form */}
      <div className={`${showForm ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 xl:w-96 border-r border-gray-300 bg-gray-50 flex-col`}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h2 className="text-[10px] font-bold text-gray-700 uppercase mb-4">Pet Consultation Form</h2>

          {/* Owner Name */}
          <div>
            <label className="text-[10px] font-bold text-gray-700 uppercase mb-4">Owner Name</label>
            <div className="relative">
              <input
                type="text"
                value={clientSearchQuery}
                onChange={(e) => {
                  setClientSearchQuery(e.target.value)
                  setShowClientDropdown(true)
                  if (!e.target.value) {
                    onSelectClient(null)
                  }
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Search client..."
                className="w-full px-3 py-2 bg-gray-200 border-0 text-sm outline-none"
              />
              {showClientDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddClientModalOpen(true)
                      setShowClientDropdown(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 border-b border-gray-200 text-blue-600 font-medium"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add New Client
                  </button>
                  {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleClientSelect(client)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 border-b border-gray-100"
                      >
                        <div className="font-medium">{client.firstName} {client.lastName}</div>
                        <div className="text-xs text-gray-500">{client.phoneNumber}</div>
                      </button>
                    ))
                  ) : clientSearchQuery ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No clients found</div>
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">Type to search...</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pet Selection */}
          <div>
            <label className="text-[10px] font-bold text-gray-700 uppercase mb-1 block">Select Pets ({selectedPets.length})</label>
            <div className="relative">
              <input
                type="text"
                value={petSearchQuery}
                onChange={(e) => {
                  setPetSearchQuery(e.target.value)
                  setShowPetDropdown(true)
                }}
                onFocus={() => setShowPetDropdown(true)}
                disabled={!selectedClient}
                placeholder="Search and select pets..."
                className="w-full px-3 py-2 bg-gray-200 border-0 text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {showPetDropdown && selectedClient && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddPetModalOpen(true)
                      setShowPetDropdown(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 border-b border-gray-200 text-blue-600 font-medium"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add New Pet
                  </button>
                  {filteredPets.length > 0 ? (
                    filteredPets.map(pet => (
                      <button
                        key={pet.id}
                        type="button"
                        onClick={() => togglePetSelection(pet)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 border-b border-gray-100 flex items-center gap-2 ${
                          selectedPets.some(p => p.id === pet.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPets.some(p => p.id === pet.id)}
                          onChange={() => {}}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{pet.name}</div>
                          <div className="text-xs text-gray-500">{pet.species} - {pet.breed}</div>
                        </div>
                      </button>
                    ))
                  ) : petSearchQuery ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No pets found</div>
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">Type to search...</div>
                  )}
                </div>
              )}
            </div>
            
            {/* Selected Pets Display */}
            {selectedPets.length > 0 && (
              <div className="mt-2 space-y-1">
                {selectedPets.map(pet => (
                  <div key={pet.id} className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded text-xs">
                    <span className="font-medium">{pet.name}</span>
                    <button
                      type="button"
                      onClick={() => togglePetSelection(pet)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedClient && selectedPets.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-gray-300">
              {/* Activity Type */}
              <div>
                <label className="text-[10px] font-bold text-gray-700 uppercase mb-4">Activity Type</label>
                <select
                  value={formData.activityType}
                  onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-200 border-0 text-sm outline-none"
                  required
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Deworming">Deworming</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="text-[10px] font-bold text-gray-700 uppercase mb-4">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-200 border-0 text-sm outline-none"
                  required
                />
              </div>

              {/* Weight */}
              <div>
                <label className="text-[10px] font-bold text-gray-700 uppercase mb-4">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-200 border-0 text-sm outline-none"
                  placeholder="0.0"
                />
              </div>

              {/* Temperature */}
              <div>
                <label className="text-[10px] font-bold text-gray-700 uppercase mb-4">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-200 border-0 text-sm outline-none"
                  placeholder="0.0"
                />
              </div>

              {/* Diagnosis - Only for Consultation */}
              {formData.activityType === 'Consultation' && (
                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase mb-4">Diagnosis</label>
                  <textarea
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 bg-gray-200 border-0 text-sm outline-none resize-none"
                    placeholder="Enter diagnosis..."
                  />
                </div>
              )}

              {/* Treatment - Only for Consultation */}
              {formData.activityType === 'Consultation' && (
                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase mb-4">Treatment</label>
                  <textarea
                    value={formData.treatment}
                    onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 bg-gray-200 border-0 text-sm outline-none resize-none"
                    placeholder="Enter treatment..."
                  />
                </div>
              )}

              {/* Follow-up Date */}
              <div>
                <label className="text-[10px] font-bold text-gray-700 uppercase mb-4">Follow-up Date</label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-200 border-0 text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700 rounded-lg"
              >
                Add Activity to {selectedPets.length} Pet(s)
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Right Panel - Progress Table */}
      <div className={`${!showForm ? 'flex' : 'hidden'} lg:flex flex-1 flex-col`}>
        {selectedClient && selectedPets.length > 0 ? (
          <>
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0">
                      <tr className="bg-gray-800 text-white">
                        <th className="border border-gray-300 px-2 md:px-3 py-2 text-left text-xs font-bold uppercase w-8"></th>
                        <th className="border border-gray-300 px-2 md:px-3 py-2 text-left text-xs font-bold uppercase">Pet</th>
                        <th className="border border-gray-300 px-2 md:px-3 py-2 text-left text-xs font-bold uppercase">Date</th>
                        <th className="border border-gray-300 px-2 md:px-3 py-2 text-left text-xs font-bold uppercase">Activity</th>
                        <th className="border border-gray-300 px-2 md:px-3 py-2 text-left text-xs font-bold uppercase hidden md:table-cell">Details</th>
                        <th className="border border-gray-300 px-2 md:px-3 py-2 text-left text-xs font-bold uppercase hidden sm:table-cell">Follow-up</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.length > 0 ? (
                        activities.map((activity, index) => (
                          <tr key={activity.id} className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                            <td className="border border-gray-300 px-2 md:px-3 py-2 text-center align-top">
                              <input
                                type="checkbox"
                                checked={selectedActivities.includes(activity.id)}
                                onChange={() => toggleActivitySelection(activity.id)}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 md:px-3 py-2 align-top">
                              <div className="text-xs font-medium">{activity.petName}</div>
                            </td>
                            <td className="border border-gray-300 px-2 md:px-3 py-2 align-top">
                              <div className="text-xs whitespace-nowrap">
                                {new Date(activity.date).toLocaleDateString('en-US', { 
                                  month: '2-digit', 
                                  day: '2-digit', 
                                  year: '2-digit' 
                                })}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-2 md:px-3 py-2 align-top">
                              <div className="text-xs font-bold">{activity.activityType}</div>
                              {activity.weight && (
                                <div className="text-xs text-gray-600">Wt: {activity.weight}kg</div>
                              )}
                              {activity.temperature && (
                                <div className="text-xs text-gray-600">Temp: {activity.temperature}°C</div>
                              )}
                            </td>
                            <td className="border border-gray-300 px-2 md:px-3 py-2 align-top hidden md:table-cell">
                              {activity.diagnosis && (
                                <div className="text-xs mb-1">{activity.diagnosis}</div>
                              )}
                              {activity.treatment && (
                                <div className="text-xs">{activity.treatment}</div>
                              )}
                            </td>
                            <td className="border border-gray-300 px-2 md:px-3 py-2 align-top hidden sm:table-cell">
                              <div className="text-xs whitespace-nowrap">
                                {activity.followUpDate ? (
                                  new Date(activity.followUpDate).toLocaleDateString('en-US', {
                                    month: '2-digit',
                                    day: '2-digit',
                                    year: '2-digit'
                                  })
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="border border-gray-300 px-3 py-8 text-center text-sm text-gray-500">
                            No activities recorded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Fixed Continue Button */}
            <div className="border-t border-gray-300 p-4 bg-gray-50 flex-shrink-0">
              <button
                onClick={handleContinue}
                disabled={selectedActivities.length === 0}
                className="w-full px-6 py-3 bg-blue-600 text-white text-sm font-bold uppercase hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              >
                Continue to Medicines
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-gray-400 text-sm text-center">Select owner and pet(s) to continue</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onSubmit={handleAddClient}
        clientData={newClient}
        setClientData={setNewClient}
      />

      <AddPetModal
        isOpen={isAddPetModalOpen}
        onClose={() => setIsAddPetModalOpen(false)}
        onSubmit={handleAddPet}
        petData={newPet}
        setPetData={setNewPet}
        selectedClient={selectedClient}
      />
    </div>
  )
}

export default DetailsStep
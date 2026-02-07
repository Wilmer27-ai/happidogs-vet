import { useState, useEffect } from 'react'
import { FiPlus } from 'react-icons/fi'
import { getPetActivities, addPetActivity, getClients, getPetsByClient } from '../../firebase/services'
import AddClientModal from '../AddClientModal'
import AddPetModal from '../AddPetModal'

function DetailsStep({ selectedClient, selectedPets: propSelectedPets, onSelectClient, onSelectPets, onNext, consultationData, setConsultationData }) {
  const [clients, setClients] = useState([])
  const [pets, setPets] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingPets, setLoadingPets] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [petSearchQuery, setPetSearchQuery] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showPetDropdown, setShowPetDropdown] = useState(false)
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
  const [activities, setActivities] = useState([])
  const [selectedActivities, setSelectedActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPets, setSelectedPets] = useState(propSelectedPets || [])
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

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    if (selectedClient?.id) {
      loadPets()
    } else {
      setPets([])
      setSelectedPets([])
    }
  }, [selectedClient])

  useEffect(() => {
    if (selectedPets.length > 0) {
      loadActivities()
    } else {
      setActivities([])
      setSelectedActivities([])
    }
  }, [selectedPets])

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
      const allActivities = []
      for (const pet of selectedPets) {
        const data = await getPetActivities(pet.id)
        const activitiesWithPetName = data.map(activity => ({
          ...activity,
          petName: pet.name
        }))
        allActivities.push(...activitiesWithPetName)
      }
      
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
      setShowForm(false)
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
    <div className="h-screen flex flex-col bg-gray-50">
      {(showClientDropdown || showPetDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowClientDropdown(false)
            setShowPetDropdown(false)
          }}
        />
      )}

      <div className="lg:hidden flex border-b border-gray-200 bg-white flex-shrink-0">
        <button
          onClick={() => setShowForm(true)}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            showForm ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          Form
        </button>
        <button
          onClick={() => setShowForm(false)}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            !showForm ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          Activities
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className={`${showForm ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 xl:w-96 border-r border-gray-200 bg-white flex-col`}>
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Pet Consultation Form</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {/* Owner Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Owner Name</label>
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
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {showClientDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddClientModalOpen(true)
                          setShowClientDropdown(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 border-b border-gray-200 text-blue-600 font-medium"
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
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-gray-900">{client.firstName} {client.lastName}</div>
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Select Pets ({selectedPets.length})</label>
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
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                  />
                  {showPetDropdown && selectedClient && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddPetModalOpen(true)
                          setShowPetDropdown(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 border-b border-gray-200 text-blue-600 font-medium"
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
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 flex items-center gap-2 ${
                              selectedPets.some(p => p.id === pet.id) ? 'bg-blue-50' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPets.some(p => p.id === pet.id)}
                              onChange={() => {}}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{pet.name}</div>
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
                
                {selectedPets.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedPets.map(pet => (
                      <div key={pet.id} className="flex items-center justify-between bg-blue-50 border border-blue-200 px-2 py-1 rounded-md text-xs">
                        <span className="font-medium text-blue-900">{pet.name}</span>
                        <button
                          type="button"
                          onClick={() => togglePetSelection(pet)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedClient && selectedPets.length > 0 && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Activity Type</label>
                    <select
                      value={formData.activityType}
                      onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                    >
                      <option value="Consultation">Consultation</option>
                      <option value="Vaccination">Vaccination</option>
                      <option value="Deworming">Deworming</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Temperature (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.0"
                      />
                    </div>
                  </div>

                  {formData.activityType === 'Consultation' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Diagnosis</label>
                        <textarea
                          value={formData.diagnosis}
                          onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                          rows="2"
                          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          placeholder="Enter diagnosis..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Treatment</label>
                        <textarea
                          value={formData.treatment}
                          onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                          rows="2"
                          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          placeholder="Enter treatment..."
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {selectedClient && selectedPets.length > 0 && (
            <div className="p-4 bg-white border-t border-gray-200">
              <button
                onClick={handleSubmit}
                className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
              >
                <FiPlus className="w-4 h-4" />
                Add Activity to {selectedPets.length} Pet(s)
              </button>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className={`${!showForm ? 'flex' : 'hidden'} lg:flex flex-1 flex-col bg-gray-50`}>
          <div className="px-6 py-3 bg-white border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Pet Activities ({activities.length})</h3>
          </div>

          <div className="flex-1 p-6 overflow-hidden flex flex-col">
            {selectedClient && selectedPets.length > 0 ? (
              <>
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">Loading activities...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-400 text-sm text-center">No activities recorded yet</p>
                  </div>
                ) : (
                  <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-auto h-full">
                      <table className="w-full text-xs">
                        <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                          <tr>
                            <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide w-8"></th>
                            <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Pet</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Date</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Activity</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide hidden md:table-cell">Details</th>
                            <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide hidden sm:table-cell">Follow-up</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {activities.map((activity) => (
                            <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-2 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedActivities.includes(activity.id)}
                                  onChange={() => toggleActivitySelection(activity.id)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <span className="font-medium text-gray-900 text-xs">{activity.petName}</span>
                              </td>
                              <td className="px-2 py-2 text-gray-700 text-xs whitespace-nowrap">
                                {new Date(activity.date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </td>
                              <td className="px-2 py-2">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {activity.activityType}
                                </span>
                                {activity.weight && (
                                  <div className="text-xs text-gray-600 mt-0.5">Wt: {activity.weight}kg</div>
                                )}
                                {activity.temperature && (
                                  <div className="text-xs text-gray-600">Temp: {activity.temperature}°C</div>
                                )}
                              </td>
                              <td className="px-2 py-2 text-xs text-gray-700 hidden md:table-cell">
                                {activity.diagnosis && <div className="mb-1">{activity.diagnosis}</div>}
                                {activity.treatment && <div className="text-gray-600">{activity.treatment}</div>}
                                {!activity.diagnosis && !activity.treatment && <span className="text-gray-400">-</span>}
                              </td>
                              <td className="px-2 py-2 text-xs text-gray-700 whitespace-nowrap hidden sm:table-cell">
                                {activity.followUpDate ? (
                                  new Date(activity.followUpDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400 text-sm text-center">Select owner and pet(s) to continue</p>
              </div>
            )}
          </div>

          {/* Continue Button - Fixed at bottom like CreatePurchaseOrder */}
          <div className="px-6 py-3 bg-white border-t border-gray-200">
            <button
              onClick={handleContinue}
              disabled={selectedActivities.length === 0}
              className="w-full px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
            >
              Continue to Medicines ({selectedActivities.length} selected)
            </button>
          </div>
        </div>
      </div>

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
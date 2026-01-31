import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiArrowLeft, FiFileText } from 'react-icons/fi'
import { getPetActivities, getConsultations, getClients } from '../firebase/services'

function PetActivityHistory() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedPet, setSelectedPet] = useState(location.state?.selectedPet || null)
  const [activities, setActivities] = useState([])
  const [consultations, setConsultations] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedPet) {
      navigate('/consultation-history')
      return
    }
    loadPetActivities()
  }, [])

  const loadPetActivities = async () => {
    setLoading(true)
    try {
      const clientsData = await getClients()
      setClients(clientsData)

      // Load pet activities
      const activitiesData = await getPetActivities(selectedPet.id)
      setActivities(activitiesData)

      // Load consultations for this pet to get medicines
      const allConsultations = await getConsultations()
      const petConsultations = allConsultations.filter(c => c.petId === selectedPet.id)
      setConsultations(petConsultations)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get medicines for a specific activity by matching date and type
  const getMedicinesForActivity = (activity) => {
    const consultation = consultations.find(c => {
      const activityDate = new Date(activity.date).toDateString()
      const consultationDate = new Date(c.dateTime).toDateString()
      return activityDate === consultationDate && c.petId === selectedPet?.id
    })
    return consultation?.medicines || []
  }

  const getOwnerName = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown'
  }

  if (!selectedPet) {
    return null
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/consultation-history')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Pet List</span>
          </button>
  
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedPet.name} - Activity History
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Owner: {getOwnerName(selectedPet.clientId)}
            </p>
          </div>
        </div>

        {/* Activity History Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : activities.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Date
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Activity/Consultation
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Diagnosis/Treatment
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Follow-up Schedule
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Medicines Used
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => {
                    const medicines = getMedicinesForActivity(activity)
                    return (
                      <tr key={activity.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2 text-xs align-top">
                          {new Date(activity.date).toLocaleDateString('en-US', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: '2-digit' 
                          })}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-xs align-top">
                          <div className="font-medium">{activity.activityType}</div>
                          {activity.weight && <div className="text-gray-600">Wt: {activity.weight}kg</div>}
                          {activity.temperature && <div className="text-gray-600">Temp: {activity.temperature}°C</div>}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-xs align-top">
                          {activity.diagnosis && <div>{activity.diagnosis}</div>}
                          {activity.treatment && <div className="mt-1">{activity.treatment}</div>}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-xs align-top">
                          {activity.followUpDate ? (
                            new Date(activity.followUpDate).toLocaleDateString('en-US', { 
                              month: '2-digit', 
                              day: '2-digit', 
                              year: '2-digit' 
                            })
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-xs align-top">
                          {medicines.length > 0 ? (
                            <div className="space-y-1">
                              {medicines.map((med, idx) => (
                                <div key={idx}>
                                  <span className="font-medium">{med.medicineName}</span>
                                  <span className="text-gray-600"> (Qty: {med.quantity})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FiFileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No activities found</p>
            </div>
          )}
        </div>
    </div>
  )
}

export default PetActivityHistory

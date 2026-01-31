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
      
      // Sort by date descending (newest first)
      const sortedActivities = activitiesData.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA
      })
      
      setActivities(sortedActivities)

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
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-300 px-6 md:px-8 py-4">
        <button
          onClick={() => navigate('/consultation-history')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
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
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
        ) : activities.length > 0 ? (
          <table className="w-full border-collapse">
            <thead className="sticky top-0">
              <tr className="bg-gray-800 text-white">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold uppercase w-24">Date</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold uppercase w-32">Activity</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold uppercase">Diagnosis/Treatment</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold uppercase w-24">Follow-up</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-bold uppercase w-48">Medicines Used</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity, index) => {
                const medicines = getMedicinesForActivity(activity)
                return (
                  <tr key={activity.id} className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                    <td className="border border-gray-300 px-3 py-2 align-top">
                      <div className="text-xs">
                        {new Date(activity.date).toLocaleDateString('en-US', { 
                          month: '2-digit', 
                          day: '2-digit', 
                          year: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 align-top">
                      <div className="text-xs font-bold">{activity.activityType}</div>
                      {activity.weight && (
                        <div className="text-xs text-gray-600">Wt: {activity.weight}kg</div>
                      )}
                      {activity.temperature && (
                        <div className="text-xs text-gray-600">Temp: {activity.temperature}°C</div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 align-top">
                      {activity.diagnosis && (
                        <div className="text-xs mb-1">{activity.diagnosis}</div>
                      )}
                      {activity.treatment && (
                        <div className="text-xs text-gray-600">{activity.treatment}</div>
                      )}
                      {!activity.diagnosis && !activity.treatment && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 align-top">
                      <div className="text-xs">
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
                    <td className="border border-gray-300 px-3 py-2 align-top">
                      {medicines.length > 0 ? (
                        <div className="space-y-1">
                          {medicines.map((med, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium">{med.medicineName}</span>
                              <span className="text-gray-600"> (Qty: {med.quantity})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <FiFileText className="w-12 h-12 mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">No activities recorded</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PetActivityHistory

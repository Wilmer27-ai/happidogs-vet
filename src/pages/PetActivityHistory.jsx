import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiArrowLeft, FiFileText } from 'react-icons/fi'
import { getPetActivities, getClients } from '../firebase/services'

function PetActivityHistory() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedPet, setSelectedPet] = useState(location.state?.selectedPet || null)
  const [activities, setActivities] = useState([])
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

      // Load pet activities - medicines are already included
      const activitiesData = await getPetActivities(selectedPet.id)
      
      // Sort by date descending (newest first)
      const sortedActivities = activitiesData.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA
      })
      
      setActivities(sortedActivities)
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

  if (!selectedPet) {
    return null
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{selectedPet.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Activity History · Owner: <span className="text-blue-600 font-medium">{getOwnerName(selectedPet.clientId)}</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/consultation-history')}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-3 md:p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <FiFileText className="w-12 h-12 mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">No activities recorded</p>
          </div>
        ) : (
          <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider border border-gray-600 w-28">Date</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider border border-gray-600 w-36">Activity</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider border border-gray-600">Diagnosis / Treatment</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider border border-gray-600 w-32 hidden sm:table-cell">Follow-up</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider border border-gray-600 w-52 hidden md:table-cell">Medicines Used</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, index) => (
                  <tr
                    key={activity.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                  >
                    <td className="px-3 py-2.5 border border-gray-200 align-top text-gray-600 whitespace-nowrap">
                      {new Date(activity.date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200 align-top">
                      <div className="font-semibold text-gray-900">{activity.activityType}</div>
                      {activity.weight && (
                        <div className="text-gray-500 mt-0.5">Wt: {activity.weight} kg</div>
                      )}
                      {activity.temperature && (
                        <div className="text-gray-500">Temp: {activity.temperature}°C</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200 align-top">
                      {activity.diagnosis && (
                        <div className="text-gray-900">{activity.diagnosis}</div>
                      )}
                      {activity.treatment && (
                        <div className="text-gray-500 mt-0.5">{activity.treatment}</div>
                      )}
                      {!activity.diagnosis && !activity.treatment && (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200 align-top hidden sm:table-cell">
                      {activity.followUpDate ? (
                        <div>
                          <p className="font-medium text-gray-900 whitespace-nowrap">
                            {new Date(activity.followUpDate).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            })}
                          </p>
                          {activity.followUpNote
                            ? <p className="text-gray-500 mt-0.5">{activity.followUpNote}</p>
                            : <p className="text-gray-400 mt-0.5">No notes</p>
                          }
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200 align-top hidden md:table-cell">
                      {activity.medicines?.length > 0 ? (
                        <div className="space-y-0.5">
                          {activity.medicines.map((med, idx) => (
                            <div key={idx}>
                              <span className="font-medium text-gray-900">{med.medicineName}</span>
                              <span className="text-gray-500"> × {med.quantity} {med.unit}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default PetActivityHistory

import { useState, useEffect } from 'react'
import { FiCalendar, FiActivity, FiThermometer, FiFileText, FiPlus } from 'react-icons/fi'
import { getPetActivities, addPetActivity } from '../../firebase/services'

function DetailsStep({ selectedClient, selectedPet, onBack, onNext, consultationData, setConsultationData }) {
  const [activities, setActivities] = useState([])
  const [selectedActivities, setSelectedActivities] = useState([])
  const [loading, setLoading] = useState(true)
  
  const getCurrentDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
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
    if (selectedPet?.id) {
      loadActivities()
    }
  }, [selectedPet])

  const loadActivities = async () => {
    try {
      const data = await getPetActivities(selectedPet.id)
      setActivities(data)
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const activityData = {
        petId: selectedPet.id,
        clientId: selectedClient.id,
        activityType: formData.activityType,
        date: formData.date,
        weight: formData.weight ? Number(formData.weight) : null,
        temperature: formData.temperature ? Number(formData.temperature) : null
      }

      // Add conditional fields based on activity type
      if (formData.activityType === 'Consultation') {
        activityData.diagnosis = formData.diagnosis
        activityData.treatment = formData.treatment
        if (formData.followUpDate) {
          activityData.followUpDate = formData.followUpDate
        }
      }

      if (formData.activityType === 'Deworming' || formData.activityType === 'Vaccination') {
        if (formData.followUpDate) {
          activityData.followUpDate = formData.followUpDate
        }
      }

      await addPetActivity(activityData)
      
      // Reload activities
      await loadActivities()
      
      // Reset form
      setFormData({
        activityType: formData.activityType,
        date: getCurrentDate(),
        weight: '',
        temperature: '',
        diagnosis: '',
        treatment: '',
        followUpDate: ''
      })

      // Store the activity data for consultation workflow
      setConsultationData(activityData)
      
      alert('Activity recorded successfully!')
    } catch (error) {
      console.error('Error saving activity:', error)
      alert('Failed to save activity. Please try again.')
    }
  }

  const handleContinue = () => {
    if (selectedActivities.length === 0) {
      alert('Please select at least one activity before continuing.')
      return
    }
    // Store selected activities in consultation data
    const selectedActivityData = activities.filter(activity => 
      selectedActivities.includes(activity.id)
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
    <div className="h-screen flex bg-gray-50">
      {/* Left: Form */}
      <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Add Activity</h2>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-4 space-y-3">
              {/* Activity Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Activity Type</label>
                <select
                  value={formData.activityType}
                  onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Deworming">Deworming</option>
                </select>
              </div>

              {/* Date & Vitals Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="5.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="38.5"
                  />
                </div>
              </div>

              {/* Consultation Fields */}
              {formData.activityType === 'Consultation' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Diagnosis</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      placeholder="Enter diagnosis..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Treatment</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.treatment}
                      onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      placeholder="Enter treatment..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Deworming/Vaccination Follow-up */}
              {(formData.activityType === 'Deworming' || formData.activityType === 'Vaccination') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="px-6 pb-3 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-xs transition-colors"
              >
                <FiPlus className="inline w-3 h-3 mr-1" /> Add Activity
              </button>
            </div>
          </form>
        </div>

        {/* Right: History */}
        <div className="w-1/2 bg-white flex flex-col">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Activity History</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : activities.length > 0 ? (
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-1.5 text-center text-xs font-medium text-gray-700 w-10">
                      ✓
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-medium text-gray-700">
                      Date
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-medium text-gray-700">
                      Activity/Consultation
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-medium text-gray-700">
                      Diagnosis/Treatment
                    </th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-medium text-gray-700">
                      Follow-up Schedule
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1.5 text-center align-top">
                        <input
                          type="checkbox"
                          checked={selectedActivities.includes(activity.id)}
                          onChange={() => toggleActivitySelection(activity.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs align-top">
                        {new Date(activity.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs align-top">
                        <div className="font-medium">{activity.activityType}</div>
                        {activity.weight && <div className="text-gray-600">Wt: {activity.weight}kg</div>}
                        {activity.temperature && <div className="text-gray-600">Temp: {activity.temperature}°C</div>}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs align-top">
                        {activity.diagnosis && <div>{activity.diagnosis}</div>}
                        {activity.treatment && <div className="mt-1">{activity.treatment}</div>}
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5 text-xs align-top">
                        {activity.followUpDate ? (
                          new Date(activity.followUpDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FiFileText className="w-12 h-12 mb-2" />
                <p className="text-sm text-gray-500">No activities yet</p>
              </div>
            )}
          </div>

          <div className="px-6 py-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleContinue}
              disabled={selectedActivities.length === 0}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Medicines →
            </button>
          </div>
        </div>
    </div>
  )
}

export default DetailsStep
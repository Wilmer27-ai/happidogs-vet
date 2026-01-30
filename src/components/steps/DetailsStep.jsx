import { useState, useEffect } from 'react'
import { FiCalendar, FiActivity, FiThermometer, FiFileText } from 'react-icons/fi'
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
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-4 py-2 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {selectedPet?.name}
            </span>
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Change Pet
            </button>
          </div>
        </div>

        {/* Split View: Form (Left) + History (Right) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Input Form */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {/* Activity Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Deworming', 'Vaccination', 'Consultation'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, activityType: type })}
                        className={`px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-colors ${
                          formData.activityType === type
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <FiCalendar className="inline w-4 h-4 mr-1" />
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <FiActivity className="inline w-4 h-4 mr-1" />
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 5.5"
                  />
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <FiThermometer className="inline w-4 h-4 mr-1" />
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 38.5"
                  />
                </div>

                {/* Conditional Fields for Consultation */}
                {formData.activityType === 'Consultation' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Diagnosis <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter diagnosis"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Treatment <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={formData.treatment}
                        onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter treatment plan"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Follow-up Date
                      </label>
                      <input
                        type="date"
                        value={formData.followUpDate}
                        onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* Conditional Fields for Deworming/Vaccination */}
                {(formData.activityType === 'Deworming' || formData.activityType === 'Vaccination') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Form Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Activity
                </button>
              </div>
            </form>
          </div>

          {/* Right Side - Activity History Table */}
          <div className="w-1/2 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-sm">Loading...</p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity, index) => (
                      <tr key={index} className="hover:bg-gray-50">
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
                          {activity.followUpDate && (
                            <div className="text-gray-600">F/U: {new Date(activity.followUpDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}</div>
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 py-1.5 text-xs align-top">
                          {activity.diagnosis && <div>{activity.diagnosis}</div>}
                          {activity.treatment && <div className="mt-1">{activity.treatment}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <FiFileText className="w-10 h-10 mb-2" />
                  <p className="text-sm">No activities yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white font-medium text-sm"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            Continue to Medicines
          </button>
        </div>
      </div>
    </div>
  )
}

export default DetailsStep
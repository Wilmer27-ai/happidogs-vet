// src/components/steps/FollowUpStep.jsx
import { useState } from 'react'
import { FiClock } from 'react-icons/fi'

function FollowUpStep({ followUpData, setFollowUpData, onBack, onNext }) {
  const [isEnabled, setIsEnabled] = useState(followUpData?.enabled || false)
  const [followUpDate, setFollowUpDate] = useState(followUpData?.date || '')
  const [followUpType, setFollowUpType] = useState(followUpData?.type || 'Check-up')

  const followUpTypes = [
    'Check-up',
    'Vaccination',
    'Laboratory Test',
    'Surgery Follow-up',
    'Medication Review',
    'Other'
  ]

  const handleSubmit = () => {
    setFollowUpData({
      enabled: isEnabled,
      date: followUpDate,
      type: followUpType
    })
    onNext()
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        <div className="p-6 flex-shrink-0 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Schedule Follow-Up</h2>
          <p className="text-sm text-gray-500">Set a reminder for the next visit</p>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
            <div className="flex items-center gap-3">
              <FiClock className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900">Enable Follow-Up Reminder</span>
            </div>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                isEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {isEnabled && (
            <div className="space-y-6">
              {/* Follow-Up Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Follow-Up Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-Up Type
                  </label>
                  <select
                    value={followUpType}
                    onChange={(e) => setFollowUpType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {followUpTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default FollowUpStep
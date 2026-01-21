import { useState } from 'react'

function DetailsStep({ selectedClient, selectedPet, onBack, onNext, consultationData, setConsultationData }) {
  const getCurrentDateTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const [formData, setFormData] = useState({
    dateTime: consultationData?.dateTime || getCurrentDateTime(),
    reasonForVisit: consultationData?.reasonForVisit || '',
    diagnosis: consultationData?.diagnosis || '',
    treatmentNotes: consultationData?.treatmentNotes || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setConsultationData(formData)
    onNext()
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-180px)]">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 truncate">
              {selectedClient?.firstName} {selectedClient?.lastName} • {selectedPet?.name}
            </p>
            <button
              type="button"
              onClick={onBack}
              className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Change
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 px-4 py-3 space-y-2.5">
          {/* Date and Time */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={formData.dateTime}
              onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reason for Visit */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Reason for Visit *
            </label>
            <textarea
              required
              value={formData.reasonForVisit}
              onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
              rows="2"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter reason..."
            />
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Diagnosis *
            </label>
            <textarea
              required
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              rows="2"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter diagnosis..."
            />
          </div>

          {/* Treatment / Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Treatment / Notes *
            </label>
            <textarea
              required
              value={formData.treatmentNotes}
              onChange={(e) => setFormData({ ...formData, treatmentNotes: e.target.value })}
              rows="3"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter treatment..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 px-4 py-3 border-t bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-white font-medium text-sm"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  )
}

export default DetailsStep
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
    <div className="max-w-5xl mx-auto h-[calc(100vh-120px)] flex items-center px-6">
      <form onSubmit={handleSubmit} className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Consultation Details</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {selectedClient?.firstName} {selectedClient?.lastName} - {selectedPet?.name}
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Change
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={formData.dateTime}
              onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason for Visit
            </label>
            <input
              type="text"
              required
              value={formData.reasonForVisit}
              onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reason for visit"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Diagnosis
            </label>
            <input
              type="text"
              required
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter diagnosis"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Treatment Plan
            </label>
            <input
              type="text"
              required
              value={formData.treatmentNotes}
              onChange={(e) => setFormData({ ...formData, treatmentNotes: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter treatment plan"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-white font-medium text-sm"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  )
}

export default DetailsStep
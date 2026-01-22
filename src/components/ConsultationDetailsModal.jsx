// src/components/ConsultationDetailsModal.jsx
import { FiX } from 'react-icons/fi'

function ConsultationDetailsModal({ consultation, isOpen, onClose }) {
  if (!isOpen || !consultation) return null

  const formatFullDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Consultation Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Date and Client */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Date</p>
              <p className="text-sm font-medium text-gray-900">{formatFullDate(consultation.dateTime)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Client</p>
              <p className="text-sm font-medium text-gray-900">{consultation.clientName}</p>
            </div>
          </div>

          {/* Pet */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Pet</p>
            <p className="text-sm font-medium text-gray-900">
              {consultation.petName} ({consultation.petSpecies || 'Pet'})
            </p>
          </div>

          {/* Reason for Visit */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Reason for Visit</p>
            <p className="text-sm text-gray-900">{consultation.reason || 'N/A'}</p>
          </div>

          {/* Diagnosis */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Diagnosis</p>
            <p className="text-sm font-medium text-gray-900">{consultation.diagnosis || 'N/A'}</p>
          </div>

          {/* Treatment */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Treatment</p>
            <p className="text-sm text-gray-900">{consultation.treatment || 'N/A'}</p>
          </div>

          {/* Medicines */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Medicines</p>
            {consultation.medicines && consultation.medicines.length > 0 ? (
              <div className="space-y-2">
                {consultation.medicines.map((med, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900">{med.quantity}x {med.medicineName}</span>
                    <span className="font-medium text-gray-900">₱{((med.price || 0) * (med.quantity || 0)).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No medicines administered</p>
            )}
          </div>

          {/* Follow-Up (if exists) */}
          {consultation.followUp?.enabled && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">Follow-Up Scheduled</p>
              <p className="text-sm text-blue-900">
                {formatFullDate(consultation.followUp.date)} • {consultation.followUp.type}
              </p>
            </div>
          )}

          {/* Total */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-blue-600">₱{consultation.totalAmount?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsultationDetailsModal
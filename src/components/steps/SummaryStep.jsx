// src/components/steps/SummaryStep.jsx
import { FiUser, FiCalendar, FiFileText, FiPackage, FiClock, FiCheck } from 'react-icons/fi'

function SummaryStep({ 
  selectedClient, 
  selectedPet, 
  consultationData, 
  medicinesData, 
  followUpData,
  onBack, 
  onSave 
}) {
  const getTotalPrice = () => {
    const medicinesTotal = medicinesData?.reduce((sum, med) => sum + ((med.sellingPrice || 0) * (med.quantity || 0)), 0) || 0
    const consultationFee = 300
    return medicinesTotal + consultationFee
  }

  const handleSave = () => {
    // This will be replaced with Firebase save
    const consultation = {
      client: selectedClient,
      pet: selectedPet,
      details: consultationData,
      medicines: medicinesData,
      followUp: followUpData,
      totalPrice: getTotalPrice(),
      date: new Date().toISOString()
    }
    console.log('Saving consultation:', consultation)
    onSave()
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] overflow-y-auto pb-20">
      <div className="space-y-4">
        {/* Client & Pet Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiUser className="w-5 h-5 text-blue-600" />
            Client & Pet Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p className="font-medium text-gray-900">
                {selectedClient?.firstName} {selectedClient?.lastName}
              </p>
              <p className="text-sm text-gray-600">{selectedClient?.phoneNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pet</p>
              <p className="font-medium text-gray-900">{selectedPet?.name}</p>
              <p className="text-sm text-gray-600">
                {selectedPet?.species} • {selectedPet?.breed} • {selectedPet?.age} years
              </p>
            </div>
          </div>
        </div>

        {/* Consultation Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiFileText className="w-5 h-5 text-blue-600" />
            Consultation Details
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium text-gray-900">{consultationData?.dateTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Reason for Visit</p>
              <p className="font-medium text-gray-900">{consultationData?.reason || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Diagnosis</p>
              <p className="font-medium text-gray-900">{consultationData?.diagnosis || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Treatment Plan</p>
              <p className="font-medium text-gray-900">{consultationData?.treatment || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Medicines */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiPackage className="w-5 h-5 text-blue-600" />
            Medicines Administered
          </h3>
          {medicinesData && medicinesData.length > 0 ? (
            <div className="space-y-2">
              {medicinesData.map(med => (
                <div key={med.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{med.medicineName || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Quantity: {med.quantity || 0}</p>
                  </div>
                  <p className="font-semibold text-gray-900">₱{((med.sellingPrice || 0) * (med.quantity || 0)).toLocaleString()}</p>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-3">
                <p className="font-medium text-gray-700">Medicines Subtotal</p>
                <p className="font-bold text-gray-900">
                  ₱{medicinesData.reduce((sum, med) => sum + ((med.sellingPrice || 0) * (med.quantity || 0)), 0).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No medicines administered</p>
          )}
        </div>

        {/* Follow-Up */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiClock className="w-5 h-5 text-blue-600" />
            Follow-Up Schedule
          </h3>
          {followUpData?.enabled ? (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{followUpData.type}</p>
                <p className="text-sm text-gray-600">{followUpData.date}</p>
              </div>
              <FiCheck className="w-5 h-5 text-blue-600" />
            </div>
          ) : (
            <p className="text-sm text-gray-500">No follow-up scheduled</p>
          )}
        </div>

        {/* Total */}
        <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-gray-700">
              <span>Consultation Fee</span>
              <span className="font-medium">₱300</span>
            </div>
            <div className="flex items-center justify-between text-gray-700">
              <span>Medicines</span>
              <span className="font-medium">
                ₱{(medicinesData?.reduce((sum, med) => sum + ((med.sellingPrice || 0) * (med.quantity || 0)), 0) || 0).toLocaleString()}
              </span>
            </div>
            <div className="border-t-2 border-blue-200 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">₱{getTotalPrice().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fixed Actions */}
      <div className="fixed bottom-0 left-0 lg:left-72 right-0 bg-white border-t border-gray-200 p-4 lg:p-6 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
          >
            Back
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            <FiCheck className="w-4 h-4" />
            Save Consultation
          </button>
        </div>
      </div>
    </div>
  )
}

export default SummaryStep
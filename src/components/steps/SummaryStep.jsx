// src/components/steps/SummaryStep.jsx
import { FiPrinter } from 'react-icons/fi'

function SummaryStep({ 
  selectedClient, 
  selectedPets,
  consultationData, 
  medicinesData, 
  onBack, 
  onSave 
}) {
  const getTotalPrice = () => {
    const medicinesTotal = medicinesData?.reduce((sum, med) => sum + ((med.sellingPrice || 0) * (med.quantity || 0)), 0) || 0
    const consultationFee = 300 * (selectedPets?.length || 1)
    return medicinesTotal + consultationFee
  }

  const handleSave = () => {
    const consultation = {
      client: selectedClient,
      pets: selectedPets,
      details: consultationData,
      medicines: medicinesData,
      totalPrice: getTotalPrice(),
      date: new Date().toISOString()
    }
    console.log('Saving consultation:', consultation)
    onSave()
  }

  const handlePrint = () => {
    window.print()
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    })
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Main Content - Medical Record Format */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-md border border-gray-200">
          
          {/* Header - Green Bar */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-6 py-3 rounded-t-md flex justify-between items-center">
            <div>
              <h1 className="text-base font-bold">Patient Visit Summary</h1>
              <p className="text-xs mt-1">
                {selectedPets?.[0]?.name} ({selectedPets?.length} pet{selectedPets?.length > 1 ? 's' : ''}) • {getCurrentDate()}
              </p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold">Happi Dogs Veterinary Clinic</p>
              <p className="mt-0.5">Metro Manila, Philippines</p>
              <p>(123) 456-7890</p>
            </div>
          </div>

          {/* Patient Info Section */}
          <div className="grid grid-cols-2 gap-6 px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div>
              <p className="text-sm font-bold text-gray-900">{selectedPets?.map(p => p.name).join(', ')}</p>
              <p className="text-xs text-gray-600 mt-1">DOB: {selectedPets?.[0]?.dateOfBirth ? new Date(selectedPets[0].dateOfBirth).toLocaleDateString('en-US') : 'N/A'}</p>
              <p className="text-xs text-gray-600">Sex: {selectedPets?.[0]?.gender || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">Owner: {selectedClient?.firstName} {selectedClient?.lastName}</p>
              <p className="text-xs text-gray-600 mt-1">Contact: {selectedClient?.phoneNumber || 'N/A'}</p>
            </div>
          </div>

          {/* Visit Summary Section */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900 mb-2">Visit Summary for {getCurrentDate()}</h2>
            <div className="text-xs text-gray-700">
              <p><span className="font-semibold">Owner:</span> {selectedClient?.firstName} {selectedClient?.lastName}</p>
            </div>
          </div>

          {/* Chief Complaint */}
          {consultationData && consultationData.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Chief Complaint</h2>
              <div className="space-y-2">
                {consultationData.map((activity, index) => (
                  <div key={index} className="bg-blue-50 rounded-md px-3 py-2 border border-blue-100">
                    <p className="text-xs text-gray-800">{activity.diagnosis || activity.activityType}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vitals */}
          {consultationData && consultationData.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Vitals</h2>
              <div className="grid grid-cols-2 gap-4">
                {consultationData.map((activity, index) => (
                  <div key={index} className="bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
                    {activity.weight && (
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">Weight:</span> {activity.weight} kg
                      </p>
                    )}
                    {activity.temperature && (
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">Temperature:</span> {activity.temperature}°F
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Findings */}
          {consultationData && consultationData.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Clinical Findings & Treatment</h2>
              <div className="space-y-3">
                {consultationData.map((activity, index) => (
                  <div key={index} className="bg-gray-50 rounded-md px-4 py-3 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-900 mb-2">
                      {activity.petName} • {new Date(activity.date).toLocaleDateString('en-US')}
                    </p>
                    <div className="ml-3 space-y-1">
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">Activity:</span> {activity.activityType}
                      </p>
                      {activity.diagnosis && (
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Diagnosis:</span> {activity.diagnosis}
                        </p>
                      )}
                      {activity.treatment && (
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Treatment:</span> {activity.treatment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medications */}
          {medicinesData && medicinesData.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Medications Prescribed</h2>
              <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">Medicine</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide">Quantity</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">Price</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {medicinesData.map((med, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 text-gray-900">{med.medicineName}</td>
                        <td className="px-3 py-2 text-center text-gray-700">{med.quantity} {med.unit}</td>
                        <td className="px-3 py-2 text-right text-gray-700">₱{(med.sellingPrice || 0).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">₱{((med.sellingPrice || 0) * (med.quantity || 0)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Plan */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900 mb-2">Plan</h2>
            <div className="bg-yellow-50 rounded-md px-3 py-2 border border-yellow-200">
              <p className="text-xs text-gray-800">Follow-up consultation recommended in 7-14 days</p>
            </div>
          </div>

          {/* Billing Summary */}
          <div className="px-6 py-4">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Billing Summary</h2>
            <div className="bg-gray-50 rounded-md px-4 py-3 border border-gray-200">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-700">
                  <span>Professional Fee (Consultation × {selectedPets?.length || 0})</span>
                  <span className="font-medium">₱{(300 * (selectedPets?.length || 1)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Medications</span>
                  <span className="font-medium">₱{(medicinesData?.reduce((sum, med) => sum + ((med.sellingPrice || 0) * (med.quantity || 0)), 0) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-gray-300 text-gray-900">
                  <span>TOTAL AMOUNT DUE</span>
                  <span className="text-green-600">₱{getTotalPrice().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Green Bar */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-6 py-2 rounded-b-md text-center">
            <p className="text-xs">Happi Dogs Veterinary Clinic • {getCurrentDate()} • Page 1 of 1</p>
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 print:hidden">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button
            onClick={onBack}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FiPrinter className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            Save & Complete Consultation
          </button>
        </div>
      </div>
    </div>
  )
}

export default SummaryStep
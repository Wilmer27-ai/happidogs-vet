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
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Main Content - A4 Page Display */}
      <div className="flex-1 overflow-auto p-8 print:p-0 print:overflow-visible">
        {/* A4 Page Container */}
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none print:max-w-none" style={{ minHeight: '297mm' }}>
          <div className="p-16 print:p-12">
            
            {/* Hospital Header */}
            <div className="text-center pb-4 mb-2">
              <h1 className="text-2xl font-bold uppercase tracking-wide">Happi Dogs Veterinary Clinic</h1>
              <p className="text-sm mt-1">Pob. Ilaya Lambunao, Iloilo</p>
              <p className="text-sm">Tel: (123) 456-7890</p>
            </div>

       
            {/* Patient Information */}
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Patient Information</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="font-semibold">Patient Name:</span> {selectedPets?.map(p => p.name).join(', ')}
                </div>
                <div>
                  <span className="font-semibold">Owner Name:</span> {selectedClient?.firstName} {selectedClient?.lastName}
                </div>
                <div>
                  <span className="font-semibold">Species:</span> {selectedPets?.[0]?.species || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold">Contact Number:</span> {selectedClient?.phoneNumber || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold">Date of Birth:</span> {selectedPets?.[0]?.dateOfBirth ? new Date(selectedPets[0].dateOfBirth).toLocaleDateString('en-US') : 'N/A'}
                </div>
                <div>
                  <span className="font-semibold">Gender:</span> {selectedPets?.[0]?.gender || 'N/A'}
                </div>
              </div>
            </div>

            {/* Vitals */}
            {consultationData && consultationData.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Vital Signs</h3>
                {consultationData.map((activity, index) => (
                  <div key={index} className="grid grid-cols-2 gap-x-8 text-sm mb-2">
                    {activity.weight && (
                      <div>
                        <span className="font-semibold">Weight:</span> {activity.weight} kg
                      </div>
                    )}
                    {activity.temperature && (
                      <div>
                        <span className="font-semibold">Temperature:</span> {activity.temperature}°C
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Chief Complaint & Diagnosis */}
            {consultationData && consultationData.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Chief Complaint & Diagnosis</h3>
                {consultationData.map((activity, index) => (
                  <div key={index} className="mb-4 text-sm">
                    <div className="mb-2">
                      <span className="font-semibold">Activity Type:</span> {activity.activityType}
                    </div>
                    {activity.diagnosis && (
                      <div className="mb-2">
                        <span className="font-semibold">Diagnosis:</span> 
                        <div className="break-words">{activity.diagnosis}</div>
                      </div>
                    )}
                    {activity.treatment && (
                      <div className="mb-2">
                        <span className="font-semibold">Treatment Plan:</span>
                        <div className="break-words">{activity.treatment}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Medications Prescribed */}
            {medicinesData && medicinesData.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Medications Prescribed</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="text-left py-2 font-semibold">Medicine Name</th>
                      <th className="text-center py-2 font-semibold">Quantity</th>
                      <th className="text-right py-2 font-semibold">Unit Price</th>
                      <th className="text-right py-2 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicinesData.map((med, index) => (
                      <tr key={index} className="border-b border-gray-300">
                        <td className="py-2">{med.medicineName}</td>
                        <td className="text-center py-2">{med.quantity} {med.unit}</td>
                        <td className="text-right py-2">₱{(med.sellingPrice || 0).toLocaleString()}</td>
                        <td className="text-right py-2">₱{((med.sellingPrice || 0) * (med.quantity || 0)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Billing Summary */}
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Billing Summary</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Professional Fee (Consultation × {selectedPets?.length || 0})</span>
                  <span>₱{(300 * (selectedPets?.length || 1)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medications</span>
                  <span>₱{(medicinesData?.reduce((sum, med) => sum + ((med.sellingPrice || 0) * (med.quantity || 0)), 0) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t-2 border-black pt-2 mt-2">
                  <span>TOTAL AMOUNT DUE</span>
                  <span>₱{getTotalPrice().toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Follow-up Recommendations */}
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Recommendations</h3>
              <p className="text-sm">Follow-up consultation recommended in 7-14 days</p>
            </div>

            {/* Veterinarian Signature */}
            <div className="mt-12 mb-6">
              <div className="grid grid-cols-2 gap-8">
                <div></div>
                <div>
                  <div className="border-t border-black pt-2 text-center">
                    <p className="text-sm font-semibold">Attending Veterinarian</p>
                    <p className="text-xs mt-1">License No: _______________</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs border-t border-gray-300 pt-4 mt-8">
              <p>This is a computer-generated document. No signature is required.</p>
              <p className="mt-1">Page 1 of 1</p>
            </div>

          </div>
        </div>
      </div>

      {/* Action Buttons - Hidden when printing */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 print:hidden">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button
            onClick={onBack}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
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

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default SummaryStep
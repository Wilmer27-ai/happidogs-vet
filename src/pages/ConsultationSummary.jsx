import { useLocation, useNavigate } from 'react-router-dom'
import { FiPrinter, FiArrowLeft } from 'react-icons/fi'

function ConsultationSummary() {
  const location = useLocation()
  const navigate = useNavigate()
  const consultation = location.state?.consultation

  if (!consultation) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">No consultation data found</p>
          <button
            onClick={() => navigate('/consultation-history')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Consultations
          </button>
        </div>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
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

            {/* Date */}
            <div className="text-right text-sm mb-6">
              <p>Date: {formatDate(consultation.date)}</p>
            </div>

            {/* Patient Information */}
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Patient Information</h3>
              <div className="text-sm space-y-3">
                <div className="grid grid-cols-2 gap-x-8">
                  <div>
                    <span className="font-semibold">Owner Name:</span> {consultation.clientName}
                  </div>
                  <div>
                    <span className="font-semibold">Pet Name:</span> {consultation.petName}
                  </div>
                </div>
              </div>
            </div>

            {/* Vitals */}
            {(consultation.weight || consultation.temperature) && (
              <div className="mb-6">
                <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Vital Signs</h3>
                <div className="grid grid-cols-2 gap-x-8 text-sm">
                  {consultation.weight && (
                    <div>
                      <span className="font-semibold">Weight:</span> {consultation.weight} kg
                    </div>
                  )}
                  {consultation.temperature && (
                    <div>
                      <span className="font-semibold">Temperature:</span> {consultation.temperature}°C
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chief Complaint & Diagnosis */}
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Chief Complaint & Diagnosis</h3>
              <div className="text-sm space-y-2">
                <div>
                  <span className="font-semibold">Activity Type:</span> {consultation.activityType}
                </div>
                {consultation.diagnosis && (
                  <div>
                    <span className="font-semibold">Diagnosis:</span>
                    <div className="break-words mt-1">{consultation.diagnosis}</div>
                  </div>
                )}
                {consultation.treatment && (
                  <div>
                    <span className="font-semibold">Treatment Plan:</span>
                    <div className="break-words mt-1">{consultation.treatment}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Medications Prescribed */}
            {consultation.medicines && consultation.medicines.length > 0 && (
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
                    {consultation.medicines.map((med, index) => (
                      <tr key={index} className="border-b border-gray-300">
                        <td className="py-2">{med.medicineName}</td>
                        <td className="text-center py-2">{med.quantity} {med.unit}</td>
                        <td className="text-right py-2">₱{(med.price || 0).toLocaleString()}</td>
                        <td className="text-right py-2">₱{((med.price || 0) * (med.quantity || 0)).toLocaleString()}</td>
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
                  <span>Professional Fee (Consultation)</span>
                  <span>₱{(consultation.consultationFee || 300).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medications</span>
                  <span>₱{(consultation.medicineCost || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t-2 border-black pt-2 mt-2">
                  <span>TOTAL AMOUNT</span>
                  <span>₱{(consultation.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Follow-up */}
            {consultation.followUpDate && (
              <div className="mb-6">
                <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-3">Follow-up</h3>
                <p className="text-sm">Next visit: {formatDate(consultation.followUpDate)}</p>
              </div>
            )}

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
            onClick={() => navigate('/consultation-history')}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to List
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FiPrinter className="w-4 h-4" />
            Print
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

export default ConsultationSummary
// src/components/steps/SummaryStep.jsx
import { FiUser, FiActivity, FiPackage, FiDollarSign } from 'react-icons/fi'

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

  return (
    <div className="h-screen flex flex-col bg-white">
     

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
        <div className="space-y-6">
          {/* Client & Pets Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client */}
            <div>
              <h3 className="text-xs font-bold text-gray-600 uppercase mb-2">Client</h3>
              <p className="text-lg font-semibold text-gray-900">
                {selectedClient?.firstName} {selectedClient?.lastName}
              </p>

            </div>

            {/* Pets */}
            <div>
              <h3 className="text-xs font-bold text-gray-600 uppercase mb-2">
                Pet{selectedPets?.length > 1 ? 's' : ''} ({selectedPets?.length || 0})
              </h3>
              <div className="space-y-1">
                {selectedPets?.map((pet, index) => (
                  <div key={index}>
                    <p className="text-sm font-medium text-gray-900">{pet.name}</p>
                    <p className="text-xs text-gray-500">{pet.species} • {pet.breed}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activities Table */}
          {consultationData && consultationData.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-600 uppercase mb-3">Activities</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="text-left text-xs font-bold text-gray-700 uppercase py-3 px-4">Pet</th>
                      <th className="text-left text-xs font-bold text-gray-700 uppercase py-3 px-4">Date</th>
                      <th className="text-left text-xs font-bold text-gray-700 uppercase py-3 px-4">Activity</th>
                      <th className="text-left text-xs font-bold text-gray-700 uppercase py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {consultationData.map((activity, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{activity.petName}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(activity.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-semibold text-gray-900">{activity.activityType}</div>
                          {(activity.weight || activity.temperature) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {activity.weight && <span>Wt: {activity.weight}kg</span>}
                              {activity.weight && activity.temperature && <span> | </span>}
                              {activity.temperature && <span>Temp: {activity.temperature}°C</span>}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {activity.diagnosis && <div className="mb-1">{activity.diagnosis}</div>}
                          {activity.treatment && <div className="text-gray-500">{activity.treatment}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Medicines Table */}
          {medicinesData && medicinesData.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-600 uppercase mb-3">Medicines</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="text-left text-xs font-bold text-gray-700 uppercase py-3 px-4">Medicine</th>
                      <th className="text-center text-xs font-bold text-gray-700 uppercase py-3 px-4">Qty</th>
                      <th className="text-right text-xs font-bold text-gray-700 uppercase py-3 px-4">Price</th>
                      <th className="text-right text-xs font-bold text-gray-700 uppercase py-3 px-4">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {medicinesData.map(med => (
                      <tr key={med.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{med.medicineName}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 text-center">{med.quantity}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 text-right">₱{(med.sellingPrice || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">
                          ₱{((med.sellingPrice || 0) * (med.quantity || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="border-t-2 border-gray-300 pt-6">
            <h3 className="text-xs font-bold text-gray-600 uppercase mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">
                  Consultation Fee ({selectedPets?.length || 0} pet{selectedPets?.length > 1 ? 's' : ''})
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  ₱{(300 * (selectedPets?.length || 1)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Medicines Total</span>
                <span className="text-sm font-semibold text-gray-900">
                  ₱{(medicinesData?.reduce((sum, med) => sum + ((med.sellingPrice || 0) * (med.quantity || 0)), 0) || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 bg-blue-50 px-6 py-4 -mx-6 md:-mx-8">
                <span className="text-lg md:text-xl font-bold text-gray-900">TOTAL</span>
                <span className="text-2xl md:text-3xl font-bold text-blue-600">
                  ₱{getTotalPrice().toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t border-gray-300 px-6 md:px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onBack}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm"
          >
            Back
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
          >
            Save Consultation
          </button>
        </div>
      </div>
    </div>
  )
}

export default SummaryStep
// ConsultationHistory.jsx
import { useState, useEffect } from 'react'
import { FiEye } from 'react-icons/fi'
import { getConsultations } from '../firebase/services'

function ConsultationHistory() {
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConsultations()
  }, [])

  const loadConsultations = async () => {
    try {
      const data = await getConsultations()
      setConsultations(data)
    } catch (error) {
      console.error('Error loading consultations:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Consultation History</h1>
        <p className="text-gray-500 mt-1">View all past consultations</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Loading consultations...</p>
          </div>
        ) : consultations.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No consultations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pet</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Diagnosis</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {consultations.map((consultation) => (
                  <tr key={consultation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{consultation.dateTime}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{consultation.clientName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{consultation.petName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{consultation.diagnosis}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">₱{consultation.totalAmount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-700">
                        <FiEye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConsultationHistory
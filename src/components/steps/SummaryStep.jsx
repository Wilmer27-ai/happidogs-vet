// src/components/steps/SummaryStep.jsx
import { useState } from 'react'
import { FiPrinter, FiArrowLeft } from 'react-icons/fi'
import { savePetActivity, saveConsultationSession, deductMedicineStock, saveSalesRecord, getMedicines } from '../../firebase/services'
import { useNavigate } from 'react-router-dom'

function SummaryStep({ selectedClient, selectedPets, consultationData, medicinesData, onBack, onSave }) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const getMedicinesForPet = (petId) =>
    (medicinesData || []).filter(m => m.petId === petId || !m.petId)

  const medicinesTotal = (medicinesData || []).reduce((sum, med) =>
    sum + ((med.pricePerUnit ?? med.sellingPrice ?? 0) * (med.quantity || 0)), 0)
  const consultationFee = 300 * (consultationData?.length || 0)
  const totalAmount = medicinesTotal + consultationFee

  const handleSave = async () => {
    setSaving(true)
    try {
      const consultationId = crypto.randomUUID()
      const date = new Date().toISOString()

      // 1) Save each pet activity
      await Promise.all(
        consultationData.map(async (activity) => {
          const petMedicines = (medicinesData || []).filter(m => m.petId === activity.petId || !m.petId)
          await savePetActivity({
            consultationId, date,
            petId: activity.petId,
            petName: activity.petName,
            clientId: selectedClient?.id,
            clientName: `${selectedClient?.firstName} ${selectedClient?.lastName}`,
            activityType: activity.activityType,
            weight: activity.weight || null,
            temperature: activity.temperature || null,
            diagnosis: activity.diagnosis || null,
            treatment: activity.treatment || null,
            followUpDate: activity.followUpDate || null,
            followUpNote: activity.followUpNote || null,
            medicines: petMedicines.map(m => ({
              medicineId: m.medicineId || m.id,
              medicineName: m.medicineName,
              quantity: m.quantity,
              unit: m.sellUnit ?? m.unit,
              pricePerUnit: m.pricePerUnit ?? m.sellingPrice ?? 0
            }))
          })
        })
      )

      // 2) Save consultation session record
      await saveConsultationSession(consultationId, {
        clientId: selectedClient?.id,
        clientName: `${selectedClient?.firstName} ${selectedClient?.lastName}`,
        date,
        petIds: consultationData.map(a => a.petId)
      })

      // 3) Deduct medicine stocks
      if (medicinesData && medicinesData.length > 0) {
        // Get latest medicine data for accurate stock values
        const allMedicines = await getMedicines()

        // Aggregate same medicine across all pets to avoid double deduction
        const aggregated = {}
        medicinesData.forEach(m => {
          const key = m.medicineId || m.id
          if (!aggregated[key]) {
            aggregated[key] = { ...m, totalQty: 0 }
          }
          aggregated[key].totalQty += m.quantity || 0
        })

        await Promise.all(
          Object.values(aggregated).map(async (med) => {
            const medicineId = med.medicineId || med.id
            const freshMed = allMedicines.find(m => m.id === medicineId)
            if (!freshMed) return
            await deductMedicineStock(
              medicineId,
              med.totalQty,
              med.sellUnit ?? med.unit,
              freshMed
            )
          })
        )
      }

      // 4) Save sales record for reports & dashboard
      const saleItems = (medicinesData || []).map(m => ({
        medicineId: m.medicineId || m.id,
        medicineName: m.medicineName,
        quantity: m.quantity,
        unit: m.sellUnit ?? m.unit,
        pricePerUnit: m.pricePerUnit ?? m.sellingPrice ?? 0,
        subtotal: (m.pricePerUnit ?? m.sellingPrice ?? 0) * (m.quantity || 0)
      }))

      await saveSalesRecord({
        consultationId,
        clientId: selectedClient?.id,
        clientName: `${selectedClient?.firstName} ${selectedClient?.lastName}`,
        date,
        type: 'consultation',
        consultationFee,
        medicinesTotal,
        totalAmount,
        petCount: consultationData?.length || 0,
        petNames: consultationData?.map(a => a.petName) || [],
        activityTypes: [...new Set(consultationData?.map(a => a.activityType) || [])],
        items: saleItems
      })

      onSave?.()
      navigate('/consultation-history')
    } catch (e) {
      console.error('Failed to save:', e)
      alert('Failed to save consultation.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* Toolbar — hidden on print */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 print:hidden flex-shrink-0">
        <button onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
          <FiArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
          <FiPrinter className="w-3.5 h-3.5" /> Print
        </button>
        <button onClick={handleSave} disabled={saving}
          className="ml-auto px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
          {saving ? 'Saving...' : 'Save & Complete'}
        </button>
      </div>

      {/* Scrollable area */}
      <div className="flex-1 overflow-auto py-6 px-4 print:p-0 print:overflow-visible">

        {/* A4 Paper */}
        <div className="bg-white mx-auto shadow print:shadow-none print:mx-0"
          style={{ width: '100%', maxWidth: '720px' }}>
          <div className="px-12 py-10 print:px-16 print:py-12">

            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold uppercase tracking-widest text-gray-900">Happi Dogs Veterinary Clinic</h1>
              <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                <p>Pob. Ilaya Lambunao, Iloilo</p>
                <p>Tel: (123) 456-7890</p>
              </div>
              <div className="mt-3 border-t-2 border-b border-gray-900 py-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-700">Official Receipt / Clinical Record</p>
              </div>
            </div>

            {/* Client Info Row */}
            <div className="flex justify-between text-xs mb-6 gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex gap-1">
                  <span className="text-gray-500 w-16 flex-shrink-0">Owner:</span>
                  <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 flex-1">
                    {selectedClient?.firstName} {selectedClient?.lastName}
                  </span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-500 w-16 flex-shrink-0">No. of Pets:</span>
                  <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 flex-1">
                    {consultationData?.length}
                  </span>
                </div>
              </div>
              <div className="space-y-1 text-right">
                <div className="flex gap-1 justify-end">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 min-w-[120px] text-left pl-1">
                    {formatDate(new Date().toISOString())}
                  </span>
                </div>
              </div>
            </div>

            {/* Per Pet Section */}
            {consultationData?.map((activity, index) => {
              const petMeds = getMedicinesForPet(activity.petId)
              const petMedsTotal = petMeds.reduce((sum, m) =>
                sum + ((m.pricePerUnit ?? 0) * (m.quantity || 0)), 0)

              return (
                <div key={index} className="mb-5">
                  {/* Pet name bar */}
                  <div className="flex items-center gap-3 bg-gray-900 text-white px-3 py-1.5 text-xs">
                    <span className="font-bold uppercase tracking-wider">{activity.petName}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-300">{activity.activityType}</span>
                    {(activity.weight || activity.temperature) && (
                      <>
                        <span className="text-gray-300">·</span>
                        {activity.weight && <span className="text-gray-300">Wt: {activity.weight} kg</span>}
                        {activity.temperature && <span className="text-gray-300 ml-2">Temp: {activity.temperature}°C</span>}
                      </>
                    )}
                  </div>

                  {/* Diagnosis / Treatment */}
                  {(activity.diagnosis || activity.treatment) && (
                    <div className="border border-t-0 border-gray-300 px-3 py-2 text-xs space-y-1">
                      {activity.diagnosis && (
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-20 flex-shrink-0">Diagnosis:</span>
                          <span className="text-gray-900">{activity.diagnosis}</span>
                        </div>
                      )}
                      {activity.treatment && (
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-20 flex-shrink-0">Treatment:</span>
                          <span className="text-gray-900">{activity.treatment}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Medicines table */}
                  {petMeds.length > 0 && (
                    <table className="w-full border border-t-0 border-gray-300 text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-300">
                          <th className="px-3 py-1.5 text-left font-semibold text-gray-700">Medicine</th>
                          <th className="px-3 py-1.5 text-center font-semibold text-gray-700">Qty</th>
                          <th className="px-3 py-1.5 text-right font-semibold text-gray-700">Unit Price</th>
                          <th className="px-3 py-1.5 text-right font-semibold text-gray-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {petMeds.map((med, i) => (
                          <tr key={i} className="border-b border-gray-200">
                            <td className="px-3 py-1.5 text-gray-900">{med.medicineName}</td>
                            <td className="px-3 py-1.5 text-center text-gray-700">{med.quantity} {med.sellUnit ?? med.unit}</td>
                            <td className="px-3 py-1.5 text-right text-gray-700">₱{(med.pricePerUnit ?? 0).toLocaleString()}</td>
                            <td className="px-3 py-1.5 text-right font-medium text-gray-900">₱{((med.pricePerUnit ?? 0) * (med.quantity || 0)).toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td colSpan="3" className="px-3 py-1.5 text-right text-gray-500 text-xs">Medicines subtotal</td>
                          <td className="px-3 py-1.5 text-right font-semibold text-gray-900">₱{petMedsTotal.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {/* Follow-up */}
                  {activity.followUpDate && (
                    <div className="border border-t-0 border-gray-300 px-3 py-1.5 text-xs text-gray-600 bg-gray-50">
                      <span className="font-medium text-gray-700">Follow-up:</span> {formatDate(activity.followUpDate)}
                      {activity.followUpNote && <span className="ml-2 text-gray-500">— {activity.followUpNote}</span>}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Billing Summary */}
            <div className="mt-2 border border-gray-300">
              <div className="bg-gray-900 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-widest">
                Billing Summary
              </div>
              <div className="px-3 py-2 text-xs space-y-1.5">
                <div className="flex justify-between text-gray-600">
                  <span>Professional Fee (₱300 × {consultationData?.length} {consultationData?.length > 1 ? 'pets' : 'pet'})</span>
                  <span>₱{consultationFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Medications</span>
                  <span>₱{medicinesTotal.toLocaleString()}</span>
                </div>
              </div>
              <div className="border-t-2 border-gray-900 px-3 py-2 flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wide text-gray-900">Total Amount Due</span>
                <span className="text-base font-bold text-gray-900">₱{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Signature line */}
            <div className="mt-12 flex justify-end print:mt-14">
              <div className="text-center w-52">
                <div className="border-t-2 border-gray-900 pt-2">
                  <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Attending Veterinarian</p>
                  <p className="text-xs text-gray-500 mt-1">PRC License No.: _______________</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-3 border-t border-gray-300 text-center text-xs text-gray-400">
              This is a computer-generated document. Thank you for trusting Happi Dogs Veterinary Clinic.
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0; background: white; }
          @page { size: A4; margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default SummaryStep
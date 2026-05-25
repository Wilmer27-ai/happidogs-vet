import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiPrinter, FiArrowLeft } from 'react-icons/fi'
import ConsultationReceiptPrint from '../components/ConsultationReceiptPrint'
import PrintStyles from '../components/PrintStyles'
import { getMasterData, MASTER_DATA_DEFAULTS } from '../firebase/services'

function ConsultationSummary() {
  const location = useLocation()
  const navigate = useNavigate()
  const group = location.state?.group
  const autoPrint = location.state?.autoPrint
  const [clinicName, setClinicName] = useState(MASTER_DATA_DEFAULTS.clinicName)
  const [clinicAddress, setClinicAddress] = useState(MASTER_DATA_DEFAULTS.clinicAddress)
  const [clinicPhone, setClinicPhone] = useState(MASTER_DATA_DEFAULTS.clinicPhone)
  const [attendingVeterinarian, setAttendingVeterinarian] = useState(MASTER_DATA_DEFAULTS.attendingVeterinarian)

  useEffect(() => {
    getMasterData().then((data) => {
      if (data?.clinicName) setClinicName(data.clinicName)
      if (data?.clinicAddress) setClinicAddress(data.clinicAddress)
      if (data?.clinicPhone) setClinicPhone(data.clinicPhone)
      setAttendingVeterinarian(data?.attendingVeterinarian ?? MASTER_DATA_DEFAULTS.attendingVeterinarian)
    })
  }, [])

  useEffect(() => {
    if (!autoPrint) return
    const timer = window.setTimeout(() => window.print(), 100)
    return () => window.clearTimeout(timer)
  }, [autoPrint])

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-300">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No consultation data found</p>
          <button onClick={() => navigate('/consultation-history')}
            className="mt-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700">
            Back to Consultations
          </button>
        </div>
      </div>
    )
  }

  const activities = group.activities || []
  const clientName = group.clientName || 'Unknown'
  const date = group.date || group.createdAt || ''

  if (activities.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-300">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 print:hidden flex-shrink-0">
          <button onClick={() => navigate('/consultation-history')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm font-medium">No activity details available</p>
            <p className="text-gray-400 text-xs mt-1">
              This consultation was saved before the new format — detailed data is not available.
            </p>
            <button onClick={() => navigate('/consultation-history')}
              className="mt-4 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700">
              Back to History
            </button>
          </div>
        </div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const parts = String(dateString).split('T')[0].split('-')
    if (parts.length === 3) {
      const [year, month, day] = parts
      return new Date(Number(year), Number(month) - 1, Number(day))
        .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  // ── Use saved totals from group (respects edited values) ──
  const consultationFee = group.consultationFee ?? 0
  const medicinesTotal = group.medicinesTotal ?? 0
  const totalAmount = group.totalAmount ?? (consultationFee + medicinesTotal)
  const isCustomTotal = group.isCustomTotal ?? false

  const receiptNo = group.consultationId
    ? `HDV-${(date || '').replace(/-/g, '').slice(0, 8)}-${group.consultationId.slice(-4).toUpperCase()}`
    : 'N/A'

  // ── Unique pets ──
  const uniquePetIds = [...new Set(activities.map(a => a.petId))]
  const groupedByPet = uniquePetIds.map(petId => {
    const acts = activities.filter(a => a.petId === petId)
    return { petId, petName: acts[0]?.petName || '', activities: acts }
  })
  const uniquePetCount = groupedByPet.length

  const hasFollowUp = activities.some(a => a.followUpDate)

  // ── Build table rows (same logic as SummaryStep) ──
  const buildRows = (group) => {
    const rows = []
    group.activities.forEach((activity, aIndex) => {
      const petMeds = (activity.medicines || []).map(m => ({
        ...m,
        pricePerUnit: m.pricePerUnit ?? m.price ?? 0,
      }))
      const detailParts = []
      if (activity.weight) detailParts.push({ label: 'Weight', value: `${activity.weight} kg` })
      if (activity.temperature) detailParts.push({ label: 'Temp', value: `${activity.temperature}°C` })
      if (activity.diagnosis) detailParts.push({ label: 'Diagnosis', value: activity.diagnosis })
      if (activity.treatment) detailParts.push({ label: 'Treatment', value: activity.treatment })
      if (activity.note) detailParts.push({ label: 'Note', value: activity.note })
      if (activity.followUpDate) detailParts.push({ label: 'Follow-up', value: formatDate(activity.followUpDate) })

      if (petMeds.length === 0) {
        rows.push({
          key: `${activity.petActivityId || aIndex}-nomeds`,
          isFirstInGroup: aIndex === 0,
          isFirstInActivity: true,
          petName: group.petName,
          activityType: activity.activityType,
          detailParts,
          med: null,
          activityMedCount: 1,
        })
      } else {
        petMeds.forEach((med, mIndex) => {
          rows.push({
            key: `${activity.petActivityId || aIndex}-${mIndex}`,
            isFirstInGroup: aIndex === 0 && mIndex === 0,
            isFirstInActivity: mIndex === 0,
            petName: group.petName,
            activityType: activity.activityType,
            detailParts: mIndex === 0 ? detailParts : [],
            med,
            activityMedCount: petMeds.length,
          })
        })
      }
    })
    return rows
  }

  return (
    <div className="consultation-summary min-h-screen flex flex-col bg-gray-300">

      {/* ── Toolbar ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-2 print:hidden flex-shrink-0">
        <button onClick={() => navigate('/consultation-history')}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
          <FiArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button onClick={() => window.print()}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
          <FiPrinter className="w-3.5 h-3.5" /> Print
        </button>
      </div>

      <ConsultationReceiptPrint
        activities={activities}
        groupedByPet={groupedByPet}
        buildRows={buildRows}
        formatDate={formatDate}
        receiptNo={receiptNo}
        receiptDateLabel={formatDate(date)}
        clinicName={clinicName}
        clinicAddress={clinicAddress}
        clinicPhone={clinicPhone}
        clientName={clientName}
        contactNumber="N/A"
        uniquePetCount={uniquePetCount}
        consultationFee={consultationFee}
        medicinesTotal={medicinesTotal}
        totalAmount={totalAmount}
        hasFollowUp={hasFollowUp}
        attendingVeterinarian={attendingVeterinarian}
      />

      <PrintStyles />
    </div>
  )
}

export default ConsultationSummary
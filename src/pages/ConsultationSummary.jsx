import { useLocation, useNavigate } from 'react-router-dom'
import { FiPrinter, FiArrowLeft } from 'react-icons/fi'
import logo from '../assets/happidogslogo.png'

function ConsultationSummary() {
  const location = useLocation()
  const navigate = useNavigate()
  const group = location.state?.group

  if (!group) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-300">
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
      <div className="h-screen flex flex-col bg-gray-300">
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
    <div className="h-screen flex flex-col bg-gray-300">

      {/* ── Toolbar ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 print:hidden flex-shrink-0">
        <button onClick={() => navigate('/consultation-history')}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
          <FiArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
          <FiPrinter className="w-3.5 h-3.5" /> Print
        </button>
      </div>

      {/* ── Scrollable A4 area ── */}
      <div className="flex-1 overflow-auto py-8 px-4 print:p-0 print:overflow-visible">
        <div className="bg-white mx-auto print:shadow-none print:mx-0 flex flex-col"
          style={{ width: '210mm', minHeight: '297mm', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>

          {/* Top accent bar */}
          <div style={{ height: '7px', background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', flexShrink: 0 }} />

          <div className="flex flex-col flex-1 px-10 py-7">

            {/* ── Clinic Header ── */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Happi Dogs" className="w-16 h-16 object-contain"
                  onError={(e) => { e.target.style.display = 'none' }} />
                <div>
                  <h1 className="text-lg font-black uppercase tracking-wide text-gray-900 leading-tight">Happi Dogs</h1>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 leading-tight">Veterinary Clinic</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Pob. Ilaya, Lambunao, Iloilo</p>
                  <p className="text-xs text-gray-400">Tel: (123) 456-7890</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block border-2 border-gray-900 px-4 py-2 mb-2">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-900">Clinical Record</p>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-900">& Official Receipt</p>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p><span className="font-semibold text-gray-700">Receipt No:</span> {receiptNo}</p>
                  <p><span className="font-semibold text-gray-700">Date:</span> {formatDate(date)}</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-gray-900 border-b border-gray-300 mb-4" />

            {/* ── Client Info ── */}
            <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 border border-gray-200 px-4 py-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex gap-2 items-baseline">
                  <span className="text-gray-500 font-medium w-24 flex-shrink-0">Owner's Name:</span>
                  <span className="font-bold text-gray-900 border-b border-dotted border-gray-400 flex-1 pb-0.5">
                    {clientName}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex gap-2 items-baseline">
                  <span className="text-gray-500 font-medium w-20 flex-shrink-0">No. of Pets:</span>
                  <span className="font-bold text-gray-900 border-b border-dotted border-gray-400 flex-1 pb-0.5">
                    {uniquePetCount}
                  </span>
                </div>
                <div className="flex gap-2 items-baseline">
                  <span className="text-gray-500 font-medium w-20 flex-shrink-0">Pet Name(s):</span>
                  <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 flex-1 pb-0.5">
                    {groupedByPet.map(g => g.petName).join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Clinical Summary label ── */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-3.5 w-1 rounded-full bg-gray-900" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-900">Clinical Summary</p>
            </div>

            {/* ── Table ── */}
            <table className="w-full text-xs border-collapse mb-4" style={{ borderTop: '2px solid #111827' }}>
              <thead>
                <tr style={{ background: '#111827' }} className="text-white">
                  <th className="px-2.5 py-2 text-left font-bold border-r border-gray-600 w-[12%]">Pet</th>
                  <th className="px-2.5 py-2 text-left font-bold border-r border-gray-600 w-[13%]">Activity</th>
                  <th className="px-2.5 py-2 text-left font-bold border-r border-gray-600 w-[23%]">Clinical Notes</th>
                  <th className="px-2.5 py-2 text-left font-bold border-r border-gray-600 w-[22%]">Medicine / Item</th>
                  <th className="px-2.5 py-2 text-center font-bold border-r border-gray-600 w-[10%]">Qty</th>
                  <th className="px-2.5 py-2 text-right font-bold border-r border-gray-600 w-[10%]">Unit Price</th>
                  <th className="px-2.5 py-2 text-right font-bold w-[10%]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {groupedByPet.map((group, gIndex) => {
                  const rows = buildRows(group)
                  return rows.map((row) => (
                    <tr key={row.key}
                      style={{ background: gIndex % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                      className="border-b border-gray-200">
                      {row.isFirstInGroup && (
                        <td rowSpan={rows.length}
                          className="px-2.5 py-2 border-r border-gray-200 font-black text-gray-900 align-top"
                          style={{ borderLeft: '3px solid #111827' }}>
                          {row.petName}
                        </td>
                      )}
                      {row.isFirstInActivity && (
                        <td rowSpan={row.activityMedCount || 1}
                          className="px-2.5 py-2 border-r border-gray-200 font-semibold text-gray-700 align-top whitespace-nowrap">
                          {row.activityType}
                        </td>
                      )}
                      {row.isFirstInActivity && (
                        <td rowSpan={row.activityMedCount || 1}
                          className="px-2.5 py-2 border-r border-gray-200 text-gray-700 align-top">
                          {row.detailParts.length > 0 ? (
                            <div className="space-y-0.5">
                              {row.detailParts.map((d, i) => (
                                <div key={i}>
                                  <span className="font-semibold text-gray-500">{d.label}: </span>
                                  <span className="text-gray-800">{d.value}</span>
                                </div>
                              ))}
                            </div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                      )}
                      <td className="px-2.5 py-2 border-r border-gray-200 text-gray-900">
                        {row.med ? row.med.medicineName : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-2.5 py-2 border-r border-gray-200 text-center text-gray-700">
                        {row.med ? `${row.med.quantity} ${row.med.unit}` : '—'}
                      </td>
                      <td className="px-2.5 py-2 border-r border-gray-200 text-right text-gray-700">
                        {row.med ? `₱${(row.med.pricePerUnit ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-2.5 py-2 text-right font-semibold text-gray-900">
                        {row.med
                          ? `₱${((row.med.pricePerUnit ?? 0) * (row.med.quantity || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                    </tr>
                  ))
                })}
              </tbody>
            </table>

            {/* ── Billing Summary — read only, uses saved values ── */}
            <div className="flex justify-end mb-4">
              <div className="w-80">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-3.5 w-1 rounded-full bg-gray-900" />
                  <p className="text-xs font-black uppercase tracking-widest text-gray-900">Billing Summary</p>
                </div>
                <div className="border border-gray-300 overflow-hidden">
                  <div className="flex justify-between items-center px-3 py-2 text-xs bg-gray-50 border-b border-gray-200">
                    <span className="text-gray-600">
                      Professional Fee
                      <span className="text-gray-400 ml-1">(₱300 × {uniquePetCount} {uniquePetCount > 1 ? 'pets' : 'pet'})</span>
                    </span>
                    <span className="font-semibold text-gray-900">
                      ₱{consultationFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2 text-xs bg-gray-50 border-b border-gray-200">
                    <span className="text-gray-600">Medications & Items</span>
                    <span className="font-semibold text-gray-900">
                      ₱{medicinesTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2.5" style={{ background: '#111827' }}>
                    <span className="text-xs font-black uppercase tracking-wide text-white">
                      Total Amount Due
                      {isCustomTotal && <span className="text-yellow-400 ml-1 text-xs normal-case font-normal">(adjusted)</span>}
                    </span>
                    <span className="text-sm font-black text-white">
                      ₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Follow-up ── */}
            {hasFollowUp && (
              <div className="mb-4 border border-dashed border-gray-400 px-4 py-2.5 bg-gray-50">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">📅 Follow-up Schedule</p>
                {activities.filter(a => a.followUpDate).map((a, i) => (
                  <p key={i} className="text-xs text-gray-600">
                    <span className="font-semibold">{a.petName}</span> — {formatDate(a.followUpDate)}
                    {a.followUpNote && <span className="text-gray-500 ml-1 italic">({a.followUpNote})</span>}
                  </p>
                ))}
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* ── Vet Signature ── */}
            <div className="flex justify-end mt-4 mb-6">
              <div className="text-center w-60">
                <div className="border-b-2 border-gray-400 mb-1.5 h-10" />
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Attending Veterinarian</p>
                <p className="text-xs text-gray-500 mt-0.5">PRC License No.: _______________</p>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
              <p className="text-xs text-gray-400 italic">This is a computer-generated document.</p>
              <p className="text-xs font-semibold text-gray-500">Thank you for trusting Happi Dogs Veterinary Clinic 🐾</p>
            </div>

          </div>

          {/* Bottom accent bar */}
          <div style={{ height: '5px', background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', flexShrink: 0 }} />
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

export default ConsultationSummary
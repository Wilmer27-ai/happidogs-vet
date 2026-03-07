// src/components/steps/SummaryStep.jsx
import { useState, useEffect } from 'react'
import { FiPrinter, FiArrowLeft, FiCheckCircle, FiEdit2, FiCheck, FiX } from 'react-icons/fi'
import { deductMedicineStock, saveSalesRecord, getMedicines, getMasterData, MASTER_DATA_DEFAULTS } from '../../firebase/services'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/happidogslogo.png'

function SummaryStep({ selectedClient, selectedPets, consultationData, medicinesData, onBack, onSave }) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedGroup, setSavedGroup] = useState(null)

  const uniquePetIds = [...new Set((consultationData || []).map(a => a.petId))]
  const uniquePetCount = uniquePetIds.length
  const groupedByPet = uniquePetIds.map(petId => {
    const activities = (consultationData || []).filter(a => a.petId === petId)
    return { petId, petName: activities[0]?.petName || '', activities }
  })

  const allMeds = (consultationData || []).flatMap(a =>
    (a.medicines || []).map(m => ({ ...m, pricePerUnit: m.price ?? m.pricePerUnit ?? 0 }))
  )
  const medicinesTotal = allMeds.reduce((sum, m) => sum + ((m.pricePerUnit ?? 0) * (m.quantity || 0)), 0)

  const [consultationFee, setConsultationFee] = useState(MASTER_DATA_DEFAULTS.consultationFee * uniquePetCount)
  const [feeInput, setFeeInput] = useState(MASTER_DATA_DEFAULTS.consultationFee * uniquePetCount)

  const [clinicName, setClinicName] = useState(MASTER_DATA_DEFAULTS.clinicName)
  const [clinicAddress, setClinicAddress] = useState(MASTER_DATA_DEFAULTS.clinicAddress)
  const [clinicPhone, setClinicPhone] = useState(MASTER_DATA_DEFAULTS.clinicPhone)

  // Load default fee and clinic info from masterData
  useEffect(() => {
    getMasterData().then(data => {
      const fee = (data?.consultationFee ?? MASTER_DATA_DEFAULTS.consultationFee) * uniquePetCount
      setConsultationFee(fee)
      setFeeInput(fee)
      if (data?.clinicName) setClinicName(data.clinicName)
      if (data?.clinicAddress) setClinicAddress(data.clinicAddress)
      if (data?.clinicPhone) setClinicPhone(data.clinicPhone)
    })
  }, [])

  const [editingFee, setEditingFee] = useState(false)
  const [editingTotal, setEditingTotal] = useState(false)
  const [totalInput, setTotalInput] = useState(null)
  const [customTotal, setCustomTotal] = useState(null)

  const computedTotal = consultationFee + medicinesTotal
  const totalAmount = customTotal !== null ? customTotal : computedTotal

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    // ── Parse YYYY-MM-DD as LOCAL date to avoid UTC offset shift ──
    const parts = String(dateString).split('T')[0].split('-')
    if (parts.length === 3) {
      const [year, month, day] = parts
      return new Date(Number(year), Number(month) - 1, Number(day))
        .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const now = new Date()
  const receiptNo = `HDV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`

  const buildRows = (group) => {
    const rows = []
    group.activities.forEach((activity, aIndex) => {
      const petMeds = (activity.medicines || []).map(m => ({
        ...m,
        pricePerUnit: m.price ?? m.pricePerUnit ?? 0,
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
          key: `${activity.id || aIndex}-nomeds`,
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
            key: `${activity.id || aIndex}-${mIndex}`,
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

  const hasFollowUp = (consultationData || []).some(a => a.followUpDate)

  const handleSave = async () => {
    if (saving || saved) return
    setSaving(true)
    try {
      const consultationId = crypto.randomUUID()
      const now = new Date()
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const clientName = `${selectedClient?.firstName} ${selectedClient?.lastName}`

      const snapshotActivities = (consultationData || []).map(activity => ({
        petActivityId: activity.id,
        petId: activity.petId,
        petName: activity.petName,
        activityType: activity.activityType,
        date: activity.date || date,
        weight: activity.weight || '',
        temperature: activity.temperature || '',
        diagnosis: activity.diagnosis || '',
        treatment: activity.treatment || '',
        note: activity.note || '',
        followUpDate: activity.followUpDate || '',
        followUpNote: activity.followUpNote || '',
        medicines: (activity.medicines || []).map(m => {
          const unitPrice = m.price ?? m.pricePerUnit ?? 0
          const qty = m.quantity || 0
          return {
            medicineId: m.medicineId || m.id || '',
            medicineName: m.medicineName || '',
            quantity: qty,
            unit: m.unit || '',
            pricePerUnit: unitPrice,
            subtotal: unitPrice * qty,
          }
        }),
      }))

      // ── Aggregate required medicines ──
      const aggregated = {}
      snapshotActivities.forEach(activity => {
        ;(activity.medicines || []).forEach(m => {
          const key = m.medicineId
          if (!key) return
          if (!aggregated[key]) aggregated[key] = { ...m, totalQty: 0 }
          aggregated[key].totalQty += m.quantity || 0
        })
      })

      // ── 1. Validate stocks BEFORE saving anything ──
      if (Object.keys(aggregated).length > 0) {
        const freshMedicines = await getMedicines()
        const stockErrors = []

        for (const med of Object.values(aggregated)) {
          const freshMed = freshMedicines.find(m => m.id === med.medicineId)
          if (!freshMed) {
            stockErrors.push(`"${med.medicineName}" not found in inventory.`)
            continue
          }

          // ── Calculate available stock based on medicine type ──
          let availableStock = 0
          if (freshMed.medicineType === 'syrup') {
            availableStock = ((freshMed.bottleCount ?? 0) * (freshMed.mlPerBottle ?? 0)) + (freshMed.looseMl ?? 0)
            // If unit is bottle, convert needed qty to ml equivalent
            const neededMl = med.unit === 'bottle'
              ? med.totalQty * (freshMed.mlPerBottle ?? 0)
              : med.totalQty
            if (neededMl > availableStock) {
              stockErrors.push(
                `"${med.medicineName}": need ${med.totalQty} ${med.unit}, only ${freshMed.bottleCount ?? 0} bottle(s) + ${freshMed.looseMl ?? 0}ml available.`
              )
            }
          } else if (freshMed.medicineType === 'tablet') {
            availableStock = ((freshMed.boxCount ?? 0) * (freshMed.tabletsPerBox ?? 0)) + (freshMed.looseTablets ?? 0)
            const neededTabs = med.unit === 'box'
              ? med.totalQty * (freshMed.tabletsPerBox ?? 0)
              : med.totalQty
            if (neededTabs > availableStock) {
              stockErrors.push(
                `"${med.medicineName}": need ${med.totalQty} ${med.unit}, only ${freshMed.boxCount ?? 0} box(es) + ${freshMed.looseTablets ?? 0} tablet(s) available.`
              )
            }
          } else {
            availableStock = freshMed.stockQuantity ?? 0
            if (med.totalQty > availableStock) {
              stockErrors.push(
                `"${med.medicineName}": need ${med.totalQty} ${med.unit}, only ${availableStock} available.`
              )
            }
          }
        }

        if (stockErrors.length > 0) {
          alert(`⚠️ Cannot save — insufficient stock:\n\n${stockErrors.map(e => `• ${e}`).join('\n')}`)
          setSaving(false)
          return
        }

        // ── 2. Save consultation ──
        await addDoc(collection(db, 'consultations'), {
          consultationId,
          clientId: selectedClient?.id,
          clientName,
          date,
          activities: snapshotActivities,
          consultationFee,
          medicinesTotal,
          totalAmount,
          isCustomTotal: customTotal !== null,
          createdAt: new Date().toISOString(),
        })
        console.log('✅ Consultation saved')

        // ── 3. Deduct stocks ──
        await Promise.all(
          Object.values(aggregated).map(async (med) => {
            const freshMed = freshMedicines.find(m => m.id === med.medicineId)
            if (!freshMed) return
            await deductMedicineStock(med.medicineId, med.totalQty, med.unit, freshMed)
          })
        )
        console.log('✅ Stock deducted')

      } else {
        // ── No medicines — just save consultation ──
        await addDoc(collection(db, 'consultations'), {
          consultationId,
          clientId: selectedClient?.id,
          clientName,
          date,
          activities: snapshotActivities,
          consultationFee,
          medicinesTotal,
          totalAmount,
          isCustomTotal: customTotal !== null,
          createdAt: new Date().toISOString(),
        })
        console.log('✅ Consultation saved (no medicines)')
      }

      // ── 4. Build sale items ──
      const saleItems = snapshotActivities.flatMap(activity =>
        (activity.medicines || []).map(m => ({
          medicineId: m.medicineId,
          medicineName: m.medicineName,
          quantity: m.quantity,
          unit: m.unit,
          pricePerUnit: m.pricePerUnit,
          subtotal: m.subtotal,
        }))
      )

      // ── 5. Save sales record ──
      const salesPayload = {
        consultationId,
        clientId: selectedClient?.id || '',
        clientName,
        date,
        type: 'consultation',
        consultationFee: Number(consultationFee),
        medicinesTotal: Number(medicinesTotal),
        totalAmount: Number(totalAmount),
        isCustomTotal: customTotal !== null,
        petCount: uniquePetCount,
        petNames: groupedByPet.map(g => g.petName),
        activityTypes: [...new Set(snapshotActivities.map(a => a.activityType))],
        items: saleItems,
        createdAt: new Date().toISOString(),
      }

      console.log('💾 Saving sales record:', salesPayload)
      await saveSalesRecord(salesPayload)
      console.log('✅ Sales record saved')

      const group = {
        consultationId,
        clientName,
        date,
        activities: snapshotActivities,
        consultationFee,
        medicinesTotal,
        totalAmount,
      }
      setSavedGroup(group)
      setSaved(true)
      onSave?.()
    } catch (e) {
      console.error('❌ Failed to save:', e)
      alert(`Failed to save consultation: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleViewSummary = () => navigate('/consultation-summary', { state: { group: savedGroup } })
  const handleGoToHistory = () => navigate('/consultation-history')

  return (
    <div className="h-screen flex flex-col bg-gray-300">

      {/* ── Toolbar ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 print:hidden flex-shrink-0">
        {!saved && (
          <button onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
            <FiArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
          <FiPrinter className="w-3.5 h-3.5" /> Print
        </button>
        <div className="ml-auto flex items-center gap-2">
          {saved ? (
            <>
              <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <FiCheckCircle className="w-4 h-4" /> Consultation saved!
              </div>
              <button onClick={handleViewSummary}
                className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
                View Receipt
              </button>
              <button onClick={handleGoToHistory}
                className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">
                Go to History
              </button>
            </>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5">
              {saving
                ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                : 'Save & Complete'}
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable A4 area ── */}
      <div className="flex-1 overflow-auto py-8 px-4 print:p-0 print:overflow-visible">
        <div className="bg-white mx-auto print:shadow-none print:mx-0 flex flex-col"
          style={{ width: '210mm', minHeight: '297mm', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>

          <div style={{ height: '7px', background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', flexShrink: 0 }} />

          <div className="flex flex-col flex-1 px-10 py-7">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Happi Dogs" className="w-16 h-16 object-contain"
                  onError={(e) => { e.target.style.display = 'none' }} />
                <div>
                  <h1 className="text-lg font-black uppercase tracking-wide text-gray-900 leading-tight">{clinicName}</h1>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 leading-tight">Veterinary Clinic</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{clinicAddress}</p>
                  <p className="text-xs text-gray-400">Tel: {clinicPhone}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block border-2 border-gray-900 px-4 py-2 mb-2">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-900">Clinical Record</p>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-900">& Official Receipt</p>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p><span className="font-semibold text-gray-700">Receipt No:</span> {receiptNo}</p>
                  <p><span className="font-semibold text-gray-700">Date:</span> {formatDate(now.toLocaleDateString('en-CA'))}</p>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-gray-900 border-b border-gray-300 mb-4" />

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 border border-gray-200 px-4 py-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex gap-2 items-baseline">
                  <span className="text-gray-500 font-medium w-24 flex-shrink-0">Owner's Name:</span>
                  <span className="font-bold text-gray-900 border-b border-dotted border-gray-400 flex-1 pb-0.5">
                    {selectedClient?.firstName} {selectedClient?.lastName}
                  </span>
                </div>
                <div className="flex gap-2 items-baseline">
                  <span className="text-gray-500 font-medium w-24 flex-shrink-0">Contact No.:</span>
                  <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 flex-1 pb-0.5">
                    {selectedClient?.contactNumber || selectedClient?.phoneNumber || '______________________'}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex gap-2 items-baseline">
                  <span className="text-gray-500 font-medium w-20 flex-shrink-0">No. of Pets:</span>
                  <span className="font-bold text-gray-900 border-b border-dotted border-gray-400 flex-1 pb-0.5">{uniquePetCount}</span>
                </div>
                <div className="flex gap-2 items-baseline">
                  <span className="text-gray-500 font-medium w-20 flex-shrink-0">Pet Name(s):</span>
                  <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 flex-1 pb-0.5">
                    {groupedByPet.map(g => g.petName).join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Clinical Summary label */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-3.5 w-1 rounded-full bg-gray-900" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-900">Clinical Summary</p>
            </div>

            {/* Table */}
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

            {/* Billing Summary */}
            <div className="flex justify-end mb-4">
              <div className="w-80">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-3.5 w-1 rounded-full bg-gray-900" />
                  <p className="text-xs font-black uppercase tracking-widest text-gray-900">Billing Summary</p>
                </div>
                <div className="border border-gray-300 overflow-hidden">

                  {/* Professional Fee — editable */}
                  <div className="flex justify-between items-center px-3 py-2 text-xs bg-gray-50 border-b border-gray-200">
                    <span className="text-gray-600">
                      Professional Fee
                      <span className="text-gray-400 ml-1">(₱300 × {uniquePetCount} {uniquePetCount > 1 ? 'pets' : 'pet'})</span>
                    </span>
                    <div className="flex items-center gap-1 print:hidden">
                      {editingFee ? (
                        <>
                          <span className="text-gray-500 text-xs">₱</span>
                          <input type="number" min="0" step="50" value={feeInput}
                            onChange={(e) => setFeeInput(parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                            className="w-20 px-1 py-0.5 text-xs text-right border border-blue-400 rounded focus:outline-none"
                            autoFocus />
                          <button onClick={() => { setConsultationFee(feeInput); setEditingFee(false) }}
                            className="text-green-600 hover:text-green-700 ml-1">
                            <FiCheck className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setFeeInput(consultationFee); setEditingFee(false) }}
                            className="text-red-400 hover:text-red-600">
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-gray-900">
                            ₱{consultationFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </span>
                          <button onClick={() => { setFeeInput(consultationFee); setEditingFee(true) }}
                            className="text-gray-400 hover:text-gray-600 ml-1.5">
                            <FiEdit2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                    <span className="hidden print:block font-semibold text-gray-900">
                      ₱{consultationFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Medications */}
                  <div className="flex justify-between items-center px-3 py-2 text-xs bg-gray-50 border-b border-gray-200">
                    <span className="text-gray-600">Medications & Items</span>
                    <span className="font-semibold text-gray-900">
                      ₱{medicinesTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Total — editable */}
                  <div className="flex justify-between items-center px-3 py-2.5" style={{ background: '#111827' }}>
                    <span className="text-xs font-black uppercase tracking-wide text-white">Total Amount Due</span>
                    <div className="flex items-center gap-1 print:hidden">
                      {editingTotal ? (
                        <>
                          <span className="text-gray-400 text-xs">₱</span>
                          <input type="number" min="0" step="50"
                            value={totalInput ?? computedTotal}
                            onChange={(e) => setTotalInput(parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                            className="w-24 px-1 py-0.5 text-xs text-right border border-blue-400 rounded bg-gray-800 text-white focus:outline-none"
                            autoFocus />
                          <button onClick={() => { setCustomTotal(totalInput ?? computedTotal); setEditingTotal(false) }}
                            className="text-green-400 hover:text-green-300 ml-1">
                            <FiCheck className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setTotalInput(null); setCustomTotal(null); setEditingTotal(false) }}
                            className="text-red-400 hover:text-red-300">
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-black text-white">
                            ₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </span>
                          {customTotal !== null && (
                            <span className="text-xs text-yellow-400 ml-1">(edited)</span>
                          )}
                          <button onClick={() => { setTotalInput(totalAmount); setEditingTotal(true) }}
                            className="text-gray-400 hover:text-white ml-1.5">
                            <FiEdit2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                    <span className="hidden print:block text-sm font-black text-white">
                      ₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Follow-up */}
            {hasFollowUp && (
              <div className="mb-4 border border-dashed border-gray-400 px-4 py-2.5 bg-gray-50">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">📅 Follow-up Schedule</p>
                {(consultationData || []).filter(a => a.followUpDate).map((a, i) => (
                  <p key={i} className="text-xs text-gray-600">
                    <span className="font-semibold">{a.petName}</span> — {formatDate(a.followUpDate)}
                    {a.followUpNote && <span className="text-gray-500 ml-1 italic">({a.followUpNote})</span>}
                  </p>
                ))}
              </div>
            )}

            <div className="flex-1" />

            {/* Vet Signature */}
            <div className="flex justify-end mt-4 mb-6">
              <div className="text-center w-60">
                <div className="border-b-2 border-gray-400 mb-1.5 h-10" />
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Attending Veterinarian</p>
                <p className="text-xs text-gray-500 mt-0.5">PRC License No.: _______________</p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
              <p className="text-xs text-gray-400 italic">This is a computer-generated document.</p>
              <p className="text-xs font-semibold text-gray-500">Thank you for trusting Happi Dogs Veterinary Clinic 🐾</p>
            </div>
          </div>

          <div style={{ height: '5px', background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', flexShrink: 0 }} />
        </div>
      </div>

      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0; background: white; }
          @page { size: A4; margin: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  )
}

export default SummaryStep
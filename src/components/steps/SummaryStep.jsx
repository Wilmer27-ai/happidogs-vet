// src/components/steps/SummaryStep.jsx
import { useState, useEffect } from 'react'
import { FiPrinter, FiArrowLeft, FiCheckCircle, FiEdit2 } from 'react-icons/fi'
import { deductMedicineStock, saveSalesRecord, getMedicines, getMasterData, MASTER_DATA_DEFAULTS } from '../../firebase/services'
import { useAuth } from '../../pages/AuthContext'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useNavigate } from 'react-router-dom'
import ConsultationReceiptPrint from '../ConsultationReceiptPrint'
import PrintStyles from '../PrintStyles'

function SummaryStep({ selectedClient, selectedPets, consultationData, medicinesData, onBack, onSave }) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedGroup, setSavedGroup] = useState(null)
  const { userProfile, currentUser } = useAuth()

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

  const [consultationFee, setConsultationFee] = useState(MASTER_DATA_DEFAULTS.consultationFee)
  const [feeInput, setFeeInput] = useState(MASTER_DATA_DEFAULTS.consultationFee)

  const [clinicName, setClinicName] = useState(MASTER_DATA_DEFAULTS.clinicName)
  const [clinicAddress, setClinicAddress] = useState(MASTER_DATA_DEFAULTS.clinicAddress)
  const [clinicPhone, setClinicPhone] = useState(MASTER_DATA_DEFAULTS.clinicPhone)
  const [attendingVeterinarian, setAttendingVeterinarian] = useState(MASTER_DATA_DEFAULTS.attendingVeterinarian)

  // Load default fee and clinic info from masterData
  useEffect(() => {
    getMasterData().then(data => {
      const fee = data?.consultationFee ?? MASTER_DATA_DEFAULTS.consultationFee
      setConsultationFee(fee)
      setFeeInput(fee)
      if (data?.clinicName) setClinicName(data.clinicName)
      if (data?.clinicAddress) setClinicAddress(data.clinicAddress)
      if (data?.clinicPhone) setClinicPhone(data.clinicPhone)
      setAttendingVeterinarian(data?.attendingVeterinarian ?? MASTER_DATA_DEFAULTS.attendingVeterinarian)
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
        activityTypes: activity.activityTypes || [],
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
          category: m.category || 'Uncategorized',
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
        activityTypes: [...new Set(snapshotActivities.flatMap(a => a.activityTypes || []))],
        items: saleItems,
        shopName: userProfile?.shopName || 'Main Clinic',
        createdByUid: currentUser?.uid ?? null,
        createdByName: userProfile?.displayName || userProfile?.email || null,
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
    <div className="summary-step min-h-screen lg:h-screen flex flex-col bg-gray-300 print:min-h-0 print:h-auto print:block print:bg-white">

      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 print:hidden flex-shrink-0">
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
        <div className="sm:ml-auto flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          {saved ? (
            <>
              <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <FiCheckCircle className="w-4 h-4" /> Consultation saved!
              </div>
              <button onClick={handleViewSummary}
                className="w-full sm:w-auto px-4 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
                View Receipt
              </button>
              <button onClick={handleGoToHistory}
                className="w-full sm:w-auto px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">
                Go to History
              </button>
            </>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="w-full sm:w-auto px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5">
              {saving
                ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                : 'Save & Complete'}
            </button>
          )}
        </div>
      </div>

      <ConsultationReceiptPrint
        activities={consultationData || []}
        groupedByPet={groupedByPet}
        buildRows={buildRows}
        formatDate={formatDate}
        receiptNo={receiptNo}
        receiptDateLabel={formatDate(now.toLocaleDateString('en-CA'))}
        clinicName={clinicName}
        clinicAddress={clinicAddress}
        clinicPhone={clinicPhone}
        clientName={`${selectedClient?.firstName} ${selectedClient?.lastName}`}
        contactNumber={selectedClient?.contactNumber || selectedClient?.phoneNumber || '______________________'}
        uniquePetCount={uniquePetCount}
        consultationFee={consultationFee}
        medicinesTotal={medicinesTotal}
        totalAmount={totalAmount}
        hasFollowUp={hasFollowUp}
        attendingVeterinarian={attendingVeterinarian}
        editableBilling={true}
        editingFee={editingFee}
        feeInput={feeInput}
        onFeeInputChange={setFeeInput}
        onToggleFeeEdit={() => { setFeeInput(consultationFee); setEditingFee(true) }}
        onSaveFee={() => { setConsultationFee(feeInput); setEditingFee(false) }}
        editingTotal={editingTotal}
        totalInput={totalInput ?? computedTotal}
        onTotalInputChange={setTotalInput}
        onToggleTotalEdit={() => { setTotalInput(totalAmount); setEditingTotal(true) }}
        onSaveTotal={() => { setCustomTotal(totalInput ?? computedTotal); setEditingTotal(false) }}
        customTotal={customTotal}
      />

      <PrintStyles />
    </div>
  )

}

export default SummaryStep
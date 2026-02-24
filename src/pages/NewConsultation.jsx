// src/pages/NewConsultation.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheckCircle } from 'react-icons/fi'
import DetailsStep from '../components/steps/DetailsStep'
import SummaryStep from '../components/steps/SummaryStep'
import { updateMedicine } from '../firebase/services'

function NewConsultation() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedPets, setSelectedPets] = useState([])
  const [consultationData, setConsultationData] = useState([])
  const [medicinesData, setMedicinesData] = useState([])
  const [isSaving, setIsSaving] = useState(false)

  const deductMedicineStock = async (medicines) => {
    for (const med of medicines) {
      const qty = med.quantity
      const unit = med.sellUnit ?? med.unit

      if (med.medicineType === 'syrup') {
        let mlToDeduct = unit === 'bottle' ? qty * (med.mlPerBottle ?? 0) : qty
        let looseMl = med.looseMl ?? 0
        let bottleCount = med.bottleCount ?? 0
        if (mlToDeduct <= looseMl) {
          looseMl -= mlToDeduct
        } else {
          mlToDeduct -= looseMl
          looseMl = 0
          const bottlesNeeded = Math.ceil(mlToDeduct / (med.mlPerBottle ?? 1))
          bottleCount = Math.max(0, bottleCount - bottlesNeeded)
          looseMl = (bottlesNeeded * (med.mlPerBottle ?? 0)) - mlToDeduct
        }
        await updateMedicine(med.id ?? med.medicineId, { bottleCount, looseMl, stockQuantity: (bottleCount * (med.mlPerBottle ?? 0)) + looseMl })

      } else if (med.medicineType === 'tablet') {
        let tabletsToDeduct = unit === 'box' ? qty * (med.tabletsPerBox ?? 0) : qty
        let looseTablets = med.looseTablets ?? 0
        let boxCount = med.boxCount ?? 0
        if (tabletsToDeduct <= looseTablets) {
          looseTablets -= tabletsToDeduct
        } else {
          tabletsToDeduct -= looseTablets
          looseTablets = 0
          const boxesNeeded = Math.ceil(tabletsToDeduct / (med.tabletsPerBox ?? 1))
          boxCount = Math.max(0, boxCount - boxesNeeded)
          looseTablets = (boxesNeeded * (med.tabletsPerBox ?? 0)) - tabletsToDeduct
        }
        await updateMedicine(med.id ?? med.medicineId, { boxCount, looseTablets, stockQuantity: (boxCount * (med.tabletsPerBox ?? 0)) + looseTablets })

      } else {
        await updateMedicine(med.id ?? med.medicineId, {
          stockQuantity: Math.max(0, (med.stockQuantity ?? 0) - qty)
        })
      }
    }
  }

  const handleSaveConsultation = async () => {
    setIsSaving(true)
    try {
      // Deduct all medicines from selected activities
      await deductMedicineStock(medicinesData || [])

      setTimeout(() => {
        setIsSaving(false)
        navigate('/consultation-history')
      }, 1000)
    } catch (error) {
      console.error('Error saving consultation:', error)
      setIsSaving(false)
      alert('Failed to save. Please try again.')
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-hidden">

        {/* Step 0 — Details + Medicines embedded */}
        {currentStep === 0 && (
          <DetailsStep
            selectedClient={selectedClient}
            selectedPets={selectedPets}
            onSelectClient={setSelectedClient}
            onSelectPets={setSelectedPets}
            onNext={() => setCurrentStep(1)}
            consultationData={consultationData}
            setConsultationData={setConsultationData}
            setMedicinesData={setMedicinesData}
          />
        )}

        {/* Step 1 — Summary (was Step 2 before) */}
        {currentStep === 1 && (
          <SummaryStep
            selectedClient={selectedClient}
            selectedPets={selectedPets}
            consultationData={consultationData}
            medicinesData={medicinesData}
            onBack={() => setCurrentStep(0)}
            onSave={handleSaveConsultation}
          />
        )}
      </div>

      {isSaving && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center max-w-sm w-full">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FiCheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Saving Consultation</h3>
            <p className="text-sm text-gray-600 text-center">Please wait...</p>
            <div className="mt-4">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewConsultation
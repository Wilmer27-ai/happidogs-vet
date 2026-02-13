// src/pages/NewConsultation.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheckCircle } from 'react-icons/fi'
import DetailsStep from '../components/steps/DetailsStep'
import MedicinesStep from '../components/steps/MedicinesStep'
import SummaryStep from '../components/steps/SummaryStep'
import { updatePetActivity, updateMedicine } from '../firebase/services'

function NewConsultation() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedPets, setSelectedPets] = useState([])
  const [consultationData, setConsultationData] = useState(null)
  const [medicinesData, setMedicinesData] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSaveConsultation = async () => {
    setIsSaving(true)
    try {
      if (!selectedClient?.id || selectedPets.length === 0 || !consultationData) {
        alert('Please complete all steps')
        return
      }

      // Calculate total medicine cost
      const medicineCost = medicinesData?.reduce((sum, med) => 
        sum + ((med.sellingPrice || 0) * (med.quantity || 0)), 0
      ) || 0

      // Update medicine stock first
      for (const medicine of medicinesData || []) {
        const newStock = Math.max(0, medicine.stockQuantity - medicine.quantity)
        await updateMedicine(medicine.id, { stockQuantity: newStock })
      }

      // Update each selected activity with medicines and billing info
      const updatePromises = consultationData.map(activity => {
        const activityUpdate = {
          medicines: medicinesData?.map(med => ({
            medicineId: med.id,
            medicineName: med.medicineName,
            quantity: med.quantity,
            unit: med.unit,
            price: med.sellingPrice
          })) || [],
          consultationFee: 300,
          medicineCost: medicineCost,
          totalAmount: 300 + medicineCost,
          clientId: selectedClient.id,
          clientName: `${selectedClient.firstName} ${selectedClient.lastName}`
        }
        return updatePetActivity(activity.id, activityUpdate)
      })

      await Promise.all(updatePromises)

      setTimeout(() => {
        setIsSaving(false)
        navigate('/consultation-history')
      }, 1000)
    } catch (error) {
      console.error('Error saving consultation:', error)
      setIsSaving(false)
      alert('Failed to save consultation. Please try again.')
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-hidden">
        {currentStep === 0 && (
          <DetailsStep
            selectedClient={selectedClient}
            selectedPets={selectedPets}
            onSelectClient={setSelectedClient}
            onSelectPets={setSelectedPets}
            onNext={() => setCurrentStep(1)}
            consultationData={consultationData}
            setConsultationData={setConsultationData}
          />
        )}

        {currentStep === 1 && (
          <MedicinesStep
            selectedClient={selectedClient}
            selectedPets={selectedPets}
            onBack={() => setCurrentStep(0)}
            onNext={() => setCurrentStep(2)}
            medicinesData={medicinesData}
            setMedicinesData={setMedicinesData}
          />
        )}

        {currentStep === 2 && (
          <SummaryStep
            selectedClient={selectedClient}
            selectedPets={selectedPets}
            consultationData={consultationData}
            medicinesData={medicinesData}
            onBack={() => setCurrentStep(1)}
            onSave={handleSaveConsultation}
          />
        )}
      </div>

      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <FiCheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <p className="text-lg font-semibold">Saving consultation...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewConsultation
// src/pages/NewConsultation.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheckCircle } from 'react-icons/fi'
import DetailsStep from '../components/steps/DetailsStep'
import MedicinesStep from '../components/steps/MedicinesStep'
import SummaryStep from '../components/steps/SummaryStep'
import { addConsultation } from '../firebase/services'

function NewConsultation() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedPet, setSelectedPet] = useState(null)
  const [consultationData, setConsultationData] = useState(null)
  const [medicinesData, setMedicinesData] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSaveConsultation = async () => {
    setIsSaving(true)
    try {
      if (!selectedClient?.id || !selectedPet?.id) {
        alert('Please select a client and pet')
        return
      }

      const consultationToSave = {
        clientId: selectedClient.id,
        clientName: `${selectedClient.firstName} ${selectedClient.lastName}`,
        petId: selectedPet.id,
        petName: selectedPet.name,
        dateTime: consultationData?.dateTime || new Date().toISOString(),
        reason: consultationData?.reason || '',
        diagnosis: consultationData?.diagnosis || '',
        treatment: consultationData?.treatment || '',
        medicines: medicinesData?.map(med => ({
          medicineId: med.id,
          medicineName: med.medicineName,
          quantity: med.quantity,
          price: med.sellingPrice
        })) || [],
        totalAmount: (medicinesData?.reduce((sum, med) => sum + ((med.sellingPrice || 0) * (med.quantity || 0)), 0) || 0) + 300,
        consultationFee: 300
      }

      const savedConsultation = await addConsultation(consultationToSave)

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
            selectedPet={selectedPet}
            onSelectClient={setSelectedClient}
            onSelectPet={setSelectedPet}
            consultationData={consultationData}
            setConsultationData={setConsultationData}
            onNext={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 1 && (
          <MedicinesStep
            selectedClient={selectedClient}
            selectedPet={selectedPet}
            medicinesData={medicinesData}
            setMedicinesData={setMedicinesData}
            onBack={() => setCurrentStep(0)}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <SummaryStep
            selectedClient={selectedClient}
            selectedPet={selectedPet}
            consultationData={consultationData}
            medicinesData={medicinesData}
            onBack={() => setCurrentStep(1)}
            onSave={handleSaveConsultation}
          />
        )}
      </div>

      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <FiCheckCircle className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Saving Consultation</h3>
            <p className="text-sm text-gray-500">Please wait...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewConsultation
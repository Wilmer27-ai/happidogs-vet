// src/pages/NewConsultation.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DetailsStep from '../components/steps/DetailsStep'
import SummaryStep from '../components/steps/SummaryStep'

function NewConsultation() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedPets, setSelectedPets] = useState([])
  const [consultationData, setConsultationData] = useState([])
  const [medicinesData, setMedicinesData] = useState([])

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
            setMedicinesData={setMedicinesData}
          />
        )}
        {currentStep === 1 && (
          <SummaryStep
            selectedClient={selectedClient}
            selectedPets={selectedPets}
            consultationData={consultationData}
            medicinesData={medicinesData}
            onBack={() => setCurrentStep(0)}
            onSave={() => {}}
          />
        )}
      </div>
    </div>
  )
}

export default NewConsultation
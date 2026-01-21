// src/pages/NewConsultation.jsx
import { useState } from 'react'
import { FiPlus, FiCheckCircle } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import AddClientModal from '../components/AddClientModal'
import AddPetModal from '../components/AddPetModal'
import ClientStep from '../components/steps/ClientStep'
import PetStep from '../components/steps/PetStep'
import DetailsStep from '../components/steps/DetailsStep'
import MedicinesStep from '../components/steps/MedicinesStep'
import FollowUpStep from '../components/steps/FollowUpStep'
import SummaryStep from '../components/steps/SummaryStep'

function NewConsultation() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false)
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedPet, setSelectedPet] = useState(null)
  const [consultationData, setConsultationData] = useState(null)
  const [medicinesData, setMedicinesData] = useState([])
  const [followUpData, setFollowUpData] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: ''
  })

  const [newPet, setNewPet] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    weight: ''
  })

  const steps = ['Client', 'Pet', 'Details', 'Medicines', 'Follow-Up', 'Review']

  const handleAddClient = (clientData) => {
    console.log('New Client:', clientData)
    setNewClient({ firstName: '', lastName: '', phoneNumber: '', address: '' })
    setIsAddClientModalOpen(false)
  }

  const handleAddPet = (petData) => {
    console.log('New Pet:', petData)
    setNewPet({ name: '', species: '', breed: '', age: '', weight: '' })
    setIsAddPetModalOpen(false)
  }

  const handleSaveConsultation = () => {
    setIsSaving(true)
    // Simulate save delay
    setTimeout(() => {
      setIsSaving(false)
      // Navigate to consultation history
      navigate('/consultation-history')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">New Consultation</h1>
              {/* Compact Step Indicator */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs sm:text-sm text-gray-500">
                  Step {currentStep + 1} of {steps.length}:
                </span>
                <span className="text-xs sm:text-sm font-medium text-blue-600">
                  {steps[currentStep]}
                </span>
              </div>
            </div>
            {currentStep === 0 && (
              <button
                onClick={() => setIsAddClientModalOpen(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm text-sm"
              >
                <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Add Client</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
            {currentStep === 1 && (
              <button
                onClick={() => setIsAddPetModalOpen(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm text-sm"
              >
                <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Add Pet</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-8 py-4 sm:py-6">
        {currentStep === 0 && (
          <ClientStep
            onSelectClient={setSelectedClient}
            onNext={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 1 && (
          <PetStep
            selectedClient={selectedClient}
            onSelectPet={setSelectedPet}
            onBack={() => setCurrentStep(0)}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <DetailsStep
            selectedClient={selectedClient}
            selectedPet={selectedPet}
            consultationData={consultationData}
            setConsultationData={setConsultationData}
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && (
          <MedicinesStep
            selectedClient={selectedClient}
            selectedPet={selectedPet}
            medicinesData={medicinesData}
            setMedicinesData={setMedicinesData}
            onBack={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 4 && (
          <FollowUpStep
            followUpData={followUpData}
            setFollowUpData={setFollowUpData}
            onBack={() => setCurrentStep(3)}
            onNext={() => setCurrentStep(5)}
          />
        )}

        {currentStep === 5 && (
          <SummaryStep
            selectedClient={selectedClient}
            selectedPet={selectedPet}
            consultationData={consultationData}
            medicinesData={medicinesData}
            followUpData={followUpData}
            onBack={() => setCurrentStep(4)}
            onSave={handleSaveConsultation}
          />
        )}
      </div>

      {/* Saving Overlay */}
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

      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onSubmit={handleAddClient}
        clientData={newClient}
        setClientData={setNewClient}
      />

      <AddPetModal
        isOpen={isAddPetModalOpen}
        onClose={() => setIsAddPetModalOpen(false)}
        onSubmit={handleAddPet}
        petData={newPet}
        setPetData={setNewPet}
        selectedClient={selectedClient}
      />
    </div>
  )
}

export default NewConsultation
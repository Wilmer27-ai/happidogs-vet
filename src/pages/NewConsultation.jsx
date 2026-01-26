// src/pages/NewConsultation.jsx
import { useState } from 'react'
import { FiPlus, FiCheckCircle } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { addConsultation, addFollowUp } from '../firebase/services'
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
    dateOfBirth: ''
  })

  const steps = ['Client', 'Pet', 'Details', 'Medicines', 'Follow-Up', 'Review']

  const handleAddClient = (newClient) => {
    setSelectedClient(newClient)
    setNewClient({ firstName: '', lastName: '', phoneNumber: '', address: '' })
    setIsAddClientModalOpen(false)
  }

  const handleAddPet = (newPet) => {
    setSelectedPet(newPet)
    setNewPet({ name: '', species: '', breed: '', dateOfBirth: '' })
    setIsAddPetModalOpen(false)
  }

  const handleSaveConsultation = async () => {
    setIsSaving(true)
    try {
      if (!selectedClient?.id || !selectedPet?.id) {
        alert('Please select both client and pet')
        setIsSaving(false)
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

      console.log('Saving consultation:', consultationToSave)

      const savedConsultation = await addConsultation(consultationToSave)

      console.log('Consultation saved:', savedConsultation)

      if (followUpData?.enabled && followUpData?.date) {
        await addFollowUp({
          consultationId: savedConsultation.id,
          date: followUpData.date,
          type: followUpData.type || 'Check-up'
        })
      }

      setTimeout(() => {
        setIsSaving(false)
        navigate('/consultation-history')
      }, 1500)
    } catch (error) {
      console.error('Error saving consultation:', error)
      alert(`Failed to save consultation: ${error.message}`)
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Consultation</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">
                  Step {currentStep + 1} of {steps.length}:
                </span>
                <span className="text-sm font-medium text-blue-600">
                  {steps[currentStep]}
                </span>
              </div>
            </div>
            {currentStep === 0 && (
              <button
                onClick={() => setIsAddClientModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm text-sm"
              >
                <FiPlus className="w-5 h-5" />
                Add Client
              </button>
            )}
            {currentStep === 1 && (
              <button
                onClick={() => setIsAddPetModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm text-sm"
              >
                <FiPlus className="w-5 h-5" />
                Add Pet
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
      <div className="flex-1 px-6 py-4">
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
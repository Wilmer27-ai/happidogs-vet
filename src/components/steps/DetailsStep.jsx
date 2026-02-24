// src/components/steps/DetailsStep.jsx
import { useState, useEffect } from 'react'
import { FiPlus, FiSearch, FiX, FiPackage, FiMinus } from 'react-icons/fi'
import { getClients, getPets, addPetActivity, getPetActivities, getMedicines } from '../../firebase/services'
import AddClientModal from '../AddClientModal'
import AddPetModal from '../AddPetModal'

// ── Medicine Picker Modal ──────────────────────────────────────────────────────
function MedicinePickerModal({ isOpen, onClose, onConfirm, activityType, allMedicines }) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [checked, setChecked] = useState([])

  const getMedicineFilter = () => {
    if (activityType === 'Vaccination') return ['Vaccine']
    if (activityType === 'Deworming') return ['Dewormer']
    return null
  }

  const categories = ['All', 'Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care']

  const getStockLabel = (med) => {
    if (med.medicineType === 'syrup') return `${med.bottleCount ?? 0} btl · ${med.looseMl ?? 0} ml`
    if (med.medicineType === 'tablet') return `${med.boxCount ?? 0} box · ${med.looseTablets ?? 0} tabs`
    return `${med.stockQuantity ?? 0} ${med.unit ?? ''}`
  }

  const filtered = allMedicines.filter(med => {
    const categoryFilter = getMedicineFilter()
    const matchesCategory = !categoryFilter || categoryFilter.includes(med.category)
    const matchesFilter = activeFilter === 'All' || med.category === activeFilter
    const matchesSearch = med.medicineName?.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesFilter && matchesSearch
  })

  const toggleCheck = (id) => setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleConfirm = () => {
    onConfirm(allMedicines.filter(m => checked.includes(m.id)))
    setSearch(''); setChecked([]); setActiveFilter('All')
  }

  const handleClose = () => {
    setSearch(''); setChecked([]); setActiveFilter('All')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '85vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">Select Medicines</h3>
            {activityType !== 'Consultation' && (
              <p className="text-xs text-gray-500 mt-0.5">
                {activityType === 'Vaccination' ? 'Showing vaccines only' : 'Showing dewormers only'}
              </p>
            )}
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Search + Filter row */}
        <div className="px-5 py-3 border-b border-gray-100 flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine name..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          {activityType === 'Consultation' && (
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-44 px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          )}
        </div>

        {/* Medicine list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-gray-400">{search ? 'No medicines found' : 'No medicines available'}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 w-10"></th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Medicine</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide hidden sm:table-cell">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide hidden sm:table-cell">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(med => {
                  const isChecked = checked.includes(med.id)
                  return (
                    <tr key={med.id} onClick={() => toggleCheck(med.id)}
                      className={`cursor-pointer transition-colors ${isChecked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-2.5 text-center">
                        <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(med.id)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-900 text-sm">{med.medicineName}</p>
                        <p className="text-xs text-gray-500 capitalize">{med.medicineType}</p>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{med.category}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 hidden sm:table-cell">{getStockLabel(med)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between gap-3">
          <p className="text-sm">
            {checked.length > 0
              ? <span className="font-medium text-blue-600">{checked.length} medicine{checked.length > 1 ? 's' : ''} selected</span>
              : <span className="text-gray-400">No medicines selected</span>}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={handleClose}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button type="button" onClick={handleConfirm} disabled={checked.length === 0}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium">
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main DetailsStep ──────────────────────────────────────────────────────────
function DetailsStep({ selectedClient, selectedPets: propSelectedPets, onSelectClient, onSelectPets, onNext, consultationData, setConsultationData, setMedicinesData }) {
  const [clients, setClients] = useState([])
  const [pets, setPets] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingPets, setLoadingPets] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [petSearchQuery, setPetSearchQuery] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showPetDropdown, setShowPetDropdown] = useState(false)
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false)
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false)
  const [newClient, setNewClient] = useState({ firstName: '', lastName: '', phoneNumber: '', address: '' })
  const [newPet, setNewPet] = useState({ name: '', species: '', breed: '', dateOfBirth: '' })
  const [activities, setActivities] = useState([])
  const [selectedActivities, setSelectedActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [savingActivity, setSavingActivity] = useState(false)
  const [selectedPets, setSelectedPets] = useState(propSelectedPets || [])
  const [showForm, setShowForm] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [allMedicines, setAllMedicines] = useState([])
  const [selectedMedicines, setSelectedMedicines] = useState([])
  const [showMedModal, setShowMedModal] = useState(false)

  const getCurrentDate = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const [formData, setFormData] = useState({
    activityType: 'Consultation', date: getCurrentDate(), diagnosis: '', treatment: '',
    hasFollowUp: false, followUpDate: '', followUpNote: ''
  })
  const [petVitals, setPetVitals] = useState({})

  useEffect(() => { loadClients(); loadAllMedicines() }, [])
  useEffect(() => {
    if (selectedClient) loadPets()
    else { setPets([]); setSelectedPets([]); onSelectPets([]) }
  }, [selectedClient])
  useEffect(() => { if (selectedPets.length > 0) loadActivities(); else setActivities([]) }, [selectedPets])
  useEffect(() => { onSelectPets(selectedPets) }, [selectedPets])
  useEffect(() => {
    const v = {}
    selectedPets.forEach(p => { v[p.id] = petVitals[p.id] || { weight: '', temperature: '' } })
    setPetVitals(v)
  }, [selectedPets])
  useEffect(() => { setSelectedMedicines([]) }, [formData.activityType])

  const loadClients = async () => {
    try { setClients(await getClients()) } catch (e) { console.error(e) } finally { setLoadingClients(false) }
  }
  const loadPets = async () => {
    setLoadingPets(true)
    try { const all = await getPets(); setPets(all.filter(p => p.clientId === selectedClient.id)) }
    catch (e) { console.error(e) } finally { setLoadingPets(false) }
  }
  const loadActivities = async () => {
    setLoading(true)
    try {
      const all = []
      for (const pet of selectedPets) { const a = await getPetActivities(pet.id); all.push(...a) }
      all.sort((a, b) => new Date(b.date) - new Date(a.date))
      setActivities(all)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }
  const loadAllMedicines = async () => {
    try { const d = await getMedicines(); setAllMedicines(d.filter(m => getTotalStock(m) > 0)) }
    catch (e) { console.error(e) }
  }

  const getTotalStock = (med) => {
    if (med.medicineType === 'syrup') return ((med.bottleCount ?? 0) * (med.mlPerBottle ?? 0)) + (med.looseMl ?? 0)
    if (med.medicineType === 'tablet') return ((med.boxCount ?? 0) * (med.tabletsPerBox ?? 0)) + (med.looseTablets ?? 0)
    return med.stockQuantity ?? 0
  }
  const getPricePerUnit = (med, unit) => {
    if (med.medicineType === 'syrup') return unit === 'bottle' ? (med.sellingPricePerBottle ?? 0) : (med.sellingPricePerMl ?? 0)
    if (med.medicineType === 'tablet') return unit === 'box' ? (med.sellingPricePerBox ?? 0) : (med.sellingPricePerTablet ?? 0)
    return med.sellingPrice ?? 0
  }
  const getDefaultUnit = (med) => {
    if (med.medicineType === 'syrup') return 'ml'
    if (med.medicineType === 'tablet') return 'tablet'
    return med.unit ?? 'unit'
  }

  const handleMedicineModalConfirm = (newMeds) => {
    const toAdd = newMeds.filter(med => !selectedMedicines.some(m => m.id === med.id))
    const built = toAdd.map(med => {
      const defaultUnit = getDefaultUnit(med)
      const pricePerUnit = getPricePerUnit(med, defaultUnit)
      return { ...med, quantity: 1, sellUnit: defaultUnit, pricePerUnit, subtotal: pricePerUnit,
        mlPerBottle: med.mlPerBottle ?? null, tabletsPerBox: med.tabletsPerBox ?? null,
        bottleCount: med.bottleCount ?? 0, looseMl: med.looseMl ?? 0,
        boxCount: med.boxCount ?? 0, looseTablets: med.looseTablets ?? 0 }
    })
    setSelectedMedicines(prev => [...prev, ...built])
    setShowMedModal(false)
  }

  const handleRemoveMedicine = (id) => setSelectedMedicines(prev => prev.filter(m => m.id !== id))

  const handleMedQty = (id, delta) => {
    setSelectedMedicines(prev => prev.map(m => {
      if (m.id !== id) return m
      const step = m.sellUnit === 'ml' ? 0.5 : 1
      const newQty = Math.max(step, parseFloat((m.quantity + delta * step).toFixed(2)))
      return { ...m, quantity: newQty, subtotal: newQty * (m.pricePerUnit ?? 0) }
    }))
  }

  const handleMedQtyInput = (id, value) => {
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) return
    setSelectedMedicines(prev => prev.map(m =>
      m.id === id ? { ...m, quantity: num, subtotal: num * (m.pricePerUnit ?? 0) } : m
    ))
  }

  const handleMedUnitChange = (id, newUnit) => {
    const src = allMedicines.find(m => m.id === id)
    if (!src) return
    const newPrice = getPricePerUnit(src, newUnit)
    setSelectedMedicines(prev => prev.map(m =>
      m.id === id ? { ...m, sellUnit: newUnit, pricePerUnit: newPrice, quantity: 1, subtotal: newPrice } : m
    ))
  }

  const handleAddClient = async (data) => {
    setClients([...clients, data]); onSelectClient(data)
    setClientSearchQuery(`${data.firstName} ${data.lastName}`)
    setIsAddClientModalOpen(false)
  }
  const handleAddPet = async (data) => { setPets([...pets, data]); setIsAddPetModalOpen(false) }
  const handleClientSelect = (client) => {
    onSelectClient(client)
    setClientSearchQuery(`${client.firstName} ${client.lastName}`)
    setShowClientDropdown(false)
  }
  const togglePetSelection = (pet) => {
    setSelectedPets(prev => prev.some(p => p.id === pet.id) ? prev.filter(p => p.id !== pet.id) : [...prev, pet])
  }

  const filteredClients = clients.filter(c =>
    `${c.firstName} ${c.lastName} ${c.phoneNumber}`.toLowerCase().includes(clientSearchQuery.toLowerCase())
  ).slice(0, 50)
  const filteredPets = pets.filter(p =>
    `${p.name} ${p.species} ${p.breed}`.toLowerCase().includes(petSearchQuery.toLowerCase())
  ).slice(0, 50)

  const updatePetVital = (petId, field, value) =>
    setPetVitals(prev => ({ ...prev, [petId]: { ...prev[petId], [field]: value } }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedClient || selectedPets.length === 0) { alert('Please select a client and at least one pet'); return }
    setSavingActivity(true)
    try {
      await Promise.all(selectedPets.map(pet => {
        const vitals = petVitals[pet.id] || { weight: '', temperature: '' }
        return addPetActivity({
          petId: pet.id, petName: pet.name, clientId: selectedClient.id,
          clientName: `${selectedClient.firstName} ${selectedClient.lastName}`,
          activityType: formData.activityType, date: formData.date,
          weight: vitals.weight || '', temperature: vitals.temperature || '',
          diagnosis: formData.diagnosis || '', treatment: formData.treatment || '',
          followUpDate: formData.hasFollowUp ? (formData.followUpDate || '') : '',
          followUpNote: formData.hasFollowUp ? (formData.followUpNote || '') : '',
          medicines: selectedMedicines.map(med => ({
            medicineId: med.id, medicineName: med.medicineName, quantity: med.quantity,
            unit: med.sellUnit ?? med.unit, price: med.pricePerUnit ?? med.sellingPrice ?? 0, subtotal: med.subtotal ?? 0
          }))
        })
      }))
      setFormData({ activityType: 'Consultation', date: getCurrentDate(), diagnosis: '', treatment: '', followUpDate: '' })
      setPetVitals({}); setSelectedMedicines([])
      setSuccessMessage(`Activity added for ${selectedPets.length} pet(s)`)
      setTimeout(() => setSuccessMessage(''), 3000)
      await loadActivities()
    } catch (e) { console.error(e); alert('Failed to add activity.') }
    finally { setSavingActivity(false) }
  }

  const handleContinue = () => {
    if (selectedActivities.length === 0) { alert('Please select at least one activity to continue'); return }
    const objs = activities.filter(a => selectedActivities.includes(a.id))
    const allMeds = []; const seen = new Set()
    objs.forEach(act => (act.medicines || []).forEach(med => {
      if (!seen.has(med.medicineId)) {
        seen.add(med.medicineId)
        allMeds.push({ id: med.medicineId, medicineName: med.medicineName, quantity: med.quantity,
          sellUnit: med.unit, unit: med.unit, pricePerUnit: med.price, sellingPrice: med.price, subtotal: med.subtotal })
      }
    }))
    setConsultationData(objs)
    if (setMedicinesData) setMedicinesData(allMeds)
    onNext()
  }

  const toggleActivitySelection = (id) =>
    setSelectedActivities(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const activityTypeColors = {
    Consultation: 'text-black',
    Vaccination: 'text-black',
    Deworming: 'text-black',
  }

  const medicinesTotalAmount = selectedMedicines.reduce((s, m) => s + ((m.pricePerUnit ?? 0) * m.quantity), 0)

  return (
    <div className="h-screen flex flex-col bg-gray-50">

      {(showClientDropdown || showPetDropdown) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowClientDropdown(false); setShowPetDropdown(false) }} />
      )}

      <MedicinePickerModal isOpen={showMedModal} onClose={() => setShowMedModal(false)}
        onConfirm={handleMedicineModalConfirm} activityType={formData.activityType} allMedicines={allMedicines} />

      {/* Mobile tabs */}
      <div className="lg:hidden flex border-b border-gray-200 bg-white flex-shrink-0">
        <button onClick={() => setShowForm(true)} className={`flex-1 py-3 text-sm font-semibold transition-colors ${showForm ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700'}`}>Form</button>
        <button onClick={() => setShowForm(false)} className={`flex-1 py-3 text-sm font-semibold transition-colors ${!showForm ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700'}`}>Activities</button>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT PANEL ── */}
        <div className={`${showForm ? 'flex' : 'hidden'} lg:flex w-full lg:w-[420px] xl:w-[460px] border-r border-gray-200 bg-white flex-col flex-shrink-0`}>
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-sm">Pet Consultation Form</h3>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

            {/* Owner */}
            <div className="relative" style={{ zIndex: 50 }}>
              <label className="block text-xs font-medium text-gray-700 mb-1">Owner Name</label>
              <div className="relative">
                <input type="text" value={clientSearchQuery}
                  onChange={(e) => { setClientSearchQuery(e.target.value); setShowClientDropdown(true); if (!e.target.value) onSelectClient(null) }}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Search client..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {showClientDropdown && (
                  <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto" style={{ zIndex: 51 }}>
                    <button type="button" onClick={() => { setIsAddClientModalOpen(true); setShowClientDropdown(false) }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 border-b border-gray-200 text-blue-600 font-medium">
                      <FiPlus className="w-4 h-4" /> Add New Client
                    </button>
                    {filteredClients.length > 0 ? filteredClients.map(client => (
                      <button key={client.id} type="button" onClick={() => handleClientSelect(client)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0">
                        <div className="font-medium text-gray-900">{client.firstName} {client.lastName}</div>
                        <div className="text-xs text-gray-500">{client.phoneNumber}</div>
                      </button>
                    )) : <div className="px-3 py-2 text-sm text-gray-400">{clientSearchQuery ? 'No clients found' : 'Type to search...'}</div>}
                  </div>
                )}
              </div>
              {selectedClient && (
                <div className="mt-1 flex items-center justify-between bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                  <div>
                    <p className="text-xs font-semibold text-blue-900">{selectedClient.firstName} {selectedClient.lastName}</p>
                    <p className="text-xs text-blue-600">{selectedClient.phoneNumber}</p>
                  </div>
                  <button type="button" onClick={() => { onSelectClient(null); setClientSearchQuery('') }} className="text-gray-400 hover:text-red-500">
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Pets */}
            <div className="relative" style={{ zIndex: 40 }}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Select Pets {selectedPets.length > 0 && <span className="text-gray-400 font-normal">({selectedPets.length})</span>}
              </label>
              <div className="relative">
                <input type="text" value={petSearchQuery}
                  onChange={(e) => { setPetSearchQuery(e.target.value); setShowPetDropdown(true) }}
                  onFocus={() => { if (selectedClient) setShowPetDropdown(true) }}
                  disabled={!selectedClient}
                  placeholder={selectedClient ? 'Search and select pets...' : 'Select an owner first'}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400" />
                {showPetDropdown && selectedClient && (
                  <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto" style={{ zIndex: 41 }}>
                    <button type="button" onClick={() => { setIsAddPetModalOpen(true); setShowPetDropdown(false) }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 border-b border-gray-200 text-blue-600 font-medium">
                      <FiPlus className="w-4 h-4" /> Add New Pet
                    </button>
                    {loadingPets ? <div className="px-3 py-2 text-sm text-gray-400">Loading...</div>
                      : filteredPets.length > 0 ? filteredPets.map(pet => (
                        <button key={pet.id} type="button" onClick={() => togglePetSelection(pet)}
                          className={`w-full px-3 py-2 text-left text-sm border-b border-gray-100 last:border-0 flex items-center gap-2 ${selectedPets.some(p => p.id === pet.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                          <input type="checkbox" readOnly checked={selectedPets.some(p => p.id === pet.id)} className="w-4 h-4 text-blue-600 rounded pointer-events-none" />
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{pet.name}</div>
                            <div className="text-xs text-gray-500">{pet.species} · {pet.breed}</div>
                          </div>
                        </button>
                      )) : <div className="px-3 py-2 text-sm text-gray-400">{petSearchQuery ? 'No pets found' : 'Type to search...'}</div>}
                  </div>
                )}
              </div>
              {selectedPets.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {selectedPets.map(pet => (
                    <span key={pet.id} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-md">
                      {pet.name}
                      <button type="button" onClick={() => togglePetSelection(pet)} className="text-blue-400 hover:text-red-500">
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {selectedClient && selectedPets.length > 0 && (
              <>
                {/* Activity Type + Date */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Activity Type</label>
                    <select value={formData.activityType} onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="Consultation">Consultation</option>
                      <option value="Vaccination">Vaccination</option>
                      <option value="Deworming">Deworming</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                {/* Vitals */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vitals</label>
                  <div className="space-y-1.5">
                    {selectedPets.map(pet => (
                      <div key={pet.id} className="bg-gray-50 border border-gray-200 rounded-md p-2.5">
                        <p className="text-xs font-semibold text-gray-800 mb-1.5">{pet.name}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">Weight (kg)</label>
                            <input type="number" step="0.1" min="0" value={petVitals[pet.id]?.weight || ''}
                              onChange={(e) => updatePetVital(pet.id, 'weight', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0.0" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">Temp (°C)</label>
                            <input type="number" step="0.1" min="0" value={petVitals[pet.id]?.temperature || ''}
                              onChange={(e) => updatePetVital(pet.id, 'temperature', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0.0" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Diagnosis & Treatment */}
                {formData.activityType === 'Consultation' && (
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Diagnosis</label>
                      <textarea value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                        rows="2" className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Enter diagnosis..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Treatment</label>
                      <textarea value={formData.treatment} onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                        rows="2" className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Enter treatment plan..." />
                    </div>
                  </div>
                )}

                {/* Follow-up */}
                <div className="border border-gray-200 rounded-md p-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">Follow-up</label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, hasFollowUp: !prev.hasFollowUp, followUpDate: '', followUpNote: '' }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.hasFollowUp ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${formData.hasFollowUp ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  {formData.hasFollowUp && (
                    <div className="mt-2.5 space-y-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Follow-up Date</label>
                        <input
                          type="date"
                          value={formData.followUpDate}
                          onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Notes <span className="text-gray-400">(e.g. 2nd shot, recheck wound)</span></label>
                        <textarea
                          value={formData.followUpNote}
                          onChange={(e) => setFormData({ ...formData, followUpNote: e.target.value })}
                          rows="2"
                          placeholder="Enter follow-up details..."
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Medicines ── */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      Medicines
                      {formData.activityType === 'Vaccination' && <span className="ml-1 text-gray-400 font-normal">(Vaccines only)</span>}
                      {formData.activityType === 'Deworming' && <span className="ml-1 text-gray-400 font-normal">(Dewormers only)</span>}
                    </label>
                    <button type="button" onClick={() => setShowMedModal(true)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      <FiPackage className="w-3 h-3" /> Browse
                    </button>
                  </div>

                  {selectedMedicines.length === 0 ? (
                    <div className="border border-dashed border-gray-300 rounded-md px-4 py-4 text-center">
                      <p className="text-xs text-gray-400">No medicines added yet</p>
                      <button type="button" onClick={() => setShowMedModal(true)} className="mt-1 text-xs text-blue-600 hover:underline font-medium">
                        + Browse and add medicines
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedMedicines.map(med => (
                        <div key={med.id} className="border border-gray-200 rounded-md p-2.5 bg-white">

                          {/* Row 1: Name + remove */}
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-900 truncate">{med.medicineName}</p>
                              <p className="text-xs text-gray-400 capitalize">{med.medicineType} · {med.category}</p>
                            </div>
                            <button type="button" onClick={() => handleRemoveMedicine(med.id)}
                              className="text-gray-300 hover:text-red-500 ml-2 mt-0.5 flex-shrink-0">
                              <FiX className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Row 2: Unit toggle (if needed) */}
                          {(med.medicineType === 'syrup' || med.medicineType === 'tablet') && (
                            <div className="flex gap-1 mb-1.5">
                              {med.medicineType === 'syrup' && (
                                <>
                                  <button type="button" onClick={() => handleMedUnitChange(med.id, 'ml')}
                                    className={`flex-1 py-0.5 text-xs rounded border font-medium transition-colors ${med.sellUnit === 'ml' ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                    per ml
                                  </button>
                                  <button type="button" onClick={() => handleMedUnitChange(med.id, 'bottle')}
                                    className={`flex-1 py-0.5 text-xs rounded border font-medium transition-colors ${med.sellUnit === 'bottle' ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                    per bottle
                                  </button>
                                </>
                              )}
                              {med.medicineType === 'tablet' && (
                                <>
                                  <button type="button" onClick={() => handleMedUnitChange(med.id, 'tablet')}
                                    className={`flex-1 py-0.5 text-xs rounded border font-medium transition-colors ${med.sellUnit === 'tablet' ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                    per tablet
                                  </button>
                                  <button type="button" onClick={() => handleMedUnitChange(med.id, 'box')}
                                    className={`flex-1 py-0.5 text-xs rounded border font-medium transition-colors ${med.sellUnit === 'box' ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                    per box
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Row 3: Qty controls + price — all in one line */}
                          <div className="flex items-center justify-between gap-2">
                            {/* − qty + unit */}
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => handleMedQty(med.id, -1)}
                                className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex-shrink-0">
                                <FiMinus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min={med.sellUnit === 'ml' ? '0.5' : '1'}
                                step={med.sellUnit === 'ml' ? '0.5' : '1'}
                                value={med.quantity}
                                onChange={(e) => handleMedQtyInput(med.id, e.target.value)}
                                className="w-12 py-0.5 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <button type="button" onClick={() => handleMedQty(med.id, 1)}
                                className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex-shrink-0">
                                <FiPlus className="w-3 h-3" />
                              </button>
                              <span className="text-xs text-gray-500">{med.sellUnit ?? med.unit}</span>
                            </div>
                            {/* Price */}
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-bold text-gray-900">₱{((med.pricePerUnit ?? 0) * med.quantity).toLocaleString()}</p>
                              <p className="text-xs text-gray-400">₱{(med.pricePerUnit ?? 0).toLocaleString()}/{med.sellUnit ?? med.unit}</p>
                            </div>
                          </div>

                        </div>
                      ))}

                      {/* Total row */}
                      <div className="flex items-center justify-between pt-0.5">
                        <button type="button" onClick={() => setShowMedModal(true)}
                          className="text-xs text-blue-600 hover:underline font-medium">
                          + Add more
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Total</span>
                          <span className="text-sm font-bold text-gray-900">₱{medicinesTotalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Submit */}
          {selectedClient && selectedPets.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-white space-y-2">
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-2 rounded-md">
                  {successMessage}
                </div>
              )}
              <button onClick={handleSubmit} disabled={savingActivity}
                className="w-full py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed">
                {savingActivity ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                ) : (
                  <><FiPlus className="w-4 h-4" />Add Activity for {selectedPets.length} Pet{selectedPets.length > 1 ? 's' : ''}</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL — Activities ── */}
        <div className={`${!showForm ? 'flex' : 'hidden'} lg:flex flex-1 flex-col bg-gray-50 min-w-0`}>
          <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Pet Consultations</h3>
              {selectedPets.length > 0 && activities.length > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">{activities.length} record{activities.length !== 1 ? 's' : ''} found</p>
              )}
            </div>
            {selectedActivities.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-1 rounded-md">
                {selectedActivities.length} selected
              </span>
            )}
          </div>

          <div className="flex-1 p-6 overflow-hidden flex flex-col">
            {!selectedClient || selectedPets.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Select owner and pet(s) to view activities</p>
              </div>
            ) : loading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Loading activities...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-400 text-sm">No activities yet. Add one using the form.</p>
              </div>
            ) : (
              <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-auto h-full">
                  <table className="w-full text-xs">
                      <thead className="bg-gray-900 text-white sticky top-0 z-10">
                        <tr>
                          <th className="px-2 py-2.5 text-center w-8">
                            <input type="checkbox"
                              checked={selectedActivities.length === activities.length && activities.length > 0}
                              onChange={() => selectedActivities.length === activities.length ? setSelectedActivities([]) : setSelectedActivities(activities.map(a => a.id))}
                              className="w-3.5 h-3.5 rounded" />
                          </th>
                          <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide">Pet</th>
                          <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide">Date</th>
                          <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide">Type</th>
                          <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide hidden md:table-cell">Vitals</th>
                          <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide hidden lg:table-cell">Details</th>
                          <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide hidden xl:table-cell">Medicines</th>
                          <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide hidden sm:table-cell">Follow-up</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {activities.map((activity) => (
                          <tr key={activity.id} onClick={() => toggleActivitySelection(activity.id)}
                            className={`cursor-pointer transition-colors ${selectedActivities.includes(activity.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                            <td className="px-2 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                              <input type="checkbox" checked={selectedActivities.includes(activity.id)} onChange={() => toggleActivitySelection(activity.id)} className="w-3.5 h-3.5 text-blue-600 rounded" />
                            </td>
                            <td className="px-3 py-2.5 font-medium text-gray-900">{activity.petName}</td>
                            <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                              {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${activityTypeColors[activity.activityType] ?? 'bg-gray-100 text-gray-700'}`}>
                                {activity.activityType}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 hidden md:table-cell">
                              {activity.weight && <div>Wt: {activity.weight} kg</div>}
                              {activity.temperature && <div>Temp: {activity.temperature}°C</div>}
                              {!activity.weight && !activity.temperature && <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 hidden lg:table-cell max-w-[180px]">
                              {activity.diagnosis && <div className="truncate" title={activity.diagnosis}>{activity.diagnosis}</div>}
                              {activity.treatment && <div className="truncate text-gray-500" title={activity.treatment}>{activity.treatment}</div>}
                              {!activity.diagnosis && !activity.treatment && <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 hidden xl:table-cell">
                              {activity.medicines?.length > 0 ? activity.medicines.map((med, idx) => (
                                <div key={idx}>
                                  <span className="font-medium text-gray-800">{med.medicineName}</span>
                                  <span className="text-gray-500"> × {med.quantity} {med.unit}</span>
                                </div>
                              )) : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-3 py-2.5 hidden sm:table-cell">
                              {activity.followUpDate ? (
                                <div>
                                  <p className="whitespace-nowrap font-medium text-gray-800">
                                    {new Date(activity.followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                  {activity.followUpNote
                                    ? <p className="text-xs text-gray-500 mt-0.5 max-w-[160px]" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{activity.followUpNote}</p>
                                    : <p className="text-xs text-gray-400 mt-0.5">No notes</p>
                                  }
                                </div>
                              ) : <span className="text-gray-400">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-3 bg-white border-t border-gray-200">
            <button onClick={handleContinue} disabled={selectedActivities.length === 0}
              className="w-full px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed">
              {selectedActivities.length === 0 ? 'Select activities to continue' : `Continue to Summary (${selectedActivities.length} selected)`}
            </button>
          </div>
        </div>
      </div>

      <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setIsAddClientModalOpen(false)} onSubmit={handleAddClient} clientData={newClient} setClientData={setNewClient} />
      <AddPetModal isOpen={isAddPetModalOpen} onClose={() => setIsAddPetModalOpen(false)} onSubmit={handleAddPet} petData={newPet} setPetData={setNewPet} selectedClient={selectedClient} />
    </div>
  )
}

export default DetailsStep
import { useState, useEffect, useRef } from 'react'
import { FiPlus, FiSearch, FiX, FiPackage, FiMinus, FiTrash2, FiEdit2 } from 'react-icons/fi'
import { getClients, getPets, addPetActivity, getPetActivities, getMedicines, deletePetActivity, getMasterData, MASTER_DATA_DEFAULTS } from '../../firebase/services'
import AddClientModal from '../AddClientModal'
import AddPetModal from '../AddPetModal'
import React from 'react'

const DISPLAY_STEP = 20

// ── Medicine Picker Modal ─────────────────────────────────────────────────────
function MedicinePickerModal({ isOpen, onClose, onConfirm, allMedicines }) {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [checked, setChecked] = useState([])
  const [displayCount, setDisplayCount] = useState(DISPLAY_STEP)
  const observerTarget = useRef(null)

  const categories = ['All', 'Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care']

  const getStockLabel = (med) => {
    if (med.medicineType === 'syrup') return `${med.bottleCount ?? 0} btl · ${med.looseMl ?? 0} ml`
    if (med.medicineType === 'tablet') return `${med.boxCount ?? 0} box · ${med.looseTablets ?? 0} tabs`
    return `${med.stockQuantity ?? 0} ${med.unit ?? ''}`
  }

  // Show ALL medicines — no activity type filter
  const filtered = allMedicines.filter(med => {
    const matchesFilter = activeFilter === 'All' || med.category === activeFilter
    const matchesSearch = !search || med.medicineName?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const displayed = filtered.slice(0, displayCount)
  const hasMore = displayCount < filtered.length

  // Reset display count when search or filter changes
  useEffect(() => { setDisplayCount(DISPLAY_STEP) }, [search, activeFilter])

  // Lazy loading observer
  useEffect(() => {
    if (!isOpen) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          setDisplayCount(prev => prev + DISPLAY_STEP)
        }
      },
      { threshold: 0.1 }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore, isOpen])

  const toggleCheck = (id) =>
    setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleConfirm = () => {
    onConfirm(allMedicines.filter(m => checked.includes(m.id)))
    setSearch(''); setChecked([]); setActiveFilter('All'); setDisplayCount(DISPLAY_STEP)
  }

  const handleClose = () => {
    setSearch(''); setChecked([]); setActiveFilter('All'); setDisplayCount(DISPLAY_STEP)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ height: '80vh', maxHeight: '80vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-200 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">Select Medicines</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {filtered.length} medicine{filtered.length !== 1 ? 's' : ''} available
              {checked.length > 0 && <span className="ml-2 text-blue-600 font-medium">· {checked.length} selected</span>}
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Search + Filter */}
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row gap-2 flex-shrink-0">
          <div className="relative flex-1">
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine name..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus />
          </div>
          <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full sm:w-44 px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700">
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* Table — fixed height, scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">{search ? 'No medicines match your search' : 'No medicines available'}</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm border-collapse">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2.5 text-center w-8 border border-gray-600">
                    <input type="checkbox"
                      checked={checked.length === filtered.length && filtered.length > 0}
                      onChange={() => checked.length === filtered.length
                        ? setChecked([])
                        : setChecked(filtered.map(m => m.id))}
                      className="w-3.5 h-3.5 rounded" />
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Medicine</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Type</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Category</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Stock</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((med, index) => (
                  <tr key={med.id} onClick={() => toggleCheck(med.id)}
                    className={`cursor-pointer transition-colors ${checked.includes(med.id) ? 'bg-blue-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                    <td className="px-2 py-2.5 text-center border border-gray-200" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={checked.includes(med.id)} onChange={() => toggleCheck(med.id)}
                        className="w-3.5 h-3.5 text-blue-600 rounded" />
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200 font-medium text-gray-900">{med.medicineName}</td>
                    <td className="px-3 py-2.5 border border-gray-200 text-gray-600 capitalize">{med.medicineType}</td>
                    <td className="px-3 py-2.5 border border-gray-200 text-gray-600">{med.category}</td>
                    <td className="px-3 py-2.5 border border-gray-200 text-gray-600">{getStockLabel(med)}</td>
                  </tr>
                ))}
                {/* Lazy load trigger row */}
                {hasMore && (
                  <tr ref={observerTarget}>
                    <td colSpan="5" className="px-3 py-3 text-center border border-gray-200">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        <span className="text-xs">Loading more...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <p className="text-xs text-gray-400">
            Showing {displayed.length} of {filtered.length}
          </p>
          <div className="flex gap-2 sm:justify-end">
            <button type="button" onClick={handleClose}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={handleConfirm} disabled={checked.length === 0}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium">
              Add {checked.length > 0 ? `${checked.length} Selected` : 'Selected'}
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
  const [activityTypes, setActivityTypes] = useState(MASTER_DATA_DEFAULTS.activityTypes)
  const [masterPetSpecies, setMasterPetSpecies] = useState(MASTER_DATA_DEFAULTS.petSpecies)
  const [selectedPets, setSelectedPets] = useState(propSelectedPets || [])
  const [showForm, setShowForm] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [allMedicines, setAllMedicines] = useState([])
  const [medicinesLoaded, setMedicinesLoaded] = useState(false)
  const [selectedMedicines, setSelectedMedicines] = useState([])
  const [showMedModal, setShowMedModal] = useState(false)
  const [perPetMode, setPerPetMode] = useState(false)
  const [petMedicines, setPetMedicines] = useState({})
  const [activeMedPetId, setActiveMedPetId] = useState(null)

  const getCurrentDate = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const [formData, setFormData] = useState({
    activityTypes: ['Consultation'],
    date: getCurrentDate(),
    diagnosis: '', treatment: '',
    note: '',                        // ← add this
    hasFollowUp: false, followUpDate: '', followUpNote: ''
  })
  const [petVitals, setPetVitals] = useState({})

  useEffect(() => { loadClients() }, [])
  useEffect(() => {
    getMasterData().then(data => {
      if (data?.activityTypes) setActivityTypes(data.activityTypes)
      if (data?.petSpecies) setMasterPetSpecies(data.petSpecies)
    })
  }, [])

  useEffect(() => {
    if (selectedClient) loadPets()
    else { setPets([]); setSelectedPets([]); onSelectPets([]) }
  }, [selectedClient])

  useEffect(() => {
    if (selectedPets.length > 0) loadActivities()
    else setActivities([])
  }, [selectedPets])

  useEffect(() => { onSelectPets(selectedPets) }, [selectedPets])

  useEffect(() => {
    const v = {}
    selectedPets.forEach(p => { v[p.id] = petVitals[p.id] || { weight: '', temperature: '' } })
    setPetVitals(v)
  }, [selectedPets])

  const loadClients = async () => {
    try { setClients(await getClients()) }
    catch (e) { console.error(e) }
    finally { setLoadingClients(false) }
  }

  const loadPets = async () => {
    setLoadingPets(true)
    try {
      const all = await getPets()
      setPets(all.filter(p => p.clientId === selectedClient.id))
    } catch (e) { console.error(e) }
    finally { setLoadingPets(false) }
  }

  const loadActivities = async () => {
    setLoading(true)
    try {
      const all = []
      for (const pet of selectedPets) {
        const a = await getPetActivities(pet.id)
        all.push(...a)
      }
      all.sort((a, b) => new Date(b.date) - new Date(a.date))
      setActivities(all)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // ← Load medicines ONCE only when modal is first opened
  const handleOpenMedModal = async () => {
    if (!medicinesLoaded) {
      try {
        const d = await getMedicines()
        setAllMedicines(d.filter(m => getTotalStock(m) > 0))
        setMedicinesLoaded(true)
      } catch (e) { console.error(e) }
    }
    setActiveMedPetId(null)
    setShowMedModal(true)
  }

  const handleOpenPetMedModal = async (petId) => {
    if (!medicinesLoaded) {
      try {
        const d = await getMedicines()
        setAllMedicines(d.filter(m => getTotalStock(m) > 0))
        setMedicinesLoaded(true)
      } catch (e) { console.error(e) }
    }
    setActiveMedPetId(petId)
    setShowMedModal(true)
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

  const toggleActivityType = (type) => {
    setFormData(prev => {
      const exists = prev.activityTypes.includes(type)
      if (exists && prev.activityTypes.length === 1) return prev
      return {
        ...prev,
        activityTypes: exists
          ? prev.activityTypes.filter(t => t !== type)
          : [...prev.activityTypes, type]
      }
    })
  }

  const buildMedEntry = (med) => {
    const defaultUnit = getDefaultUnit(med)
    const pricePerUnit = getPricePerUnit(med, defaultUnit)
    return {
      ...med, quantity: 1, sellUnit: defaultUnit, pricePerUnit,
      subtotal: pricePerUnit,
      mlPerBottle: med.mlPerBottle ?? null,
      tabletsPerBox: med.tabletsPerBox ?? null,
      bottleCount: med.bottleCount ?? 0,
      looseMl: med.looseMl ?? 0,
      boxCount: med.boxCount ?? 0,
      looseTablets: med.looseTablets ?? 0
    }
  }

  const handleMedicineModalConfirm = (newMeds) => {
    if (perPetMode && activeMedPetId) {
      setPetMedicines(prev => {
        const existing = prev[activeMedPetId] || []
        const toAdd = newMeds.filter(med => !existing.some(m => m.id === med.id)).map(buildMedEntry)
        return { ...prev, [activeMedPetId]: [...existing, ...toAdd] }
      })
    } else {
      const toAdd = newMeds.filter(med => !selectedMedicines.some(m => m.id === med.id)).map(buildMedEntry)
      setSelectedMedicines(prev => [...prev, ...toAdd])
    }
    setShowMedModal(false)
    setActiveMedPetId(null)
  }

  const handleRemoveMedicine = (id) =>
    setSelectedMedicines(prev => prev.filter(m => m.id !== id))

  const handleMedQty = (id, delta) => {
    setSelectedMedicines(prev => prev.map(m => {
      if (m.id !== id) return m
      const step = (m.sellUnit === 'ml' || m.sellUnit === 'kg' || m.sellUnit === 'tablet') ? 0.5 : 1
      const currentQty = parseFloat(m.quantity)
      const safeQty = Number.isFinite(currentQty) ? currentQty : step
      const newQty = Math.max(step, parseFloat((safeQty + delta * step).toFixed(2)))
      return { ...m, quantity: newQty, subtotal: newQty * (m.pricePerUnit ?? 0) }
    }))
  }

  const handleMedQtyInput = (id, value) => {
    if (value === '' || value === '-' || value === '.' || value === '-.') {
      setSelectedMedicines(prev => prev.map(m =>
        m.id === id ? { ...m, quantity: value } : m
      ))
      return
    }
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return
    setSelectedMedicines(prev => prev.map(m =>
      m.id === id ? { ...m, quantity: value, subtotal: num * (m.pricePerUnit ?? 0) } : m
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

  const handleRemovePetMedicine = (petId, id) =>
    setPetMedicines(prev => ({ ...prev, [petId]: (prev[petId] || []).filter(m => m.id !== id) }))

  const handlePetMedQty = (petId, id, delta) => {
    setPetMedicines(prev => ({
      ...prev,
      [petId]: (prev[petId] || []).map(m => {
        if (m.id !== id) return m
        const step = (m.sellUnit === 'ml' || m.sellUnit === 'kg' || m.sellUnit === 'tablet') ? 0.5 : 1
        const currentQty = parseFloat(m.quantity)
        const safeQty = Number.isFinite(currentQty) ? currentQty : step
        const newQty = Math.max(step, parseFloat((safeQty + delta * step).toFixed(2)))
        return { ...m, quantity: newQty, subtotal: newQty * (m.pricePerUnit ?? 0) }
      })
    }))
  }

  const handlePetMedQtyInput = (petId, id, value) => {
    if (value === '' || value === '-' || value === '.' || value === '-.') {
      setPetMedicines(prev => ({
        ...prev,
        [petId]: (prev[petId] || []).map(m =>
          m.id === id ? { ...m, quantity: value } : m
        )
      }))
      return
    }
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return
    setPetMedicines(prev => ({
      ...prev,
      [petId]: (prev[petId] || []).map(m =>
        m.id === id ? { ...m, quantity: value, subtotal: num * (m.pricePerUnit ?? 0) } : m
      )
    }))
  }

  const handlePetMedUnitChange = (petId, id, newUnit) => {
    const src = allMedicines.find(m => m.id === id)
    if (!src) return
    const newPrice = getPricePerUnit(src, newUnit)
    setPetMedicines(prev => ({
      ...prev,
      [petId]: (prev[petId] || []).map(m =>
        m.id === id ? { ...m, sellUnit: newUnit, pricePerUnit: newPrice, quantity: 1, subtotal: newPrice } : m
      )
    }))
  }

  const handleAddClient = async (data) => {
    setClients(prev => [...prev, data])
    onSelectClient(data)
    setClientSearchQuery(`${data.firstName} ${data.lastName}`)
    setIsAddClientModalOpen(false)
  }

  const handleAddPet = async (data) => {
    setPets(prev => [...prev, data])
    setIsAddPetModalOpen(false)
  }

  const handleClientSelect = (client) => {
    onSelectClient(client)
    setClientSearchQuery(`${client.firstName} ${client.lastName}`)
    setShowClientDropdown(false)
  }

  const togglePetSelection = (pet) => {
    setSelectedPets(prev =>
      prev.some(p => p.id === pet.id)
        ? prev.filter(p => p.id !== pet.id)
        : [...prev, pet]
    )
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
    if (!selectedClient || selectedPets.length === 0) {
      alert('Please select a client and at least one pet')
      return
    }
    setSavingActivity(true)
    try {
      await Promise.all(
        selectedPets.flatMap(pet => {
          const vitals = petVitals[pet.id] || { weight: '', temperature: '' }
          const meds = perPetMode ? (petMedicines[pet.id] || []) : selectedMedicines
          return formData.activityTypes.map(activityType =>
            addPetActivity({
              petId: pet.id,
              petName: pet.name,
              clientId: selectedClient.id,
              clientName: `${selectedClient.firstName} ${selectedClient.lastName}`,
              activityType,
              date: formData.date,
              weight: vitals.weight || '',
              temperature: vitals.temperature || '',
              diagnosis: formData.activityTypes.includes('Consultation') ? (formData.diagnosis || '') : '',
              treatment: formData.activityTypes.includes('Consultation') ? (formData.treatment || '') : '',
              note: (activityType === 'Vaccination' || activityType === 'Deworming') ? (formData.note || '') : '',   // ← add this
              followUpDate: formData.hasFollowUp ? (formData.followUpDate || '') : '',
              followUpNote: formData.hasFollowUp ? (formData.followUpNote || '') : '',
              medicines: meds.map(med => ({
                medicineId: med.id,
                medicineName: med.medicineName,
                quantity: med.quantity,
                unit: med.sellUnit ?? med.unit,
                price: med.pricePerUnit ?? med.sellingPrice ?? 0,
                subtotal: med.subtotal ?? 0
              }))
            })
          )
        })
      )

      setFormData({
        activityTypes: ['Consultation'],
        date: getCurrentDate(),
        diagnosis: '', treatment: '',
        note: '',                    // ← add this
        hasFollowUp: false, followUpDate: '', followUpNote: ''
      })
      setPetVitals({})
      setSelectedMedicines([])
      setPetMedicines({})
      setSuccessMessage(
        `${formData.activityTypes.length} activity type${formData.activityTypes.length > 1 ? 's' : ''} saved for ${selectedPets.length} pet${selectedPets.length > 1 ? 's' : ''}`
      )
      setTimeout(() => setSuccessMessage(''), 3000)
      await loadActivities()
    } catch (e) {
      console.error(e)
      alert('Failed to add activity.')
    } finally {
      setSavingActivity(false)
    }
  }

  const handleContinue = () => {
    if (selectedActivities.length === 0) {
      alert('Please select at least one activity to continue')
      return
    }
    const objs = activities.filter(a => selectedActivities.includes(a.id))
    const allMeds = []
    const seen = new Set()
    objs.forEach(act => (act.medicines || []).forEach(med => {
      if (!seen.has(med.medicineId)) {
        seen.add(med.medicineId)
        allMeds.push({
          id: med.medicineId,
          medicineName: med.medicineName,
          quantity: med.quantity,
          sellUnit: med.unit,
          unit: med.unit,
          pricePerUnit: med.price,
          sellingPrice: med.price,
          subtotal: med.subtotal
        })
      }
    }))
    setConsultationData(objs)
    if (setMedicinesData) setMedicinesData(allMeds)
    onNext()
  }

  const toggleActivitySelection = (id) =>
    setSelectedActivities(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return
    try {
      await deletePetActivity(activityId)
      setActivities(prev => prev.filter(a => a.id !== activityId))
      setSelectedActivities(prev => prev.filter(id => id !== activityId))
    } catch (e) {
      console.error(e)
      alert('Failed to delete activity.')
    }
  }

  const medicinesPerPetAmount = selectedMedicines.reduce((s, m) => s + ((m.pricePerUnit ?? 0) * m.quantity), 0)
  const medicinesTotalAmount = medicinesPerPetAmount * (selectedPets.length || 1)

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-gray-50">

      {(showClientDropdown || showPetDropdown) && (
        <div className="fixed inset-0 z-40"
          onClick={() => { setShowClientDropdown(false); setShowPetDropdown(false) }} />
      )}

      {/* Medicine Modal — no activityTypes prop anymore */}
      <MedicinePickerModal
        isOpen={showMedModal}
        onClose={() => setShowMedModal(false)}
        onConfirm={handleMedicineModalConfirm}
        allMedicines={allMedicines}
      />

      {/* Mobile tabs */}
      <div className="lg:hidden flex border-b border-gray-200 bg-white flex-shrink-0">
        <button onClick={() => setShowForm(true)}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${showForm ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700'}`}>
          Form
        </button>
        <button onClick={() => setShowForm(false)}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${!showForm ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700'}`}>
          Activities
        </button>
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
                  onChange={(e) => {
                    setClientSearchQuery(e.target.value)
                    setShowClientDropdown(true)
                    if (!e.target.value) onSelectClient(null)
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Search client..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8" />
                {selectedClient && (
                  <button type="button"
                    onClick={() => { onSelectClient(null); setClientSearchQuery('') }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                )}
                {showClientDropdown && (
                  <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto"
                    style={{ zIndex: 51 }}>
                    <button type="button"
                      onClick={() => { setIsAddClientModalOpen(true); setShowClientDropdown(false) }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 border-b border-gray-200 text-blue-600 font-medium">
                      <FiPlus className="w-4 h-4" /> Add New Client
                    </button>
                    {filteredClients.length > 0
                      ? filteredClients.map(client => (
                        <button key={client.id} type="button" onClick={() => handleClientSelect(client)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0">
                          <div className="font-medium text-gray-900">{client.firstName} {client.lastName}</div>
                          <div className="text-xs text-gray-500">{client.phoneNumber}</div>
                        </button>
                      ))
                      : <div className="px-3 py-2 text-sm text-gray-400">
                        {clientSearchQuery ? 'No clients found' : 'Type to search...'}
                      </div>
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Pets */}
            <div className="relative" style={{ zIndex: 40 }}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Select Pets {selectedPets.length > 0 &&
                  <span className="text-gray-400 font-normal">({selectedPets.length})</span>}
              </label>
              <div className={`border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 ${!selectedClient ? 'bg-gray-100' : 'bg-white'}`}>
                {selectedPets.length > 0 && (
                  <div className="flex flex-wrap gap-1 px-2 pt-2">
                    {selectedPets.map(pet => (
                      <span key={pet.id}
                        className="inline-flex items-center gap-1 bg-blue-100 border border-blue-200 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                        {pet.name}
                        <button type="button" onClick={() => togglePetSelection(pet)}
                          className="text-blue-400 hover:text-red-500">
                          <FiX className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input type="text" value={petSearchQuery}
                  onChange={(e) => { setPetSearchQuery(e.target.value); setShowPetDropdown(true) }}
                  onFocus={() => { if (selectedClient) setShowPetDropdown(true) }}
                  disabled={!selectedClient}
                  placeholder={selectedClient
                    ? selectedPets.length > 0 ? 'Add more pets...' : 'Search and select pets...'
                    : 'Select an owner first'}
                  className="w-full px-3 py-1.5 text-sm bg-transparent focus:outline-none disabled:cursor-not-allowed disabled:text-gray-400" />
                {showPetDropdown && selectedClient && (
                  <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto"
                    style={{ zIndex: 41 }}>
                    <button type="button"
                      onClick={() => { setIsAddPetModalOpen(true); setShowPetDropdown(false) }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 border-b border-gray-200 text-blue-600 font-medium">
                      <FiPlus className="w-4 h-4" /> Add New Pet
                    </button>
                    {loadingPets
                      ? <div className="px-3 py-2 text-sm text-gray-400">Loading...</div>
                      : filteredPets.length > 0
                        ? filteredPets.map(pet => (
                          <button key={pet.id} type="button" onClick={() => togglePetSelection(pet)}
                            className={`w-full px-3 py-2 text-left text-sm border-b border-gray-100 last:border-0 flex items-center gap-2 ${selectedPets.some(p => p.id === pet.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                            <input type="checkbox" readOnly
                              checked={selectedPets.some(p => p.id === pet.id)}
                              className="w-4 h-4 text-blue-600 rounded pointer-events-none" />
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{pet.name}</div>
                              <div className="text-xs text-gray-500">{pet.species} · {pet.breed}</div>
                            </div>
                          </button>
                        ))
                        : <div className="px-3 py-2 text-sm text-gray-400">
                          {petSearchQuery ? 'No pets found' : 'Type to search...'}
                        </div>
                    }
                  </div>
                )}
              </div>
            </div>

            {selectedClient && selectedPets.length > 0 && (
              <>
                {/* Activity Type (multi-checkbox) + Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Activity Type</label>
                    <div className="border border-gray-300 rounded-md px-3 py-2 space-y-1.5 bg-white">
                      {activityTypes.map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formData.activityTypes.includes(type)}
                            onChange={() => toggleActivityType(type)}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-gray-800">{type}</span>
                        </label>
                      ))}
                    </div>
                    {formData.activityTypes.length > 1 && (
                      <p className="text-xs text-blue-600 mt-1">
                        {formData.activityTypes.length} types — saves {formData.activityTypes.length} records per pet
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                {/* Vitals */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vitals</label>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full min-w-[420px] text-xs">
                        <thead className="bg-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="px-2.5 py-1.5 text-left font-medium text-gray-600">Pet</th>
                            <th className="px-2.5 py-1.5 text-left font-medium text-gray-600">Weight (kg)</th>
                            <th className="px-2.5 py-1.5 text-left font-medium text-gray-600">Temp (°C)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPets.map((pet, index) => (
                            <tr key={pet.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-2.5 py-1.5 font-semibold text-gray-800">{pet.name}</td>
                              <td className="px-2 py-1">
                                <input type="number" step="0.1" min="0"
                                  value={petVitals[pet.id]?.weight || ''}
                                  onChange={(e) => updatePetVital(pet.id, 'weight', e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="0" />
                              </td>
                              <td className="px-2 py-1">
                                <input type="number" step="0.1" min="0"
                                  value={petVitals[pet.id]?.temperature || ''}
                                  onChange={(e) => updatePetVital(pet.id, 'temperature', e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="0" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Diagnosis & Treatment — only when Consultation is checked */}
                {formData.activityTypes.includes('Consultation') && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Diagnosis</label>
                      <textarea value={formData.diagnosis}
                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                        rows="2"
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Enter diagnosis..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Treatment</label>
                      <textarea value={formData.treatment}
                        onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                        rows="2"
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Enter treatment plan..." />
                    </div>
                  </div>
                )}

                {/* Note — only when Vaccination or Deworming is selected */}
                {(formData.activityTypes.includes('Vaccination') || formData.activityTypes.includes('Deworming')) && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Note
                      <span className="ml-1 text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      rows="2"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder={
                        formData.activityTypes.includes('Vaccination') && formData.activityTypes.includes('Deworming')
                          ? 'e.g. Vaccine brand, dewormer dose...'
                          : formData.activityTypes.includes('Vaccination')
                            ? 'e.g. 5-in-1, 1st dose...'
                            : 'e.g. Pyrantel, 2nd dose...'
                      }
                    />
                  </div>
                )}

                {/* Medicines */}
                <div className="border border-gray-200 rounded-md bg-white overflow-hidden">

                  {/* Header row */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Medicines</span>
                      {(() => {
                        const count = perPetMode
                          ? selectedPets.reduce((n, p) => n + (petMedicines[p.id]?.length || 0), 0)
                          : selectedMedicines.length
                        return count > 0 ? (
                          <span className="text-xs font-semibold bg-gray-800 text-white px-1.5 py-0.5 rounded-full leading-none">{count}</span>
                        ) : null
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPets.length > 1 && (
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <span className={`text-xs font-medium transition-colors ${perPetMode ? 'text-gray-700' : 'text-gray-400'}`}>Per pet</span>
                          <button type="button" onClick={() => setPerPetMode(v => !v)}
                            className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${perPetMode ? 'bg-gray-800' : 'bg-gray-300'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${perPetMode ? 'left-4' : 'left-0.5'}`} />
                          </button>
                        </label>
                      )}
                      {!perPetMode && (
                        <button type="button" onClick={handleOpenMedModal}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors">
                          <FiPlus className="w-3 h-3" /> Add
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Shared mode ── */}
                  {!perPetMode && (
                    selectedMedicines.length === 0 ? (
                      <button type="button" onClick={handleOpenMedModal}
                        className="w-full py-4 flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors group">
                        <FiPlus className="w-3.5 h-3.5 group-hover:text-gray-600" />
                        <span className="text-xs">No medicines yet — click to add</span>
                      </button>
                    ) : (
                      <div>
                        {selectedMedicines.map((med, idx) => {
                          const step = (med.sellUnit === 'ml' || med.sellUnit === 'kg' || med.sellUnit === 'tablet') ? 0.5 : 1
                          const subtotal = (med.pricePerUnit ?? 0) * med.quantity
                          return (
                            <div key={med.id} className={`px-3 py-2 ${idx < selectedMedicines.length - 1 ? 'border-b border-gray-100' : ''}`}>
                              {/* Row: name | stepper | price | × */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{med.medicineName}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    ₱{(med.pricePerUnit ?? 0).toLocaleString()}/{med.sellUnit ?? med.unit}
                                    {selectedPets.length > 1 && <span className="text-amber-500 ml-1">× {selectedPets.length}</span>}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button type="button" onClick={() => handleMedQty(med.id, -step)}
                                    className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors bg-white">
                                    <FiMinus className="w-2.5 h-2.5" />
                                  </button>
                                  <input type="text" inputMode="decimal" value={med.quantity}
                                    onChange={(e) => {
                                      const raw = e.target.value
                                      if (raw === '' || raw === '-') { setSelectedMedicines(prev => prev.map(m => m.id === med.id ? { ...m, quantity: raw } : m)); return }
                                      const num = parseFloat(raw)
                                      if (!isNaN(num) && num >= 0) handleMedQtyInput(med.id, raw)
                                    }}
                                    onBlur={(e) => { const num = parseFloat(e.target.value); if (isNaN(num) || num <= 0) setSelectedMedicines(prev => prev.map(m => m.id === med.id ? { ...m, quantity: step } : m)) }}
                                    onFocus={(e) => e.target.select()}
                                    className="w-10 text-center text-xs border border-gray-200 rounded py-1 focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white" />
                                  <button type="button" onClick={() => handleMedQty(med.id, step)}
                                    className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors bg-white">
                                    <FiPlus className="w-2.5 h-2.5" />
                                  </button>
                                  <span className="text-xs text-gray-400 min-w-[28px]">{med.sellUnit ?? med.unit}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {med.editingPrice ? (
                                    <div className="flex items-center gap-1 bg-blue-50 px-2 py-1.5 rounded border border-blue-300">
                                      <span className="text-xs font-semibold text-gray-700">₱</span>
                                      <input type="number" min="0" step="0.01"
                                        value={med.finalPrice !== undefined ? med.finalPrice : subtotal}
                                        onChange={(e) => {
                                          const value = e.target.value
                                          if (value === '') {
                                            setSelectedMedicines(prev => prev.map(m =>
                                              m.id === med.id ? { ...m, finalPrice: '' } : m
                                            ))
                                            return
                                          }
                                          const num = parseFloat(value)
                                          if (isNaN(num) || num < 0) return
                                          setSelectedMedicines(prev => prev.map(m =>
                                            m.id === med.id ? { ...m, finalPrice: num, pricePerUnit: med.quantity > 0 ? num / med.quantity : 0 } : m
                                          ))
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        className="w-14 text-xs font-bold text-right border-0 focus:outline-none bg-transparent [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                                        style={{ appearance: 'none', MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                                        autoFocus />
                                      <button type="button"
                                        onClick={() => setSelectedMedicines(prev => prev.map(m => m.id === med.id ? { ...m, editingPrice: false } : m))}
                                        className="px-1.5 py-0.5 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700 transition-colors">Save</button>
                                    </div>
                                  ) : (
                                    <button type="button" title="Click to edit price"
                                      onClick={() => setSelectedMedicines(prev => prev.map(m => m.id === med.id ? { ...m, editingPrice: true } : m))}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 hover:border-blue-400 transition-all group shadow-sm">
                                      <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 tabular-nums">₱{subtotal.toLocaleString()}</p>
                                        {selectedPets.length > 1 && <p className="text-sm text-gray-500 group-hover:text-blue-600 tabular-nums">₱{(subtotal * selectedPets.length).toLocaleString()} total</p>}
                                      </div>
                                      <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700 whitespace-nowrap">Edit</span>
                                    </button>
                                  )}
                                  <button type="button" onClick={() => handleRemoveMedicine(med.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors">
                                    <FiX className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              {/* Unit toggle for syrup/tablet */}
                              {(med.medicineType === 'syrup' || med.medicineType === 'tablet') && (
                                <div className="flex gap-2 mt-2">
                                  {med.medicineType === 'syrup' ? (
                                    <>
                                      <button type="button" onClick={() => handleMedUnitChange(med.id, 'ml')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md border-2 transition-all ${med.sellUnit === 'ml' ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>ml</button>
                                      <button type="button" onClick={() => handleMedUnitChange(med.id, 'bottle')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md border-2 transition-all ${med.sellUnit === 'bottle' ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>bottle</button>
                                    </>
                                  ) : (
                                    <>
                                      <button type="button" onClick={() => handleMedUnitChange(med.id, 'tablet')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md border-2 transition-all ${med.sellUnit === 'tablet' ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>tablet</button>
                                      <button type="button" onClick={() => handleMedUnitChange(med.id, 'box')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md border-2 transition-all ${med.sellUnit === 'box' ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>box</button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {/* Footer */}
                        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
                          <button type="button" onClick={handleOpenMedModal}
                            className="text-xs font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors">
                            <FiPlus className="w-3 h-3" /> Add more
                          </button>
                          <div className="text-right">
                            <span className="text-xs text-gray-500 mr-1.5">{selectedPets.length > 1 ? `${selectedPets.length} pets` : ''}</span>
                            <span className="text-sm font-bold text-gray-900">₱{medicinesTotalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {/* ── Per-pet mode ── */}
                  {perPetMode && (
                    <div className="bg-white/40">
                      {selectedPets.map((pet, petIdx) => {
                        const meds = petMedicines[pet.id] || []
                        const petTotal = meds.reduce((s, m) => s + ((m.pricePerUnit ?? 0) * m.quantity), 0)
                        return (
                          <div key={pet.id} className={petIdx > 0 ? 'border-t-2 border-amber-200' : ''}>
                            {/* Pet row */}
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-100 to-blue-50 border-b-2 border-blue-200">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                  {pet.species?.[0]?.toUpperCase()}
                                </div>
                                <span className="text-sm font-bold text-gray-900">{pet.name}</span>
                                <span className="text-xs text-gray-600 font-medium">{pet.species}</span>
                                {meds.length > 0 && (
                                  <span className="text-xs font-bold text-blue-700 bg-blue-200 px-2 py-0.5 rounded">· {meds.length}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                {meds.length > 0 && <span className="text-lg font-black text-blue-900">₱{petTotal.toLocaleString()}</span>}
                                <button type="button" onClick={() => handleOpenPetMedModal(pet.id)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm">
                                  <FiPlus className="w-3.5 h-3.5" /> Add
                                </button>
                              </div>
                            </div>
                            {/* Medicines for this pet */}
                            {meds.length === 0 ? (
                              <button type="button" onClick={() => handleOpenPetMedModal(pet.id)}
                                className="w-full py-5 flex items-center justify-center gap-2 text-blue-400 hover:text-blue-600 hover:bg-white/60 transition-all group">
                                <FiPackage className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-medium">Add medicines for {pet.name}</span>
                              </button>
                            ) : (
                              <div>
                                {meds.map((med, medIdx) => {
                                  const step = (med.sellUnit === 'ml' || med.sellUnit === 'kg' || med.sellUnit === 'tablet') ? 0.5 : 1
                                  const subtotal = (med.pricePerUnit ?? 0) * med.quantity
                                  return (
                                    <div key={med.id} className={`px-3.5 py-3 ${medIdx < meds.length - 1 ? 'border-b-2 border-blue-100' : ''} hover:bg-white/80 transition-all`}>
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                          <FiPackage className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-bold text-gray-900 truncate">{med.medicineName}</p>
                                          <p className="text-xs text-gray-600 mt-0.5">
                                            <span className="font-semibold text-blue-700">₱{(med.pricePerUnit ?? 0).toLocaleString()}</span>
                                            <span className="text-gray-500">/{med.sellUnit ?? med.unit}</span>
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0 bg-white rounded-lg px-1.5 py-1 shadow-sm border border-blue-200">
                                          <button type="button" onClick={() => handlePetMedQty(pet.id, med.id, -step)}
                                            className="w-5 h-5 rounded border border-blue-300 flex items-center justify-center text-blue-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all bg-white">
                                            <FiMinus className="w-2.5 h-2.5" />
                                          </button>
                                          <input type="text" inputMode="decimal" value={med.quantity}
                                            onChange={(e) => {
                                              const raw = e.target.value
                                              if (raw === '' || raw === '-') { setPetMedicines(prev => ({ ...prev, [pet.id]: (prev[pet.id] || []).map(m => m.id === med.id ? { ...m, quantity: raw } : m) })); return }
                                              const num = parseFloat(raw)
                                              if (!isNaN(num) && num >= 0) handlePetMedQtyInput(pet.id, med.id, raw)
                                            }}
                                            onBlur={(e) => { const num = parseFloat(e.target.value); if (isNaN(num) || num <= 0) setPetMedicines(prev => ({ ...prev, [pet.id]: (prev[pet.id] || []).map(m => m.id === med.id ? { ...m, quantity: step } : m) })) }}
                                            onFocus={(e) => e.target.select()}
                                            className="w-8 text-center text-xs font-semibold border-0 focus:outline-none focus:ring-0 bg-transparent text-gray-900" />
                                          <button type="button" onClick={() => handlePetMedQty(pet.id, med.id, step)}
                                            className="w-5 h-5 rounded border border-blue-300 flex items-center justify-center text-blue-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all bg-white">
                                            <FiPlus className="w-2.5 h-2.5" />
                                          </button>
                                          <span className="text-xs font-semibold text-blue-700 min-w-[32px]">{med.sellUnit ?? med.unit}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          {med.editingPrice ? (
                                            <div className="flex items-center gap-1 bg-blue-50 px-2 py-1.5 rounded border border-blue-400 shadow-sm">
                                              <span className="text-xs font-bold text-blue-600">₱</span>
                                              <input type="number" min="0" step="0.01"
                                                value={med.finalPrice !== undefined ? med.finalPrice : subtotal}
                                                onChange={(e) => {
                                                  const value = e.target.value
                                                  if (value === '') {
                                                    setPetMedicines(prev => ({ ...prev, [pet.id]: (prev[pet.id] || []).map(m => m.id === med.id ? { ...m, finalPrice: '' } : m) }))
                                                    return
                                                  }
                                                  const num = parseFloat(value)
                                                  if (isNaN(num) || num < 0) return
                                                  setPetMedicines(prev => ({ ...prev, [pet.id]: (prev[pet.id] || []).map(m => m.id === med.id ? { ...m, finalPrice: num, pricePerUnit: med.quantity > 0 ? num / med.quantity : 0 } : m) }))
                                                }}
                                                onFocus={(e) => e.target.select()}
                                                className="w-12 text-xs font-bold text-right border-0 focus:outline-none focus:ring-0 bg-transparent text-blue-600 [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                                                style={{ appearance: 'none', MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                                                autoFocus />
                                              <button type="button"
                                                onClick={() => setPetMedicines(prev => ({ ...prev, [pet.id]: (prev[pet.id] || []).map(m => m.id === med.id ? { ...m, editingPrice: false } : m) }))}
                                                className="px-1.5 py-0.5 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700 transition-colors">Save</button>
                                            </div>
                                          ) : (
                                            <button type="button" title="Click to edit price"
                                              onClick={() => setPetMedicines(prev => ({ ...prev, [pet.id]: (prev[pet.id] || []).map(m => m.id === med.id ? { ...m, editingPrice: true } : m) }))}
                                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-400 rounded-lg hover:from-blue-100 hover:to-blue-200 hover:shadow-md transition-all group shadow">
                                              <div className="text-right">
                                                <p className="text-base font-bold text-gray-900 group-hover:text-blue-800 tabular-nums">₱{subtotal.toLocaleString()}</p>
                                              </div>
                                              <span className="text-xs font-bold text-blue-700 group-hover:text-blue-800 whitespace-nowrap">EDIT</span>
                                            </button>
                                          )}
                                          <button type="button" onClick={() => handleRemovePetMedicine(pet.id, med.id)}
                                            className="text-blue-200 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg p-1.5">
                                            <FiX className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                      {(med.medicineType === 'syrup' || med.medicineType === 'tablet') && (
                                        <div className="flex gap-2 mt-2.5 ml-10">
                                          {med.medicineType === 'syrup' ? (
                                            <>
                                              <button type="button" onClick={() => handlePetMedUnitChange(pet.id, med.id, 'ml')}
                                                className={`px-3 py-1 text-xs rounded-md font-bold transition-all border-2 ${med.sellUnit === 'ml' ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white border-gray-900' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>ml</button>
                                              <button type="button" onClick={() => handlePetMedUnitChange(pet.id, med.id, 'bottle')}
                                                className={`px-3 py-1 text-xs rounded-md font-bold transition-all border-2 ${med.sellUnit === 'bottle' ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white border-gray-900' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>bottle</button>
                                            </>
                                          ) : (
                                            <>
                                              <button type="button" onClick={() => handlePetMedUnitChange(pet.id, med.id, 'tablet')}
                                                className={`px-3 py-1 text-xs rounded-md font-bold transition-all border-2 ${med.sellUnit === 'tablet' ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white border-gray-900' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>tablet</button>
                                              <button type="button" onClick={() => handlePetMedUnitChange(pet.id, med.id, 'box')}
                                                className={`px-3 py-1 text-xs rounded-md font-bold transition-all border-2 ${med.sellUnit === 'box' ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white border-gray-900' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>box</button>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {/* Grand total */}
                      <div className="flex items-center justify-between px-4 py-3.5 border-t-2 border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100">
                        <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">All Pets Total</span>
                        <span className="text-lg font-black text-amber-900 bg-white/60 px-3 py-1.5 rounded-lg">
                          ₱{selectedPets.reduce((sum, pet) =>
                            sum + (petMedicines[pet.id] || []).reduce((s, m) => s + ((m.pricePerUnit ?? 0) * m.quantity), 0), 0
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Follow-up */}
                <div className="border border-gray-200 rounded-md p-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">Follow-up</label>
                    <button type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev, hasFollowUp: !prev.hasFollowUp,
                        followUpDate: '', followUpNote: ''
                      }))}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.hasFollowUp ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${formData.hasFollowUp ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  {formData.hasFollowUp && (
                    <div className="mt-2.5 space-y-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Follow-up Date</label>
                        <input type="date" value={formData.followUpDate}
                          onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Notes</label>
                        <textarea value={formData.followUpNote}
                          onChange={(e) => setFormData({ ...formData, followUpNote: e.target.value })}
                          rows="2" placeholder="e.g. 2nd shot, recheck wound..."
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiPlus className="w-4 h-4" />
                    Add {formData.activityTypes.length > 1
                      ? `${formData.activityTypes.length} Activities`
                      : 'Activity'} for {selectedPets.length} Pet{selectedPets.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL — Activities Table ── */}
        <div className={`${!showForm ? 'flex' : 'hidden'} lg:flex flex-1 flex-col bg-gray-50 min-w-0 overflow-hidden`}>
          <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="font-semibold text-gray-900">Pet Consultations</h3>
              {selectedPets.length > 0 && activities.length > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {activities.length} record{activities.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
            {selectedActivities.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-1 rounded-md">
                {selectedActivities.length} selected
              </span>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
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
              <div className="flex-1 overflow-auto min-h-0">
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[860px] text-xs border-collapse">
                  <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2.5 text-center w-8 border border-gray-600">
                        <input type="checkbox"
                          checked={selectedActivities.length === activities.length && activities.length > 0}
                          onChange={() => selectedActivities.length === activities.length
                            ? setSelectedActivities([])
                            : setSelectedActivities(activities.map(a => a.id))}
                          className="w-3.5 h-3.5 rounded" />
                      </th>
                      <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Pet</th>
                      <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Date</th>
                      <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Type</th>
                      <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600 hidden md:table-cell">Vitals</th>
                      <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600 hidden lg:table-cell">Details</th>
                      <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600 hidden xl:table-cell">Medicines</th>
                      <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600 hidden sm:table-cell">Follow-up</th>
                      <th className="px-2 py-2.5 text-center border border-gray-600 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPets.map((pet) => {
                      const petActivities = activities.filter(a => a.petId === pet.id)
                      return (
                        <React.Fragment key={pet.id}>
                          <tr>
                            <td colSpan="9" className="px-3 py-1.5 bg-gray-100 border border-gray-300">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{pet.name}</span>
                                <span className="text-xs text-gray-400">{pet.species} · {pet.breed}</span>
                                <span className="ml-auto text-xs text-gray-400">
                                  {petActivities.length} record{petActivities.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </td>
                          </tr>
                          {petActivities.length === 0 ? (
                            <tr>
                              <td colSpan="9" className="px-3 py-2.5 text-center text-gray-400 border border-gray-200">
                                No activities yet
                              </td>
                            </tr>
                          ) : (
                            petActivities.map((activity, index) => (
                              <tr key={activity.id || `${pet.id}-${index}`}
                                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors cursor-pointer`}
                                onClick={() => toggleActivitySelection(activity.id)}>
                                <td className="px-2 py-2.5 text-center border border-gray-200" onClick={e => e.stopPropagation()}>
                                  <input type="checkbox"
                                    checked={selectedActivities.includes(activity.id)}
                                    onChange={() => toggleActivitySelection(activity.id)}
                                    className="w-3.5 h-3.5 text-blue-600 rounded" />
                                </td>
                                <td className="px-3 py-2.5 border border-gray-200 font-medium text-gray-900">{pet.name}</td>
                                <td className="px-3 py-2.5 border border-gray-200 text-gray-600 whitespace-nowrap">
                                  {new Date(activity.date).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric'
                                  })}
                                </td>
                                <td className="px-3 py-2.5 border border-gray-200">
                                  <span className="text-xs font-medium text-gray-800">{activity.activityType}</span>
                                </td>
                                <td className="px-3 py-2.5 border border-gray-200 text-gray-600 hidden md:table-cell">
                                  {activity.weight && <div>Wt: {activity.weight} kg</div>}
                                  {activity.temperature && <div>Temp: {activity.temperature}°C</div>}
                                  {!activity.weight && !activity.temperature && <span className="text-gray-400">—</span>}
                                </td>
                                <td className="px-3 py-2.5 border border-gray-200 text-gray-600 hidden lg:table-cell max-w-[180px]">
                                  {activity.diagnosis && <div className="truncate" title={activity.diagnosis}>{activity.diagnosis}</div>}
                                  {activity.treatment && <div className="truncate text-gray-500" title={activity.treatment}>{activity.treatment}</div>}
                                  {activity.note && <div className="truncate text-gray-500 italic" title={activity.note}>Note: {activity.note}</div>}
                                  {!activity.diagnosis && !activity.treatment && !activity.note && <span className="text-gray-400">—</span>}
                                </td>
                                <td className="px-3 py-2.5 border border-gray-200 text-gray-600 hidden xl:table-cell">
                                  {activity.medicines?.length > 0
                                    ? activity.medicines.map((med, idx) => (
                                      <div key={idx}>
                                        <span className="font-medium text-gray-800">{med.medicineName}</span>
                                        <span className="text-gray-500"> × {med.quantity} {med.unit}</span>
                                      </div>
                                    ))
                                    : <span className="text-gray-400">—</span>}
                                </td>
                                <td className="px-3 py-2.5 border border-gray-200 hidden sm:table-cell">
                                  {activity.followUpDate ? (
                                    <div>
                                      <p className="whitespace-nowrap font-medium text-gray-800">
                                        {new Date(activity.followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                      {activity.followUpNote
                                        ? <p className="text-xs text-gray-500 mt-0.5 max-w-[160px] break-words">{activity.followUpNote}</p>
                                        : <p className="text-xs text-gray-400 mt-0.5">No notes</p>}
                                    </div>
                                  ) : <span className="text-gray-400">—</span>}
                                </td>
                                <td className="px-2 py-2.5 text-center border border-gray-200" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleDeleteActivity(activity.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors p-0.5 rounded hover:bg-red-50"
                                    title="Delete activity">
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
            <button onClick={handleContinue} disabled={selectedActivities.length === 0}
              className="w-full px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed">
              {selectedActivities.length === 0 ? 'Select activities to continue' : `Continue to Summary (${selectedActivities.length} selected)`}
            </button>
          </div>
        </div>

      </div>

      {/* Modals — only once */}
      <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setIsAddClientModalOpen(false)}
        onSubmit={handleAddClient} clientData={newClient} setClientData={setNewClient} />
      <AddPetModal isOpen={isAddPetModalOpen} onClose={() => setIsAddPetModalOpen(false)}
        onSubmit={handleAddPet} petData={newPet} setPetData={setNewPet} selectedClient={selectedClient} speciesList={masterPetSpecies} />

    </div>
  )
}

export default DetailsStep
// MasterData.jsx
import { useState, useEffect } from 'react'
import { FiPlus, FiX, FiSave, FiCheck, FiRefreshCw } from 'react-icons/fi'
import { getMasterData, saveMasterData, MASTER_DATA_DEFAULTS } from '../firebase/services'

function CategorySection({ title, description, items, onRemove, onAdd, newValue, setNewValue, note }) {
  const handleAdd = () => {
    const trimmed = newValue.trim()
    if (!trimmed || items.map(i => i.toLowerCase()).includes(trimmed.toLowerCase())) return
    onAdd(trimmed)
    setNewValue('')
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5 leading-tight">{description}</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0">
          {items.length}
        </span>
      </div>

      <div className="p-3">
        <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 bg-gray-50 rounded-md border border-gray-100">
          {items.length === 0 && (
            <p className="text-xs text-gray-400 italic self-center">No items yet.</p>
          )}
          {items.map((item, index) => (
            <span key={index} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-900 text-white rounded-full text-xs font-medium">
              {item}
              <button type="button" onClick={() => onRemove(index)} className="opacity-60 hover:opacity-100 transition-opacity">
                <FiX className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-1.5 mt-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add new item..."
            className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newValue.trim() || items.map(i => i.toLowerCase()).includes(newValue.trim().toLowerCase())}
            className="px-2.5 py-1.5 bg-gray-900 text-white rounded-md text-xs hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
          >
            <FiPlus className="w-3 h-3" />
            Add
          </button>
        </div>

        {note && (
          <p className="text-xs text-gray-400 mt-2 leading-tight">{note}</p>
        )}
      </div>
    </div>
  )
}

function MedicineFormsSection({ forms, onChange }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-gray-900">Medicine Forms</h3>
          <p className="text-xs text-gray-400 mt-0.5 leading-tight">Labels shown in the Medicine Form dropdown</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0">
          {Object.keys(forms).length}
        </span>
      </div>
      <div className="p-3">
        <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 bg-gray-50 rounded-md border border-gray-100">
          {Object.values(forms).map((label, i) => (
            <span key={i} className="px-2.5 py-0.5 bg-gray-900 text-white rounded-full text-xs font-medium">
              {label}
            </span>
          ))}
        </div>
        <div className="space-y-1.5 mt-2">
          {Object.entries(forms).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-10 capitalize flex-shrink-0">{key}</span>
              <input
                type="text"
                value={label}
                onChange={(e) => onChange({ ...forms, [key]: e.target.value })}
                className="flex-1 px-2.5 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 leading-tight">Fixed types — only labels can be renamed.</p>
      </div>
    </div>
  )
}

function MasterData() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const [consultationFee, setConsultationFee] = useState(MASTER_DATA_DEFAULTS.consultationFee)
  const [medicineCategories, setMedicineCategories] = useState([...MASTER_DATA_DEFAULTS.medicineCategories])
  const [storeCategories, setStoreCategories] = useState([...MASTER_DATA_DEFAULTS.storeCategories])
  const [activityTypes, setActivityTypes] = useState([...MASTER_DATA_DEFAULTS.activityTypes])
  const [petSpecies, setPetSpecies] = useState([...MASTER_DATA_DEFAULTS.petSpecies])
  const [packUnits, setPackUnits] = useState([...MASTER_DATA_DEFAULTS.packUnits])
  const [subUnits, setSubUnits] = useState([...MASTER_DATA_DEFAULTS.subUnits])
  const [brands, setBrands] = useState([...MASTER_DATA_DEFAULTS.brands])
  const [expenseCategories, setExpenseCategories] = useState([...MASTER_DATA_DEFAULTS.expenseCategories])
  const [medicineForms, setMedicineForms] = useState({ ...MASTER_DATA_DEFAULTS.medicineForms })
  const [lowStockThreshold, setLowStockThreshold] = useState(MASTER_DATA_DEFAULTS.lowStockThreshold)
  const [clinicName, setClinicName] = useState(MASTER_DATA_DEFAULTS.clinicName)
  const [clinicAddress, setClinicAddress] = useState(MASTER_DATA_DEFAULTS.clinicAddress)
  const [clinicPhone, setClinicPhone] = useState(MASTER_DATA_DEFAULTS.clinicPhone)
  const [attendingVeterinarian, setAttendingVeterinarian] = useState(MASTER_DATA_DEFAULTS.attendingVeterinarian)

  const [newMedCategory, setNewMedCategory] = useState('')
  const [newStoreCategory, setNewStoreCategory] = useState('')
  const [newActivityType, setNewActivityType] = useState('')
  const [newSpecies, setNewSpecies] = useState('')
  const [newPackUnit, setNewPackUnit] = useState('')
  const [newSubUnit, setNewSubUnit] = useState('')
  const [newBrand, setNewBrand] = useState('')
  const [newExpenseCategory, setNewExpenseCategory] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getMasterData()
      if (data) {
        setConsultationFee(data.consultationFee ?? MASTER_DATA_DEFAULTS.consultationFee)
        setMedicineCategories(data.medicineCategories ?? [...MASTER_DATA_DEFAULTS.medicineCategories])
        setStoreCategories(data.storeCategories ?? [...MASTER_DATA_DEFAULTS.storeCategories])
        setActivityTypes(data.activityTypes ?? [...MASTER_DATA_DEFAULTS.activityTypes])
        setPetSpecies(data.petSpecies ?? [...MASTER_DATA_DEFAULTS.petSpecies])
        setPackUnits(data.packUnits ?? [...MASTER_DATA_DEFAULTS.packUnits])
        setSubUnits(data.subUnits ?? [...MASTER_DATA_DEFAULTS.subUnits])
        setBrands(data.brands ?? [...MASTER_DATA_DEFAULTS.brands])
        setExpenseCategories(data.expenseCategories ?? [...MASTER_DATA_DEFAULTS.expenseCategories])
        setMedicineForms(data.medicineForms ?? { ...MASTER_DATA_DEFAULTS.medicineForms })
        setLowStockThreshold(data.lowStockThreshold ?? MASTER_DATA_DEFAULTS.lowStockThreshold)
        setClinicName(data.clinicName ?? MASTER_DATA_DEFAULTS.clinicName)
        setClinicAddress(data.clinicAddress ?? MASTER_DATA_DEFAULTS.clinicAddress)
        setClinicPhone(data.clinicPhone ?? MASTER_DATA_DEFAULTS.clinicPhone)
        setAttendingVeterinarian(data.attendingVeterinarian ?? MASTER_DATA_DEFAULTS.attendingVeterinarian)
      }
    } catch (error) {
      console.error('Error loading master data:', error)
    } finally {
      setLoading(false)
      setIsDirty(false)
    }
  }

  const markDirty = () => setIsDirty(true)

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await saveMasterData({
        consultationFee: parseFloat(consultationFee) || 0,
        medicineCategories,
        storeCategories,
        activityTypes,
        petSpecies,
        packUnits,
        subUnits,
        brands,
        expenseCategories,
        medicineForms,
        lowStockThreshold: parseInt(lowStockThreshold) || 10,
        clinicName,
        clinicAddress,
        clinicPhone,
        attendingVeterinarian,
      })
      setSaved(true)
      setIsDirty(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetAll = () => {
    if (!confirm('Reset ALL settings to default values?')) return
    setConsultationFee(MASTER_DATA_DEFAULTS.consultationFee)
    setMedicineCategories([...MASTER_DATA_DEFAULTS.medicineCategories])
    setStoreCategories([...MASTER_DATA_DEFAULTS.storeCategories])
    setActivityTypes([...MASTER_DATA_DEFAULTS.activityTypes])
    setPetSpecies([...MASTER_DATA_DEFAULTS.petSpecies])
    setPackUnits([...MASTER_DATA_DEFAULTS.packUnits])
    setSubUnits([...MASTER_DATA_DEFAULTS.subUnits])
    setExpenseCategories([...MASTER_DATA_DEFAULTS.expenseCategories])
    setMedicineForms({ ...MASTER_DATA_DEFAULTS.medicineForms })
    setBrands([...MASTER_DATA_DEFAULTS.brands])
    setLowStockThreshold(MASTER_DATA_DEFAULTS.lowStockThreshold)
    setClinicName(MASTER_DATA_DEFAULTS.clinicName)
    setClinicAddress(MASTER_DATA_DEFAULTS.clinicAddress)
    setClinicPhone(MASTER_DATA_DEFAULTS.clinicPhone)
    setAttendingVeterinarian(MASTER_DATA_DEFAULTS.attendingVeterinarian)
    markDirty()
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">Master Data</h1>
            {isDirty && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Unsaved changes
              </span>
            )}
            {saved && (
              <span className="text-xs text-green-700 font-medium flex items-center gap-1.5">
                <FiCheck className="w-3 h-3" /> Saved!
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              Reset All
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving || !isDirty}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSave className="w-3.5 h-3.5" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-4">

          {/* Settings strip — all scalar settings in one row */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Clinic & Settings</p>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Clinic Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => { setClinicName(e.target.value); markDirty() }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="Clinic Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={clinicAddress}
                  onChange={(e) => { setClinicAddress(e.target.value); markDirty() }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="Address"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone / Contact</label>
                <input
                  type="text"
                  value={clinicPhone}
                  onChange={(e) => { setClinicPhone(e.target.value); markDirty() }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="Phone Number"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Attending Veterinarian</label>
                <input
                  type="text"
                  value={attendingVeterinarian}
                  onChange={(e) => { setAttendingVeterinarian(e.target.value); markDirty() }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="Vet Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Consultation Fee <span className="text-gray-400 font-normal">(₱ per pet)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={consultationFee}
                  onChange={(e) => { setConsultationFee(e.target.value); markDirty() }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Low Stock Threshold <span className="text-gray-400 font-normal">(units)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={lowStockThreshold}
                  onChange={(e) => { setLowStockThreshold(e.target.value); markDirty() }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* Category sections — 3-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <MedicineFormsSection
              forms={medicineForms}
              onChange={(val) => { setMedicineForms(val); markDirty() }}
            />
            <CategorySection
              title="Medicine Categories"
              description="Used when adding or editing medicines in inventory"
              items={medicineCategories}
              onRemove={(i) => { setMedicineCategories(prev => prev.filter((_, idx) => idx !== i)); markDirty() }}
              onAdd={(val) => { setMedicineCategories(prev => [...prev, val]); markDirty() }}
              newValue={newMedCategory}
              setNewValue={setNewMedCategory}
            />
            <CategorySection
              title="Store Item Categories"
              description="Used in petstore and inventory for store products"
              items={storeCategories}
              onRemove={(i) => { setStoreCategories(prev => prev.filter((_, idx) => idx !== i)); markDirty() }}
              onAdd={(val) => { setStoreCategories(prev => [...prev, val]); markDirty() }}
              newValue={newStoreCategory}
              setNewValue={setNewStoreCategory}
              note='"Dog Food", "Cat Food", "Bird Food" enable kg/sack dual-stock tracking.'
            />
            <CategorySection
              title="Activity Types"
              description="Options when recording a new consultation"
              items={activityTypes}
              onRemove={(i) => { setActivityTypes(prev => prev.filter((_, idx) => idx !== i)); markDirty() }}
              onAdd={(val) => { setActivityTypes(prev => [...prev, val]); markDirty() }}
              newValue={newActivityType}
              setNewValue={setNewActivityType}
              note='"Vaccination" and "Deworming" have an optional note field.'
            />
            <CategorySection
              title="Pet Species"
              description="Shown in the species dropdown when adding a new pet"
              items={petSpecies}
              onRemove={(i) => { setPetSpecies(prev => prev.filter((_, idx) => idx !== i)); markDirty() }}
              onAdd={(val) => { setPetSpecies(prev => [...prev, val]); markDirty() }}
              newValue={newSpecies}
              setNewValue={setNewSpecies}
            />
            <CategorySection
              title="Pack Units"
              description="Container units used in Purchase Orders (e.g. bottle, box, sack)"
              items={packUnits}
              onRemove={(i) => { setPackUnits(prev => prev.filter((_, idx) => idx !== i)); markDirty() }}
              onAdd={(val) => { setPackUnits(prev => [...prev, val.toLowerCase()]); markDirty() }}
              newValue={newPackUnit}
              setNewValue={setNewPackUnit}
            />
            <CategorySection
              title="Sub Units"
              description="Measurement units inside a pack (e.g. ml, tablet, kg)"
              items={subUnits}
              onRemove={(i) => { setSubUnits(prev => prev.filter((_, idx) => idx !== i)); markDirty() }}
              onAdd={(val) => { setSubUnits(prev => [...prev, val.toLowerCase()]); markDirty() }}
              newValue={newSubUnit}
              setNewValue={setNewSubUnit}
            />
            <CategorySection
              title="Brands"
              description="Product brands used in Purchase Orders and inventory"
              items={brands}
              onRemove={(i) => { setBrands(prev => prev.filter((_, idx) => idx !== i)); markDirty() }}
              onAdd={(val) => { setBrands(prev => [...prev, val]); markDirty() }}
              newValue={newBrand}
              setNewValue={setNewBrand}
            />
            <CategorySection
              title="Expense Categories"
              description="Categories available when logging an expense"
              items={expenseCategories}
              onRemove={(i) => { setExpenseCategories(prev => prev.filter((_, idx) => idx !== i)); markDirty() }}
              onAdd={(val) => { setExpenseCategories(prev => [...prev, val]); markDirty() }}
              newValue={newExpenseCategory}
              setNewValue={setNewExpenseCategory}
            />
          </div>

        </div>
      </div>
    </div>
  )
}

export default MasterData
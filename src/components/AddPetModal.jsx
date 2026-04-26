// src/components/AddPetModal.jsx
import { FiX, FiPlus, FiChevronDown, FiTrash2 } from 'react-icons/fi'
import { addPet, getMasterData, saveMasterData, MASTER_DATA_DEFAULTS } from '../firebase/services'
import { useState, useEffect, useRef } from 'react'

// ── Dropdown Component for Species/Breed ──────────────────────────────────────
function ItemDropdown({ label, value, onChange, items, onItemsChange, placeholder = 'Select or type...' }) {
  const [open, setOpen] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [lastAddedItem, setLastAddedItem] = useState(null)
  const [savedMessage, setSavedMessage] = useState(false)
  const ref = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false)
        setNewItem('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAdd = async () => {
    const trimmed = newItem.trim()
    if (!trimmed) return
    if (items.includes(trimmed)) {
      onChange(trimmed)
      setNewItem('')
      setOpen(false)
      return
    }

    try {
      const updatedItems = [...items, trimmed]
      onItemsChange(updatedItems)
      
      // Save to master data
      if (label === 'Species') {
        await saveMasterData({ petSpecies: updatedItems })
      } else if (label === 'Breed') {
        await saveMasterData({ petBreeds: updatedItems })
      }
      
      onChange(trimmed)
      setLastAddedItem(trimmed)
      setSavedMessage(true)
      setNewItem('')
      setTimeout(() => {
        setOpen(false)
        setLastAddedItem(null)
        setSavedMessage(false)
      }, 1500)
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Failed to add item.')
    }
  }

  const handleDelete = async (item, e) => {
    e.stopPropagation()
    e.preventDefault()
    
    try {
      const updatedItems = items.filter(i => i !== item)
      onItemsChange(updatedItems)
      
      // Save to master data
      if (label === 'Species') {
        await saveMasterData({ petSpecies: updatedItems })
      } else if (label === 'Breed') {
        await saveMasterData({ petBreeds: updatedItems })
      }
      
      if (value === item) onChange('')
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item.')
    }
  }

  const handleSelect = (item) => {
    onChange(item)
    setOpen(false)
    setNewItem('')
  }

  return (
    <div ref={ref} className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} *</label>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setNewItem('') }}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-xl z-50"
        >
          {savedMessage && (
            <div className="px-3 py-2 bg-green-50 border-b border-green-200 text-xs text-green-700 font-medium flex items-center gap-1.5">
              <span className="w-4 h-4 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">✓</span>
              Saved to Master Data
            </div>
          )}

          <div className="flex items-center gap-1.5 p-2 border-b border-gray-100 bg-gray-50">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
                if (e.key === 'Escape') { setOpen(false); setNewItem('') }
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder={`Type new ${label.toLowerCase()}...`}
              className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={(e) => { e.stopPropagation(); handleAdd() }}
              disabled={!newItem.trim()}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <FiPlus className="w-3 h-3" />
              Add
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No items yet. Add one above.</p>
            ) : (
              items.map(item => {
                const isSelected = value === item
                const isNewlyAdded = item === lastAddedItem
                return (
                  <div
                    key={item}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer group transition-colors
                      ${isNewlyAdded ? 'bg-green-100 border-l-3 border-green-600' : isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm ${isNewlyAdded ? 'text-green-700 font-semibold' : isSelected ? 'text-blue-700 font-semibold' : 'text-gray-800'}`}>
                        {item}
                      </span>
                      {isNewlyAdded && <span className="text-xs font-medium text-green-700">NEW</span>}
                    </div>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                      onClick={(e) => handleDelete(item, e)}
                      className="flex items-center gap-1 px-1.5 py-0.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete this item"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main AddPetModal Component ────────────────────────────────────────────────
function AddPetModal({ isOpen, onClose, onSubmit, petData, setPetData, selectedClient, speciesList }) {
  const [isSaving, setIsSaving] = useState(false)
  const [species, setSpecies] = useState([...MASTER_DATA_DEFAULTS.petSpecies])
  const [breeds, setBreeds] = useState([...MASTER_DATA_DEFAULTS.petBreeds])

  // Load master data on mount
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const data = await getMasterData()
        if (data) {
          if (data.petSpecies?.length) setSpecies(data.petSpecies)
          if (data.petBreeds?.length) setBreeds(data.petBreeds)
        }
      } catch (error) {
        console.error('Error loading master data:', error)
      }
    }
    loadMasterData()
  }, [])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedClient) {
      alert('Please select a client first')
      return
    }
    setIsSaving(true)
    try {
      const newPet = await addPet({
        name: petData.name,
        species: petData.species,
        breed: petData.breed,
        dateOfBirth: petData.dateOfBirth,
        clientId: selectedClient.id
      })
      onSubmit(newPet)
      setPetData({ name: '', species: '', breed: '', dateOfBirth: '' })
    } catch (error) {
      console.error('Error adding pet:', error)
      alert('Failed to add pet. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Add New Pet</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pet Name *
              </label>
              <input
                type="text"
                required
                value={petData.name}
                onChange={(e) => setPetData({ ...petData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Max"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ItemDropdown
                label="Species"
                value={petData.species}
                onChange={(val) => setPetData({ ...petData, species: val })}
                items={species}
                onItemsChange={setSpecies}
                placeholder="Select species..."
              />

              <ItemDropdown
                label="Breed"
                value={petData.breed}
                onChange={(val) => setPetData({ ...petData, breed: val })}
                items={breeds}
                onItemsChange={setBreeds}
                placeholder="Select breed..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={petData.dateOfBirth}
                onChange={(e) => setPetData({ ...petData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isSaving ? 'Adding...' : 'Add Pet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddPetModal
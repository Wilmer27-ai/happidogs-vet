// MedicinesStocks.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiX, FiTrash2, FiSave, FiClock, FiPackage, FiAlertCircle, FiPlus, FiChevronDown } from 'react-icons/fi'
import { getMedicines, getStoreItems, addMedicine, addStoreItem, updateMedicine, updateStoreItem, deleteMedicine, deleteStoreItem, logStockEdit, getMasterData, saveMasterData, MASTER_DATA_DEFAULTS } from '../firebase/services'

// ── Reusable Unit Dropdown with Add / Delete ──────────────────────────────────
function UnitDropdown({ label, value, onChange, units, onUnitsChange, placeholder = 'Select or type...' }) {
  const [open, setOpen] = useState(false)
  const [newUnit, setNewUnit] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState({})
  const [lastAddedUnit, setLastAddedUnit] = useState(null)
  const [savedMessage, setSavedMessage] = useState(false)
  const ref = useRef(null)
  const dropdownRef = useRef(null)

  const updatePosition = () => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    })
  }

  useEffect(() => {
    if (!open) return
    const frameId = requestAnimationFrame(() => {
      updatePosition()
    })
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  useEffect(() => {
    const handler = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false)
        setNewUnit('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAdd = () => {
    const trimmed = newUnit.trim().toLowerCase()
    if (!trimmed) return
    if (units.includes(trimmed)) {
      onChange(trimmed)
      setNewUnit('')
      setOpen(false)
      return
    }
    onUnitsChange([...units, trimmed])
    onChange(trimmed)
    setLastAddedUnit(trimmed)
    setSavedMessage(true)
    setNewUnit('')
    setTimeout(() => {
      setOpen(false)
      setLastAddedUnit(null)
      setSavedMessage(false)
    }, 1500)
  }

  const handleDelete = (unit, e) => {
    e.stopPropagation()
    e.preventDefault()
    onUnitsChange(units.filter(u => u !== unit))
    if (value === unit) onChange('')
  }

  const handleSelect = (unit) => {
    onChange(unit)
    setOpen(false)
    setNewUnit('')
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setNewUnit('') }}
        className="w-full flex items-center justify-between px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-blue-400 transition-colors"
      >
        <span className={value ? 'text-gray-900 capitalize' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <FiChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-2xl z-50"
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
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
                if (e.key === 'Escape') { setOpen(false); setNewUnit('') }
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Type new unit name..."
              className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={(e) => { e.stopPropagation(); handleAdd() }}
              disabled={!newUnit.trim()}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <FiPlus className="w-3 h-3" />
              Add
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {units.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No units yet. Add one above.</p>
            ) : (
              units.map(unit => {
                const isSelected = value === unit
                const isNewlyAdded = unit === lastAddedUnit
                return (
                  <div
                    key={unit}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer group transition-colors
                      ${isNewlyAdded ? 'bg-green-100 border-l-3 border-green-600' : isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => handleSelect(unit)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs capitalize ${isNewlyAdded ? 'text-green-700 font-semibold' : isSelected ? 'text-blue-700 font-semibold' : 'text-gray-800'}`}>
                        {unit}
                      </span>
                      {isNewlyAdded && <span className="text-xs font-medium text-green-700">NEW</span>}
                    </div>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                      onClick={(e) => handleDelete(unit, e)}
                      className="flex items-center gap-1 px-1.5 py-0.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete this unit"
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

// ── Reusable Category Dropdown with Add / Delete ──────────────────────────────
function CategoryDropdown({ label, value, onChange, categories, onCategoriesChange, placeholder = 'Select or type...' }) {
  const [open, setOpen] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState({})
  const [lastAddedCategory, setLastAddedCategory] = useState(null)
  const [savedMessage, setSavedMessage] = useState(false)
  const ref = useRef(null)
  const dropdownRef = useRef(null)

  const updatePosition = () => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    })
  }

  useEffect(() => {
    if (!open) return
    const frameId = requestAnimationFrame(() => {
      updatePosition()
    })
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  useEffect(() => {
    const handler = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false)
        setNewCategory('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAdd = () => {
    const trimmed = newCategory.trim()
    if (!trimmed) return
    if (categories.includes(trimmed)) {
      onChange(trimmed)
      setNewCategory('')
      setOpen(false)
      return
    }
    onCategoriesChange([...categories, trimmed])
    onChange(trimmed)
    setLastAddedCategory(trimmed)
    setSavedMessage(true)
    setNewCategory('')
    setTimeout(() => {
      setOpen(false)
      setLastAddedCategory(null)
      setSavedMessage(false)
    }, 1500)
  }

  const handleDelete = (category, e) => {
    e.stopPropagation()
    e.preventDefault()
    onCategoriesChange(categories.filter(c => c !== category))
    if (value === category) onChange('')
  }

  const handleSelect = (category) => {
    onChange(category)
    setOpen(false)
    setNewCategory('')
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setNewCategory('') }}
        className="w-full flex items-center justify-between px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-blue-400 transition-colors"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <FiChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-2xl z-50"
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
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
                if (e.key === 'Escape') { setOpen(false); setNewCategory('') }
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Type new category..."
              className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={(e) => { e.stopPropagation(); handleAdd() }}
              disabled={!newCategory.trim()}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <FiPlus className="w-3 h-3" />
              Add
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No categories yet. Add one above.</p>
            ) : (
              categories.map(category => {
                const isSelected = value === category
                const isNewlyAdded = category === lastAddedCategory
                return (
                  <div
                    key={category}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer group transition-colors
                      ${isNewlyAdded ? 'bg-green-100 border-l-3 border-green-600' : isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => handleSelect(category)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs ${isNewlyAdded ? 'text-green-700 font-semibold' : isSelected ? 'text-blue-700 font-semibold' : 'text-gray-800'}`}>
                        {category}
                      </span>
                      {isNewlyAdded && <span className="text-xs font-medium text-green-700">NEW</span>}
                    </div>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                      onClick={(e) => handleDelete(category, e)}
                      className="flex items-center gap-1 px-1.5 py-0.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete this category"
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

// ── Reusable Brand Dropdown with Add / Delete ────────────────────────────────
function BrandDropdown({ label, value, onChange, brands, onBrandsChange, placeholder = 'Select or type...' }) {
  const [open, setOpen] = useState(false)
  const [newBrand, setNewBrand] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState({})
  const [lastAddedBrand, setLastAddedBrand] = useState(null)
  const [savedMessage, setSavedMessage] = useState(false)
  const ref = useRef(null)
  const dropdownRef = useRef(null)

  const updatePosition = () => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    })
  }

  useEffect(() => {
    if (!open) return
    const frameId = requestAnimationFrame(() => {
      updatePosition()
    })
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  useEffect(() => {
    const handler = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false)
        setNewBrand('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAdd = () => {
    const trimmed = newBrand.trim()
    if (!trimmed) return
    if (brands.includes(trimmed)) {
      onChange(trimmed)
      setNewBrand('')
      setOpen(false)
      return
    }
    onBrandsChange([...brands, trimmed])
    onChange(trimmed)
    setLastAddedBrand(trimmed)
    setSavedMessage(true)
    setNewBrand('')
    setTimeout(() => {
      setOpen(false)
      setLastAddedBrand(null)
      setSavedMessage(false)
    }, 1500)
  }

  const handleDelete = (brand, e) => {
    e.stopPropagation()
    e.preventDefault()
    onBrandsChange(brands.filter(b => b !== brand))
    if (value === brand) onChange('')
  }

  const handleSelect = (brand) => {
    onChange(brand)
    setOpen(false)
    setNewBrand('')
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setNewBrand('') }}
        className="w-full flex items-center justify-between px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-blue-400 transition-colors"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <FiChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-2xl z-50"
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
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
                if (e.key === 'Escape') { setOpen(false); setNewBrand('') }
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Type new brand..."
              className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={(e) => { e.stopPropagation(); handleAdd() }}
              disabled={!newBrand.trim()}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <FiPlus className="w-3 h-3" />
              Add
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {brands.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No brands yet. Add one above.</p>
            ) : (
              brands.map(brand => {
                const isSelected = value === brand
                const isNewlyAdded = brand === lastAddedBrand
                return (
                  <div
                    key={brand}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer group transition-colors
                      ${isNewlyAdded ? 'bg-green-100 border-l-3 border-green-600' : isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => handleSelect(brand)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs ${isNewlyAdded ? 'text-green-700 font-semibold' : isSelected ? 'text-blue-700 font-semibold' : 'text-gray-800'}`}>
                        {brand}
                      </span>
                      {isNewlyAdded && <span className="text-xs font-medium text-green-700">NEW</span>}
                    </div>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                      onClick={(e) => handleDelete(brand, e)}
                      className="flex items-center gap-1 px-1.5 py-0.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete this brand"
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

// ── Add Stock Modal ───────────────────────────────────────────────────────
function AddStockModal({ isOpen, onClose, onSave, medicineCategories: propMedCategories, storeCategories: propStoreCategories, medicineForms: propMedicineForms, packUnits: propPackUnits, subUnits: propSubUnits, onPackUnitsChange, onSubUnitsChange }) {
  const foodCategories = ['Dog Food', 'Cat Food', 'Bird Food']
  const medicineForms = propMedicineForms ?? MASTER_DATA_DEFAULTS.medicineForms

  const defaultItem = {
    itemType: 'medicine', medicineType: 'tablet',
    itemName: '', brand: '', category: 'Antibiotic', expirationDate: '',
    packUnit: 'box', subUnit: 'tablet',
    quantity: '', unitsPerPack: '', packageSize: '', packageUnit: 'pcs',
    purchasePrice: '', sellingPricePerUnit: '', sellingPricePerPack: '', sellingPrice: '',
    supplierName: '',
  }

  const [form, setForm] = useState(defaultItem)
  const [stagedItems, setStagedItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [packUnits, setPackUnits] = useState([...MASTER_DATA_DEFAULTS.packUnits])
  const [subUnits, setSubUnits] = useState([...MASTER_DATA_DEFAULTS.subUnits])
  const [medicineCategories, setMedicineCategories] = useState(propMedCategories ?? [...MASTER_DATA_DEFAULTS.medicineCategories])
  const [storeCategories, setStoreCategories] = useState(propStoreCategories ?? [...MASTER_DATA_DEFAULTS.storeCategories])
  const [brands, setBrands] = useState([...MASTER_DATA_DEFAULTS.brands])

  const isMedicine = form.itemType === 'medicine'
  const isSyrup = isMedicine && form.medicineType === 'syrup'
  const isTablet = isMedicine && form.medicineType === 'tablet'
  const isFoodCat = !isMedicine && foodCategories.includes(form.category)
  const isDual = isSyrup || isTablet || isFoodCat
  const capFirst = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

  const parseDecimal = (value) => {
    if (value === '' || value === '.' || value === '-.' || value === '-') return null
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }

  const applyPerUnitAutoCalc = (item) => {
    if (!(item.itemType === 'medicine' && (item.medicineType === 'syrup' || item.medicineType === 'tablet')) &&
        !(item.itemType === 'store' && foodCategories.includes(item.category))) {
      return item
    }
    const perPack = parseDecimal(item.sellingPricePerPack)
    const unitsPerPack = parseDecimal(item.unitsPerPack)
    if (!perPack || !unitsPerPack) return item
    const perUnit = perPack / unitsPerPack
    return { ...item, sellingPricePerUnit: perUnit.toFixed(2) }
  }

  const isItemSyrup = (item) => item.itemType === 'medicine' && item.medicineType === 'syrup'
  const isItemTablet = (item) => item.itemType === 'medicine' && item.medicineType === 'tablet'
  const isItemFoodCat = (item) => item.itemType === 'store' && foodCategories.includes(item.category)
  const isItemDual = (item) => isItemSyrup(item) || isItemTablet(item) || isItemFoodCat(item)

  const getMedicineLabels = (type) => {
    if (type === 'syrup') return { packUnit: 'bottle', subUnit: 'ml' }
    if (type === 'tablet') return { packUnit: 'box', subUnit: 'tablet' }
    return { packUnit: 'vial', subUnit: null }
  }

  const handlePackUnitsChange = (units) => {
    setPackUnits(units)
    saveMasterData({ packUnits: units })
  }

  const handleSubUnitsChange = (units) => {
    setSubUnits(units)
    saveMasterData({ subUnits: units })
  }

  const handleMedicineCategoriesChange = (categories) => {
    setMedicineCategories(categories)
    saveMasterData({ medicineCategories: categories })
  }

  const handleStoreCategoriesChange = (categories) => {
    setStoreCategories(categories)
    saveMasterData({ storeCategories: categories })
  }

  const handleBrandsChange = (newBrands) => {
    setBrands(newBrands)
    saveMasterData({ brands: newBrands })
  }

  const set = (field, value) => {
    if (field === 'itemType') {
      const isMed = value === 'medicine'
      setForm({ ...defaultItem, itemType: value, category: isMed ? (medicineCategories[0] || 'Antibiotic') : (storeCategories[0] || 'Dog Food'), packUnit: isMed ? 'box' : 'sack', subUnit: isMed ? 'tablet' : 'kg' })
    } else if (field === 'medicineType') {
      const labels = getMedicineLabels(value)
      setForm(prev => ({ ...prev, medicineType: value, packUnit: labels.packUnit, subUnit: labels.subUnit ?? '', quantity: '', unitsPerPack: '', purchasePrice: '', sellingPricePerUnit: '', sellingPricePerPack: '', sellingPrice: '' }))
    } else if (field === 'category' && form.itemType === 'store') {
      const isFood = foodCategories.includes(value)
      setForm(prev => ({ ...prev, category: value, packUnit: isFood ? 'sack' : prev.packUnit, subUnit: isFood ? 'kg' : prev.subUnit, sellingPricePerPack: '', sellingPricePerUnit: '', packageSize: '' }))
    } else {
      setForm(prev => {
        const next = { ...prev, [field]: value }
        if (field === 'sellingPricePerPack' || field === 'unitsPerPack') {
          return applyPerUnitAutoCalc(next)
        }
        return next
      })
    }
  }

  const handleAddToList = () => {
    if (!form.itemName)      { alert('Item Name is required'); return }
    if (!form.quantity)      { alert('Quantity is required'); return }
    if (!form.purchasePrice) { alert('Purchase Price is required'); return }
    if (isMedicine && !form.expirationDate) { alert('Expiration date is required for medicines'); return }
    if (isDual) {
      if (!form.unitsPerPack)        { alert('Units per pack is required'); return }
      if (!form.sellingPricePerUnit) { alert('Selling price per unit is required'); return }
      if (!form.sellingPricePerPack) { alert('Selling price per pack is required'); return }
    } else {
      if (!form.sellingPrice) { alert('Selling Price is required'); return }
    }
    setStagedItems(prev => [...prev, {
      ...form,
      quantity:            Number(form.quantity),
      unitsPerPack:        form.unitsPerPack   ? Number(form.unitsPerPack)   : null,
      packageSize:         form.packageSize    ? Number(form.packageSize)    : null,
      purchasePrice:       Number(form.purchasePrice),
      sellingPricePerUnit: form.sellingPricePerUnit ? Number(form.sellingPricePerUnit) : null,
      sellingPricePerPack: form.sellingPricePerPack ? Number(form.sellingPricePerPack) : null,
      sellingPrice:        form.sellingPrice   ? Number(form.sellingPrice)   : null,
    }])
    setForm(prev => ({ ...prev, itemName: '', brand: '', quantity: '', unitsPerPack: '', packageSize: '', purchasePrice: '', sellingPricePerUnit: '', sellingPricePerPack: '', sellingPrice: '', expirationDate: '' }))
  }

  const handleSaveAll = async () => {
    if (stagedItems.length === 0) { alert('Add at least one item to the list.'); return }
    setSaving(true)
    try {
      for (const item of stagedItems) {
        const base = { brand: item.brand || '', purchasePrice: item.purchasePrice, supplierName: item.supplierName || '', createdAt: new Date().toISOString() }
        if (item.itemType === 'medicine') {
          if (isItemSyrup(item)) {
            await addMedicine({ ...base, medicineName: item.itemName, category: item.category, medicineType: 'syrup',
              bottleCount: item.quantity - 1, looseMl: item.unitsPerPack, mlPerBottle: item.unitsPerPack,
              stockQuantity: item.quantity * item.unitsPerPack, unit: item.packUnit,
              sellingPricePerMl: item.sellingPricePerUnit, sellingPricePerBottle: item.sellingPricePerPack,
              expirationDate: item.expirationDate })
          } else if (isItemTablet(item)) {
            await addMedicine({ ...base, medicineName: item.itemName, category: item.category, medicineType: 'tablet',
              boxCount: item.quantity - 1, looseTablets: item.unitsPerPack, tabletsPerBox: item.unitsPerPack,
              stockQuantity: item.quantity * item.unitsPerPack, unit: item.packUnit,
              sellingPricePerTablet: item.sellingPricePerUnit, sellingPricePerBox: item.sellingPricePerPack,
              expirationDate: item.expirationDate })
          } else {
            await addMedicine({ ...base, medicineName: item.itemName, category: item.category, medicineType: item.medicineType || 'other',
              stockQuantity: item.quantity, unit: item.packUnit, sellingPrice: item.sellingPrice, expirationDate: item.expirationDate })
          }
        } else {
          if (isItemFoodCat(item)) {
            await addStoreItem({ ...base, itemName: item.itemName, category: item.category,
              stockQuantity: item.quantity * item.unitsPerPack, sacksCount: item.quantity - 1,
              looseKg: item.unitsPerPack, kgPerSack: item.unitsPerPack, unit: item.packUnit,
              sellingPricePerKg: item.sellingPricePerUnit, sellingPricePerSack: item.sellingPricePerPack })
          } else {
            const totalStock = item.packageSize ? item.quantity * item.packageSize : item.quantity
            await addStoreItem({ ...base, itemName: item.itemName, category: item.category,
              stockQuantity: totalStock, unit: item.packageSize ? (item.packageUnit || 'pcs') : item.packUnit,
              packageUnit: item.packUnit, packageSize: item.packageSize || null, sellingPrice: item.sellingPrice })
          }
        }
        await logStockEdit({ itemId: 'new', itemName: item.itemName, itemType: item.itemType,
          action: 'add', changes: { note: { after: 'Added directly via Add Stock' } }, editedAt: new Date().toISOString() })
      }
      setStagedItems([])
      setForm(defaultItem)
      onSave()
      onClose()
    } catch (err) {
      console.error(err)
      alert('Failed to save stock.')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setStagedItems([])
    setForm(defaultItem)
    onClose()
  }

  if (!isOpen) return null

  const inputClass = "w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
  const labelClass = "block text-xs font-medium text-gray-700 mb-1"
  const totalCost = stagedItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0)

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
      <div className="bg-gray-50 w-full max-w-7xl flex flex-col rounded-xl shadow-2xl overflow-hidden max-h-[92vh] md:h-[92vh]">

        {/* Header */}


        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* ── LEFT: Item Form ── */}
          <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm">Item Details</h3>
              <p className="text-xs text-gray-400 mt-0.5">Fill in details then click "Add to List"</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">

              {/* Type + Medicine Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Type *</label>
                  <select value={form.itemType} onChange={(e) => set('itemType', e.target.value)} className={`${inputClass} bg-white`}>
                    <option value="medicine">Medicine</option>
                    <option value="store">Store</option>
                  </select>
                </div>
                {isMedicine && (
                  <div>
                    <label className={labelClass}>Medicine Form *</label>
                    <select value={form.medicineType} onChange={(e) => set('medicineType', e.target.value)} className={`${inputClass} bg-white`}>
                      {Object.entries(medicineForms).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Name + Brand */}
              <div>
                <label className={labelClass}>Item Name *</label>
                <input type="text" value={form.itemName} onChange={(e) => set('itemName', e.target.value)}
                  placeholder={isMedicine ? 'e.g. Amoxicillin' : 'e.g. Champion Dog Food'} className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <BrandDropdown
                    label="Brand"
                    value={form.brand}
                    onChange={(v) => set('brand', v)}
                    brands={brands}
                    onBrandsChange={handleBrandsChange}
                    placeholder="Select brand"
                  />
                </div>
                <div>
                  <CategoryDropdown
                    label="Category *"
                    value={form.category}
                    onChange={(v) => set('category', v)}
                    categories={isMedicine ? medicineCategories : storeCategories}
                    onCategoriesChange={isMedicine ? handleMedicineCategoriesChange : handleStoreCategoriesChange}
                    placeholder="Select category"
                  />
                </div>
              </div>

              {isMedicine && (
                <div>
                  <label className={labelClass}>Expiry Date *</label>
                  <input type="date" value={form.expirationDate} onChange={(e) => set('expirationDate', e.target.value)} className={inputClass} />
                </div>
              )}

              {/* ── Dual stock ── */}
              {isDual && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <UnitDropdown
                      label="Pack Called *"
                      value={form.packUnit}
                      onChange={(v) => set('packUnit', v)}
                      units={packUnits}
                      onUnitsChange={handlePackUnitsChange}
                      placeholder="e.g. bottle"
                    />
                    <UnitDropdown
                      label="Unit Inside *"
                      value={form.subUnit}
                      onChange={(v) => set('subUnit', v)}
                      units={subUnits}
                      onUnitsChange={handleSubUnitsChange}
                      placeholder="e.g. ml"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>No. of {capFirst(form.packUnit) || 'Pack'}s *</label>
                      <input type="text" inputMode="decimal" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="e.g. 10" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>{capFirst(form.subUnit) || 'Units'} per {form.packUnit || 'Pack'} *</label>
                      <input type="text" inputMode="decimal" min="1" step="0.01" value={form.unitsPerPack} onChange={(e) => set('unitsPerPack', e.target.value)} placeholder="e.g. 60" className={inputClass} />
                    </div>
                  </div>
                  {form.quantity && form.unitsPerPack && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                      <p className="text-xs text-blue-700">
                        On save: <strong>{Number(form.quantity) - 1} sealed {form.packUnit}s</strong> + <strong>{form.unitsPerPack} {form.subUnit} loose</strong>
                        {' · '}Total: <strong>{Number(form.quantity) * Number(form.unitsPerPack)} {form.subUnit}</strong>
                      </p>
                    </div>
                  )}
                  <div className="border border-gray-200 rounded-md p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-700">Pricing</p>
                    <div>
                      <label className={labelClass}>Purchase Price (per {form.packUnit || 'pack'}) *</label>
                      <input type="text" inputMode="decimal" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} placeholder="₱" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Selling Price per {form.subUnit || 'unit'} *</label>
                      <input type="text" inputMode="decimal" min="0" step="0.01" value={form.sellingPricePerUnit} onChange={(e) => set('sellingPricePerUnit', e.target.value)} placeholder="₱" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Selling Price per {form.packUnit || 'pack'} *</label>
                      <input type="text" inputMode="decimal" min="0" step="0.01" value={form.sellingPricePerPack} onChange={(e) => set('sellingPricePerPack', e.target.value)} placeholder="₱" className={inputClass} />
                    </div>
                  </div>
                </>
              )}

              {/* ── Single unit medicine (vial / other) ── */}
              {isMedicine && !isSyrup && !isTablet && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <UnitDropdown
                      label="Unit *"
                      value={form.packUnit}
                      onChange={(v) => set('packUnit', v)}
                      units={packUnits}
                      onUnitsChange={handlePackUnitsChange}
                      placeholder="e.g. vial"
                    />
                    <div>
                      <label className={labelClass}>Qty *</label>
                      <input type="text" inputMode="decimal" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="e.g. 20" className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Purchase Price *</label>
                      <input type="text" inputMode="decimal" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} placeholder="₱" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Selling Price *</label>
                      <input type="text" inputMode="decimal" min="0" step="0.01" value={form.sellingPrice} onChange={(e) => set('sellingPrice', e.target.value)} placeholder="₱" className={inputClass} />
                    </div>
                  </div>
                </>
              )}

              {/* ── Non-food store ── */}
              {!isMedicine && !isFoodCat && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <UnitDropdown
                      label="Pack Unit *"
                      value={form.packUnit}
                      onChange={(v) => set('packUnit', v)}
                      units={packUnits}
                      onUnitsChange={handlePackUnitsChange}
                      placeholder="e.g. bag"
                    />
                    <div>
                      <label className={labelClass}>Qty Ordered *</label>
                      <input type="text" inputMode="decimal" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="e.g. 12" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Pcs per Package <span className="text-gray-400">(optional)</span></label>
                    <input type="text" inputMode="decimal" min="1" value={form.packageSize} onChange={(e) => set('packageSize', e.target.value)} placeholder="e.g. 12 pcs per box" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Purchase Price *</label>
                      <input type="text" inputMode="decimal" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} placeholder="₱" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Selling Price *</label>
                      <input type="text" inputMode="decimal" min="0" step="0.01" value={form.sellingPrice} onChange={(e) => set('sellingPrice', e.target.value)} placeholder="₱" className={inputClass} />
                    </div>
                  </div>
                </>
              )}

              {/* Supplier (optional) */}
              <div>
                <label className={labelClass}>Supplier <span className="text-gray-400">(optional)</span></label>
                <input type="text" value={form.supplierName} onChange={(e) => set('supplierName', e.target.value)} placeholder="e.g. ABC Pharma" className={inputClass} />
              </div>

            </div>

          </div>

          {/* ── RIGHT: Staged Items Table ── */}
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-3 bg-white border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Items to Add ({stagedItems.length})</h3>
            </div>

            <div className="flex-1 p-4 md:p-6 flex flex-col overflow-hidden">
              {stagedItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <FiPackage className="w-16 h-16 mx-auto mb-3 opacity-40" />
                    <p className="text-lg font-medium">No items yet</p>
                    <p className="text-sm">Fill in the form and click "Add to List"</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden mb-3">
                    <div className="overflow-auto h-full">
                      <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[900px] text-xs">
                        <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                          <tr>
                            <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">Type</th>
                            <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">Item Name</th>
                            <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">Category</th>
                            <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">Ordered</th>
                            <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">Stock on Save</th>
                            <th className="px-2 py-2 text-right font-semibold uppercase tracking-wide">Purchase</th>
                            <th className="px-2 py-2 text-right font-semibold uppercase tracking-wide">Selling</th>
                            <th className="px-2 py-2 text-right font-semibold uppercase tracking-wide">Subtotal</th>
                            <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide">Del</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {stagedItems.map((item, index) => {
                            if (isItemDual(item)) {
                              const sealed = item.quantity - 1
                              return (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-2 py-2 font-medium text-gray-900 capitalize">{item.medicineType || (item.itemType === 'store' ? 'food' : 'other')}</td>
                                  <td className="px-2 py-2">
                                    <span className="font-medium text-gray-900">{item.itemName}</span>
                                    {item.brand && <span className="text-gray-400 ml-1">({item.brand})</span>}
                                  </td>
                                  <td className="px-2 py-2 text-gray-700">{item.category}</td>
                                  <td className="px-2 py-2 text-gray-700 whitespace-nowrap">
                                    {item.quantity} {item.packUnit}s × {item.unitsPerPack} {item.subUnit}
                                  </td>
                                  <td className="px-2 py-2 whitespace-nowrap">
                                    <span className="font-semibold text-gray-900">{sealed} {item.packUnit}{sealed !== 1 ? 's' : ''}</span>
                                    <span className="text-gray-300 mx-1">|</span>
                                    <span className="font-semibold text-gray-900">{item.unitsPerPack} {item.subUnit}</span>
                                  </td>
                                  <td className="px-2 py-2 text-right text-gray-700 whitespace-nowrap">₱{item.purchasePrice.toLocaleString()}/{item.packUnit}</td>
                                  <td className="px-2 py-2 text-right text-gray-700 whitespace-nowrap">
                                    <div>₱{item.sellingPricePerUnit?.toLocaleString()}/{item.subUnit}</div>
                                    <div className="text-gray-400">₱{item.sellingPricePerPack?.toLocaleString()}/{item.packUnit}</div>
                                  </td>
                                  <td className="px-2 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">₱{(item.purchasePrice * item.quantity).toLocaleString()}</td>
                                  <td className="px-2 py-2 text-center">
                                    <button onClick={() => setStagedItems(prev => prev.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                                      <FiTrash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              )
                            }
                            const totalStock = item.packageSize ? item.quantity * item.packageSize : item.quantity
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-2 py-2 font-medium text-gray-900 capitalize">{item.itemType === 'medicine' ? item.medicineType : 'Store'}</td>
                                <td className="px-2 py-2">
                                  <span className="font-medium text-gray-900">{item.itemName}</span>
                                  {item.brand && <span className="text-gray-400 ml-1">({item.brand})</span>}
                                </td>
                                <td className="px-2 py-2 text-gray-700">{item.category}</td>
                                <td className="px-2 py-2 text-gray-700 whitespace-nowrap">{item.quantity} {item.packUnit}{item.packageSize ? ` × ${item.packageSize} pcs` : ''}</td>
                                <td className="px-2 py-2 font-semibold text-gray-900 whitespace-nowrap">{totalStock} {item.packUnit}</td>
                                <td className="px-2 py-2 text-right text-gray-700 whitespace-nowrap">₱{item.purchasePrice.toLocaleString()}/{item.packUnit}</td>
                                <td className="px-2 py-2 text-right text-gray-700 whitespace-nowrap">₱{item.sellingPrice?.toLocaleString()}/{item.packUnit}</td>
                                <td className="px-2 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">₱{(item.purchasePrice * item.quantity).toLocaleString()}</td>
                                <td className="px-2 py-2 text-center">
                                  <button onClick={() => setStagedItems(prev => prev.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                          </table>
                        </div>
                    </div>
                  </div>

                  {/* Total footer */}
                  <div className="bg-white rounded-md border border-gray-200 shadow-sm px-5 py-3 flex items-center justify-between">
                    <p className="text-sm text-gray-600">{stagedItems.length} item{stagedItems.length !== 1 ? 's' : ''} ready to add</p>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Total Cost</p>
                      <p className="text-2xl font-bold text-gray-900">₱{totalCost.toLocaleString()}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>

        {/* Bottom actions */}
        <div className="bg-white border-t border-gray-200 flex flex-col lg:flex-row items-stretch flex-shrink-0">
          <div className="w-full lg:w-80 flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b lg:border-b-0 lg:border-r border-gray-200">
            <button onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm whitespace-nowrap">
              Cancel
            </button>
            <button onClick={handleAddToList}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700 font-medium">
              <FiPlus className="w-4 h-4" /> Add to List
            </button>
          </div>
          <div className="flex-1 flex items-center px-4 md:px-6 py-3">
            <button onClick={handleSaveAll} disabled={saving || stagedItems.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed">
              <FiSave className="w-4 h-4" />
              {saving ? 'Saving...' : `Save ${stagedItems.length > 0 ? stagedItems.length + ' Item' + (stagedItems.length !== 1 ? 's' : '') : 'Items'} to Stock`}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditStockModal({ item, isOpen, onClose, onSave, onDelete, medicineCategories: propMedCategories, storeCategories: propStoreCategories, medicineForms: propMedicineForms, packUnits: propPackUnits, subUnits: propSubUnits, brands: propBrands, onPackUnitsChange, onSubUnitsChange, onMedicineCategoriesChange, onStoreCategoriesChange }) {
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const foodCategories = ['Dog Food', 'Cat Food', 'Bird Food']
  const medicineCategories = propMedCategories ?? MASTER_DATA_DEFAULTS.medicineCategories
  const storeCategories = propStoreCategories ?? MASTER_DATA_DEFAULTS.storeCategories
  const medicineForms = propMedicineForms ?? MASTER_DATA_DEFAULTS.medicineForms
  const packUnits = propPackUnits ?? MASTER_DATA_DEFAULTS.packUnits
  const subUnits = propSubUnits ?? MASTER_DATA_DEFAULTS.subUnits
  const brands = propBrands ?? MASTER_DATA_DEFAULTS.brands

  const isFood = (cat) => foodCategories.includes(cat)
  const isSyrup = form.medicineType === 'syrup'
  const isTablet = form.medicineType === 'tablet'
  const isDualStock = isSyrup || isTablet || (item?._type === 'store' && isFood(form.category))

  useEffect(() => {
    if (!item) return
    setForm({ ...item })
    setConfirmDelete(false)
  }, [item])

  if (!isOpen || !item) return null

  const set = (field, value) => {
    const newData = { ...form, [field]: value }
    const fieldsToCalc = ['sellingPricePerBottle', 'mlPerBottle', 'sellingPricePerBox', 'tabletsPerBox', 'sellingPricePerSack', 'kgPerSack']
    if (fieldsToCalc.includes(field)) {
      const calculated = applyPerUnitAutoCalc(newData)
      setForm(calculated)
    } else {
      setForm(newData)
    }
  }

  const normalizeNumberField = (value) => {
    if (value === '' || value === null || value === undefined || value === '.' || value === '-.' || value === '-') return 0
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
  }

  const normalizeNumericFields = (data) => {
    const next = { ...data }
    const numericFields = [
      'bottleCount', 'looseMl', 'mlPerBottle',
      'boxCount', 'looseTablets', 'tabletsPerBox',
      'sacksCount', 'looseKg', 'kgPerSack',
      'stockQuantity', 'purchasePrice',
      'sellingPricePerMl', 'sellingPricePerBottle',
      'sellingPricePerTablet', 'sellingPricePerBox',
      'sellingPricePerKg', 'sellingPricePerSack',
      'sellingPrice'
    ]
    numericFields.forEach(field => {
      if (field in next) next[field] = normalizeNumberField(next[field])
    })
    return next
  }

  const sanitizeForFirestore = (value) => {
    if (value === undefined) return null
    if (value === null) return null
    if (Array.isArray(value)) return value.map(sanitizeForFirestore)
    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, sanitizeForFirestore(v)])
      )
    }
    return value
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // ── Build a diff of what changed ──
      const normalizedForm = normalizeNumericFields(form)
      const changes = {}
      Object.keys(normalizedForm).forEach(key => {
        if (JSON.stringify(normalizedForm[key]) !== JSON.stringify(item[key])) {
          changes[key] = { before: item[key], after: normalizedForm[key] }
        }
      })

      if (item._type === 'medicine') {
        await updateMedicine(item.id, normalizedForm)
      } else {
        await updateStoreItem(item.id, normalizedForm)
      }

      // ── Log the edit (non-blocking for UI save success) ──
      try {
        const safeChanges = sanitizeForFirestore(
          Object.keys(changes).length > 0
            ? changes
            : { note: { before: null, after: 'Saved with no field diff detected' } }
        )

        await logStockEdit({
          itemId: item.id,
          itemName: item.itemName || item.medicineName || '',
          itemType: item._type,
          action: 'edit',
          changes: safeChanges,
          editedAt: new Date().toISOString(),
        })
      } catch (logErr) {
        console.warn('Stock updated but edit log failed:', logErr)
      }

      await onSave()
      onClose()
    } catch (err) {
      console.error(err)
      alert('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      if (item._type === 'medicine') {
        await deleteMedicine(item.id)
      } else {
        await deleteStoreItem(item.id)
      }

      // ── Log the deletion ──
      await logStockEdit({
        itemId: item.id,
        itemName: item.itemName || item.medicineName || '',
        itemType: item._type,
        action: 'delete',
        changes: {},
        editedAt: new Date().toISOString(),
      })

      onDelete()
      onClose()
    } catch (err) {
      console.error(err)
      alert('Failed to delete.')
    } finally {
      setDeleting(false)
    }
  }

  const inputClass = "w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
  const labelClass = "block text-xs font-medium text-gray-700 mb-1"

  const handleLocalPackUnitsChange = (units) => {
    onPackUnitsChange ? onPackUnitsChange(units) : saveMasterData({ packUnits: units })
  }

  const handleLocalSubUnitsChange = (units) => {
    onSubUnitsChange ? onSubUnitsChange(units) : saveMasterData({ subUnits: units })
  }

  const handleBrandsChange = (newBrands) => {
    saveMasterData({ brands: newBrands })
  }

  const handleLocalMedicineCategoriesChange = (categories) => {
    onMedicineCategoriesChange ? onMedicineCategoriesChange(categories) : saveMasterData({ medicineCategories: categories })
  }

  const handleLocalStoreCategoriesChange = (categories) => {
    onStoreCategoriesChange ? onStoreCategoriesChange(categories) : saveMasterData({ storeCategories: categories })
  }

  const parseDecimal = (value) => {
    if (value === '' || value === '.' || value === '-.' || value === '-') return null
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }

  const applyPerUnitAutoCalc = (data) => {
    const isSyrup = data.medicineType === 'syrup'
    const isTablet = data.medicineType === 'tablet'
    const isFood = foodCategories.includes(data.category) && item._type === 'store'
    
    if (!isSyrup && !isTablet && !isFood) return data
    
    if (isSyrup) {
      const perBottle = parseDecimal(data.sellingPricePerBottle)
      const mlPerBottle = parseDecimal(data.mlPerBottle)
      if (perBottle && mlPerBottle) {
        return { ...data, sellingPricePerMl: (perBottle / mlPerBottle).toFixed(2) }
      }
    } else if (isTablet) {
      const perBox = parseDecimal(data.sellingPricePerBox)
      const tabletsPerBox = parseDecimal(data.tabletsPerBox)
      if (perBox && tabletsPerBox) {
        return { ...data, sellingPricePerTablet: (perBox / tabletsPerBox).toFixed(2) }
      }
    } else if (isFood) {
      const perSack = parseDecimal(data.sellingPricePerSack)
      const kgPerSack = parseDecimal(data.kgPerSack)
      if (perSack && kgPerSack) {
        return { ...data, sellingPricePerKg: (perSack / kgPerSack).toFixed(2) }
      }
    }
    return data
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">Edit Stock</h3>
            <p className="text-xs text-gray-500 mt-0.5">{item.itemName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── Basic Info ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                {item._type === 'medicine' ? 'Medicine Name' : 'Item Name'} *
              </label>
              <input type="text" value={form.medicineName || form.itemName || ''} className={inputClass}
                onChange={(e) => set(item._type === 'medicine' ? 'medicineName' : 'itemName', e.target.value)} />
            </div>
            <div>
              <BrandDropdown
                label="Brand"
                value={form.brand || ''}
                onChange={(v) => set('brand', v)}
                brands={brands}
                onBrandsChange={handleBrandsChange}
                placeholder="Select or add brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <CategoryDropdown
                label="Category"
                value={form.category || ''}
                onChange={(v) => set('category', v)}
                categories={item._type === 'medicine' ? medicineCategories : storeCategories}
                onCategoriesChange={item._type === 'medicine' ? handleLocalMedicineCategoriesChange : handleLocalStoreCategoriesChange}
                placeholder="Select or add category"
              />
            </div>
            {item._type === 'medicine' && (
              <div>
                <label className={labelClass}>Medicine Type</label>
                <select value={form.medicineType || ''} className={`${inputClass} bg-white`}
                  onChange={(e) => set('medicineType', e.target.value)}>
                  {Object.entries(medicineForms).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ── Expiry (medicine only) ── */}
          {item._type === 'medicine' && (
            <div>
              <label className={labelClass}>Expiry Date</label>
              <input type="date" value={form.expirationDate || ''} className={inputClass}
                onChange={(e) => set('expirationDate', e.target.value)} />
            </div>
          )}

          {/* ── SYRUP stock ── */}
          {isSyrup && (
            <div className="border border-gray-200 rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Stock (Syrup)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <UnitDropdown
                  label="Pack Called *"
                  value={form.packUnit || 'bottle'}
                  onChange={(v) => set('packUnit', v)}
                  units={packUnits}
                  onUnitsChange={handleLocalPackUnitsChange}
                  placeholder="e.g. bottle"
                />
                <UnitDropdown
                  label="Unit Inside *"
                  value={form.subUnit || 'ml'}
                  onChange={(v) => set('subUnit', v)}
                  units={subUnits}
                  onUnitsChange={handleLocalSubUnitsChange}
                  placeholder="e.g. ml"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Sealed {form.packUnit || 'Bottle'}s</label>
                  <input type="text" inputMode="decimal" value={form.bottleCount ?? ''} className={inputClass}
                    onChange={(e) => set('bottleCount', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Loose {form.subUnit || 'ML'}</label>
                  <input type="text" inputMode="decimal" value={form.looseMl ?? ''} className={inputClass}
                    onChange={(e) => set('looseMl', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>{form.subUnit || 'ML'} per {form.packUnit || 'Bottle'}</label>
                  <input type="text" inputMode="decimal" value={form.mlPerBottle ?? ''} className={inputClass}
                    onChange={(e) => set('mlPerBottle', e.target.value)} />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
                <p className="text-xs text-blue-700">
                  Total stock: <strong>
                    {((Number(form.bottleCount) || 0) * (Number(form.mlPerBottle) || 0)) + (Number(form.looseMl) || 0)} ml
                  </strong>
                </p>
              </div>
            </div>
          )}

          {/* ── TABLET stock ── */}
          {isTablet && (
            <div className="border border-gray-200 rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Stock (Tablet)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <UnitDropdown
                  label="Pack Called *"
                  value={form.packUnit || 'box'}
                  onChange={(v) => set('packUnit', v)}
                  units={packUnits}
                  onUnitsChange={handleLocalPackUnitsChange}
                  placeholder="e.g. box"
                />
                <UnitDropdown
                  label="Unit Inside *"
                  value={form.subUnit || 'tablet'}
                  onChange={(v) => set('subUnit', v)}
                  units={subUnits}
                  onUnitsChange={handleLocalSubUnitsChange}
                  placeholder="e.g. tablet"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Sealed {form.packUnit || 'Box'}es</label>
                  <input type="text" inputMode="decimal" value={form.boxCount ?? ''} className={inputClass}
                    onChange={(e) => set('boxCount', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Loose {form.subUnit || 'Tablet'}s</label>
                  <input type="text" inputMode="decimal" value={form.looseTablets ?? ''} className={inputClass}
                    onChange={(e) => set('looseTablets', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>{form.subUnit || 'Tablet'}s per {form.packUnit || 'Box'}</label>
                  <input type="text" inputMode="decimal" value={form.tabletsPerBox ?? ''} className={inputClass}
                    onChange={(e) => set('tabletsPerBox', e.target.value)} />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
                <p className="text-xs text-blue-700">
                  Total stock: <strong>
                    {((Number(form.boxCount) || 0) * (Number(form.tabletsPerBox) || 0)) + (Number(form.looseTablets) || 0)} tablets
                  </strong>
                </p>
              </div>
            </div>
          )}

          {/* ── FOOD stock ── */}
          {item._type === 'store' && isFood(form.category) && (
            <div className="border border-gray-200 rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Stock (Food)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <UnitDropdown
                  label="Pack Called *"
                  value={form.packUnit || 'sack'}
                  onChange={(v) => set('packUnit', v)}
                  units={packUnits}
                  onUnitsChange={handleLocalPackUnitsChange}
                  placeholder="e.g. sack"
                />
                <UnitDropdown
                  label="Unit Inside *"
                  value={form.subUnit || 'kg'}
                  onChange={(v) => set('subUnit', v)}
                  units={subUnits}
                  onUnitsChange={handleLocalSubUnitsChange}
                  placeholder="e.g. kg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Sealed {form.packUnit || 'Sack'}s</label>
                  <input type="text" inputMode="decimal" value={form.sacksCount ?? ''} className={inputClass}
                    onChange={(e) => set('sacksCount', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Loose {form.subUnit || 'KG'}</label>
                  <input type="text" inputMode="decimal" value={form.looseKg ?? ''} className={inputClass}
                    onChange={(e) => set('looseKg', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>{form.subUnit || 'KG'} per {form.packUnit || 'Sack'}</label>
                  <input type="text" inputMode="decimal" value={form.kgPerSack ?? ''} className={inputClass}
                    onChange={(e) => set('kgPerSack', e.target.value)} />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
                <p className="text-xs text-blue-700">
                  Total stock: <strong>
                    {((Number(form.sacksCount) || 0) * (Number(form.kgPerSack) || 0)) + (Number(form.looseKg) || 0)} kg
                  </strong>
                </p>
              </div>
            </div>
          )}

          {/* ── VIAL / OTHER / Non-food store ── */}
          {!isDualStock && (
            <div className="border border-gray-200 rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Stock</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Quantity</label>
                  <input type="text" inputMode="decimal" value={form.stockQuantity ?? ''} className={inputClass}
                    onChange={(e) => set('stockQuantity', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Unit</label>
                  <UnitDropdown
                    label=""
                    value={form.unit || ''}
                    onChange={(v) => set('unit', v)}
                    units={subUnits}
                    onUnitsChange={handleLocalSubUnitsChange}
                    placeholder="e.g. vial, pcs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Pricing ── */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Pricing</p>
            <div>
              <label className={labelClass}>Purchase Price (per pack/unit)</label>
              <input type="text" inputMode="decimal" value={form.purchasePrice ?? ''} className={inputClass}
                onChange={(e) => set('purchasePrice', e.target.value)} placeholder="₱" />
            </div>
            {isSyrup && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Selling Price per ML</label>
                  <input type="text" inputMode="decimal" value={form.sellingPricePerMl ?? ''} className={inputClass}
                    onChange={(e) => set('sellingPricePerMl', e.target.value)} placeholder="₱/ml" />
                </div>
                <div>
                  <label className={labelClass}>Selling Price per Bottle</label>
                  <input type="text" inputMode="decimal" value={form.sellingPricePerBottle ?? ''} className={inputClass}
                    onChange={(e) => set('sellingPricePerBottle', e.target.value)} placeholder="₱/bottle" />
                </div>
              </div>
            )}
            {isTablet && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Selling Price per Tablet</label>
                  <input type="text" inputMode="decimal" value={form.sellingPricePerTablet ?? ''} className={inputClass}
                    onChange={(e) => set('sellingPricePerTablet', e.target.value)} placeholder="₱/tablet" />
                </div>
                <div>
                  <label className={labelClass}>Selling Price per Box</label>
                  <input type="text" inputMode="decimal" value={form.sellingPricePerBox ?? ''} className={inputClass}
                    onChange={(e) => set('sellingPricePerBox', e.target.value)} placeholder="₱/box" />
                </div>
              </div>
            )}
            {item._type === 'store' && isFood(form.category) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Selling Price per KG</label>
                  <input type="text" inputMode="decimal" value={form.sellingPricePerKg ?? ''} className={inputClass}
                    onChange={(e) => set('sellingPricePerKg', e.target.value)} placeholder="₱/kg" />
                </div>
                <div>
                  <label className={labelClass}>Selling Price per Sack</label>
                  <input type="text" inputMode="decimal" value={form.sellingPricePerSack ?? ''} className={inputClass}
                    onChange={(e) => set('sellingPricePerSack', e.target.value)} placeholder="₱/sack" />
                </div>
              </div>
            )}
            {!isDualStock && (
              <div>
                <label className={labelClass}>Selling Price</label>
                <input type="text" inputMode="decimal" value={form.sellingPrice ?? ''} className={inputClass}
                  onChange={(e) => set('sellingPrice', e.target.value)} placeholder="₱" />
              </div>
            )}
          </div>

          {/* ── Supplier ── */}
          <div>
            <label className={labelClass}>Supplier Name</label>
            <input type="text" value={form.supplierName || ''} className={inputClass}
              onChange={(e) => set('supplierName', e.target.value)} placeholder="e.g. ABC Pharma" />
          </div>

          {/* ── Delete Confirmation Banner ── */}
          {confirmDelete && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiTrash2 className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700 font-medium">
                  Are you sure? This will permanently delete <strong>{item.itemName}</strong>.
                </p>
              </div>
              <button onClick={() => setConfirmDelete(false)}
                className="text-red-400 hover:text-red-600 ml-3 flex-shrink-0">
                <FiX className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Delete button — left side */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-md font-medium transition-colors disabled:cursor-not-allowed
                ${confirmDelete
                  ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
                  : 'border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-50'
                }`}
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              {deleting ? 'Deleting...' : confirmDelete ? 'Confirm Delete' : 'Delete'}
            </button>

            <div className="flex-1" />

            {/* Cancel & Save — right side */}
            <button onClick={() => { onClose(); setConfirmDelete(false) }}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed">
              <FiSave className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
function MedicinesStocks() {
  const navigate = useNavigate()   // ← add this
  const [medicines, setMedicines] = useState([])
  const [storeItems, setStoreItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [stockFilter, setStockFilter] = useState('All')
  const [itemType, setItemType] = useState('All')
  const [editItem, setEditItem] = useState(null)
  const [showAddStock, setShowAddStock] = useState(false)

  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)

  const foodCategories = ['Dog Food', 'Cat Food', 'Bird Food']
  const [medicineCategories, setMedicineCategories] = useState(MASTER_DATA_DEFAULTS.medicineCategories)
  const [storeCategories, setStoreCategories] = useState(MASTER_DATA_DEFAULTS.storeCategories)
  const [medicineForms, setMedicineForms] = useState({ ...MASTER_DATA_DEFAULTS.medicineForms })
  const [packUnits, setPackUnits] = useState([...MASTER_DATA_DEFAULTS.packUnits])
  const [subUnits, setSubUnits] = useState([...MASTER_DATA_DEFAULTS.subUnits])
  const [brands, setBrands] = useState([...MASTER_DATA_DEFAULTS.brands])
  const [lowStockThreshold, setLowStockThreshold] = useState(MASTER_DATA_DEFAULTS.lowStockThreshold)
  const allCategories = ['All', ...new Set([...medicineCategories, ...storeCategories])]

  const handlePackUnitsChange = (units) => {
    setPackUnits(units)
    saveMasterData({ packUnits: units })
  }

  const handleSubUnitsChange = (units) => {
    setSubUnits(units)
    saveMasterData({ subUnits: units })
  }

  const handleBrandsChange = (newBrands) => {
    setBrands(newBrands)
    saveMasterData({ brands: newBrands })
  }

  const handleMedicineCategoriesChange = (categories) => {
    setMedicineCategories(categories)
    saveMasterData({ medicineCategories: categories })
  }

  const handleStoreCategoriesChange = (categories) => {
    setStoreCategories(categories)
    saveMasterData({ storeCategories: categories })
  }

  const isFood = (item) => foodCategories.includes(item?.category)

  const getTotalStock = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') return ((item.bottleCount ?? 0) * (item.mlPerBottle ?? 0)) + (item.looseMl ?? 0)
      if (item.medicineType === 'tablet') return ((item.boxCount ?? 0) * (item.tabletsPerBox ?? 0)) + (item.looseTablets ?? 0)
      return item.stockQuantity ?? 0
    }
    if (isFood(item)) return ((item.sacksCount ?? 0) * (item.kgPerSack ?? 0)) + (item.looseKg ?? 0)
    return item.stockQuantity ?? 0
  }

  const isLowStock = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') return (item.bottleCount ?? 0) < 2
      if (item.medicineType === 'tablet') return (item.boxCount ?? 0) < 2
      return (item.stockQuantity ?? 0) <= lowStockThreshold
    }
    if (isFood(item)) return (item.sacksCount ?? 0) < 2 && (item.looseKg ?? 0) < (item.kgPerSack ?? 0)
    return (item.stockQuantity ?? 0) <= lowStockThreshold
  }

  const isOutOfStock = (item) => getTotalStock(item) === 0

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [medicinesData, itemsData, masterData] = await Promise.all([getMedicines(), getStoreItems(), getMasterData()])
      setMedicines(medicinesData)
      setStoreItems(itemsData)
      if (masterData) {
        if (masterData.medicineCategories) setMedicineCategories(masterData.medicineCategories)
        if (masterData.storeCategories) setStoreCategories(masterData.storeCategories)
        if (masterData.medicineForms) setMedicineForms(masterData.medicineForms)
        if (masterData.packUnits) setPackUnits(masterData.packUnits)
        if (masterData.subUnits) setSubUnits(masterData.subUnits)
        if (masterData.lowStockThreshold != null) setLowStockThreshold(masterData.lowStockThreshold)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const allItems = [
    ...medicines.map(med => ({ ...med, _type: 'medicine', itemName: med.medicineName })),
    ...storeItems.map(item => ({ ...item, _type: 'store' }))
  ]

  const getStockDisplay = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') {
        const bottles = item.bottleCount ?? 0
        const ml = item.looseMl ?? 0
        return (
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-gray-900">{bottles} Bottle{bottles !== 1 ? 's' : ''}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-900">{ml} ml</span>
          </div>
        )
      }
      if (item.medicineType === 'tablet') {
        const boxes = item.boxCount ?? 0
        const tabs = item.looseTablets ?? 0
        return (
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-gray-900">{boxes} Box{boxes !== 1 ? 'es' : ''}</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-900">{tabs} Tablets</span>
          </div>
        )
      }
      return <span className="text-gray-900 whitespace-nowrap">{item.stockQuantity ?? 0} {item.unit ?? ''}</span>
    }
    if (isFood(item)) {
      const sacks = item.sacksCount ?? 0
      const kg = item.looseKg ?? 0
      return (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <span className="text-gray-900">{sacks} Sack{sacks !== 1 ? 's' : ''}</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-900">{kg} Kilos</span>
        </div>
      )
    }
    return <span className="text-gray-900 whitespace-nowrap">{item.stockQuantity ?? 0} {item.unit ?? 'pcs'}</span>
  }

  const getSellingPriceDisplay = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') return (
        <div className="text-right leading-tight">
          <p className="text-gray-900">₱{item.sellingPricePerMl?.toLocaleString()}/ml</p>
          <p className="text-gray-900">₱{item.sellingPricePerBottle?.toLocaleString()}/bottle</p>
        </div>
      )
      if (item.medicineType === 'tablet') return (
        <div className="text-right leading-tight">
          <p className="text-gray-900">₱{item.sellingPricePerTablet?.toLocaleString()}/tablet</p>
          <p className="text-gray-900">₱{item.sellingPricePerBox?.toLocaleString()}/box</p>
        </div>
      )
      return <p className="text-right text-gray-900">₱{item.sellingPrice?.toLocaleString()}/{item.unit}</p>
    }
    if (isFood(item)) return (
      <div className="text-right leading-tight">
        <p className="text-gray-900">₱{item.sellingPricePerKg?.toLocaleString()}/kg</p>
        <p className="text-gray-900">₱{item.sellingPricePerSack?.toLocaleString()}/sack</p>
      </div>
    )
    return <p className="text-right text-gray-900">₱{item.sellingPrice?.toLocaleString()}/{item.unit ?? 'pcs'}</p>
  }

  const getTypeLabel = (item) => {
    if (item._type === 'medicine') return item.medicineType ? item.medicineType.charAt(0).toUpperCase() + item.medicineType.slice(1) : 'Medicine'
    return isFood(item) ? 'Food' : 'Store'
  }

  const getItemValue = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') return getTotalStock(item) * (item.sellingPricePerMl ?? 0)
      if (item.medicineType === 'tablet') return getTotalStock(item) * (item.sellingPricePerTablet ?? 0)
    }
    if (isFood(item)) return getTotalStock(item) * (item.sellingPricePerKg ?? 0)
    return (item.stockQuantity ?? 0) * (item.sellingPrice ?? 0)
  }

  const filteredItems = allItems.filter(item => {
    const matchesSearch =
      item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplierName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesType =
      itemType === 'All' ||
      (itemType === 'Medicines' && item._type === 'medicine') ||
      (itemType === 'Store Items' && item._type === 'store')

    let matchesStock = true
    if (stockFilter === 'Low Stock') matchesStock = isLowStock(item) && !isOutOfStock(item)
    else if (stockFilter === 'Out of Stock') matchesStock = isOutOfStock(item)
    else if (stockFilter === 'Expiring Soon') {
      if (item._type === 'medicine' && item.expirationDate) {
        matchesStock = new Date(item.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      } else matchesStock = false
    }

    return matchesSearch && matchesCategory && matchesType && matchesStock
  })

  const displayedItems = filteredItems.slice(0, displayCount)
  const hasMore = displayCount < filteredItems.length

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore) setDisplayCount(prev => prev + 20) },
      { threshold: 0.1 }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore])

  useEffect(() => { setDisplayCount(20) }, [searchQuery, activeCategory, stockFilter, itemType])

  const lowStockCount = allItems.filter(i => isLowStock(i) && !isOutOfStock(i)).length
  const outOfStockCount = allItems.filter(i => isOutOfStock(i)).length
  const expiringSoonCount = medicines.filter(m => {
    if (!m.expirationDate) return false
    return new Date(m.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }).length
  const totalValue = allItems.reduce((sum, i) => sum + getItemValue(i), 0)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* Add Stock Modal */}
      <AddStockModal
        isOpen={showAddStock}
        onClose={() => setShowAddStock(false)}
        onSave={loadData}
        medicineCategories={medicineCategories}
        storeCategories={storeCategories}
        medicineForms={medicineForms}
        packUnits={packUnits}
        subUnits={subUnits}
        onPackUnitsChange={handlePackUnitsChange}
        onSubUnitsChange={handleSubUnitsChange}
      />

      {/* Edit Modal */}
      <EditStockModal
        item={editItem}
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSave={loadData}
        onDelete={loadData}
        medicineCategories={medicineCategories}
        storeCategories={storeCategories}
        medicineForms={medicineForms}
        packUnits={packUnits}
        subUnits={subUnits}
        brands={brands}
        onPackUnitsChange={handlePackUnitsChange}
        onSubUnitsChange={handleSubUnitsChange}
        onMedicineCategoriesChange={handleMedicineCategoriesChange}
        onStoreCategoriesChange={handleStoreCategoriesChange}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex-shrink-0">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 mb-3">
          <h1 className="text-xl font-semibold text-gray-900">Inventory Management</h1>
          <div className="flex flex-wrap items-center gap-3">

            {/* ── Add Stock Button ── */}
            <button
              onClick={() => setShowAddStock(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              <FiPlus className="w-4 h-4" />
              Add Stock
            </button>

            {/* ── Edit History Button ── */}
            <button
              onClick={() => navigate('/stock-edit-history')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <FiClock className="w-4 h-4" />
              Edit History
            </button>

            {/* ── Stat Badges ── */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{lowStockCount}</span>
              </div>
              <p className="text-xs text-gray-500">Low Stock</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{outOfStockCount}</span>
              </div>
              <p className="text-xs text-gray-500">Out of Stock</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{expiringSoonCount}</span>
              </div>
              <p className="text-xs text-gray-500">Expiring</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₱{totalValue.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500">Total Value</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search items..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
          </div>
          <select value={itemType} onChange={(e) => setItemType(e.target.value)} className="w-full md:w-auto px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-sm">
            <option value="All">All Types</option>
            <option value="Medicines">Medicines</option>
            <option value="Store Items">Store Items</option>
          </select>
          <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="w-full md:w-auto px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-sm">
            {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="w-full md:w-auto px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-sm">
            <option value="All">All Status</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Expiring Soon">Expiring Soon</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden px-4 md:px-6 py-3">
        <div className="bg-white rounded-md border border-gray-200 shadow-sm h-full overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1100px] text-xs">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Item</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Brand</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Stock</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Supplier</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">Purchase</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">Selling Price</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Expiry</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-sm">Loading inventory...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <FiPackage className="w-12 h-12 text-gray-300" />
                        <span className="text-sm font-medium">No items found</span>
                        <span className="text-xs text-gray-400">Adjust your filters or add new inventory</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {displayedItems.map((item) => {
                      const isExpiringSoon = item._type === 'medicine' && item.expirationDate &&
                        new Date(item.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      const low = isLowStock(item)
                      const out = isOutOfStock(item)

                      return (
                        <tr key={`${item._type}-${item.id}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-gray-900">{item.itemName || 'N/A'}</span>
                              {isExpiringSoon && <FiAlertCircle className="w-3 h-3 text-orange-500 flex-shrink-0" title="Expiring Soon" />}
                            </div>
                          </td>
                          <td className="px-3 py-1.5 text-gray-900">{item.brand || <span className="text-gray-400 italic">—</span>}</td>
                          <td className="px-3 py-1.5 text-gray-900 whitespace-nowrap">{getTypeLabel(item)}</td>
                          <td className="px-3 py-1.5 text-gray-900">{item.category || 'N/A'}</td>
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-1">
                              {(out || low) && <FiAlertCircle className={`w-3 h-3 flex-shrink-0 ${out ? 'text-red-500' : 'text-yellow-500'}`} />}
                              <div className={out ? 'text-red-600' : low ? 'text-yellow-600' : ''}>{getStockDisplay(item)}</div>
                            </div>
                          </td>
                          <td className="px-3 py-1.5 text-gray-900">{item.supplierName || <span className="text-gray-400 italic">N/A</span>}</td>
                          <td className="px-3 py-1.5 text-right text-gray-900">
                            ₱{item.purchasePrice?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                          </td>
                          <td className="px-3 py-1.5 text-gray-900 font-semibold text-blue-600">{getSellingPriceDisplay(item)}</td>
                          <td className="px-3 py-1.5">
                            {item._type === 'medicine' && item.expirationDate ? (
                              <span className={isExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-900'}>
                                {new Date(item.expirationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            ) : <span className="text-gray-400 italic">N/A</span>}
                          </td>

                          {/* ── Edit Button ── */}
                          <td className="px-3 py-1.5 text-center">
                            <button
                              onClick={() => setEditItem(item)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {hasMore && (
                      <tr ref={observerTarget}>
                        <td colSpan="10" className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                            <span className="text-xs">Loading more...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MedicinesStocks

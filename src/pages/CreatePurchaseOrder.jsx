import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiPlus, FiTrash2, FiArrowLeft, FiPackage, FiChevronDown, FiX, FiCalendar } from 'react-icons/fi'
import { addPurchaseOrder, addMedicine, addStoreItem, getMasterData, saveMasterData, addExpense, MASTER_DATA_DEFAULTS } from '../firebase/services'

// ── Reusable Unit Dropdown with Add / Delete ──────────────────────────────────
function UnitDropdown({ label, value, onChange, units, onUnitsChange, placeholder = 'Select or type...' }) {
  const [open, setOpen] = useState(false)
  const [newUnit, setNewUnit] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState({})  // ← track position in state
  const [lastAddedUnit, setLastAddedUnit] = useState(null) // ← track newly added unit for visual feedback
  const [savedMessage, setSavedMessage] = useState(false) // ← show save confirmation
  const ref = useRef(null)
  const dropdownRef = useRef(null)

  // ── Recalculate position whenever open or on scroll/resize ──
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

    // Re-position on any scroll or resize (captures scrolling inside panels too)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  // ── Outside click handler ──
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
    // Auto-close dropdown after 1.5 seconds
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
          {/* ── Success message ── */}
          {savedMessage && (
            <div className="px-3 py-2 bg-green-50 border-b border-green-200 text-xs text-green-700 font-medium flex items-center gap-1.5">
              <span className="w-4 h-4 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">✓</span>
              Saved to Master Data
            </div>
          )}

          {/* ── Add new row ── */}
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

          {/* ── Unit list ── */}
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

// ── Main Component ────────────────────────────────────────────────────────────
function CreatePurchaseOrder() {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedSupplier = location.state?.supplier

  const [orderItems, setOrderItems] = useState([])
  const [orderFormData, setOrderFormData] = useState({
    orderDate: new Date().toISOString().split('T')[0],
    paymentTerms: selectedSupplier?.paymentTerms || '0'
  })

  const [packUnits, setPackUnits] = useState([...MASTER_DATA_DEFAULTS.packUnits])
  const [subUnits, setSubUnits] = useState([...MASTER_DATA_DEFAULTS.subUnits])
  const [medicineCategories, setMedicineCategories] = useState([...MASTER_DATA_DEFAULTS.medicineCategories])
  const [storeCategories, setStoreCategories] = useState([...MASTER_DATA_DEFAULTS.storeCategories])
  const [brands, setBrands] = useState([...MASTER_DATA_DEFAULTS.brands])
  const [medicineForms, setMedicineForms] = useState({ ...MASTER_DATA_DEFAULTS.medicineForms })

  const [currentItem, setCurrentItem] = useState({
    itemType: 'medicine',
    itemName: '',
    category: 'Antibiotic',
    brand: '',
    description: '',
    quantity: '',
    packUnit: 'box',
    unitsPerPack: '',
    subUnit: 'tablet',
    packageSize: '',
    packageUnit: 'pcs',
    purchasePrice: '',
    sellingPricePerUnit: '',
    sellingPricePerPack: '',
    sellingPrice: '',
    expirationDate: '',
    medicineType: 'tablet',
  })

  const foodCategories = ['Dog Food', 'Cat Food', 'Bird Food']

  const getMedicineLabels = (medicineType) => {
    switch (medicineType) {
      case 'syrup':  return { packUnit: 'bottle', subUnit: 'ml',     purchaseLabel: 'Purchase Price (per bottle)' }
      case 'tablet': return { packUnit: 'box',    subUnit: 'tablet', purchaseLabel: 'Purchase Price (per box)' }
      case 'vial':   return { packUnit: 'vial',   subUnit: null,     purchaseLabel: 'Purchase Price (per vial)' }
      default:       return { packUnit: 'pack',   subUnit: null,     purchaseLabel: 'Purchase Price' }
    }
  }

  const isFoodCategory  = () => foodCategories.includes(currentItem.category) && currentItem.itemType === 'store'
  const isItemFoodCategory = (item) => foodCategories.includes(item.category) && item.itemType === 'store'
  const isSyrup  = () => currentItem.itemType === 'medicine' && currentItem.medicineType === 'syrup'
  const isTablet = () => currentItem.itemType === 'medicine' && currentItem.medicineType === 'tablet'
  const isItemSyrup  = (item) => item.itemType === 'medicine' && item.medicineType === 'syrup'
  const isItemTablet = (item) => item.itemType === 'medicine' && item.medicineType === 'tablet'
  const hasDualStock = () => isSyrup() || isTablet() || isFoodCategory()
  const isDualStockItem = (item) =>
    (item.itemType === 'medicine' && (item.medicineType === 'syrup' || item.medicineType === 'tablet')) ||
    (item.itemType === 'store' && foodCategories.includes(item.category))

  const parseDecimal = (value) => {
    if (value === '' || value === '.' || value === '-.' || value === '-') return null
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }

  const applyPerUnitAutoCalc = (item) => {
    if (!isDualStockItem(item)) return item
    const perPack = parseDecimal(item.sellingPricePerPack)
    const unitsPerPack = parseDecimal(item.unitsPerPack)
    if (!perPack || !unitsPerPack) return item
    const perUnit = perPack / unitsPerPack
    return { ...item, sellingPricePerUnit: perUnit.toFixed(2) }
  }

  useEffect(() => {
    if (!selectedSupplier) navigate('/suppliers')
    getMasterData().then(data => {
      if (data) {
        if (data.packUnits?.length) setPackUnits(data.packUnits)
        if (data.subUnits?.length) setSubUnits(data.subUnits)
        if (data.medicineCategories?.length) setMedicineCategories(data.medicineCategories)
        if (data.storeCategories?.length) setStoreCategories(data.storeCategories)
        if (data.medicineForms) setMedicineForms(data.medicineForms)
      }
    })
  }, [selectedSupplier, navigate])

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

  const calculatePaymentDeadline = (orderDate, paymentTerms) => {
    const date = new Date(orderDate)
    if (paymentTerms.toLowerCase() === 'cod') return orderDate
    const daysMatch = paymentTerms.match(/\d+/)
    if (daysMatch) {
      date.setDate(date.getDate() + parseInt(daysMatch[0]))
      return date.toISOString().split('T')[0]
    }
    return orderDate
  }

  const handleCurrentItemChange = (field, value) => {
    if (field === 'itemType') {
      const isMed = value === 'medicine'
      setCurrentItem({
        ...currentItem,
        itemType: value,
        category: isMed ? 'Antibiotic' : 'Dog Food',
        medicineType: 'tablet',
        packUnit: isMed ? 'box' : 'sack',
        subUnit: isMed ? 'tablet' : 'kg',
        quantity: '', unitsPerPack: '', packageSize: '',
        purchasePrice: '', sellingPricePerUnit: '', sellingPricePerPack: '', sellingPrice: '',
        expirationDate: '',
      })
    } else if (field === 'medicineType') {
      const labels = getMedicineLabels(value)
      setCurrentItem({
        ...currentItem,
        medicineType: value,
        packUnit: labels.packUnit,
        subUnit: labels.subUnit ?? '',
        quantity: '', unitsPerPack: '',
        purchasePrice: '', sellingPricePerUnit: '', sellingPricePerPack: '', sellingPrice: '',
      })
    } else if (field === 'category' && currentItem.itemType === 'store') {
      const isFood = foodCategories.includes(value)
      setCurrentItem({
        ...currentItem,
        category: value,
        packUnit: isFood ? 'sack' : currentItem.packUnit,
        subUnit: isFood ? 'kg' : currentItem.subUnit,
        sellingPricePerPack: '', sellingPricePerUnit: '', packageSize: '',
      })
    } else {
      setCurrentItem(prev => {
        const next = { ...prev, [field]: value }
        if (field === 'sellingPricePerPack' || field === 'unitsPerPack') {
          return applyPerUnitAutoCalc(next)
        }
        return next
      })
    }
  }

  const handleAddItemToOrder = (e) => {
    e.preventDefault()
    if (!currentItem.itemName)      { alert('Item Name is required'); return }
    if (!currentItem.quantity)      { alert('Quantity ordered is required'); return }
    if (!currentItem.purchasePrice) { alert('Purchase Price is required'); return }
    if (currentItem.itemType === 'medicine' && !currentItem.expirationDate) {
      alert('Expiration date is required for medicines'); return
    }
    if (hasDualStock()) {
      if (!currentItem.unitsPerPack)       { alert('Units per pack is required'); return }
      if (!currentItem.sellingPricePerUnit){ alert('Selling price per unit is required'); return }
      if (!currentItem.sellingPricePerPack){ alert('Selling price per pack is required'); return }
    } else {
      if (!currentItem.sellingPrice)       { alert('Selling Price is required'); return }
    }

    setOrderItems(prev => [...prev, {
      ...currentItem,
      quantity:            Number(currentItem.quantity),
      unitsPerPack:        currentItem.unitsPerPack   ? Number(currentItem.unitsPerPack)   : null,
      packageSize:         currentItem.packageSize    ? Number(currentItem.packageSize)    : null,
      purchasePrice:       Number(currentItem.purchasePrice),
      sellingPricePerUnit: currentItem.sellingPricePerUnit ? Number(currentItem.sellingPricePerUnit) : null,
      sellingPricePerPack: currentItem.sellingPricePerPack ? Number(currentItem.sellingPricePerPack) : null,
      sellingPrice:        currentItem.sellingPrice   ? Number(currentItem.sellingPrice)   : null,
    }])

    setCurrentItem(prev => ({
      ...prev,
      itemName: '', brand: '', description: '',
      quantity: '', unitsPerPack: '', packageSize: '',
      purchasePrice: '', sellingPricePerUnit: '', sellingPricePerPack: '', sellingPrice: '',
      expirationDate: '',
    }))
  }

  const handleRemoveOrderItem = (index) =>
    setOrderItems(prev => prev.filter((_, i) => i !== index))

  const calculateOrderTotal = () =>
    orderItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0)

  const handleSubmitPurchaseOrder = async (e) => {
    e.preventDefault()
    if (orderItems.length === 0) { alert('Please add at least one item.'); return }

    try {
      const orderNumber = `PO-${Date.now()}`
      const totalAmount = calculateOrderTotal()
      const paymentDeadline = calculatePaymentDeadline(orderFormData.orderDate, orderFormData.paymentTerms)

      await addPurchaseOrder({
        orderNumber,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.supplierName,
        orderDate: orderFormData.orderDate,
        paymentTerms: orderFormData.paymentTerms,
        paymentDeadline,
        totalAmount,
        paymentStatus: 'Pending',
        items: orderItems,
        createdAt: new Date().toISOString()
      })

      for (const item of orderItems) {
        if (item.itemType === 'medicine') {
          if (isItemSyrup(item)) {
            await addMedicine({
              medicineName: item.itemName, category: item.category,
              brand: item.brand || '', description: item.description || '',
              medicineType: 'syrup',
              bottleCount: item.quantity - 1,
              looseMl: item.unitsPerPack,
              mlPerBottle: item.unitsPerPack,
              stockQuantity: item.quantity * item.unitsPerPack,
              unit: item.packUnit,
              sellingPricePerMl: item.sellingPricePerUnit,
              sellingPricePerBottle: item.sellingPricePerPack,
              purchasePrice: item.purchasePrice,
              expirationDate: item.expirationDate,
              supplierId: selectedSupplier.id, supplierName: selectedSupplier.supplierName,
              createdAt: new Date().toISOString()
            })
          } else if (isItemTablet(item)) {
            await addMedicine({
              medicineName: item.itemName, category: item.category,
              brand: item.brand || '', description: item.description || '',
              medicineType: 'tablet',
              boxCount: item.quantity - 1,
              looseTablets: item.unitsPerPack,
              tabletsPerBox: item.unitsPerPack,
              stockQuantity: item.quantity * item.unitsPerPack,
              unit: item.packUnit,
              sellingPricePerTablet: item.sellingPricePerUnit,
              sellingPricePerBox: item.sellingPricePerPack,
              purchasePrice: item.purchasePrice,
              expirationDate: item.expirationDate,
              supplierId: selectedSupplier.id, supplierName: selectedSupplier.supplierName,
              createdAt: new Date().toISOString()
            })
          } else {
            await addMedicine({
              medicineName: item.itemName, category: item.category,
              brand: item.brand || '', description: item.description || '',
              medicineType: item.medicineType || 'other',
              stockQuantity: item.quantity,
              unit: item.packUnit,
              sellingPrice: item.sellingPrice,
              purchasePrice: item.purchasePrice,
              expirationDate: item.expirationDate,
              supplierId: selectedSupplier.id, supplierName: selectedSupplier.supplierName,
              createdAt: new Date().toISOString()
            })
          }
        } else if (item.itemType === 'store') {
          if (isItemFoodCategory(item)) {
            await addStoreItem({
              itemName: item.itemName, category: item.category,
              brand: item.brand || '', description: item.description || '',
              stockQuantity: item.quantity * item.unitsPerPack,
              sacksCount: item.quantity - 1,
              looseKg: item.unitsPerPack,
              kgPerSack: item.unitsPerPack,
              unit: item.packUnit,
              sellingPricePerKg: item.sellingPricePerUnit,
              sellingPricePerSack: item.sellingPricePerPack,
              purchasePrice: item.purchasePrice,
              hasBundle: false,
              supplierId: selectedSupplier.id, supplierName: selectedSupplier.supplierName,
              createdAt: new Date().toISOString()
            })
          } else {
            const totalStock = item.packageSize ? item.quantity * item.packageSize : item.quantity
            await addStoreItem({
              itemName: item.itemName, category: item.category,
              brand: item.brand || '', description: item.description || '',
              stockQuantity: totalStock,
              unit: item.packageSize ? (item.packageUnit || 'pcs') : item.packUnit,
              packageUnit: item.packUnit,
              packageSize: item.packageSize || null,
              purchasePrice: item.purchasePrice,
              sellingPrice: item.sellingPrice,
              hasBundle: false,
              supplierId: selectedSupplier.id, supplierName: selectedSupplier.supplierName,
              createdAt: new Date().toISOString()
            })
          }
        }
      }

      // Create expense record if cash payment is selected
      if (orderFormData.paymentTerms === '0') {
        try {
          await addExpense({
            expenseName: `PO Purchase: ${selectedSupplier.supplierName}`,
            category: 'Supplier Payment',
            amount: totalAmount.toString(),
            expenseDate: orderFormData.orderDate,
            description: `Purchase Order ${orderNumber} - Cash Payment from ${selectedSupplier.supplierName}. Items: ${orderItems.map(i => i.itemName).join(', ')}`
          })
        } catch (expenseError) {
          console.error('Warning: Failed to create expense record:', expenseError)
          // Don't fail the entire operation if expense logging fails
        }
      }

      alert(`Purchase order created successfully!${orderFormData.paymentTerms === '0' ? '\nExpense record created.' : ''}`)
      navigate('/suppliers')
    } catch (error) {
      console.error('Error creating purchase order:', error)
      alert('Failed to create purchase order.')
    }
  }

  if (!selectedSupplier) return null

  const capFirst = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ── LEFT: Form ── */}
        <div className="w-full lg:w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/suppliers')} className="text-gray-600 hover:text-gray-900">
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="font-semibold text-gray-900">Add New Item</h3>
                <p className="text-xs text-gray-400">{selectedSupplier.supplierName}</p>
              </div>
            </div>
            {orderFormData.paymentTerms === '0' && (
              <div className="px-2.5 py-1 bg-green-100 text-green-800 rounded text-xs font-medium whitespace-nowrap">
                Cash Payment
              </div>
            )}
            {orderFormData.paymentTerms !== '0' && orderFormData.paymentTerms && (
              <div className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium whitespace-nowrap">
                Due: {new Date(orderFormData.paymentTerms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* Order Date & Payment Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Order Date *</label>
                <input type="date" value={orderFormData.orderDate}
                  onChange={(e) => setOrderFormData({ ...orderFormData, orderDate: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Payment Terms *</label>
                <div className="space-y-2">
                  <select 
                    value={orderFormData.paymentTerms === '0' ? 'cash' : 'terms'}
                    onChange={(e) => {
                      if (e.target.value === 'cash') {
                        setOrderFormData({ ...orderFormData, paymentTerms: '0' })
                      } else {
                        setOrderFormData({ ...orderFormData, paymentTerms: '' })
                      }
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                    <option value="cash">Cash Payment</option>
                    <option value="terms">Payment Terms</option>
                  </select>
                  {orderFormData.paymentTerms === '0' && (
                    <p className="text-xs text-gray-500">Expense will be recorded automatically</p>
                  )}
                  {orderFormData.paymentTerms !== '0' && (
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4 text-gray-400" />
                      <input type="date" 
                        value={orderFormData.paymentTerms}
                        onChange={(e) => setOrderFormData({ ...orderFormData, paymentTerms: e.target.value })}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                        min={orderFormData.orderDate}
                        autoFocus />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Item Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
              <select value={currentItem.itemType} onChange={(e) => handleCurrentItemChange('itemType', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                <option value="medicine">Medicine</option>
                <option value="store">Store</option>
              </select>
            </div>

            {/* Medicine Form */}
            {currentItem.itemType === 'medicine' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Medicine Form *</label>
                <select value={currentItem.medicineType} onChange={(e) => handleCurrentItemChange('medicineType', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                  {Object.entries(medicineForms).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Item Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Item Name *</label>
              <input type="text" value={currentItem.itemName}
                onChange={(e) => handleCurrentItemChange('itemName', e.target.value)}
                placeholder={currentItem.itemType === 'medicine' ? 'e.g. Amoxicillin' : 'e.g. Champion Dog Food'}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            {/* Brand */}
            <div>
              <BrandDropdown
                label="Brand"
                value={currentItem.brand}
                onChange={(v) => handleCurrentItemChange('brand', v)}
                brands={brands}
                onBrandsChange={handleBrandsChange}
                placeholder="Select or add brand"
              />
            </div>

            {/* Category */}
            <div>
              <CategoryDropdown
                label="Category *"
                value={currentItem.category}
                onChange={(v) => handleCurrentItemChange('category', v)}
                categories={currentItem.itemType === 'medicine' ? medicineCategories : storeCategories}
                onCategoriesChange={currentItem.itemType === 'medicine' ? handleMedicineCategoriesChange : handleStoreCategoriesChange}
                placeholder="Select category"
              />
            </div>

            {/* Expiry Date (medicine only) */}
            {currentItem.itemType === 'medicine' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date *</label>
                <input type="date" value={currentItem.expirationDate}
                  onChange={(e) => handleCurrentItemChange('expirationDate', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            )}

            {/* ── DUAL STOCK (syrup / tablet / food) ── */}
            {hasDualStock() && (
              <>
                {/* Pack Called + Unit Inside — each uses UnitDropdown */}
                {currentItem.itemType === 'medicine' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <UnitDropdown
                      label="Pack Called *"
                      value={currentItem.packUnit}
                      onChange={(v) => handleCurrentItemChange('packUnit', v)}
                      units={packUnits}
                      onUnitsChange={handlePackUnitsChange}
                      placeholder="e.g. bottle"
                    />
                    <UnitDropdown
                      label="Unit Inside *"
                      value={currentItem.subUnit}
                      onChange={(v) => handleCurrentItemChange('subUnit', v)}
                      units={subUnits}
                      onUnitsChange={handleSubUnitsChange}
                      placeholder="e.g. ml"
                    />
                  </div>
                )}

                {/* Qty + Units per Pack */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      No. of {capFirst(currentItem.packUnit) || 'Pack'}s *
                    </label>
                    <input type="text" inputMode="decimal" min="1" value={currentItem.quantity}
                      onChange={(e) => handleCurrentItemChange('quantity', e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {currentItem.subUnit
                        ? `${capFirst(currentItem.subUnit)} per ${currentItem.packUnit || 'Pack'} *`
                        : 'Units per Pack *'}
                    </label>
                    <input type="text" inputMode="decimal" min="1" step="0.01" value={currentItem.unitsPerPack}
                      onChange={(e) => handleCurrentItemChange('unitsPerPack', e.target.value)}
                      placeholder="e.g. 60"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>

                {/* Stock Preview */}
                {currentItem.quantity && currentItem.unitsPerPack && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5">
                    <p className="text-xs font-semibold text-blue-800 mb-1">Stock Preview</p>
                    <p className="text-xs text-blue-700">{Number(currentItem.quantity)} {currentItem.packUnit}s ordered</p>
                    <p className="text-xs text-blue-700">
                      On save: <strong>{Number(currentItem.quantity) - 1} sealed {currentItem.packUnit}s</strong>
                      {' + '}
                      <strong>{Number(currentItem.unitsPerPack)} {currentItem.subUnit} loose</strong>
                      {' '}(1 {currentItem.packUnit} opened)
                    </p>
                    <p className="text-xs text-blue-700">
                      Total: <strong>{Number(currentItem.quantity) * Number(currentItem.unitsPerPack)} {currentItem.subUnit}</strong>
                    </p>
                  </div>
                )}

                {/* Pricing */}
                <div className="border border-gray-200 rounded-md p-2.5 space-y-2">
                  <p className="text-xs font-semibold text-gray-800">Pricing</p>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Purchase Price (per {currentItem.packUnit || 'pack'}) *
                    </label>
                    <input type="text" inputMode="decimal" min="0" step="0.01" value={currentItem.purchasePrice}
                      onChange={(e) => handleCurrentItemChange('purchasePrice', e.target.value)}
                      placeholder={`₱ per ${currentItem.packUnit || 'pack'}`}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Selling Price per {currentItem.subUnit || 'unit'} *
                    </label>
                    <input type="text" inputMode="decimal" min="0" step="0.01" value={currentItem.sellingPricePerUnit}
                      onChange={(e) => handleCurrentItemChange('sellingPricePerUnit', e.target.value)}
                      placeholder={`₱ per ${currentItem.subUnit || 'unit'}`}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Selling Price per {currentItem.packUnit || 'pack'} *
                    </label>
                    <input type="text" inputMode="decimal" min="0" step="0.01" value={currentItem.sellingPricePerPack}
                      onChange={(e) => handleCurrentItemChange('sellingPricePerPack', e.target.value)}
                      placeholder={`₱ per ${currentItem.packUnit || 'pack'}`}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
              </>
            )}

            {/* ── VIAL / OTHER (medicine, no dual stock) ── */}
            {currentItem.itemType === 'medicine' && !isSyrup() && !isTablet() && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <UnitDropdown
                    label="Pack Called *"
                    value={currentItem.packUnit}
                    onChange={(v) => handleCurrentItemChange('packUnit', v)}
                    units={packUnits}
                    onUnitsChange={handlePackUnitsChange}
                    placeholder="e.g. vial"
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Qty Ordered *</label>
                    <input type="text" inputMode="decimal" min="1" value={currentItem.quantity}
                      onChange={(e) => handleCurrentItemChange('quantity', e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Price *</label>
                    <input type="text" inputMode="decimal" min="0" step="0.01" value={currentItem.purchasePrice}
                      onChange={(e) => handleCurrentItemChange('purchasePrice', e.target.value)}
                      placeholder="₱"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price *</label>
                    <input type="text" inputMode="decimal" min="0" step="0.01" value={currentItem.sellingPrice}
                      onChange={(e) => handleCurrentItemChange('sellingPrice', e.target.value)}
                      placeholder="₱"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
              </>
            )}

            {/* ── NON-FOOD STORE ── */}
            {currentItem.itemType === 'store' && !isFoodCategory() && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <UnitDropdown
                    label="Pack Called *"
                    value={currentItem.packUnit}
                    onChange={(v) => handleCurrentItemChange('packUnit', v)}
                    units={packUnits}
                    onUnitsChange={handlePackUnitsChange}
                    placeholder="e.g. bag"
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Qty Ordered *</label>
                    <input type="text" inputMode="decimal" min="1" value={currentItem.quantity}
                      onChange={(e) => handleCurrentItemChange('quantity', e.target.value)}
                      placeholder="e.g. 12"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pcs per Package <span className="text-gray-400">(optional)</span></label>
                  <input type="text" inputMode="decimal" min="1" value={currentItem.packageSize}
                    onChange={(e) => handleCurrentItemChange('packageSize', e.target.value)}
                    placeholder="e.g. 12 pcs per box"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Price *</label>
                    <input type="text" inputMode="decimal" min="0" step="0.01" value={currentItem.purchasePrice}
                      onChange={(e) => handleCurrentItemChange('purchasePrice', e.target.value)}
                      placeholder="₱"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price *</label>
                    <input type="text" inputMode="decimal" min="0" step="0.01" value={currentItem.sellingPrice}
                      onChange={(e) => handleCurrentItemChange('sellingPrice', e.target.value)}
                      placeholder="₱"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Add Button */}
          <div className="p-4 border-t border-gray-200">
            <button onClick={handleAddItemToOrder}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 font-medium flex items-center justify-center gap-2">
              <FiPlus className="w-4 h-4" /> Add Item to Order
            </button>
          </div>
        </div>

        {/* ── RIGHT: Table ── */}
          <div className="flex-1 flex flex-col bg-gray-50">
          <div className="px-4 md:px-6 py-3 bg-white border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Order Items ({orderItems.length})</h3>
          </div>

          <div className="flex-1 p-4 md:p-6 flex flex-col h-auto lg:h-[calc(100vh-200px)]">
            {orderItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <FiPackage className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">No items added yet</p>
                  <p className="text-sm">Add items using the form on the left</p>
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
                          <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">Stock</th>
                          <th className="px-2 py-2 text-right font-semibold uppercase tracking-wide">Purchase</th>
                          <th className="px-2 py-2 text-right font-semibold uppercase tracking-wide">Selling</th>
                          <th className="px-2 py-2 text-right font-semibold uppercase tracking-wide">Subtotal</th>
                          <th className="px-2 py-2 text-center font-semibold uppercase tracking-wide">Del</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orderItems.map((item, index) => {
                          const isDual = isItemSyrup(item) || isItemTablet(item) || isItemFoodCategory(item)
                          if (isDual) {
                            const sealed = item.quantity - 1
                            return (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-2 py-2 font-medium text-gray-900 capitalize">{item.medicineType || 'food'}</td>
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
                                <td className="px-2 py-2 text-right text-gray-700 whitespace-nowrap">
                                  ₱{item.purchasePrice.toLocaleString()}/{item.packUnit}
                                </td>
                                <td className="px-2 py-2 text-right text-gray-700 whitespace-nowrap">
                                  <div>₱{item.sellingPricePerUnit?.toLocaleString()}/{item.subUnit}</div>
                                  <div className="text-gray-400">₱{item.sellingPricePerPack?.toLocaleString()}/{item.packUnit}</div>
                                </td>
                                <td className="px-2 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
                                  ₱{(item.purchasePrice * item.quantity).toLocaleString()}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <button onClick={() => handleRemoveOrderItem(index)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            )
                          }
                          const totalStock = item.packageSize ? item.quantity * item.packageSize : item.quantity
                          return (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-2 py-2 font-medium text-gray-900 capitalize">
                                {item.itemType === 'medicine' ? item.medicineType : 'Store'}
                              </td>
                              <td className="px-2 py-2">
                                <span className="font-medium text-gray-900">{item.itemName}</span>
                                {item.brand && <span className="text-gray-400 ml-1">({item.brand})</span>}
                              </td>
                              <td className="px-2 py-2 text-gray-700">{item.category}</td>
                              <td className="px-2 py-2 text-gray-700 whitespace-nowrap">
                                {item.quantity} {item.packUnit}{item.packageSize ? ` × ${item.packageSize} pcs` : ''}
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap font-semibold text-gray-900">
                                {totalStock} {item.packUnit}
                              </td>
                              <td className="px-2 py-2 text-right text-gray-700 whitespace-nowrap">
                                ₱{item.purchasePrice.toLocaleString()}/{item.packUnit}
                              </td>
                              <td className="px-2 py-2 text-right text-gray-700 whitespace-nowrap">
                                ₱{item.sellingPrice?.toLocaleString()}/{item.packUnit}
                              </td>
                              <td className="px-2 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
                                ₱{(item.purchasePrice * item.quantity).toLocaleString()}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button onClick={() => handleRemoveOrderItem(index)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
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
                <div className="bg-white rounded-md border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Supplier: <span className="font-medium text-gray-900">{selectedSupplier.supplierName}</span></p>
                      <p className="text-xs text-gray-500 mt-1">
                        Payment Due: {new Date(calculatePaymentDeadline(orderFormData.orderDate, orderFormData.paymentTerms)).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                      <p className="text-3xl font-bold text-gray-900">₱{calculateOrderTotal().toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="px-4 md:px-6 py-3 bg-white border-t border-gray-200 flex flex-col sm:flex-row gap-3">
            <button onClick={() => navigate('/suppliers')}
              className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button onClick={handleSubmitPurchaseOrder} disabled={orderItems.length === 0}
              className="w-full sm:flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed">
              Create Purchase Order
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default CreatePurchaseOrder

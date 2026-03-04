// MedicinesStocks.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'      // ← add this
import { FiSearch, FiX, FiTrash2, FiSave, FiClock, FiPackage, FiAlertCircle } from 'react-icons/fi'   // ← add FiClock
import { getMedicines, getStoreItems, updateMedicine, updateStoreItem, deleteMedicine, deleteStoreItem, logStockEdit } from '../firebase/services'

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditStockModal({ item, isOpen, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const foodCategories = ['Dog Food', 'Cat Food', 'Bird Food']
  const medicineCategories = ['Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care']
  const storeCategories = ['Dog Food', 'Cat Food', 'Bird Food', 'Treats & Snacks', 'Toys', 'Accessories', 'Grooming', 'Health & Wellness', 'Bedding', 'Other']

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

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      // ── Build a diff of what changed ──
      const changes = {}
      Object.keys(form).forEach(key => {
        if (JSON.stringify(form[key]) !== JSON.stringify(item[key])) {
          changes[key] = { before: item[key], after: form[key] }
        }
      })

      if (item._type === 'medicine') {
        await updateMedicine(item.id, form)
      } else {
        await updateStoreItem(item.id, form)
      }

      // ── Log the edit ──
      await logStockEdit({
        itemId: item.id,
        itemName: item.itemName || item.medicineName || '',
        itemType: item._type,
        action: 'edit',
        changes,
        editedAt: new Date().toISOString(),
      })

      onSave()
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                {item._type === 'medicine' ? 'Medicine Name' : 'Item Name'} *
              </label>
              <input type="text" value={form.medicineName || form.itemName || ''} className={inputClass}
                onChange={(e) => set(item._type === 'medicine' ? 'medicineName' : 'itemName', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Brand</label>
              <input type="text" value={form.brand || ''} className={inputClass}
                onChange={(e) => set('brand', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category || ''} className={`${inputClass} bg-white`}
                onChange={(e) => set('category', e.target.value)}>
                {(item._type === 'medicine' ? medicineCategories : storeCategories).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {item._type === 'medicine' && (
              <div>
                <label className={labelClass}>Medicine Type</label>
                <select value={form.medicineType || ''} className={`${inputClass} bg-white`}
                  onChange={(e) => set('medicineType', e.target.value)}>
                  <option value="tablet">Tablet / Capsule</option>
                  <option value="syrup">Syrup / Liquid</option>
                  <option value="vial">Vial / Injectable</option>
                  <option value="other">Other</option>
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Sealed Bottles</label>
                  <input type="number" min="0" value={form.bottleCount ?? 0} className={inputClass}
                    onChange={(e) => set('bottleCount', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Loose ML</label>
                  <input type="number" min="0" step="0.01" value={form.looseMl ?? 0} className={inputClass}
                    onChange={(e) => set('looseMl', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>ML per Bottle</label>
                  <input type="number" min="1" step="0.01" value={form.mlPerBottle ?? 0} className={inputClass}
                    onChange={(e) => set('mlPerBottle', Number(e.target.value))} />
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Sealed Boxes</label>
                  <input type="number" min="0" value={form.boxCount ?? 0} className={inputClass}
                    onChange={(e) => set('boxCount', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Loose Tablets</label>
                  <input type="number" min="0" value={form.looseTablets ?? 0} className={inputClass}
                    onChange={(e) => set('looseTablets', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Tablets per Box</label>
                  <input type="number" min="1" value={form.tabletsPerBox ?? 0} className={inputClass}
                    onChange={(e) => set('tabletsPerBox', Number(e.target.value))} />
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Sealed Sacks</label>
                  <input type="number" min="0" value={form.sacksCount ?? 0} className={inputClass}
                    onChange={(e) => set('sacksCount', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Loose KG</label>
                  <input type="number" min="0" step="0.01" value={form.looseKg ?? 0} className={inputClass}
                    onChange={(e) => set('looseKg', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>KG per Sack</label>
                  <input type="number" min="1" step="0.01" value={form.kgPerSack ?? 0} className={inputClass}
                    onChange={(e) => set('kgPerSack', Number(e.target.value))} />
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Quantity</label>
                  <input type="number" min="0" value={form.stockQuantity ?? 0} className={inputClass}
                    onChange={(e) => set('stockQuantity', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Unit</label>
                  <input type="text" value={form.unit || ''} className={inputClass}
                    onChange={(e) => set('unit', e.target.value)}
                    placeholder="e.g. vial, pcs" />
                </div>
              </div>
            </div>
          )}

          {/* ── Pricing ── */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Pricing</p>
            <div>
              <label className={labelClass}>Purchase Price (per pack/unit)</label>
              <input type="number" min="0" step="0.01" value={form.purchasePrice ?? ''} className={inputClass}
                onChange={(e) => set('purchasePrice', Number(e.target.value))} placeholder="₱" />
            </div>
            {isSyrup && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Selling Price per ML</label>
                  <input type="number" min="0" step="0.01" value={form.sellingPricePerMl ?? ''} className={inputClass}
                    onChange={(e) => set('sellingPricePerMl', Number(e.target.value))} placeholder="₱/ml" />
                </div>
                <div>
                  <label className={labelClass}>Selling Price per Bottle</label>
                  <input type="number" min="0" step="0.01" value={form.sellingPricePerBottle ?? ''} className={inputClass}
                    onChange={(e) => set('sellingPricePerBottle', Number(e.target.value))} placeholder="₱/bottle" />
                </div>
              </div>
            )}
            {isTablet && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Selling Price per Tablet</label>
                  <input type="number" min="0" step="0.01" value={form.sellingPricePerTablet ?? ''} className={inputClass}
                    onChange={(e) => set('sellingPricePerTablet', Number(e.target.value))} placeholder="₱/tablet" />
                </div>
                <div>
                  <label className={labelClass}>Selling Price per Box</label>
                  <input type="number" min="0" step="0.01" value={form.sellingPricePerBox ?? ''} className={inputClass}
                    onChange={(e) => set('sellingPricePerBox', Number(e.target.value))} placeholder="₱/box" />
                </div>
              </div>
            )}
            {item._type === 'store' && isFood(form.category) && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Selling Price per KG</label>
                  <input type="number" min="0" step="0.01" value={form.sellingPricePerKg ?? ''} className={inputClass}
                    onChange={(e) => set('sellingPricePerKg', Number(e.target.value))} placeholder="₱/kg" />
                </div>
                <div>
                  <label className={labelClass}>Selling Price per Sack</label>
                  <input type="number" min="0" step="0.01" value={form.sellingPricePerSack ?? ''} className={inputClass}
                    onChange={(e) => set('sellingPricePerSack', Number(e.target.value))} placeholder="₱/sack" />
                </div>
              </div>
            )}
            {!isDualStock && (
              <div>
                <label className={labelClass}>Selling Price</label>
                <input type="number" min="0" step="0.01" value={form.sellingPrice ?? ''} className={inputClass}
                  onChange={(e) => set('sellingPrice', Number(e.target.value))} placeholder="₱" />
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

  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)

  const foodCategories = ['Dog Food', 'Cat Food', 'Bird Food']
  const medicineCategories = ['Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care']
  const storeCategories = ['Dog Food', 'Cat Food', 'Bird Food', 'Treats & Snacks', 'Toys', 'Accessories', 'Grooming', 'Health & Wellness', 'Bedding', 'Other']
  const allCategories = ['All', ...new Set([...medicineCategories, ...storeCategories])]

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
      return (item.stockQuantity ?? 0) <= 5
    }
    if (isFood(item)) return (item.sacksCount ?? 0) < 2 && (item.looseKg ?? 0) < (item.kgPerSack ?? 0)
    return (item.stockQuantity ?? 0) <= 3
  }

  const isOutOfStock = (item) => getTotalStock(item) === 0

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [medicinesData, itemsData] = await Promise.all([getMedicines(), getStoreItems()])
      setMedicines(medicinesData)
      setStoreItems(itemsData)
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
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* Edit Modal */}
      <EditStockModal
        item={editItem}
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSave={loadData}
        onDelete={loadData}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-gray-900">Inventory Management</h1>
          <div className="flex items-center gap-4">

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
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search items..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
          </div>
          <select value={itemType} onChange={(e) => setItemType(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-sm">
            <option value="All">All Types</option>
            <option value="Medicines">Medicines</option>
            <option value="Store Items">Store Items</option>
          </select>
          <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-sm">
            {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-sm">
            <option value="All">All Status</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Expiring Soon">Expiring Soon</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden px-6 py-3">
        <div className="bg-white rounded-md border border-gray-200 shadow-sm h-full overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
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
                          <td className="px-3 py-1.5 text-gray-900">{getSellingPriceDisplay(item)}</td>
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
                              className="px-2 py-1 text-xs font-medium text-white bg-gray-900 hover:bg-gray-700 rounded transition-colors"
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
  )
}

export default MedicinesStocks
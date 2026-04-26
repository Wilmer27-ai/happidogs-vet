import { useState, useEffect, useRef } from 'react'
import { FiSearch, FiShoppingBag, FiMinus, FiPlus, FiX, FiClock, FiShoppingCart } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { getStoreItems, updateStoreItem, getMedicines, updateMedicine, addSale } from '../firebase/services'

function PetStore() {
  const navigate = useNavigate()
  const [storeItems, setStoreItems] = useState([])
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [itemType, setItemType] = useState('All')
  const [order, setOrder] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)

  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)

  const foodCategories = ['Dog Food', 'Cat Food', 'Bird Food']
  const storeCategories = ['Dog Food', 'Cat Food', 'Bird Food', 'Treats & Snacks', 'Toys', 'Accessories', 'Grooming', 'Health & Wellness', 'Bedding', 'Other']
  const medicineCategories = ['Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care']
  const allCategories = ['All', ...new Set([...storeCategories, ...medicineCategories])]

  const isFood = (item) => foodCategories.includes(item?.category)

  const getTypeLabel = (item) => {
    if (item._type === 'medicine') {
      return item.medicineType ? item.medicineType.charAt(0).toUpperCase() + item.medicineType.slice(1) : 'Medicine'
    }
    return isFood(item) ? 'Food' : 'Store'
  }

  useEffect(() => { loadItems() }, [])

  const loadItems = async () => {
    setLoading(true)
    try {
      const [itemsData, medicinesData] = await Promise.all([getStoreItems(), getMedicines()])
      setStoreItems(itemsData)
      setMedicines(medicinesData)
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const allItems = [
    ...storeItems.map(item => ({ ...item, _type: 'store', itemName: item.itemName })),
    ...medicines.map(med => ({ ...med, _type: 'medicine', itemName: med.medicineName })),
  ]

  const getTotalStock = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') return ((item.bottleCount ?? 0) * (item.mlPerBottle ?? 0)) + (item.looseMl ?? 0)
      if (item.medicineType === 'tablet') return ((item.boxCount ?? 0) * (item.tabletsPerBox ?? 0)) + (item.looseTablets ?? 0)
      return item.stockQuantity ?? 0
    }
    if (isFood(item)) return ((item.sacksCount ?? 0) * (item.kgPerSack ?? 0)) + (item.looseKg ?? 0)
    return item.stockQuantity ?? 0
  }

  const isOutOfStock = (item) => {
    const total = getTotalStock(item)
    return !Number.isFinite(total) || total <= 0
  }

  const getStockDisplay = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') return (
        <div className="text-xs space-y-0.5">
          <div className="flex gap-1 items-center">
            <span className="text-gray-900 font-medium">{item.bottleCount ?? 0}btl</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-900 font-medium">{item.looseMl ?? 0}ml</span>
          </div>
          <div className="text-gray-400">Total: {((item.bottleCount ?? 0) * (item.mlPerBottle ?? 0)) + (item.looseMl ?? 0)}ml</div>
        </div>
      )
      if (item.medicineType === 'tablet') return (
        <div className="text-xs space-y-0.5">
          <div className="flex gap-1 items-center">
            <span className="text-gray-900 font-medium">{item.boxCount ?? 0}box</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-900 font-medium">{item.looseTablets ?? 0}tab</span>
          </div>
          <div className="text-gray-400">Total: {((item.boxCount ?? 0) * (item.tabletsPerBox ?? 0)) + (item.looseTablets ?? 0)}tab</div>
        </div>
      )
      return <span className="text-xs text-gray-900 font-medium">{item.stockQuantity ?? 0} {item.unit ?? ''}</span>
    }
    if (isFood(item)) return (
      <div className="text-xs space-y-0.5">
        <div className="flex gap-1 items-center">
          <span className="text-gray-900 font-medium">{item.sacksCount ?? 0}sk</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-900 font-medium">{item.looseKg ?? 0}kg</span>
        </div>
        <div className="text-gray-400">Total: {((item.sacksCount ?? 0) * (item.kgPerSack ?? 0)) + (item.looseKg ?? 0)}kg</div>
      </div>
    )
    return <span className="text-xs text-gray-900 font-medium">{item.stockQuantity ?? 0} {item.unit ?? 'pcs'}</span>
  }

  const getPriceDisplay = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') return (
        <div className="text-xs space-y-0.5">
          <div className="text-gray-900">₱{item.sellingPricePerMl?.toLocaleString()}/ml</div>
          <div className="text-gray-900">₱{item.sellingPricePerBottle?.toLocaleString()}/btl</div>
        </div>
      )
      if (item.medicineType === 'tablet') return (
        <div className="text-xs space-y-0.5">
          <div className="text-gray-900">₱{item.sellingPricePerTablet?.toLocaleString()}/tab</div>
          <div className="text-gray-900">₱{item.sellingPricePerBox?.toLocaleString()}/box</div>
        </div>
      )
      return <span className="text-xs text-gray-900">₱{item.sellingPrice?.toLocaleString()}/{item.unit}</span>
    }
    if (isFood(item)) return (
      <div className="text-xs space-y-0.5">
        <div className="text-gray-900">₱{item.sellingPricePerKg?.toLocaleString()}/kg</div>
        <div className="text-gray-900">₱{item.sellingPricePerSack?.toLocaleString()}/sack</div>
      </div>
    )
    return <span className="text-xs text-gray-900">₱{item.sellingPrice?.toLocaleString()}/{item.unit ?? 'pcs'}</span>
  }

  const getDefaultSellUnit = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') return 'ml'
      if (item.medicineType === 'tablet') return 'tablet'
      return item.unit ?? 'unit'
    }
    if (isFood(item)) return 'kg'
    return item.unit ?? 'pcs'
  }

  const getPricePerUnit = (item, unit) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') return unit === 'bottle' ? (item.sellingPricePerBottle ?? 0) : (item.sellingPricePerMl ?? 0)
      if (item.medicineType === 'tablet') return unit === 'box' ? (item.sellingPricePerBox ?? 0) : (item.sellingPricePerTablet ?? 0)
      return item.sellingPrice ?? 0
    }
    if (isFood(item)) return unit === 'sack' ? (item.sellingPricePerSack ?? 0) : (item.sellingPricePerKg ?? 0)
    return item.sellingPrice ?? 0
  }

  const getTypeColor = (item) => {
    if (item._type === 'medicine') {
      if (item.medicineType === 'syrup') return 'text-blue-600'
      if (item.medicineType === 'tablet') return 'text-blue-600'
      return 'text-blue-600'
    }
    if (isFood(item)) return 'text-blue-600'
    return 'text-blue-600'
  }

  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.itemName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesType =
      itemType === 'All' ||
      (itemType === 'store' && item._type === 'store') ||
      (itemType === 'medicine' && item._type === 'medicine')
    return matchesSearch && matchesCategory && matchesType
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

  useEffect(() => { setDisplayCount(20) }, [searchQuery, activeCategory, itemType])

  const handleAddToOrder = (item) => {
    if (isOutOfStock(item)) return
    const existing = order.find(i => i.id === item.id && i._type === item._type)
    const defaultUnit = getDefaultSellUnit(item)
    if (existing) {
      setOrder(order.map(i =>
        (i.id === item.id && i._type === item._type) ? { ...i, quantity: i.quantity + 1 } : i
      ))
    } else {
      setOrder([...order, {
        ...item,
        sellUnit: defaultUnit,
        quantity: 1,
        pricePerUnit: getPricePerUnit(item, defaultUnit)
      }])
    }
  }

  const handleRemoveFromOrder = (id, type) => {
    setOrder(order.filter(i => !(i.id === id && i._type === type)))
  }

  const handleUpdateQuantity = (id, type, delta) => {
    const newOrder = order.map(i => {
      if (i.id !== id || i._type !== type) return i
      const currentQty = parseFloat(i.quantity)
      const safeQty = Number.isFinite(currentQty) ? currentQty : 0.1
      const newQty = Math.max(0.1, parseFloat((safeQty + delta).toFixed(2)))
      return { 
        ...i, 
        quantity: newQty,
        finalPrice: undefined   // ← reset final price override when qty changes
      }
    }).filter(i => i.quantity > 0)
    setOrder(newOrder)
  }

  const handleQuantityInput = (id, type, value) => {
    if (value === '' || value === '-' || value === '.' || value === '-.') {
      setOrder(prev => prev.map(i =>
        (i.id === id && i._type === type) ? {
          ...i,
          quantity: value,
          finalPrice: undefined
        } : i
      ))
      return
    }
    if (!/^-?\d*\.?\d*$/.test(value)) return
    setOrder(prev => prev.map(i =>
      (i.id === id && i._type === type) ? {
        ...i,
        quantity: value,
        finalPrice: undefined
      } : i
    ))
  }

  const handleSellUnitChange = (id, type, newUnit) => {
    setOrder(order.map(i => {
      if (i.id !== id || i._type !== type) return i
      const sourceItem = allItems.find(a => a.id === id && a._type === type)
      return { 
        ...i, 
        sellUnit: newUnit, 
        pricePerUnit: getPricePerUnit(sourceItem, newUnit), 
        quantity: 1,
        finalPrice: undefined   // ← reset final price override when unit changes
      }
    }))
  }

  const calculateItemTotal = (orderItem) => {
    // ── Use finalPrice if manually set, otherwise calculate normally ──
    const qty = parseFloat(orderItem.quantity)
    const safeQty = Number.isFinite(qty) ? qty : 0
    if (orderItem.finalPrice !== undefined && orderItem.finalPrice !== '') {
      const final = parseFloat(orderItem.finalPrice)
      return Number.isFinite(final) ? final : 0
    }
    return (orderItem.pricePerUnit ?? 0) * safeQty
  }

  const getTotalAmount = () => order.reduce((sum, i) => sum + calculateItemTotal(i), 0)

  const handlePriceEdit = (id, type, value) => {
    if (value === '' || value === '-' || value === '.' || value === '-.') {
      setOrder(order.map(i =>
        (i.id === id && i._type === type) ? {
          ...i,
          finalPrice: value
        } : i
      ))
      return
    }
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return
    setOrder(order.map(i => {
      if (i.id !== id || i._type !== type) return i
      const qty = parseFloat(i.quantity)
      const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 0
      return {
        ...i,
        finalPrice: value,                                       // ← store final price
        pricePerUnit: safeQty > 0 ? num / safeQty : 0            // ← back-calculate per unit
      }
    }))
  }

  const handleToggleEditPrice = (id, type) => {
    setOrder(order.map(i =>
      (i.id === id && i._type === type) ? { ...i, editingPrice: !i.editingPrice } : i
    ))
  }

  const handleCheckout = async () => {
    if (order.length === 0) { alert('Order is empty!'); return }
    try {
      for (const orderItem of order) {
        const qty = parseFloat(orderItem.quantity)
        if (!Number.isFinite(qty) || qty <= 0) {
          alert('Please fix invalid quantities before checkout.')
          return
        }
        const unit = orderItem.sellUnit
        const totalAmount = calculateItemTotal(orderItem)   // ← uses finalPrice if set
        const effectivePricePerUnit = totalAmount / qty     // ← back-calculated for sale record

        const saleData = {
          itemId: orderItem.id,
          itemName: orderItem.itemName,
          itemType: orderItem._type,
          category: orderItem.category,
          brand: orderItem.brand || '',
          quantity: qty,
          unit,
          sellingPrice: effectivePricePerUnit,              // ← effective per-unit price
          totalAmount,
          profit: totalAmount - ((orderItem.purchasePrice ?? 0) * qty),
          saleDate: new Date().toISOString()
        }
        await addSale(saleData)

        if (orderItem._type === 'medicine') {
          if (orderItem.medicineType === 'syrup') {
            let mlToDeduct = unit === 'bottle' ? qty * (orderItem.mlPerBottle ?? 0) : qty
            let looseMl = orderItem.looseMl ?? 0
            let bottleCount = orderItem.bottleCount ?? 0
            if (mlToDeduct <= looseMl) {
              looseMl -= mlToDeduct
            } else {
              mlToDeduct -= looseMl; looseMl = 0
              const bottlesNeeded = Math.ceil(mlToDeduct / (orderItem.mlPerBottle ?? 1))
              bottleCount = Math.max(0, bottleCount - bottlesNeeded)
              looseMl = (bottlesNeeded * (orderItem.mlPerBottle ?? 0)) - mlToDeduct
            }
            await updateMedicine(orderItem.id, { bottleCount, looseMl, stockQuantity: (bottleCount * (orderItem.mlPerBottle ?? 0)) + looseMl })
          } else if (orderItem.medicineType === 'tablet') {
            let tabletsToDeduct = unit === 'box' ? qty * (orderItem.tabletsPerBox ?? 0) : qty
            let looseTablets = orderItem.looseTablets ?? 0
            let boxCount = orderItem.boxCount ?? 0
            if (tabletsToDeduct <= looseTablets) {
              looseTablets -= tabletsToDeduct
            } else {
              tabletsToDeduct -= looseTablets; looseTablets = 0
              const boxesNeeded = Math.ceil(tabletsToDeduct / (orderItem.tabletsPerBox ?? 1))
              boxCount = Math.max(0, boxCount - boxesNeeded)
              looseTablets = (boxesNeeded * (orderItem.tabletsPerBox ?? 0)) - tabletsToDeduct
            }
            await updateMedicine(orderItem.id, { boxCount, looseTablets, stockQuantity: (boxCount * (orderItem.tabletsPerBox ?? 0)) + looseTablets })
          } else {
            await updateMedicine(orderItem.id, { stockQuantity: Math.max(0, (orderItem.stockQuantity ?? 0) - qty) })
          }
        } else {
          if (isFood(orderItem)) {
            let kgToDeduct = unit === 'sack' ? qty * (orderItem.kgPerSack ?? 0) : qty
            let looseKg = orderItem.looseKg ?? 0
            let sacksCount = orderItem.sacksCount ?? 0
            if (kgToDeduct <= looseKg) {
              looseKg -= kgToDeduct
            } else {
              kgToDeduct -= looseKg; looseKg = 0
              const sacksNeeded = Math.ceil(kgToDeduct / (orderItem.kgPerSack ?? 1))
              sacksCount = Math.max(0, sacksCount - sacksNeeded)
              looseKg = (sacksNeeded * (orderItem.kgPerSack ?? 0)) - kgToDeduct
            }
            await updateStoreItem(orderItem.id, { sacksCount, looseKg, stockQuantity: (sacksCount * (orderItem.kgPerSack ?? 0)) + looseKg })
          } else {
            await updateStoreItem(orderItem.id, { stockQuantity: Math.max(0, (orderItem.stockQuantity ?? 0) - qty) })
          }
        }
      }
      alert('Sale completed successfully!')
      setShowCheckoutModal(false)
      setOrder([])
      setShowCart(false)
      loadItems()
    } catch (error) {
      console.error('Error processing sale:', error)
      alert('Failed to process sale. Please try again.')
    }
  }

  const renderCartPanel = () => (
    <>
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm text-gray-900">Shopping Cart</h3>
          <p className="text-xs text-gray-600">{order.length} items</p>
        </div>
        <div className="flex items-center gap-2">
          <FiShoppingBag className="w-5 h-5 text-gray-400" />
          <button onClick={() => setShowCart(false)} className="md:hidden text-gray-500 hover:text-gray-700">
            <FiX className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {order.length === 0 ? (
          <p className="text-center text-gray-400 text-xs mt-8">Cart is empty</p>
        ) : order.map(orderItem => {
          const itemTotal = calculateItemTotal(orderItem)
          const step = (orderItem.sellUnit === 'ml' || orderItem.sellUnit === 'kg') ? 0.5 : 1
          return (
            <div key={`${orderItem._type}-${orderItem.id}`} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-xs">{orderItem.itemName}</p>
                  <p className="text-xs text-gray-500">{orderItem.category} · {getTypeLabel(orderItem)}</p>
                </div>
                <button onClick={() => handleRemoveFromOrder(orderItem.id, orderItem._type)} className="text-red-600 hover:text-red-700">
                  <FiX className="w-3.5 h-3.5" />
                </button>
              </div>

              {((orderItem._type === 'medicine' && (orderItem.medicineType === 'syrup' || orderItem.medicineType === 'tablet')) ||
                (orderItem._type === 'store' && isFood(orderItem))) && (
                <div className="mb-1.5">
                  <select
                    value={orderItem.sellUnit}
                    onChange={(e) => handleSellUnitChange(orderItem.id, orderItem._type, e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                  >
                    {orderItem._type === 'medicine' && orderItem.medicineType === 'syrup' && (<><option value="ml">per ml</option><option value="bottle">per bottle</option></>)}
                    {orderItem._type === 'medicine' && orderItem.medicineType === 'tablet' && (<><option value="tablet">per tablet</option><option value="box">per box</option></>)}
                    {orderItem._type === 'store' && isFood(orderItem) && (<><option value="kg">per kg</option><option value="sack">per sack</option></>)}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button onClick={() => handleUpdateQuantity(orderItem.id, orderItem._type, -step)} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700">
                    <FiMinus className="w-3 h-3" />
                  </button>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={orderItem.quantity}
                    onChange={(e) => handleQuantityInput(orderItem.id, orderItem._type, e.target.value)}
                    className="w-14 px-1.5 py-1 text-center text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600">{orderItem.sellUnit}</span>
                  <button onClick={() => handleUpdateQuantity(orderItem.id, orderItem._type, step)} className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700">
                    <FiPlus className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs font-semibold text-gray-900">₱{itemTotal.toLocaleString()}</p>
              </div>

              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-200">
                <div className="flex-1">
                  {orderItem.editingPrice ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Final: ₱</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={orderItem.finalPrice !== undefined ? orderItem.finalPrice : calculateItemTotal(orderItem)}
                        onChange={(e) => handlePriceEdit(orderItem.id, orderItem._type, e.target.value)}
                        className="w-20 px-2 py-1 text-sm text-right border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">₱<span className="text-lg font-bold text-gray-900">{orderItem.pricePerUnit?.toLocaleString()}</span>/{orderItem.sellUnit}</p>
                      {orderItem.finalPrice !== undefined && (
                        <span className="text-xs text-blue-600 font-medium">(edited)</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleToggleEditPrice(orderItem.id, orderItem._type)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded transition-all ${
                    orderItem.editingPrice 
                      ? 'bg-green-600 text-white' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {orderItem.editingPrice ? '✓ Done' : 'Edit'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-3 border-t bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-medium text-gray-700">Total:</span>
          <span className="text-xl font-bold text-gray-900">₱{getTotalAmount().toLocaleString()}</span>
        </div>
        <button
          onClick={() => setShowCheckoutModal(true)}
          disabled={order.length === 0}
          className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          <FiShoppingBag className="w-4 h-4" />
          Checkout
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Pet Store</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/sales-history')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium text-xs md:text-sm"
            >
              <FiClock className="w-4 h-4" />
              <span className="hidden sm:inline">Sales History</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select value={itemType} onChange={(e) => setItemType(e.target.value)} className="flex-1 sm:flex-none px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="All">All Types</option>
              <option value="store">Store</option>
              <option value="medicine">Medicine</option>
            </select>
            <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="flex-1 sm:flex-none px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 p-3 md:p-4 overflow-hidden min-h-0">
        <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[580px]">
          <div className="overflow-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FiShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No items found</p>
                </div>
              </div>
            ) : (
              <div className="p-4 md:p-5 overflow-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {displayedItems.map((item) => {
                    const out = isOutOfStock(item)
                    
                    return (
                      <div
                        key={`${item._type}-${item.id}`}
                        onClick={() => { if (!out) { handleAddToOrder(item); setShowCart(true) } }}
                        className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer p-4 flex flex-col ${
                          out ? 'opacity-50 grayscale' : 'hover:border-gray-300'
                        }`}
                      >
                        {/* Header */}
                        <h3 className="font-semibold text-sm text-gray-900 mb-3 line-clamp-2">
                          {item.itemName}
                        </h3>

                        {/* Info Grid */}
                        <div className="space-y-2 text-xs flex-1">
                          {/* Brand */}
                          {item.brand && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-medium">Brand:</span>
                              <span className="text-gray-900 font-semibold">{item.brand}</span>
                            </div>
                          )}

                          {/* Category */}
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">Category:</span>
                            <span className="text-gray-900 font-semibold">{item.category}</span>
                          </div>

                          {/* Type */}
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">Type:</span>
                            <span className="text-gray-900 font-semibold">{getTypeLabel(item)}</span>
                          </div>

                          {/* Stock */}
                          <div className="flex justify-between items-start">
                            <span className="text-gray-600 font-medium">Stock:</span>
                            {out ? (
                              <span className="font-bold text-red-600">Out of Stock</span>
                            ) : (
                              <span className="text-gray-900 font-semibold text-right">{getStockDisplay(item)}</span>
                            )}
                          </div>

                          {/* Price */}
                          <div className="flex justify-between pt-3 border-t border-gray-300 mt-auto">
                            <span className="text-gray-600 font-medium">Price:</span>
                            <span className="text-blue-600 font-bold text-xl">
                              ₱{
                                (item._type === 'medicine' && item.medicineType === 'syrup' 
                                  ? item.sellingPricePerMl 
                                  : item._type === 'medicine' && item.medicineType === 'tablet'
                                  ? item.sellingPricePerTablet
                                  : isFood(item)
                                  ? item.sellingPricePerKg
                                  : item.sellingPrice)?.toLocaleString() || '0'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Load More Indicator */}
                {hasMore && (
                  <div ref={observerTarget} className="flex items-center justify-center gap-2 text-gray-500 py-8">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-xs">Loading more...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:flex w-80 lg:w-96 bg-white rounded-lg border border-gray-200 flex-col h-[580px]">
          {renderCartPanel()}
        </div>
      </div>

      <div className="md:hidden fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setShowCart(true)}
          className="relative w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 active:scale-95 transition-all"
        >
          <FiShoppingCart className="w-6 h-6" />
          {order.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {order.length}
            </span>
          )}
        </button>
      </div>

      {showCart && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-2xl flex flex-col max-h-[85vh]">
            {renderCartPanel()}
          </div>
        </div>
      )}

      {showCheckoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-gray-900">Confirm Checkout</h2>
                <p className="text-xs text-gray-500">{order.length} item{order.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {order.map(orderItem => (
                <div key={`chk-${orderItem._type}-${orderItem.id}`} className="flex justify-between items-start text-sm py-1.5 border-b border-gray-100 last:border-0">
                  <div className="flex-1 mr-3">
                    <p className="font-medium text-gray-900">{orderItem.itemName}</p>
                    <p className="text-xs text-gray-500">
                      {orderItem.quantity} {orderItem.sellUnit} × ₱{orderItem.pricePerUnit?.toLocaleString()}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 whitespace-nowrap">₱{calculateItemTotal(orderItem).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50 rounded-b-xl">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-700">Total</span>
                <span className="text-2xl font-bold text-green-600">₱{getTotalAmount().toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckout}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <FiShoppingBag className="w-4 h-4" />
                  Confirm Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PetStore
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
    ...medicines.map(med => ({ ...med, _type: 'medicine', itemName: med.medicineName }))
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

  const isOutOfStock = (item) => getTotalStock(item) === 0

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
      const newQty = Math.max(0.1, parseFloat((i.quantity + delta).toFixed(2)))
      return { ...i, quantity: newQty }
    }).filter(i => i.quantity > 0)
    setOrder(newOrder)
  }

  const handleQuantityInput = (id, type, value) => {
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) return
    setOrder(order.map(i =>
      (i.id === id && i._type === type) ? { ...i, quantity: num } : i
    ))
  }

  const handleSellUnitChange = (id, type, newUnit) => {
    setOrder(order.map(i => {
      if (i.id !== id || i._type !== type) return i
      const sourceItem = allItems.find(a => a.id === id && a._type === type)
      return { ...i, sellUnit: newUnit, pricePerUnit: getPricePerUnit(sourceItem, newUnit), quantity: 1 }
    }))
  }

  const calculateItemTotal = (orderItem) => (orderItem.pricePerUnit ?? 0) * orderItem.quantity
  const getTotalAmount = () => order.reduce((sum, i) => sum + calculateItemTotal(i), 0)

  const handlePriceEdit = (id, type, value) => {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return
    setOrder(order.map(i =>
      (i.id === id && i._type === type) ? { ...i, pricePerUnit: num } : i
    ))
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
        const qty = orderItem.quantity
        const unit = orderItem.sellUnit
        const totalAmount = calculateItemTotal(orderItem)

        const saleData = {
          itemId: orderItem.id,
          itemName: orderItem.itemName,
          itemType: orderItem._type,
          category: orderItem.category,
          brand: orderItem.brand || '',
          quantity: qty,
          unit,
          sellingPrice: orderItem.pricePerUnit,
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
      setOrder([])
      setShowCart(false)
      loadItems()
    } catch (error) {
      console.error('Error processing sale:', error)
      alert('Failed to process sale. Please try again.')
    }
  }

  const CartPanel = () => (
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
                    type="number"
                    step={step}
                    min={step}
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

              <div className="flex items-center justify-end gap-1.5 mt-1">
                {orderItem.editingPrice ? (
                  <>
                    <span className="text-xs text-gray-400">₱</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={orderItem.pricePerUnit}
                      onChange={(e) => handlePriceEdit(orderItem.id, orderItem._type, e.target.value)}
                      className="w-20 px-1.5 py-0.5 text-xs text-right border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-700"
                      autoFocus
                    />
                    <span className="text-xs text-gray-400">/{orderItem.sellUnit}</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-500">₱{orderItem.pricePerUnit?.toLocaleString()}/{orderItem.sellUnit}</span>
                )}
                <button
                  onClick={() => handleToggleEditPrice(orderItem.id, orderItem._type)}
                  className={`text-xs px-1.5 py-0.5 rounded transition-colors ${orderItem.editingPrice ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {orderItem.editingPrice ? 'Done' : 'Edit'}
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
          onClick={handleCheckout}
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
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between mb-3">
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

      <div className="flex-1 flex gap-4 p-3 md:p-4 overflow-hidden">
        <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden flex flex-col">
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
              <table className="w-full text-xs border-collapse">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider border border-gray-600">Item</th>
                    <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider border border-gray-600 hidden sm:table-cell">Brand</th>
                    <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider border border-gray-600 hidden md:table-cell">Type</th>
                    <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider border border-gray-600 hidden md:table-cell">Category</th>
                    <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider border border-gray-600">Stock</th>
                    <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider border border-gray-600">Price</th>
                    <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-wider border border-gray-600">Add</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedItems.map((item, index) => {
                    const out = isOutOfStock(item)
                    return (
                      <tr
                        key={`${item._type}-${item.id}`}
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors ${out ? 'opacity-50' : ''}`}
                      >
                        <td className="px-3 py-2 border border-gray-200 align-middle">
                          <span className={`font-semibold ${out ? 'text-red-500' : 'text-gray-900'}`}>{item.itemName || 'N/A'}</span>
                          <p className="text-gray-400 sm:hidden">{item.brand || '—'}</p>
                          <p className="text-gray-400 md:hidden">{item.category || '—'}</p>
                        </td>
                        <td className="px-3 py-2 border border-gray-200 align-middle text-gray-900 hidden sm:table-cell">
                          {item.brand || <span className="text-gray-400 italic">—</span>}
                        </td>
                        <td className="px-3 py-2 border border-gray-200 align-middle text-gray-700 hidden md:table-cell">{getTypeLabel(item)}</td>
                        <td className="px-3 py-2 border border-gray-200 align-middle text-gray-700 hidden md:table-cell">{item.category || '—'}</td>
                        <td className="px-3 py-2 border border-gray-200 align-middle">
                          {out
                            ? <span className="text-red-500 font-semibold">Out of Stock</span>
                            : getStockDisplay(item)
                          }
                        </td>
                        <td className="px-3 py-2 border border-gray-200 align-middle">{getPriceDisplay(item)}</td>
                        <td className="px-3 py-2 border border-gray-200 align-middle text-center">
                          <button
                            onClick={() => { handleAddToOrder(item); setShowCart(true) }}
                            disabled={out}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {hasMore && (
                    <tr ref={observerTarget}>
                      <td colSpan="7" className="px-4 py-3 text-center border border-gray-200">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                          <span className="text-xs">Loading more...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="hidden md:flex w-80 lg:w-96 bg-white rounded-lg border border-gray-200 flex-col">
          <CartPanel />
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
            <CartPanel />
          </div>
        </div>
      )}
    </div>
  )
}

export default PetStore
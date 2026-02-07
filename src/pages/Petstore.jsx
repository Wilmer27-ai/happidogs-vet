import { useState, useEffect, useRef } from 'react'
import { FiSearch, FiShoppingBag, FiMinus, FiPlus, FiX, FiClock } from 'react-icons/fi'
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
  
  // Custom quantity modal
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [quantityModalItem, setQuantityModalItem] = useState(null)
  const [customQuantity, setCustomQuantity] = useState('')
  
  // Lazy loading
  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)
  
  const storeCategories = ['Dog Food', 'Cat Food', 'Bird Food', 'Treats & Snacks', 'Toys', 'Accessories', 'Grooming', 'Health & Wellness', 'Bedding', 'Other']
  const medicineCategories = ['Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care']

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    setLoading(true)
    try {
      const [itemsData, medicinesData] = await Promise.all([
        getStoreItems(),
        getMedicines()
      ])
      setStoreItems(itemsData)
      setMedicines(medicinesData)
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  // Combine store items and medicines for display
  const allItems = [
    ...storeItems.map(item => ({ ...item, type: 'store', itemName: item.itemName })),
    ...medicines.map(med => ({ ...med, type: 'medicine', itemName: med.medicineName }))
  ]

  // Get all unique categories
  const allCategories = ['All', ...new Set([...storeCategories, ...medicineCategories])]

  // Filter items
  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.itemName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesType = itemType === 'All' || item.type === itemType
    return matchesSearch && matchesCategory && matchesType
  })

  const displayedItems = filteredItems.slice(0, displayCount)
  const hasMore = displayCount < filteredItems.length

  // Lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          setDisplayCount(prev => prev + 20)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore])

  useEffect(() => {
    setDisplayCount(20)
  }, [searchQuery, activeCategory, itemType])

  const getStep = (item) => {
    // For items with decimal selling (kg, grams, ml, tablets), use 0.5
    // For items sold as whole units, use 1
    if (item.unit && ['kg', 'g', 'lbs', 'oz', 'ml', 'tablet', 'capsule'].includes(item.unit.toLowerCase())) {
      return 0.5
    }
    return 1
  }

  const handleAddToOrder = (item) => {
    if (item.stockQuantity === 0) return
    
    const existingItem = order.find(i => i.id === item.id && i.type === item.type)
    const step = getStep(item)
    
    if (existingItem) {
      const newQty = parseFloat((existingItem.quantity + step).toFixed(2))
      if (newQty <= item.stockQuantity) {
        setOrder(order.map(i => 
          (i.id === item.id && i.type === item.type)
            ? { ...i, quantity: newQty }
            : i
        ))
      } else {
        alert(`Only ${item.stockQuantity} ${item.unit} available!`)
      }
    } else {
      setOrder([...order, { ...item, quantity: step }])
    }
  }

  const handleCustomQuantityClick = (item) => {
    const existing = order.find(i => i.id === item.id && i.type === item.type)
    setQuantityModalItem(item)
    setCustomQuantity(existing ? existing.quantity.toString() : '')
    setShowQuantityModal(true)
  }

  const handleCustomQuantitySubmit = () => {
    const qty = parseFloat(customQuantity)
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity')
      return
    }

    if (qty > quantityModalItem.stockQuantity) {
      alert(`Only ${quantityModalItem.stockQuantity} ${quantityModalItem.unit} available!`)
      return
    }

    const existing = order.find(i => i.id === quantityModalItem.id && i.type === quantityModalItem.type)
    if (existing) {
      setOrder(order.map(i => 
        (i.id === quantityModalItem.id && i.type === quantityModalItem.type)
          ? { ...i, quantity: qty }
          : i
      ))
    } else {
      setOrder([...order, { ...quantityModalItem, quantity: qty }])
    }

    setShowQuantityModal(false)
    setQuantityModalItem(null)
    setCustomQuantity('')
  }

  const handleRemoveFromOrder = (itemId, itemType) => {
    setOrder(order.filter(i => !(i.id === itemId && i.type === itemType)))
  }

  const handleUpdateQuantity = (itemId, itemType, change) => {
    const item = order.find(i => i.id === itemId && i.type === itemType)
    const stockItem = allItems.find(i => i.id === itemId && i.type === itemType)
    const step = getStep(stockItem)
    const newQuantity = parseFloat((item.quantity + change * step).toFixed(2))

    if (newQuantity <= 0) {
      handleRemoveFromOrder(itemId, itemType)
    } else if (newQuantity <= stockItem.stockQuantity) {
      setOrder(order.map(i => 
        (i.id === itemId && i.type === itemType)
          ? { ...i, quantity: newQuantity }
          : i
      ))
    } else {
      alert(`Only ${stockItem.stockQuantity} ${stockItem.unit} available!`)
    }
  }

  const getTotalAmount = () => {
    return order.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0)
  }

  const handleCheckout = async () => {
    if (order.length === 0) {
      alert('Order is empty!')
      return
    }

    try {
      for (const orderItem of order) {
        const saleData = {
          itemId: orderItem.id,
          itemName: orderItem.itemName,
          itemType: orderItem.type,
          category: orderItem.category,
          brand: orderItem.brand || '',
          quantity: orderItem.quantity,
          unit: orderItem.unit,
          purchasePrice: orderItem.purchasePrice || 0,
          sellingPrice: orderItem.sellingPrice,
          totalCost: (orderItem.purchasePrice || 0) * orderItem.quantity,
          totalAmount: orderItem.sellingPrice * orderItem.quantity,
          profit: ((orderItem.sellingPrice - (orderItem.purchasePrice || 0)) * orderItem.quantity),
          saleDate: new Date().toISOString()
        }
        await addSale(saleData)

        // Update stock
        const newStock = Math.max(0, orderItem.stockQuantity - orderItem.quantity)
        if (orderItem.type === 'store') {
          await updateStoreItem(orderItem.id, { stockQuantity: newStock })
        } else if (orderItem.type === 'medicine') {
          await updateMedicine(orderItem.id, { stockQuantity: newStock })
        }
      }

      alert('Sale completed successfully!')
      setOrder([])
      loadItems()
    } catch (error) {
      console.error('Error processing sale:', error)
      alert('Failed to process sale')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Pet Store</h1>
          <button
            onClick={() => navigate('/sales-history')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium text-sm"
          >
            <FiClock className="w-4 h-4" />
            View Sales History
          </button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="All">All Types</option>
            <option value="store">Store Items</option>
            <option value="medicine">Medicines</option>
          </select>

          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
          >
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-6 overflow-hidden">
        {/* Items Table */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1" style={{ height: 'calc(100vh - 220px)' }}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FiShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No items found</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs">Type</th>
                    <th className="px-4 py-2 text-left text-xs">Item Name</th>
                    <th className="px-4 py-2 text-left text-xs">Category</th>
                    <th className="px-4 py-2 text-left text-xs">Stock</th>
                    <th className="px-4 py-2 text-right text-xs">Price</th>
                    <th className="px-4 py-2 text-center text-xs">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedItems.map((item, index) => {
                    const isOutOfStock = item.stockQuantity === 0
                    const isSelected = order.find(i => i.id === item.id && i.type === item.type)
                    
                    return (
                      <tr key={`${item.type}-${item.id}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            item.type === 'medicine' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type === 'medicine' ? 'Medicine' : 'Store'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`font-medium ${isOutOfStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.itemName || 'N/A'}
                          </p>
                          {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{item.category || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={isOutOfStock ? 'text-red-600 font-medium' : 'text-gray-700'}>
                            {item.stockQuantity || 0} {item.unit || ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-medium text-gray-900">₱{item.sellingPrice?.toLocaleString() || 0}</div>
                          <div className="text-xs text-gray-500">per {item.unit || 'unit'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleAddToOrder(item)}
                              disabled={isOutOfStock}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs font-medium"
                            >
                              {isSelected ? 'Add More' : 'Add'}
                            </button>
                            <button
                              onClick={() => handleCustomQuantityClick(item)}
                              disabled={isOutOfStock}
                              className="px-2 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs"
                              title="Enter custom quantity"
                            >
                              #
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {hasMore && (
              <div ref={observerTarget} className="py-4 text-center">
                <p className="text-sm text-gray-500">Loading more...</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-96 bg-white rounded-lg border border-gray-200 flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Shopping Cart</h3>
                <p className="text-sm text-gray-600">{order.length} items</p>
              </div>
              <FiShoppingBag className="w-6 h-6 text-gray-400" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {order.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-8">Cart is empty</p>
            ) : (
              order.map(item => (
                <div key={`${item.type}-${item.id}`} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{item.itemName}</p>
                      <p className="text-xs text-gray-600">{item.category}</p>
                      {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                    </div>
                    <button
                      onClick={() => handleRemoveFromOrder(item.id, item.type)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.type, -1)}
                        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                      >
                        <FiMinus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        step={getStep(item)}
                        min={getStep(item)}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val) && val > 0 && val <= item.stockQuantity) {
                            setOrder(order.map(i =>
                              (i.id === item.id && i.type === item.type) ? { ...i, quantity: val } : i
                            ))
                          }
                        }}
                        className="w-16 px-2 py-1 text-center text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600">{item.unit}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.type, 1)}
                        className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                      >
                        <FiPlus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">
                        ₱{item.sellingPrice.toLocaleString()}/{item.unit}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        ₱{(item.sellingPrice * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-700">Total:</span>
              <span className="text-2xl font-bold text-gray-900">₱{getTotalAmount().toLocaleString()}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={order.length === 0}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FiShoppingBag className="w-5 h-5" />
              Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Custom Quantity Modal */}
      {showQuantityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Quantity</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-medium">{quantityModalItem?.itemName}</span>
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Available: {quantityModalItem?.stockQuantity} {quantityModalItem?.unit}
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity ({quantityModalItem?.unit})
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={customQuantity}
                onChange={(e) => setCustomQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2.5 or 0.25"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleCustomQuantitySubmit()}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter any decimal amount (e.g., 0.25 for quarter {quantityModalItem?.unit}, 2.5 for two and a half)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowQuantityModal(false)
                  setQuantityModalItem(null)
                  setCustomQuantity('')
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomQuantitySubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PetStore
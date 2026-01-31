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

  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesType = itemType === 'All' || 
                       (itemType === 'Store Items' && item.type === 'store') ||
                       (itemType === 'Medicines' && item.type === 'medicine')
    return matchesSearch && matchesCategory && matchesType
  })

  // Displayed items with lazy loading
  const displayedItems = filteredItems.slice(0, displayCount)
  const hasMore = displayCount < filteredItems.length

  // Intersection Observer for lazy loading
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

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20)
  }, [searchQuery, activeCategory, itemType])

  // Helper: get available quantity for selling (handles bulk items)
  const getAvailableQuantity = (item) => {
    if (item.type === 'store' && item.packageSize && item.sellingUnit) {
      return (item.stockQuantity || 0) * (parseFloat(item.packageSize) || 1)
    }
    return item.stockQuantity || 0
  }

  // Helper: get display unit for selling
  const getDisplayUnit = (item) => {
    if (item.type === 'store' && item.sellingUnit) {
      return item.sellingUnit
    }
    return item.unit
  }

  // Helper: get increment step for selling
  const getStep = (item) => {
    if (item.type === 'store' && item.sellingUnit) {
      return 0.5
    }
    return 1
  }

  const handleAddToOrder = (item) => {
    const availableQty = getAvailableQuantity(item)
    if (availableQty === 0) return
    
    const existingItem = order.find(i => i.id === item.id && i.type === item.type)
    const itemInOrder = existingItem ? existingItem.quantity : 0
    const increment = getStep(item)
    
    if (existingItem) {
      if (itemInOrder + increment <= availableQty) {
        setOrder(order.map(i => 
          (i.id === item.id && i.type === item.type)
            ? { ...i, quantity: parseFloat((i.quantity + increment).toFixed(2)) }
            : i
        ))
      } else {
        alert(`Only ${availableQty} ${getDisplayUnit(item)} available!`)
      }
    } else {
      setOrder([...order, { ...item, quantity: increment, displayUnit: getDisplayUnit(item) }])
    }
  }

  const handleRemoveFromOrder = (itemId, itemType) => {
    setOrder(order.filter(i => !(i.id === itemId && i.type === itemType)))
  }

  const handleUpdateQuantity = (itemId, itemType, change) => {
    const item = order.find(i => i.id === itemId && i.type === itemType)
    const stockItem = allItems.find(i => i.id === itemId && i.type === itemType)
    const availableQty = getAvailableQuantity(stockItem)
    const step = getStep(stockItem)
    const newQuantity = parseFloat((item.quantity + change * step).toFixed(2))

    if (newQuantity <= 0) {
      handleRemoveFromOrder(itemId, itemType)
    } else if (newQuantity <= availableQty) {
      setOrder(order.map(i => 
        (i.id === itemId && i.type === itemType)
          ? { ...i, quantity: newQuantity }
          : i
      ))
    } else {
      alert(`Only ${availableQty} ${getDisplayUnit(stockItem)} available!`)
    }
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
          brand: orderItem.brand,
          quantity: orderItem.quantity,
          purchasePrice: orderItem.purchasePrice,
          sellingPrice: orderItem.sellingPrice,
          totalCost: orderItem.purchasePrice * orderItem.quantity,
          totalAmount: orderItem.sellingPrice * orderItem.quantity,
          profit: (orderItem.sellingPrice - orderItem.purchasePrice) * orderItem.quantity,
          saleDate: new Date().toISOString(),
          unit: orderItem.displayUnit || orderItem.unit
        }
        await addSale(saleData)

        if (orderItem.type === 'store') {
          if (orderItem.packageSize && orderItem.sellingUnit) {
            const packagesUsed = orderItem.quantity / parseFloat(orderItem.packageSize)
            const newStock = Math.max(0, (orderItem.stockQuantity || 0) - packagesUsed)
            await updateStoreItem(orderItem.id, { stockQuantity: newStock })
          } else {
            await updateStoreItem(orderItem.id, {
              stockQuantity: Math.max(0, (orderItem.stockQuantity || 0) - orderItem.quantity)
            })
          }
        } else if (orderItem.type === 'medicine') {
          await updateMedicine(orderItem.id, {
            stockQuantity: Math.max(0, (orderItem.stockQuantity || 0) - orderItem.quantity)
          })
        }
      }

      alert('Sale completed successfully!')
      setOrder([])
      await loadItems()
    } catch (error) {
      console.error('Error completing sale:', error)
      alert('Failed to complete sale. Please try again.')
    }
  }

  const orderTotal = order.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0)
  const orderProfit = order.reduce((sum, item) => sum + ((item.sellingPrice - item.purchasePrice) * item.quantity), 0)

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Side - Items Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
            <button
              onClick={() => navigate('/sales-history')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <FiClock className="w-4 h-4" />
              Sales History
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              <option value="All">All Types</option>
              <option value="Store Items">Store Items</option>
              <option value="Medicines">Medicines</option>
            </select>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            >
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Items Table with Fixed Height */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col overflow-hidden">
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Item Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Price</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : displayedItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    <>
                      {displayedItems.map((item, index) => (
                        <tr key={`${item.type}-${item.id}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 border-b border-gray-200">
                            <p className="font-medium text-gray-900">{item.itemName}</p>
                            {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                          </td>
                          <td className="px-4 py-2 border-b border-gray-200 text-gray-700">
                            {item.type === 'medicine' ? 'Medicine' : 'Store Item'}
                          </td>
                          <td className="px-4 py-2 border-b border-gray-200 text-gray-700">{item.category}</td>
                          <td className="px-4 py-2 border-b border-gray-200">
                            {item.type === 'store' && item.packageSize && item.sellingUnit ? (
                              <div>
                                <span className="font-medium text-gray-900">
                                  {getAvailableQuantity(item).toFixed(2)} {getDisplayUnit(item)}
                                </span>
                                <span className="text-xs text-gray-500 block">
                                  ({item.stockQuantity} {item.unit})
                                </span>
                              </div>
                            ) : (
                              <span className="font-medium text-gray-900">
                                {item.stockQuantity} {item.unit}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 border-b border-gray-200 font-semibold text-gray-900">
                            ₱{item.sellingPrice.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 border-b border-gray-200 text-center">
                            <button
                              onClick={() => handleAddToOrder(item)}
                              disabled={getAvailableQuantity(item) === 0}
                              className={`px-3 py-1 rounded text-sm font-medium ${
                                getAvailableQuantity(item) === 0
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              Add
                            </button>
                          </td>
                        </tr>
                      ))}
                      {hasMore && (
                        <tr ref={observerTarget}>
                          <td colSpan="6" className="px-4 py-4 text-center text-gray-500 text-sm">
                            Loading more...
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

      {/* Right Side - Order Summary */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Order Header */}
        <div className="bg-gray-800 text-white px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiShoppingBag className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Current Order</h2>
            </div>
            <span className="bg-white text-gray-800 px-2 py-0.5 rounded text-sm font-medium">{order.length}</span>
          </div>
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {order.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FiShoppingBag className="w-12 h-12 mb-2" />
              <p className="text-sm">No items in order</p>
            </div>
          ) : (
            <div className="space-y-3">
              {order.map((item) => (
                <div key={`${item.type}-${item.id}`} className="bg-gray-50 rounded p-3 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">{item.itemName}</h4>
                      {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                    </div>
                    <button
                      onClick={() => handleRemoveFromOrder(item.id, item.type)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.type, -1)}
                        className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                      >
                        <FiMinus className="w-3 h-3" />
                      </button>
                      <span className="w-16 text-center text-sm font-medium">
                        {item.quantity} {item.displayUnit || item.unit}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.type, 1)}
                        className="w-6 h-6 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded text-white"
                      >
                        <FiPlus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      ₱{(item.sellingPrice * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        {order.length > 0 && (
          <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-gray-50">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₱{orderTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Profit:</span>
                <span className="font-semibold">₱{orderProfit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>₱{orderTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCheckout}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Complete Sale
              </button>
              <button
                onClick={() => setOrder([])}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm"
              >
                Clear Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PetStore
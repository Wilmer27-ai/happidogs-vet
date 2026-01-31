import { useState, useEffect } from 'react'
import { FiEdit2, FiTrash2, FiX, FiSearch, FiShoppingCart, FiMinus, FiPlus } from 'react-icons/fi'
import { getStoreItems, updateStoreItem, deleteStoreItem, getMedicines, updateMedicine, addSale } from '../firebase/services'

function PetStore() {
  const [storeItems, setStoreItems] = useState([])
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [itemType, setItemType] = useState('All') // All, Store Items, Medicines
  const [cart, setCart] = useState([])

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

  const handleAddToCart = (item) => {
    if (item.stockQuantity === 0) return
    
    const existingItem = cart.find(i => i.id === item.id && i.type === item.type)
    if (existingItem) {
      if (existingItem.quantity < item.stockQuantity) {
        setCart(cart.map(i => 
          (i.id === item.id && i.type === item.type)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ))
      } else {
        alert('Cannot add more than available stock!')
      }
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
  }

  const handleRemoveFromCart = (itemId, itemType) => {
    setCart(cart.filter(i => !(i.id === itemId && i.type === itemType)))
  }

  const handleUpdateQuantity = (itemId, itemType, change) => {
    const item = cart.find(i => i.id === itemId && i.type === itemType)
    const stockItem = allItems.find(i => i.id === itemId && i.type === itemType)
    const newQuantity = item.quantity + change

    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId, itemType)
    } else if (newQuantity <= stockItem.stockQuantity) {
      setCart(cart.map(i => 
        (i.id === itemId && i.type === itemType)
          ? { ...i, quantity: newQuantity }
          : i
      ))
    } else {
      alert('Cannot exceed available stock!')
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!')
      return
    }

    try {
      // Create sales records
      for (const cartItem of cart) {
        const saleData = {
          itemId: cartItem.id,
          itemName: cartItem.itemName,
          itemType: cartItem.type, // 'store' or 'medicine'
          category: cartItem.category,
          brand: cartItem.brand,
          quantity: cartItem.quantity,
          purchasePrice: cartItem.purchasePrice,
          sellingPrice: cartItem.sellingPrice,
          totalCost: cartItem.purchasePrice * cartItem.quantity,
          totalAmount: cartItem.sellingPrice * cartItem.quantity,
          profit: (cartItem.sellingPrice - cartItem.purchasePrice) * cartItem.quantity,
          saleDate: new Date().toISOString()
        }
        await addSale(saleData)

        // Update stock based on type
        const newQuantity = cartItem.stockQuantity - cartItem.quantity
        if (cartItem.type === 'store') {
          await updateStoreItem(cartItem.id, { stockQuantity: newQuantity })
        } else if (cartItem.type === 'medicine') {
          await updateMedicine(cartItem.id, { stockQuantity: newQuantity })
        }
      }

      alert('Sale completed successfully!')
      setCart([])
      await loadItems()
    } catch (error) {
      console.error('Error completing sale:', error)
      alert('Failed to complete sale. Please try again.')
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0)
  const cartProfit = cart.reduce((sum, item) => sum + ((item.sellingPrice - item.purchasePrice) * item.quantity), 0)

  // Statistics
  const totalStoreItems = storeItems.length
  const totalMedicines = medicines.length
  const totalItems = totalStoreItems + totalMedicines
  const lowStockItems = allItems.filter(i => i.stockQuantity > 0 && i.stockQuantity <= 10).length
  const outOfStockItems = allItems.filter(i => i.stockQuantity === 0).length

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Side - Items Table */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Happidogs POS</h1>
            
          </div>


          {/* Search & Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items or medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="All">All Types</option>
              <option value="Store Items">Store Items Only</option>
              <option value="Medicines">Medicines Only</option>
            </select>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="bg-white rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-800 text-white sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Item Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Stock</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Price</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      Loading items...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No items found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, index) => (
                    <tr key={`${item.type}-${item.id}`} className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{item.itemName}</p>
                        {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          item.type === 'medicine' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.type === 'medicine' ? 'Medicine' : 'Store Item'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.category}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${
                          item.stockQuantity === 0 ? 'text-red-600' :
                          item.stockQuantity <= 10 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {item.stockQuantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        ₱{item.sellingPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={item.stockQuantity === 0}
                            className={`px-3 py-1.5 rounded text-sm font-medium ${
                              item.stockQuantity === 0
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            <FiShoppingCart className="w-4 h-4 inline mr-1" />
                            Add
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-80 bg-white border-l border-gray-300 flex flex-col">
        {/* Cart Header */}
        <div className="bg-gray-800 text-white px-4 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiShoppingCart className="w-5 h-5" />
              <h2 className="text-lg font-bold">Cart</h2>
            </div>
            <span className="text-sm bg-white text-gray-800 px-2 py-1 rounded">{cart.length}</span>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FiShoppingCart className="w-12 h-12 mb-2" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={`${item.type}-${item.id}`} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-gray-900">{item.itemName}</h4>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          item.type === 'medicine' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.type === 'medicine' ? 'Med' : 'Item'}
                        </span>
                      </div>
                      {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.id, item.type)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.type, -1)}
                        className="w-6 h-6 flex items-center justify-center bg-gray-300 hover:bg-gray-400 rounded"
                      >
                        <FiMinus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.type, 1)}
                        className="w-6 h-6 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded text-white"
                      >
                        <FiPlus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      ₱{(item.sellingPrice * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="border-t border-gray-300 p-4 flex-shrink-0 bg-gray-50">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₱{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Profit:</span>
                <span className="font-semibold text-green-600">₱{cartProfit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span className="text-blue-600">₱{cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCheckout}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                Checkout
              </button>
              <button
                onClick={() => setCart([])}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PetStore
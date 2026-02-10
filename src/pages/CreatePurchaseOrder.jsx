import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiPlus, FiTrash2, FiArrowLeft, FiPackage } from 'react-icons/fi'
import { addPurchaseOrder, addMedicine, addStoreItem } from '../firebase/services'

function CreatePurchaseOrder() {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedSupplier = location.state?.supplier

  const [orderItems, setOrderItems] = useState([])
  const [orderFormData, setOrderFormData] = useState({
    orderDate: new Date().toISOString().split('T')[0],
    paymentTerms: selectedSupplier?.paymentTerms || '0'
  })

  const [currentItem, setCurrentItem] = useState({
    itemType: 'medicine',
    itemName: '',
    category: 'Antibiotic',
    brand: '',
    description: '',
    quantity: '',
    unit: 'bottle',
    packageSize: '',
    packageUnit: 'kg',
    sellingUnit: '',
    unitsPerPackage: '',
    purchasePrice: '',
    sellingPrice: '',
    // Bundle fields for store items
    bundleQuantity: '',
    bundlePrice: '',
    expirationDate: ''
  })

  const medicineCategories = ['Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care']
  const storeCategories = ['Dog Food', 'Cat Food', 'Bird Food', 'Treats & Snacks', 'Toys', 'Accessories', 'Grooming', 'Health & Wellness', 'Bedding', 'Other']
  const foodCategories = ['Dog Food', 'Cat Food', 'Bird Food']

  useEffect(() => {
    if (!selectedSupplier) {
      navigate('/suppliers')
    }
  }, [selectedSupplier, navigate])

  const calculatePaymentDeadline = (orderDate, paymentTerms) => {
    const date = new Date(orderDate)
    if (paymentTerms.toLowerCase() === 'cod') return orderDate
    
    const daysMatch = paymentTerms.match(/\d+/)
    if (daysMatch) {
      const days = parseInt(daysMatch[0])
      date.setDate(date.getDate() + days)
      return date.toISOString().split('T')[0]
    }
    
    return orderDate
  }

  // Check if current category is a food category
  const isFoodCategory = () => {
    return currentItem.itemType === 'store' && foodCategories.includes(currentItem.category)
  }

  // Check if item is food category
  const isItemFoodCategory = (item) => {
    return item.itemType === 'store' && foodCategories.includes(item.category)
  }

  const handleAddItemToOrder = (e) => {
    e.preventDefault()
    
    if (!currentItem.itemName || !currentItem.quantity || !currentItem.purchasePrice || !currentItem.sellingPrice) {
      alert('Please fill in all required fields')
      return
    }

    if (currentItem.itemType === 'medicine' && !currentItem.expirationDate) {
      alert('Expiration date is required for medicines')
      return
    }

    // Validate bundle: if one field is filled, both must be filled
    if (currentItem.itemType === 'store' && !isFoodCategory()) {
      if ((currentItem.bundleQuantity && !currentItem.bundlePrice) || (!currentItem.bundleQuantity && currentItem.bundlePrice)) {
        alert('Please fill in both bundle quantity and bundle price, or leave both empty')
        return
      }
    }

    // For food items, ensure selling unit is kg
    const finalSellingUnit = isFoodCategory() ? 'kg' : currentItem.sellingUnit

    setOrderItems([...orderItems, {
      ...currentItem,
      quantity: Number(currentItem.quantity),
      packageSize: currentItem.packageSize ? Number(currentItem.packageSize) : null,
      unitsPerPackage: currentItem.unitsPerPackage ? Number(currentItem.unitsPerPackage) : null,
      purchasePrice: Number(currentItem.purchasePrice),
      sellingPrice: Number(currentItem.sellingPrice),
      sellingUnit: finalSellingUnit,
      bundleQuantity: currentItem.bundleQuantity ? Number(currentItem.bundleQuantity) : null,
      bundlePrice: currentItem.bundlePrice ? Number(currentItem.bundlePrice) : null
    }])

    setCurrentItem({
      itemType: currentItem.itemType,
      itemName: '',
      category: currentItem.itemType === 'medicine' ? 'Antibiotic' : 'Dog Food',
      brand: '',
      description: '',
      quantity: '',
      unit: currentItem.itemType === 'medicine' ? 'bottle' : 'sack',
      packageSize: '',
      packageUnit: 'kg',
      sellingUnit: '',
      unitsPerPackage: '',
      purchasePrice: '',
      sellingPrice: '',
      bundleQuantity: '',
      bundlePrice: '',
      expirationDate: ''
    })
  }

  const handleRemoveOrderItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const handleCurrentItemChange = (field, value) => {
    if (field === 'itemType') {
      setCurrentItem({
        ...currentItem,
        itemType: value,
        category: value === 'medicine' ? 'Antibiotic' : 'Dog Food',
        packageSize: '',
        packageUnit: 'kg',
        sellingUnit: '',
        unitsPerPackage: '',
        bundleQuantity: '',
        bundlePrice: ''
      })
    } else if (field === 'category' && currentItem.itemType === 'store') {
      // Auto-set to kg for food categories
      const isFood = foodCategories.includes(value)
      setCurrentItem({
        ...currentItem,
        category: value,
        packageUnit: isFood ? 'kg' : currentItem.packageUnit,
        sellingUnit: '' // Clear selling unit when category changes
      })
    } else {
      setCurrentItem({ ...currentItem, [field]: value })
    }
  }

  const calculateOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0)
  }

  const handleSubmitPurchaseOrder = async (e) => {
    e.preventDefault()
    
    if (orderItems.length === 0) {
      alert('Please add at least one item to the order.')
      return
    }

    try {
      const orderNumber = `PO-${Date.now()}`
      const totalAmount = calculateOrderTotal()
      const paymentDeadline = calculatePaymentDeadline(orderFormData.orderDate, orderFormData.paymentTerms)

      const purchaseOrder = {
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
      }

      await addPurchaseOrder(purchaseOrder)

      for (const item of orderItems) {
        if (item.itemType === 'medicine') {
          let totalStock = item.quantity
          if (item.unitsPerPackage) {
            totalStock = item.quantity * item.unitsPerPackage
          }

          await addMedicine({
            medicineName: item.itemName,  // Changed from 'name' to 'medicineName'
            category: item.category,
            brand: item.brand || '',
            description: item.description || '',
            stockQuantity: totalStock,  // Changed from 'stock' to 'stockQuantity'
            unit: item.sellingUnit || item.unit,
            packageUnit: item.unit,
            unitsPerPackage: item.unitsPerPackage || null,
            purchasePrice: item.purchasePrice,
            sellingPrice: item.sellingPrice,
            expirationDate: item.expirationDate,
            supplierId: selectedSupplier.id,
            supplierName: selectedSupplier.supplierName,
            createdAt: new Date().toISOString()
          })
        } else if (item.itemType === 'store') {
          // Calculate total stock based on whether it's food or not
          let totalStock = item.quantity
          let finalUnit = item.unit // Default: sell by package unit

          if (isItemFoodCategory(item) && item.packageSize) {
            // Food items: convert to kg
            totalStock = item.quantity * item.packageSize
            finalUnit = 'kg'
          } else if (item.packageSize) {
            // Non-food with package size: sell by piece
            totalStock = item.quantity * item.packageSize
            finalUnit = item.packageUnit || 'pcs'
          }

          await addStoreItem({
            itemName: item.itemName,  // Changed from 'name' to 'itemName'
            category: item.category,
            brand: item.brand || '',
            description: item.description || '',
            stockQuantity: totalStock,  // Changed from 'stock' to 'stockQuantity'
            unit: finalUnit,
            packageUnit: item.unit,
            packageSize: item.packageSize || null,
            purchasePrice: item.purchasePrice,
            sellingPrice: item.sellingPrice,
            hasBundle: !!(item.bundleQuantity && item.bundlePrice),
            bundleQuantity: item.bundleQuantity || null,
            bundlePrice: item.bundlePrice || null,
            supplierId: selectedSupplier.id,
            supplierName: selectedSupplier.supplierName,
            createdAt: new Date().toISOString()
          })
        }
      }

      alert('Purchase order created successfully!')
      navigate('/suppliers')
    } catch (error) {
      console.error('Error creating purchase order:', error)
      alert('Failed to create purchase order.')
    }
  }

  if (!selectedSupplier) return null

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Main Content - 2 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDE - Input Form */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <button
              onClick={() => navigate('/suppliers')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-gray-900">Add New Item</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {/* Order Date & Payment Terms */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Order Date *</label>
                  <input
                    type="date"
                    required
                    value={orderFormData.orderDate}
                    onChange={(e) => setOrderFormData({ ...orderFormData, orderDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms *</label>
                  <input
                    type="text"
                    required
                    value={orderFormData.paymentTerms}
                    onChange={(e) => setOrderFormData({ ...orderFormData, paymentTerms: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0, 7, 30"
                  />
                </div>
              </div>

              {/* Item Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                <select
                  required
                  value={currentItem.itemType}
                  onChange={(e) => handleCurrentItemChange('itemType', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="medicine">Medicine</option>
                  <option value="store">Store</option>
                </select>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={currentItem.itemName}
                  onChange={(e) => handleCurrentItemChange('itemName', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={currentItem.itemType === 'medicine' ? 'e.g., Amoxicillin' : 'e.g., Champion Dog Food'}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={currentItem.category}
                  onChange={(e) => handleCurrentItemChange('category', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {(currentItem.itemType === 'medicine' ? medicineCategories : storeCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Brand (Store only) */}
              {currentItem.itemType === 'store' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={currentItem.brand}
                    onChange={(e) => handleCurrentItemChange('brand', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brand name"
                  />
                </div>
              )}

              {/* Expiry Date (Medicine only) */}
              {currentItem.itemType === 'medicine' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={currentItem.expirationDate}
                    onChange={(e) => handleCurrentItemChange('expirationDate', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Quantity & Package Unit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Qty Ordered *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => handleCurrentItemChange('quantity', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Package Unit *</label>
                  <select
                    required
                    value={currentItem.unit}
                    onChange={(e) => handleCurrentItemChange('unit', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {currentItem.itemType === 'medicine' ? (
                      <>
                        <option value="bottle">bottle</option>
                        <option value="vial">vial</option>
                        <option value="box">box</option>
                        <option value="pack">pack</option>
                      </>
                    ) : (
                      <>
                        <option value="sack">sack</option>
                        <option value="bag">bag</option>
                        <option value="box">box</option>
                        <option value="pack">pack</option>
                        <option value="pcs">pcs</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* MEDICINE: Units per Package & Selling Unit */}
              {currentItem.itemType === 'medicine' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Units/Package</label>
                    <input
                      type="number"
                      min="1"
                      value={currentItem.unitsPerPackage}
                      onChange={(e) => handleCurrentItemChange('unitsPerPackage', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Selling Unit</label>
                    <select
                      value={currentItem.sellingUnit}
                      onChange={(e) => handleCurrentItemChange('sellingUnit', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Same as package</option>
                      <option value="tablet">per Tablet</option>
                      <option value="capsule">per Capsule</option>
                      <option value="ml">per ml</option>
                      <option value="dose">per Dose</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STORE FOOD: KG/Package */}
              {currentItem.itemType === 'store' && isFoodCategory() && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">KG/Package * <span className="text-blue-600">(Sold by kg)</span></label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    value={currentItem.packageSize}
                    onChange={(e) => handleCurrentItemChange('packageSize', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 25"
                  />
                </div>
              )}

              {/* STORE NON-FOOD: Pcs/Package & Bundle */}
              {currentItem.itemType === 'store' && !isFoodCategory() && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pcs/Package (Optional)</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={currentItem.packageSize}
                      onChange={(e) => handleCurrentItemChange('packageSize', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 12"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Bundle Qty</label>
                      <input
                        type="number"
                        min="2"
                        value={currentItem.bundleQuantity}
                        onChange={(e) => handleCurrentItemChange('bundleQuantity', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="6"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Bundle ₱</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentItem.bundlePrice}
                        onChange={(e) => handleCurrentItemChange('bundlePrice', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="250"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Purchase & Selling Price */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Price *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={currentItem.purchasePrice}
                    onChange={(e) => handleCurrentItemChange('purchasePrice', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="₱"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Selling Price *
                    <span className="text-xs text-gray-500 ml-1">
                      ({isFoodCategory() ? '/kg' : currentItem.itemType === 'medicine' ? '/unit' : '/pc'})
                    </span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={currentItem.sellingPrice}
                    onChange={(e) => handleCurrentItemChange('sellingPrice', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="₱"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Add Button - Sticky at bottom */}
          <div className="p-4 bg-white border-t border-gray-200">
            <button
              onClick={handleAddItemToOrder}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
            >
              <FiPlus className="w-4 h-4" />
              Add Item to Order
            </button>
          </div>
        </div>

        {/* RIGHT SIDE - Table */}
        <div className="flex-1 flex flex-col bg-gray-50">
          <div className="px-6 py-3 bg-white border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Order Items ({orderItems.length})</h3>
          </div>

          <div className="flex-1 p-6 flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
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
                {/* Table with fixed height */}
                <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden mb-3">
                  <div className="overflow-auto h-full">
                    <table className="w-full text-xs">
                      <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Type</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Item Name</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Category</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Package</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Total Stock</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Sell By</th>
                          <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide">Purchase</th>
                          <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide">Selling</th>
                          <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide">Bundle</th>
                          <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide">Subtotal</th>
                          <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orderItems.map((item, index) => {
                          const isFood = isItemFoodCategory(item)
                          const totalStock = item.packageSize 
                            ? (item.quantity * item.packageSize)
                            : item.unitsPerPackage 
                              ? (item.quantity * item.unitsPerPackage)
                              : item.quantity
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-2 py-2">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                  item.itemType === 'medicine' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {item.itemType === 'medicine' ? 'Med' : 'Store'}
                                </span>
                              </td>
                              <td className="px-2 py-2">
                                <span className="font-medium text-gray-900 text-xs">{item.itemName}</span>
                                {item.brand && <span className="text-xs text-gray-500 ml-1">({item.brand})</span>}
                              </td>
                              <td className="px-2 py-2">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {item.category}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-gray-700 text-xs whitespace-nowrap">
                                {item.quantity} {item.unit}
                                {item.packageSize && ` × ${item.packageSize}${isFood ? 'kg' : 'pcs'}`}
                                {item.unitsPerPackage && ` × ${item.unitsPerPackage}`}
                              </td>
                              <td className="px-2 py-2">
                                <span className="font-semibold text-blue-600 text-xs whitespace-nowrap">
                                  {totalStock.toFixed(isFood ? 2 : 0)} {isFood ? 'kg' : item.unitsPerPackage ? 'units' : 'pcs'}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-gray-700 text-xs">
                                {isFood ? 'kg' : item.sellingUnit || 'piece'}
                              </td>
                              <td className="px-2 py-2 text-right text-gray-900 text-xs whitespace-nowrap">
                                ₱{item.purchasePrice.toLocaleString()}/{item.unit}
                              </td>
                              <td className="px-2 py-2 text-right text-gray-900 text-xs whitespace-nowrap">
                                ₱{item.sellingPrice.toLocaleString()}/{isFood ? 'kg' : item.sellingUnit || 'pc'}
                              </td>
                              <td className="px-2 py-2 text-right">
                                {item.bundleQuantity && item.bundlePrice ? (
                                  <span className="text-blue-600 font-medium text-xs whitespace-nowrap">
                                    {item.bundleQuantity}pcs @ ₱{item.bundlePrice.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="px-2 py-2 text-right font-semibold text-gray-900 text-xs whitespace-nowrap">
                                ₱{(item.purchasePrice * item.quantity).toLocaleString()}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button
                                  onClick={() => handleRemoveOrderItem(index)}
                                  className="text-red-600 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded"
                                >
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

                {/* Total Amount Box */}
                <div className="bg-white rounded-md border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Supplier: <span className="font-medium text-gray-900">{selectedSupplier.supplierName}</span></p>
                      <p className="text-xs text-gray-500 mt-1">Payment Due: {new Date(calculatePaymentDeadline(orderFormData.orderDate, orderFormData.paymentTerms)).toLocaleDateString()}</p>
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
          <div className="px-6 py-3 bg-white border-t border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/suppliers')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitPurchaseOrder}
              disabled={orderItems.length === 0}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
            >
              Create Purchase Order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatePurchaseOrder
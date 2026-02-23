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
    sackSellingPrice: '',
    expirationDate: '',
    // Medicine-specific
    mlPerBottle: '',
    tabletsPerBox: '',
    medicineType: 'tablet', // tablet, syrup, vial, other
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

  const isFoodCategory = () => {
    return currentItem.itemType === 'store' && foodCategories.includes(currentItem.category)
  }

  const isItemFoodCategory = (item) => {
    return item.itemType === 'store' && foodCategories.includes(item.category)
  }

  // Medicine type helpers
  const isSyrup = () => currentItem.itemType === 'medicine' && currentItem.medicineType === 'syrup'
  const isTablet = () => currentItem.itemType === 'medicine' && currentItem.medicineType === 'tablet'
  const isItemSyrup = (item) => item.itemType === 'medicine' && item.medicineType === 'syrup'
  const isItemTablet = (item) => item.itemType === 'medicine' && item.medicineType === 'tablet'

  const handleAddItemToOrder = (e) => {
    e.preventDefault()

    if (!currentItem.itemName) { alert('Item Name is required'); return }
    if (!currentItem.quantity) { alert('Quantity is required'); return }
    if (!currentItem.purchasePrice) { alert('Purchase Price is required'); return }
    if (!currentItem.sellingPrice) { alert('Selling Price is required'); return }

    if (currentItem.itemType === 'medicine' && !currentItem.expirationDate) {
      alert('Expiration date is required for medicines')
      return
    }

    if (isSyrup() && !currentItem.mlPerBottle) {
      alert('ML per bottle is required for syrup')
      return
    }

    if (isTablet() && !currentItem.tabletsPerBox) {
      alert('Tablets per box/pack is required for tablets')
      return
    }

    if (isFoodCategory() && !currentItem.packageSize) {
      alert('KG per sack is required for food items')
      return
    }

    if (isFoodCategory() && !currentItem.sackSellingPrice) {
      alert('Selling price per sack is required for food items')
      return
    }

    setOrderItems([...orderItems, {
      ...currentItem,
      quantity: Number(currentItem.quantity),
      packageSize: currentItem.packageSize ? Number(currentItem.packageSize) : null,
      unitsPerPackage: currentItem.unitsPerPackage ? Number(currentItem.unitsPerPackage) : null,
      purchasePrice: Number(currentItem.purchasePrice),
      sellingPrice: Number(currentItem.sellingPrice),
      sackSellingPrice: currentItem.sackSellingPrice ? Number(currentItem.sackSellingPrice) : null,
      mlPerBottle: currentItem.mlPerBottle ? Number(currentItem.mlPerBottle) : null,
      tabletsPerBox: currentItem.tabletsPerBox ? Number(currentItem.tabletsPerBox) : null,
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
      sackSellingPrice: '',
      expirationDate: '',
      mlPerBottle: '',
      tabletsPerBox: '',
      medicineType: currentItem.medicineType,
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
        sackSellingPrice: '',
        mlPerBottle: '',
        tabletsPerBox: '',
        medicineType: 'tablet',
        unit: value === 'medicine' ? 'bottle' : 'sack',
      })
    } else if (field === 'medicineType') {
      setCurrentItem({
        ...currentItem,
        medicineType: value,
        unit: value === 'syrup' ? 'bottle' : value === 'tablet' ? 'box' : 'vial',
        mlPerBottle: '',
        tabletsPerBox: '',
        sellingUnit: '',
        unitsPerPackage: '',
      })
    } else if (field === 'category' && currentItem.itemType === 'store') {
      const isFood = foodCategories.includes(value)
      setCurrentItem({
        ...currentItem,
        category: value,
        packageUnit: isFood ? 'kg' : currentItem.packageUnit,
        sellingUnit: '',
        sackSellingPrice: ''
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

          if (isItemSyrup(item)) {
            // SYRUP: bottleCount + looseMl (1 bottle opened on arrival)
            const totalBottles = item.quantity
            const mlPerBottle = item.mlPerBottle

            await addMedicine({
              medicineName: item.itemName,
              category: item.category,
              brand: item.brand || '',
              description: item.description || '',
              medicineType: 'syrup',
              // Dual stock structure
              bottleCount: totalBottles - 1,       // sealed bottles
              looseMl: mlPerBottle,                // ml from 1 opened bottle
              mlPerBottle: mlPerBottle,
              stockQuantity: totalBottles * mlPerBottle, // total ml
              unit: 'bottle',
              sellingPricePerMl: item.sellingPrice,
              sellingPricePerBottle: item.sackSellingPrice,
              purchasePrice: item.purchasePrice,
              expirationDate: item.expirationDate,
              supplierId: selectedSupplier.id,
              supplierName: selectedSupplier.supplierName,
              createdAt: new Date().toISOString()
            })

          } else if (isItemTablet(item)) {
            // TABLET: boxCount + looseTablets (1 box opened on arrival)
            const totalBoxes = item.quantity
            const tabletsPerBox = item.tabletsPerBox

            await addMedicine({
              medicineName: item.itemName,
              category: item.category,
              brand: item.brand || '',
              description: item.description || '',
              medicineType: 'tablet',
              // Dual stock structure
              boxCount: totalBoxes - 1,            // sealed boxes
              looseTablets: tabletsPerBox,         // tablets from 1 opened box
              tabletsPerBox: tabletsPerBox,
              stockQuantity: totalBoxes * tabletsPerBox, // total tablets
              unit: 'box',
              sellingPricePerTablet: item.sellingPrice,
              sellingPricePerBox: item.sackSellingPrice,
              purchasePrice: item.purchasePrice,
              expirationDate: item.expirationDate,
              supplierId: selectedSupplier.id,
              supplierName: selectedSupplier.supplierName,
              createdAt: new Date().toISOString()
            })

          } else {
            // VIAL / OTHER: simple stock (no split logic needed)
            await addMedicine({
              medicineName: item.itemName,
              category: item.category,
              brand: item.brand || '',
              description: item.description || '',
              medicineType: item.medicineType || 'other',
              stockQuantity: item.quantity,
              unit: item.unit,
              sellingPrice: item.sellingPrice,
              purchasePrice: item.purchasePrice,
              expirationDate: item.expirationDate,
              supplierId: selectedSupplier.id,
              supplierName: selectedSupplier.supplierName,
              createdAt: new Date().toISOString()
            })
          }

        } else if (item.itemType === 'store') {

          if (isItemFoodCategory(item)) {
            const totalSacks = item.quantity
            const kgPerSack = item.packageSize
            const totalKg = totalSacks * kgPerSack

            await addStoreItem({
              itemName: item.itemName,
              category: item.category,
              brand: item.brand || '',
              description: item.description || '',
              stockQuantity: totalKg,
              sacksCount: totalSacks - 1,
              looseKg: kgPerSack,
              kgPerSack: kgPerSack,
              unit: 'sack',
              sellingPricePerKg: item.sellingPrice,
              sellingPricePerSack: item.sackSellingPrice,
              purchasePrice: item.purchasePrice,
              hasBundle: false,
              supplierId: selectedSupplier.id,
              supplierName: selectedSupplier.supplierName,
              createdAt: new Date().toISOString()
            })

          } else {
            let totalStock = item.quantity
            let finalUnit = item.unit

            if (item.packageSize) {
              totalStock = item.quantity * item.packageSize
              finalUnit = item.packageUnit || 'pcs'
            }

            await addStoreItem({
              itemName: item.itemName,
              category: item.category,
              brand: item.brand || '',
              description: item.description || '',
              stockQuantity: totalStock,
              unit: finalUnit,
              packageUnit: item.unit,
              packageSize: item.packageSize || null,
              purchasePrice: item.purchasePrice,
              sellingPrice: item.sellingPrice,
              hasBundle: false,
              supplierId: selectedSupplier.id,
              supplierName: selectedSupplier.supplierName,
              createdAt: new Date().toISOString()
            })
          }
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

              {/* Medicine Type (Medicine only) */}
              {currentItem.itemType === 'medicine' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Medicine Form *</label>
                  <select
                    required
                    value={currentItem.medicineType}
                    onChange={(e) => handleCurrentItemChange('medicineType', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="tablet">Tablet / Capsule</option>
                    <option value="syrup">Syrup / Liquid</option>
                    <option value="vial">Vial / Injectable</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

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

              {/* ── SYRUP FIELDS ── */}
              {isSyrup() && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">No. of Bottles *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={currentItem.quantity}
                        onChange={(e) => handleCurrentItemChange('quantity', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">ML per Bottle *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        value={currentItem.mlPerBottle}
                        onChange={(e) => handleCurrentItemChange('mlPerBottle', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 60"
                      />
                    </div>
                  </div>

                  {/* Syrup Stock Preview */}
                  {currentItem.quantity && currentItem.mlPerBottle && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5">
                      <p className="text-xs text-gray-800 font-medium mb-1">Stock Preview</p>
                      <p className="text-xs text-gray-700">{Number(currentItem.quantity)} bottles ordered</p>
                      <p className="text-xs text-gray-700">
                        On save: <strong>{Number(currentItem.quantity) - 1} sealed bottles</strong> + <strong>{Number(currentItem.mlPerBottle)} ml loose</strong> (1 bottle opened)
                      </p>
                      <p className="text-xs text-gray-700">
                        Total: <strong>{Number(currentItem.quantity) * Number(currentItem.mlPerBottle)} ml</strong>
                      </p>
                    </div>
                  )}

                  {/* Syrup Pricing */}
                  <div className="border border-gray-200 rounded-md p-2.5 space-y-2">
                    <p className="text-xs font-semibold text-gray-800">Pricing</p>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Price (per bottle) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={currentItem.purchasePrice}
                        onChange={(e) => handleCurrentItemChange('purchasePrice', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="₱ per bottle"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price per ML *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={currentItem.sellingPrice}
                        onChange={(e) => handleCurrentItemChange('sellingPrice', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="₱ per ml"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price per Bottle *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={currentItem.sackSellingPrice}
                        onChange={(e) => handleCurrentItemChange('sackSellingPrice', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="₱ per bottle"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── TABLET FIELDS ── */}
              {isTablet() && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">No. of Boxes *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={currentItem.quantity}
                        onChange={(e) => handleCurrentItemChange('quantity', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tablets per Box *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={currentItem.tabletsPerBox}
                        onChange={(e) => handleCurrentItemChange('tabletsPerBox', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 100"
                      />
                    </div>
                  </div>

                  {/* Tablet Stock Preview */}
                  {currentItem.quantity && currentItem.tabletsPerBox && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5">
                      <p className="text-xs text-gray-800 font-medium mb-1">Stock Preview</p>
                      <p className="text-xs text-gray-700">{Number(currentItem.quantity)} boxes ordered</p>
                      <p className="text-xs text-gray-700">
                        On save: <strong>{Number(currentItem.quantity) - 1} sealed boxes</strong> + <strong>{Number(currentItem.tabletsPerBox)} tablets loose</strong> (1 box opened)
                      </p>
                      <p className="text-xs text-gray-700">
                        Total: <strong>{Number(currentItem.quantity) * Number(currentItem.tabletsPerBox)} tablets</strong>
                      </p>
                    </div>
                  )}

                  {/* Tablet Pricing */}
                  <div className="border border-gray-200 rounded-md p-2.5 space-y-2">
                    <p className="text-xs font-semibold text-gray-800">Pricing</p>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Price (per box) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={currentItem.purchasePrice}
                        onChange={(e) => handleCurrentItemChange('purchasePrice', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="₱ per box"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price per Tablet *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={currentItem.sellingPrice}
                        onChange={(e) => handleCurrentItemChange('sellingPrice', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="₱ per tablet"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price per Box *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={currentItem.sackSellingPrice}
                        onChange={(e) => handleCurrentItemChange('sackSellingPrice', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="₱ per box"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── VIAL / OTHER FIELDS ── */}
              {currentItem.itemType === 'medicine' && !isSyrup() && !isTablet() && (
                <>
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
                        placeholder="e.g., 20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Unit *</label>
                      <select
                        value={currentItem.unit}
                        onChange={(e) => handleCurrentItemChange('unit', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="vial">vial</option>
                        <option value="ampoule">ampoule</option>
                        <option value="pack">pack</option>
                        <option value="tube">tube</option>
                        <option value="sachet">sachet</option>
                      </select>
                    </div>
                  </div>

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
                      <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price *</label>
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
                </>
              )}

              {/* FOOD ITEMS */}
              {isFoodCategory() && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">No. of Sacks *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) => handleCurrentItemChange('quantity', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      KG per Sack * <span className="text-gray-500">(e.g., 25 for a 25kg sack)</span>
                    </label>
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

                  <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5">
                    <p className="text-xs text-gray-800 font-medium mb-1">Stock Preview</p>
                    <p className="text-xs text-gray-700">{Number(currentItem.quantity)} sacks ordered</p>
                    <p className="text-xs text-gray-700">
                      On save: <strong>{Number(currentItem.quantity) - 1} sealed sacks</strong> + <strong>{Number(currentItem.packageSize)} kg loose</strong> (1 sack opened)
                    </p>
                    <p className="text-xs text-gray-700">
                      Total: <strong>{Number(currentItem.quantity) * Number(currentItem.packageSize)} kg</strong>
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-md p-2.5 space-y-2">
                    <p className="text-xs font-semibold text-gray-800">Pricing</p>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Price (per sack) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={currentItem.purchasePrice}
                        onChange={(e) => handleCurrentItemChange('purchasePrice', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="₱ per sack"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price per KG *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={currentItem.sellingPrice}
                        onChange={(e) => handleCurrentItemChange('sellingPrice', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="₱ per kg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price per Sack *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={currentItem.sackSellingPrice}
                        onChange={(e) => handleCurrentItemChange('sackSellingPrice', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="₱ per sack"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* NON-FOOD STORE */}
              {currentItem.itemType === 'store' && !isFoodCategory() && (
                <>
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
                        <option value="bag">bag</option>
                        <option value="box">box</option>
                        <option value="pack">pack</option>
                        <option value="pcs">pcs</option>
                      </select>
                    </div>
                  </div>

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
                      <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price * <span className="text-xs text-gray-500">/pc</span></label>
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
                </>
              )}

            </div>
          </div>

          {/* Add Button */}
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
                <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden mb-3">
                  <div className="overflow-auto h-full">
                    <table className="w-full text-xs">
                      <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Type</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Item Name</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Category</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Ordered</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide">Stock</th>
                          <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide">Purchase Price</th>
                          <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide">Selling Price</th>
                          <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide">Subtotal</th>
                          <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orderItems.map((item, index) => {
                          const isFood = isItemFoodCategory(item)
                          const isMedSyrup = isItemSyrup(item)
                          const isMedTablet = isItemTablet(item)

                          // FOOD ROWS
                          if (isFood) {
                            const sealedSacks = item.quantity - 1
                            const looseKg = item.packageSize
                            return (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-2 py-2 text-xs font-medium text-gray-900">Store</td>
                                <td className="px-2 py-2">
                                  <span className="font-medium text-gray-900">{item.itemName}</span>
                                  {item.brand && <span className="text-xs text-gray-500 ml-1">({item.brand})</span>}
                                </td>
                                <td className="px-2 py-2 text-xs text-gray-900">{item.category}</td>
                                <td className="px-2 py-2 text-gray-900 whitespace-nowrap">{item.quantity} sacks × {item.packageSize}kg</td>
                                <td className="px-2 py-2">
                                  <div className="flex items-center gap-1 whitespace-nowrap">
                                    <span className="font-semibold text-gray-900">{sealedSacks} Sack{sealedSacks !== 1 ? 's' : ''}</span>
                                    <span className="text-gray-400">|</span>
                                    <span className="font-semibold text-gray-900">{looseKg} Kilos</span>
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-right text-gray-900 whitespace-nowrap">₱{item.purchasePrice.toLocaleString()}/sack</td>
                                <td className="px-2 py-2 text-right text-gray-900 whitespace-nowrap">
                                  ₱{item.sellingPrice.toLocaleString()}/kg · ₱{item.sackSellingPrice?.toLocaleString()}/sack
                                </td>
                                <td className="px-2 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">₱{(item.purchasePrice * item.quantity).toLocaleString()}</td>
                                <td className="px-2 py-2 text-center">
                                  <button onClick={() => handleRemoveOrderItem(index)} className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            )
                          }

                          // SYRUP ROWS
                          if (isMedSyrup) {
                            const sealedBottles = item.quantity - 1
                            const looseMl = item.mlPerBottle
                            return (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-2 py-2 text-xs font-medium text-gray-900">Syrup</td>
                                <td className="px-2 py-2">
                                  <span className="font-medium text-gray-900">{item.itemName}</span>
                                </td>
                                <td className="px-2 py-2 text-xs text-gray-900">{item.category}</td>
                                <td className="px-2 py-2 text-gray-900 whitespace-nowrap">{item.quantity} bottles × {item.mlPerBottle}ml</td>
                                <td className="px-2 py-2">
                                  <div className="flex items-center gap-1 whitespace-nowrap">
                                    <span className="font-semibold text-gray-900">{sealedBottles} Bottle{sealedBottles !== 1 ? 's' : ''}</span>
                                    <span className="text-gray-400">|</span>
                                    <span className="font-semibold text-gray-900">{looseMl} ml</span>
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-right text-gray-900 whitespace-nowrap">₱{item.purchasePrice.toLocaleString()}/bottle</td>
                                <td className="px-2 py-2 text-right text-gray-900 whitespace-nowrap">
                                  ₱{item.sellingPrice.toLocaleString()}/ml · ₱{item.sackSellingPrice?.toLocaleString()}/bottle
                                </td>
                                <td className="px-2 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">₱{(item.purchasePrice * item.quantity).toLocaleString()}</td>
                                <td className="px-2 py-2 text-center">
                                  <button onClick={() => handleRemoveOrderItem(index)} className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            )
                          }

                          // TABLET ROWS
                          if (isMedTablet) {
                            const sealedBoxes = item.quantity - 1
                            const looseTablets = item.tabletsPerBox
                            return (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-2 py-2 text-xs font-medium text-gray-900">Tablet</td>
                                <td className="px-2 py-2">
                                  <span className="font-medium text-gray-900">{item.itemName}</span>
                                </td>
                                <td className="px-2 py-2 text-xs text-gray-900">{item.category}</td>
                                <td className="px-2 py-2 text-gray-900 whitespace-nowrap">{item.quantity} boxes × {item.tabletsPerBox} tabs</td>
                                <td className="px-2 py-2">
                                  <div className="flex items-center gap-1 whitespace-nowrap">
                                    <span className="font-semibold text-gray-900">{sealedBoxes} Box{sealedBoxes !== 1 ? 'es' : ''}</span>
                                    <span className="text-gray-400">|</span>
                                    <span className="font-semibold text-gray-900">{looseTablets} Tablets</span>
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-right text-gray-900 whitespace-nowrap">₱{item.purchasePrice.toLocaleString()}/box</td>
                                <td className="px-2 py-2 text-right text-gray-900 whitespace-nowrap">
                                  ₱{item.sellingPrice.toLocaleString()}/tab · ₱{item.sackSellingPrice?.toLocaleString()}/box
                                </td>
                                <td className="px-2 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">₱{(item.purchasePrice * item.quantity).toLocaleString()}</td>
                                <td className="px-2 py-2 text-center">
                                  <button onClick={() => handleRemoveOrderItem(index)} className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            )
                          }

                          // VIAL / OTHER / NON-FOOD STORE ROWS
                          const totalStock = item.packageSize
                            ? (item.quantity * item.packageSize)
                            : item.quantity

                          return (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-2 py-2 text-xs font-medium text-gray-900">
                                {item.itemType === 'medicine' ? (item.medicineType || 'Med') : 'Store'}
                              </td>
                              <td className="px-2 py-2">
                                <span className="font-medium text-gray-900">{item.itemName}</span>
                                {item.brand && <span className="text-xs text-gray-500 ml-1">({item.brand})</span>}
                              </td>
                              <td className="px-2 py-2 text-xs text-gray-900">{item.category}</td>
                              <td className="px-2 py-2 text-gray-900 whitespace-nowrap">
                                {item.quantity} {item.unit}
                                {item.packageSize && ` × ${item.packageSize}pcs`}
                              </td>
                              <td className="px-2 py-2">
                                <span className="font-semibold text-gray-900 whitespace-nowrap">
                                  {totalStock} {item.unit}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-right text-gray-900 whitespace-nowrap">₱{item.purchasePrice.toLocaleString()}/{item.unit}</td>
                              <td className="px-2 py-2 text-right text-gray-900 whitespace-nowrap">₱{item.sellingPrice.toLocaleString()}/{item.unit}</td>
                              <td className="px-2 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">₱{(item.purchasePrice * item.quantity).toLocaleString()}</td>
                              <td className="px-2 py-2 text-center">
                                <button onClick={() => handleRemoveOrderItem(index)} className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded">
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
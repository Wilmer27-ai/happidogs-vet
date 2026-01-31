import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiPlus, FiTrash2, FiArrowLeft } from 'react-icons/fi'
import { addPurchaseOrder, addMedicine, addStoreItem } from '../firebase/services'

function CreatePurchaseOrder() {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedSupplier = location.state?.supplier

  const [orderItems, setOrderItems] = useState([])
  const [orderFormData, setOrderFormData] = useState({
    orderDate: new Date().toISOString().split('T')[0],
    paymentTerms: selectedSupplier?.paymentTerms || 'COD'
  })

  const [currentItem, setCurrentItem] = useState({
    itemType: 'medicine',
    itemName: '',
    category: 'Antibiotic',
    brand: '',
    description: '',
    quantity: '',
    unit: 'pcs',
    purchasePrice: '',
    sellingPrice: '',
    expirationDate: ''
  })

  const medicineCategories = ['Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care']
  const storeCategories = ['Dog Food', 'Cat Food', 'Bird Food', 'Treats & Snacks', 'Toys', 'Accessories', 'Grooming', 'Health & Wellness', 'Bedding', 'Other']

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

    setOrderItems([...orderItems, {
      ...currentItem,
      quantity: Number(currentItem.quantity),
      purchasePrice: Number(currentItem.purchasePrice),
      sellingPrice: Number(currentItem.sellingPrice)
    }])

    setCurrentItem({
      itemType: currentItem.itemType,
      itemName: '',
      category: currentItem.itemType === 'medicine' ? 'Antibiotic' : 'Dog Food',
      brand: '',
      description: '',
      quantity: '',
      unit: 'pcs',
      purchasePrice: '',
      sellingPrice: '',
      expirationDate: ''
    })
  }

  const handleRemoveOrderItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const handleCurrentItemChange = (field, value) => {
    setCurrentItem({ ...currentItem, [field]: value })
    
    if (field === 'itemType') {
      setCurrentItem({
        ...currentItem,
        itemType: value,
        category: value === 'medicine' ? 'Antibiotic' : 'Dog Food'
      })
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
          await addMedicine({
            medicineName: item.itemName,
            category: item.category,
            stockQuantity: item.quantity,
            unit: item.unit,
            purchasePrice: item.purchasePrice,
            sellingPrice: item.sellingPrice,
            expirationDate: item.expirationDate,
            supplierId: selectedSupplier.id,
            supplierName: selectedSupplier.supplierName
          })
        } else if (item.itemType === 'store') {
          await addStoreItem({
            itemName: item.itemName,
            category: item.category,
            brand: item.brand || '',
            description: item.description || '',
            stockQuantity: item.quantity,
            unit: item.unit,
            purchasePrice: item.purchasePrice,
            sellingPrice: item.sellingPrice,
            supplierId: selectedSupplier.id,
            supplierName: selectedSupplier.supplierName
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
      {/* Header */}
  

      {/* Main Content - Single Container */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full bg-white rounded-lg shadow-lg p-6 flex flex-col">
          {/* Top Section - Order Details & Add Item Form */}
          <div className="grid grid-cols-12 gap-6 mb-4">
            {/* Order Details */}
            <div className="col-span-3">
              <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Order Date *</label>
                  <input
                    type="date"
                    required
                    value={orderFormData.orderDate}
                    onChange={(e) => setOrderFormData({ ...orderFormData, orderDate: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms *</label>
                  <input
                    type="text"
                    required
                    value={orderFormData.paymentTerms}
                    onChange={(e) => setOrderFormData({ ...orderFormData, paymentTerms: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="COD, 7, 30"
                  />
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₱{calculateOrderTotal().toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Payment Due: {new Date(calculatePaymentDeadline(orderFormData.orderDate, orderFormData.paymentTerms)).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Add Item Form */}
            <div className="col-span-9">
              <h3 className="font-semibold text-gray-900 mb-3">Add Item</h3>
              <form onSubmit={handleAddItemToOrder}>
                <div className="grid grid-cols-6 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      required
                      value={currentItem.itemType}
                      onChange={(e) => handleCurrentItemChange('itemType', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="medicine">Medicine</option>
                      <option value="store">Store</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={currentItem.itemName}
                      onChange={(e) => handleCurrentItemChange('itemName', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={currentItem.itemType === 'medicine' ? 'Medicine name' : 'Item name'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      value={currentItem.category}
                      onChange={(e) => handleCurrentItemChange('category', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {(currentItem.itemType === 'medicine' ? medicineCategories : storeCategories).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Qty *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) => handleCurrentItemChange('quantity', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit *</label>
                    <select
                      required
                      value={currentItem.unit}
                      onChange={(e) => handleCurrentItemChange('unit', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pcs">pcs</option>
                      <option value="bottles">bottles</option>
                      <option value="boxes">boxes</option>
                      <option value="vials">vials</option>
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Purchase ₱ *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={currentItem.purchasePrice}
                      onChange={(e) => handleCurrentItemChange('purchasePrice', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Selling ₱ *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={currentItem.sellingPrice}
                      onChange={(e) => handleCurrentItemChange('sellingPrice', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  {currentItem.itemType === 'medicine' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Expiry *</label>
                      <input
                        type="date"
                        required
                        value={currentItem.expirationDate}
                        onChange={(e) => handleCurrentItemChange('expirationDate', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {currentItem.itemType === 'store' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                        <input
                          type="text"
                          value={currentItem.brand}
                          onChange={(e) => handleCurrentItemChange('brand', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Brand"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={currentItem.description}
                          onChange={(e) => handleCurrentItemChange('description', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Description"
                        />
                      </div>
                    </>
                  )}

                  <div className="col-span-6">
                    <button
                      type="submit"
                      className="w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <h3 className="font-semibold text-gray-900 mb-2">Order Items ({orderItems.length})</h3>
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded">
              {orderItems.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400">No items added yet</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-white sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs">Type</th>
                      <th className="px-3 py-2 text-left text-xs">Name</th>
                      <th className="px-3 py-2 text-left text-xs">Category</th>
                      <th className="px-3 py-2 text-left text-xs">Qty</th>
                      <th className="px-3 py-2 text-right text-xs">Purchase</th>
                      <th className="px-3 py-2 text-right text-xs">Selling</th>
                      <th className="px-3 py-2 text-right text-xs">Subtotal</th>
                      <th className="px-3 py-2 text-center text-xs">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orderItems.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            item.itemType === 'medicine' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.itemType === 'medicine' ? 'Med' : 'Item'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">{item.itemName}</div>
                          {item.brand && <div className="text-xs text-gray-500">{item.brand}</div>}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{item.category}</td>
                        <td className="px-3 py-2 text-gray-700">{item.quantity} {item.unit}</td>
                        <td className="px-3 py-2 text-right text-gray-700">₱{item.purchasePrice.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-gray-700">₱{item.sellingPrice.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">
                          ₱{(item.purchasePrice * item.quantity).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleRemoveOrderItem(index)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex gap-3 mt-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/suppliers')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitPurchaseOrder}
              disabled={orderItems.length === 0}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
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
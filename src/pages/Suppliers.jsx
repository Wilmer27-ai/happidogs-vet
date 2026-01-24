import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiEye, FiShoppingCart, FiCalendar, FiAlertCircle, FiCheck } from 'react-icons/fi'
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier, getMedicines, addMedicine, updateMedicine, getPurchaseOrders, addPurchaseOrder, updatePurchaseOrder } from '../firebase/services'

function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [medicines, setMedicines] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('suppliers')
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All') // All, Pending, Paid, Overdue
  
  // Supplier Modal States
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [viewingSupplier, setViewingSupplier] = useState(null)
  const [isViewSupplierModalOpen, setIsViewSupplierModalOpen] = useState(false)
  
  // Purchase Order Modal States
  const [isPurchaseOrderModalOpen, setIsPurchaseOrderModalOpen] = useState(false)
  const [selectedSupplierForOrder, setSelectedSupplierForOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  
  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null)
  
  const [supplierFormData, setSupplierFormData] = useState({
    supplierName: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    address: '',
    paymentTerms: 'COD',
    notes: ''
  })

  const [orderFormData, setOrderFormData] = useState({
    orderDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [suppliersData, medicinesData, ordersData] = await Promise.all([
        getSuppliers(),
        getMedicines(),
        getPurchaseOrders()
      ])
      setSuppliers(suppliersData)
      setMedicines(medicinesData)
      setPurchaseOrders(ordersData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['Antibiotic', 'Vaccine', 'Vitamin / Supplement', 'Pain Reliever', 'Dewormer', 'Flea & Tick Control', 'Wound Care']

  // Helper functions - MUST BE DEFINED BEFORE FILTERS
  const isPaymentOverdue = (deadline, status) => {
    if (status === 'Paid') return false
    return new Date(deadline) < new Date()
  }

  const calculatePaymentDeadline = (orderDate, paymentTerms) => {
    const date = new Date(orderDate)
    if (paymentTerms === 'COD') return orderDate
    const days = parseInt(paymentTerms.split(' ')[0])
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  const getPaymentStatusColor = (status) => {
    if (status === 'Paid') return 'bg-green-100 text-green-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  // Filter data
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.phoneNumber?.includes(searchQuery)
  )

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    
    let matchesStatus = true
    if (paymentStatusFilter === 'Pending') {
      matchesStatus = order.paymentStatus === 'Pending'
    } else if (paymentStatusFilter === 'Paid') {
      matchesStatus = order.paymentStatus === 'Paid'
    } else if (paymentStatusFilter === 'Overdue') {
      matchesStatus = isPaymentOverdue(order.paymentDeadline, order.paymentStatus)
    }
    
    return matchesSearch && matchesStatus
  })

  // Get statistics
  const totalOrders = purchaseOrders.length
  const pendingPayments = purchaseOrders.filter(order => order.paymentStatus !== 'Paid')
  const overduePayments = purchaseOrders.filter(order => isPaymentOverdue(order.paymentDeadline, order.paymentStatus))
  const totalPayable = pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0)

  // Supplier Handlers
  const handleSupplierSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, supplierFormData)
      } else {
        await addSupplier(supplierFormData)
      }
      loadData()
      handleCloseSupplierModal()
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('Failed to save supplier.')
    }
  }

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier)
    setSupplierFormData({
      supplierName: supplier.supplierName,
      contactPerson: supplier.contactPerson || '',
      phoneNumber: supplier.phoneNumber || '',
      email: supplier.email || '',
      address: supplier.address || '',
      paymentTerms: supplier.paymentTerms || 'COD',
      notes: supplier.notes || ''
    })
    setIsSupplierModalOpen(true)
  }

  const handleDeleteSupplier = async (id) => {
    const hasOrders = purchaseOrders.some(order => order.supplierId === id)
    if (hasOrders) {
      alert('Cannot delete supplier. There are purchase orders linked to this supplier.')
      return
    }
    
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier(id)
        loadData()
      } catch (error) {
        console.error('Error deleting supplier:', error)
        alert('Failed to delete supplier.')
      }
    }
  }

  const handleViewSupplier = (supplier) => {
    setViewingSupplier(supplier)
    setIsViewSupplierModalOpen(true)
  }

  const handleCloseSupplierModal = () => {
    setIsSupplierModalOpen(false)
    setEditingSupplier(null)
    setSupplierFormData({
      supplierName: '',
      contactPerson: '',
      phoneNumber: '',
      email: '',
      address: '',
      paymentTerms: 'COD',
      notes: ''
    })
  }

  // Purchase Order Handlers
  const handleCreatePurchaseOrder = (supplier) => {
    setSelectedSupplierForOrder(supplier)
    setOrderItems([])
    setOrderFormData({
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: '',
      notes: ''
    })
    setIsPurchaseOrderModalOpen(true)
  }

  const handleAddOrderItem = () => {
    setOrderItems([...orderItems, {
      medicineName: '',
      category: 'Antibiotic',
      quantity: '',
      unit: 'pcs',
      purchasePrice: '',
      sellingPrice: '',
      expirationDate: ''
    }])
  }

  const handleRemoveOrderItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const handleOrderItemChange = (index, field, value) => {
    const newItems = [...orderItems]
    newItems[index][field] = value
    setOrderItems(newItems)
  }

  const calculateOrderTotal = () => {
    return orderItems.reduce((sum, item) => {
      return sum + (Number(item.purchasePrice) * Number(item.quantity))
    }, 0)
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
      const paymentDeadline = calculatePaymentDeadline(orderFormData.orderDate, selectedSupplierForOrder.paymentTerms)

      const purchaseOrder = {
        orderNumber,
        supplierId: selectedSupplierForOrder.id,
        supplierName: selectedSupplierForOrder.supplierName,
        orderDate: orderFormData.orderDate,
        expectedDelivery: orderFormData.expectedDelivery,
        paymentTerms: selectedSupplierForOrder.paymentTerms,
        paymentDeadline,
        totalAmount,
        paymentStatus: 'Pending',
        items: orderItems.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          purchasePrice: Number(item.purchasePrice),
          sellingPrice: Number(item.sellingPrice)
        })),
        notes: orderFormData.notes,
        createdAt: new Date().toISOString()
      }

      // Save purchase order
      await addPurchaseOrder(purchaseOrder)

      // Add medicines to inventory
      for (const item of orderItems) {
        await addMedicine({
          medicineName: item.medicineName,
          category: item.category,
          stockQuantity: Number(item.quantity),
          unit: item.unit,
          purchasePrice: Number(item.purchasePrice),
          sellingPrice: Number(item.sellingPrice),
          expirationDate: item.expirationDate,
          supplierId: selectedSupplierForOrder.id,
          supplierName: selectedSupplierForOrder.supplierName
        })
      }

      loadData()
      handleClosePurchaseOrderModal()
      alert('Purchase order created successfully!')
    } catch (error) {
      console.error('Error creating purchase order:', error)
      alert('Failed to create purchase order.')
    }
  }

  const handleClosePurchaseOrderModal = () => {
    setIsPurchaseOrderModalOpen(false)
    setSelectedSupplierForOrder(null)
    setOrderItems([])
    setOrderFormData({
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: '',
      notes: ''
    })
  }

  // Payment Handlers
  const handleMarkAsPaid = (order) => {
    setSelectedOrderForPayment(order)
    setIsPaymentModalOpen(true)
  }

  const handleConfirmPayment = async () => {
    try {
      await updatePurchaseOrder(selectedOrderForPayment.id, {
        paymentStatus: 'Paid',
        paidDate: new Date().toISOString().split('T')[0]
      })
      loadData()
      setIsPaymentModalOpen(false)
      setSelectedOrderForPayment(null)
      alert('Payment recorded successfully!')
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('Failed to record payment.')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Supplier Management & Purchase Orders</h1>
              <p className="text-gray-500 mt-1">Manage suppliers, create purchase orders, and track payments</p>
            </div>
            <button
              onClick={activeTab === 'suppliers' ? () => setIsSupplierModalOpen(true) : null}
              className={`flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm text-sm ${
                activeTab !== 'suppliers' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={activeTab !== 'suppliers'}
            >
              <FiPlus className="w-5 h-5" />
              Add Supplier
            </button>
          </div>

          {/* Statistics Cards */}
          {activeTab === 'orders' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <FiShoppingCart className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-600 font-medium">Total Orders</p>
                </div>
                <p className="text-2xl font-bold text-blue-900">{totalOrders}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                <div className="flex items-center gap-2 mb-1">
                  <FiAlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-600 font-medium">Pending Payments</p>
                </div>
                <p className="text-2xl font-bold text-yellow-900">{pendingPayments.length}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <div className="flex items-center gap-2 mb-1">
                  <FiCalendar className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-600 font-medium">Overdue</p>
                </div>
                <p className="text-2xl font-bold text-red-900">{overduePayments.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-green-600 font-medium">Total Payable</span>
                </div>
                <p className="text-2xl font-bold text-green-900">₱{totalPayable.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Tab Toggle & Search */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('suppliers')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'suppliers'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Suppliers ({suppliers.length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Purchase Orders & Payments ({purchaseOrders.length})
              </button>
            </div>

            <div className="flex items-center gap-3 flex-1 max-w-2xl">
              {activeTab === 'orders' && (
                <div className="flex gap-2">
                  {['All', 'Pending', 'Overdue', 'Paid'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setPaymentStatusFilter(filter)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                        paymentStatusFilter === filter
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={activeTab === 'suppliers' ? 'Search suppliers...' : 'Search orders...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 px-6 py-4 overflow-hidden">
        <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'suppliers' ? (
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Supplier Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Payment Terms
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map((supplier) => (
                        <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{supplier.supplierName}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{supplier.contactPerson || 'N/A'}</td>
                          <td className="px-6 py-4 text-gray-700">{supplier.phoneNumber || 'N/A'}</td>
                          <td className="px-6 py-4 text-gray-700">{supplier.email || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {supplier.paymentTerms || 'COD'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleCreatePurchaseOrder(supplier)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium shadow-sm transition-colors"
                                title="Create Purchase Order"
                              >
                                <FiShoppingCart className="w-4 h-4" />
                                Create Order
                              </button>
                              <button
                                onClick={() => handleViewSupplier(supplier)}
                                className="text-gray-600 hover:text-gray-900 p-2"
                                title="View Details"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditSupplier(supplier)}
                                className="text-blue-600 hover:text-blue-700 p-2"
                                title="Edit"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSupplier(supplier.id)}
                                className="text-red-600 hover:text-red-700 p-2"
                                title="Delete"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                          No suppliers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Order Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Order Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Payment Deadline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => {
                        const overdue = isPaymentOverdue(order.paymentDeadline, order.paymentStatus)
                        
                        return (
                          <tr key={order.id} className={`transition-colors ${overdue ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                            </td>
                            <td className="px-6 py-4 text-gray-700">{order.supplierName}</td>
                            <td className="px-6 py-4 text-gray-700">
                              {new Date(order.orderDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {order.items?.length || 0} items
                              </span>
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              ₱{order.totalAmount?.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <FiCalendar className="w-4 h-4 text-gray-500" />
                                <span className={`text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                                  {new Date(order.paymentDeadline).toLocaleDateString()}
                                </span>
                                {overdue && (
                                  <FiAlertCircle className="w-4 h-4 text-red-600" title="Overdue" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {overdue ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Overdue
                                </span>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                                  {order.paymentStatus}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {order.paymentStatus !== 'Paid' && (
                                  <button
                                    onClick={() => handleMarkAsPaid(order)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium"
                                  >
                                    <FiCheck className="w-3 h-3" />
                                    Mark Paid
                                  </button>
                                )}
                                {order.paymentStatus === 'Paid' && (
                                  <span className="text-xs text-gray-500">
                                    Paid: {new Date(order.paidDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                          No purchase orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* View Supplier Modal */}
      {isViewSupplierModalOpen && viewingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Supplier Details</h2>
              <button onClick={() => setIsViewSupplierModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{viewingSupplier.supplierName}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Contact Person</label>
                  <p className="text-gray-900">{viewingSupplier.contactPerson || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                  <p className="text-gray-900">{viewingSupplier.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-gray-900">{viewingSupplier.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Payment Terms</label>
                  <p className="text-gray-900">{viewingSupplier.paymentTerms || 'COD'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                  <p className="text-gray-900">{viewingSupplier.address || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                  <p className="text-gray-900">{viewingSupplier.notes || 'No notes'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Purchase Orders ({purchaseOrders.filter(o => o.supplierId === viewingSupplier.id).length})
                </h4>
                {purchaseOrders.filter(o => o.supplierId === viewingSupplier.id).length > 0 ? (
                  <div className="space-y-2">
                    {purchaseOrders.filter(o => o.supplierId === viewingSupplier.id).map((order) => (
                      <div key={order.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.orderDate).toLocaleDateString()} • {order.items?.length} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₱{order.totalAmount?.toLocaleString()}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No purchase orders from this supplier</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setIsViewSupplierModalOpen(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <button onClick={handleCloseSupplierModal} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSupplierSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierFormData.supplierName}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, supplierName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter supplier name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={supplierFormData.contactPerson}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contact person name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={supplierFormData.phoneNumber}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={supplierFormData.email}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Terms <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={supplierFormData.paymentTerms}
                      onChange={(e) => setSupplierFormData({ ...supplierFormData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="COD">COD (Cash on Delivery)</option>
                      <option value="7 days">7 days</option>
                      <option value="15 days">15 days</option>
                      <option value="30 days">30 days</option>
                      <option value="60 days">60 days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={supplierFormData.address}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={supplierFormData.notes}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseSupplierModal}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Order Modal */}
      {isPurchaseOrderModalOpen && selectedSupplierForOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create Purchase Order</h2>
                <p className="text-sm text-gray-500 mt-1">Supplier: {selectedSupplierForOrder.supplierName}</p>
              </div>
              <button onClick={handleClosePurchaseOrderModal} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchaseOrder}>
              <div className="p-6 space-y-6">
                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={orderFormData.orderDate}
                      onChange={(e) => setOrderFormData({ ...orderFormData, orderDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
                    <input
                      type="date"
                      value={orderFormData.expectedDelivery}
                      onChange={(e) => setOrderFormData({ ...orderFormData, expectedDelivery: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                    <input
                      type="text"
                      value={selectedSupplierForOrder.paymentTerms}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
                    <button
                      type="button"
                      onClick={handleAddOrderItem}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>

                  {orderItems.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <p className="text-gray-500">No items added yet. Click "Add Item" to start.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderItems.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveOrderItem(index)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="lg:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Medicine Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={item.medicineName}
                                onChange={(e) => handleOrderItemChange(index, 'medicineName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Medicine name"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={item.category}
                                onChange={(e) => handleOrderItemChange(index, 'category', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {categories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                required
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleOrderItemChange(index, 'quantity', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Qty"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit <span className="text-red-500">*</span>
                              </label>
                              <select
                                required
                                value={item.unit}
                                onChange={(e) => handleOrderItemChange(index, 'unit', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="pcs">pcs</option>
                                <option value="bottles">bottles</option>
                                <option value="boxes">boxes</option>
                                <option value="vials">vials</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Purchase Price <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={item.purchasePrice}
                                onChange={(e) => handleOrderItemChange(index, 'purchasePrice', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="₱0.00"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Selling Price <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={item.sellingPrice}
                                onChange={(e) => handleOrderItemChange(index, 'sellingPrice', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="₱0.00"
                              />
                            </div>

                            <div className="lg:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expiration Date <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                required
                                value={item.expirationDate}
                                onChange={(e) => handleOrderItemChange(index, 'expirationDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          {item.quantity && item.purchasePrice && (
                            <div className="mt-3 pt-3 border-t border-gray-300">
                              <p className="text-sm text-gray-600">
                                Subtotal: <span className="font-semibold text-gray-900">₱{(Number(item.quantity) * Number(item.purchasePrice)).toLocaleString()}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={orderFormData.notes}
                    onChange={(e) => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes for this order"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">₱{calculateOrderTotal().toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Payment Deadline</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(calculatePaymentDeadline(orderFormData.orderDate, selectedSupplierForOrder.paymentTerms)).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClosePurchaseOrderModal}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Create Purchase Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {isPaymentModalOpen && selectedOrderForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Confirm Payment</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-600 mb-4">Are you sure you want to mark this order as paid?</p>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Order Number:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedOrderForPayment.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Supplier:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedOrderForPayment.supplierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="text-sm font-semibold text-gray-900">₱{selectedOrderForPayment.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Date:</span>
                    <span className="text-sm font-semibold text-gray-900">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Suppliers
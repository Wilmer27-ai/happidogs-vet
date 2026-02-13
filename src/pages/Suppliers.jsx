import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiShoppingCart, FiAlertCircle, FiCheck, FiPackage } from 'react-icons/fi'
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier, getPurchaseOrders, updatePurchaseOrder } from '../firebase/services'

function Suppliers() {
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('suppliers')
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All')
  
  // Supplier Modal States
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  
  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null)
  
  // Lazy loading states
  const [displayCountSuppliers, setDisplayCountSuppliers] = useState(20)
  const [displayCountOrders, setDisplayCountOrders] = useState(20)
  const observerTarget = useRef(null)
  
  const [supplierFormData, setSupplierFormData] = useState({
    supplierName: '',
    phoneNumber: '',
    address: '',
    paymentTerms: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [suppliersData, ordersData] = await Promise.all([
        getSuppliers(),
        getPurchaseOrders()
      ])
      setSuppliers(suppliersData)
      setPurchaseOrders(ordersData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper functions
  const isPaymentOverdue = (deadline, status) => {
    if (status === 'Paid') return false
    return new Date(deadline) < new Date()
  }

  const getPaymentStatusColor = (status) => {
    if (status === 'Paid') return 'bg-green-100 text-green-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const calculatePaymentDeadline = (orderDate, paymentTerms) => {
    const date = new Date(orderDate)
    const days = parseInt(paymentTerms) || 0
  
    if (days === 0) return orderDate // COD
  
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
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

  // Displayed items with lazy loading
  const displayedSuppliers = filteredSuppliers.slice(0, displayCountSuppliers)
  const displayedOrders = filteredOrders.slice(0, displayCountOrders)
  const hasMoreSuppliers = displayCountSuppliers < filteredSuppliers.length
  const hasMoreOrders = displayCountOrders < filteredOrders.length

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          if (activeTab === 'suppliers' && hasMoreSuppliers) {
            setDisplayCountSuppliers(prev => prev + 20)
          } else if (activeTab === 'orders' && hasMoreOrders) {
            setDisplayCountOrders(prev => prev + 20)
          }
        }
      },
      { threshold: 1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMoreSuppliers, hasMoreOrders, activeTab])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCountSuppliers(20)
    setDisplayCountOrders(20)
  }, [searchQuery, activeTab, paymentStatusFilter])

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
      await loadData()
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
      phoneNumber: supplier.phoneNumber || '',
      address: supplier.address || '',
      paymentTerms: supplier.paymentTerms || ''
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
        await loadData()
      } catch (error) {
        console.error('Error deleting supplier:', error)
        alert('Failed to delete supplier.')
      }
    }
  }

  const handleCloseSupplierModal = () => {
    setIsSupplierModalOpen(false)
    setEditingSupplier(null)
    setSupplierFormData({
      supplierName: '',
      phoneNumber: '',
      address: '',
      paymentTerms: ''
    })
  }

  // Purchase Order Handlers
  const handleCreatePurchaseOrder = (supplier) => {
    navigate('/create-purchase-order', { state: { supplier } })
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
        paidDate: new Date().toISOString()
      })
      await loadData()
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
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Suppliers & Purchase Orders</h1>

        

        {/* Tab Toggle & Search */}
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'suppliers'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Suppliers
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Purchase Orders
            </button>
          </div>

          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={activeTab === 'suppliers' ? 'Search suppliers...' : 'Search orders...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {activeTab === 'orders' && (
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          )}

          {activeTab === 'suppliers' && (
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm text-sm"
            >
              <FiPlus className="w-4 h-4" />
              Add Supplier
            </button>
          )}
        </div>
      </div>

      {/* Table Container with Fixed Height */}
      <div className="flex-1 px-6 py-4 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col overflow-hidden">
            <div className="overflow-auto flex-1">
              {activeTab === 'suppliers' ? (
                filteredSuppliers.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No suppliers found</p>
                    </div>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-white sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs">Supplier Name</th>
                        <th className="px-4 py-2 text-left text-xs">Contact Person</th>
                        <th className="px-4 py-2 text-left text-xs">Phone</th>
                        <th className="px-4 py-2 text-left text-xs">Email</th>
                        <th className="px-4 py-2 text-left text-xs">Payment Terms</th>
                        <th className="px-4 py-2 text-right text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {displayedSuppliers.map((supplier, index) => (
                        <tr key={supplier.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{supplier.supplierName}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{supplier.contactPerson || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-700">{supplier.phoneNumber || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-700">{supplier.email || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {supplier.paymentTerms === '0' ? 'COD' : `${supplier.paymentTerms} days`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleCreatePurchaseOrder(supplier)}
                                className="text-green-600 hover:text-green-700 p-1.5"
                                title="Create Purchase Order"
                              >
                                <FiShoppingCart className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditSupplier(supplier)}
                                className="text-blue-600 hover:text-blue-700 p-1.5"
                                title="Edit"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSupplier(supplier.id)}
                                className="text-red-600 hover:text-red-700 p-1.5"
                                title="Delete"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (
                filteredOrders.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FiShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No purchase orders found</p>
                    </div>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-white sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs">Order #</th>
                        <th className="px-4 py-2 text-left text-xs">Supplier</th>
                        <th className="px-4 py-2 text-left text-xs">Order Date</th>
                        <th className="px-4 py-2 text-left text-xs">Items</th>
                        <th className="px-4 py-2 text-right text-xs">Total Amount</th>
                        <th className="px-4 py-2 text-left text-xs">Payment Deadline</th>
                        <th className="px-4 py-2 text-left text-xs">Status</th>
                        <th className="px-4 py-2 text-right text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {displayedOrders.map((order, index) => {
                        const isOverdue = isPaymentOverdue(order.paymentDeadline, order.paymentStatus)
                        return (
                          <tr key={order.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">{order.orderNumber}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{order.supplierName}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {new Date(order.orderDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {order.items?.length || 0}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              ₱{order.totalAmount?.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                                {new Date(order.paymentDeadline).toLocaleDateString()}
                                {isOverdue && (
                                  <span className="block text-xs">
                                    <FiAlertCircle className="inline w-3 h-3 mr-1" />
                                    Overdue
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                                {order.paymentStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                {order.paymentStatus !== 'Paid' ? (
                                  <button
                                    onClick={() => handleMarkAsPaid(order)}
                                    className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 font-medium"
                                  >
                                    <FiCheck className="w-3 h-3" />
                                    Mark Paid
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-500">
                                    {new Date(order.paidDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )
              )}

              {/* Loading indicator for lazy loading */}
              {((activeTab === 'suppliers' && hasMoreSuppliers) || (activeTab === 'orders' && hasMoreOrders)) && (
                <div ref={observerTarget} className="py-4 text-center">
                  <p className="text-sm text-gray-500">Loading more...</p>
                </div>
              )}
            </div>

            {/* Footer with count */}
            {((activeTab === 'suppliers' && !hasMoreSuppliers && displayedSuppliers.length > 0) ||
              (activeTab === 'orders' && !hasMoreOrders && displayedOrders.length > 0)) && (
              <div className="py-3 text-center border-t flex-shrink-0 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Showing all {activeTab === 'suppliers' ? filteredSuppliers.length : filteredOrders.length}{' '}
                  {activeTab === 'suppliers' ? 'suppliers' : 'orders'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
              </div>
              <button
                onClick={handleCloseSupplierModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSupplierSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierFormData.supplierName}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, supplierName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Supplier name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={supplierFormData.phoneNumber}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    required
                    value={supplierFormData.address}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Full address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms (Days) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={supplierFormData.paymentTerms}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0 for COD, 7, 30, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter 0 for Cash on Delivery (COD)</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseSupplierModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                </button>
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
              <p className="text-gray-700 mb-4">
                Are you sure you want to mark this order as paid?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium text-gray-900">{selectedOrderForPayment.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplier:</span>
                  <span className="font-medium text-gray-900">{selectedOrderForPayment.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-gray-900">₱{selectedOrderForPayment.totalAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
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
      )}
    </div>
  )
}

export default Suppliers
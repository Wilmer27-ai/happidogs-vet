import { useState, useEffect, useRef } from 'react'
import { FiEdit2, FiTrash2, FiSearch, FiCalendar, FiSave, FiX, FiTrendingDown, FiFileText } from 'react-icons/fi'
import { addExpense, getExpenses, updateExpense, deleteExpense } from '../firebase/services'

function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('all')
  const [editingExpense, setEditingExpense] = useState(null)
  
  // Lazy loading
  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)

  const [formData, setFormData] = useState({
    expenseName: '',
    category: 'Supplies',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: 'Cash'
  })

  const categories = [
    'Supplies',
    'Medicine Inventory',
    'Store Inventory',
    'Utilities',
    'Rent',
    'Salaries',
    'Equipment',
    'Maintenance',
    'Transportation',
    'Marketing',
    'Other'
  ]

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    setLoading(true)
    try {
      const expensesData = await getExpenses()
      setExpenses(expensesData)
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDateRange = (filter) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch(filter) {
      case 'today':
        return { start: today }
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return { start: weekAgo }
      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return { start: monthAgo }
      default:
        return null
    }
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.expenseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter
    
    const dateRange = getDateRange(dateFilter)
    const matchesDate = !dateRange || new Date(expense.expenseDate) >= dateRange.start
    
    return matchesSearch && matchesCategory && matchesDate
  })

  // Displayed expenses with lazy loading
  const displayedExpenses = filteredExpenses.slice(0, displayCount)
  const hasMore = displayCount < filteredExpenses.length

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
  }, [searchQuery, categoryFilter, dateFilter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, formData)
        setExpenses(expenses.map(exp => 
          exp.id === editingExpense.id ? { ...exp, ...formData } : exp
        ))
        setEditingExpense(null)
      } else {
        const newExpense = await addExpense(formData)
        setExpenses([newExpense, ...expenses])
      }
      
      // Reset form
      setFormData({
        expenseName: '',
        category: 'Supplies',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        description: '',
        paymentMethod: 'Cash'
      })
      
      await loadExpenses()
    } catch (error) {
      console.error('Error saving expense:', error)
      alert('Failed to save expense. Please try again.')
    }
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setFormData({
      expenseName: expense.expenseName,
      category: expense.category,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      description: expense.description || '',
      paymentMethod: 'Cash'
    })
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingExpense(null)
    setFormData({
      expenseName: '',
      category: 'Supplies',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      description: '',
      paymentMethod: 'Cash'
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      await deleteExpense(id)
      setExpenses(expenses.filter(exp => exp.id !== id))
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense. Please try again.')
    }
  }

  // Calculate statistics
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
  const totalCount = filteredExpenses.length

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-gray-900">Expense Management</h1>
          
          {/* Statistics - Inline */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <FiTrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 leading-none">Total Expenses</p>
                <p className="text-lg font-semibold text-gray-900">₱{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <FiFileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 leading-none">Transactions</p>
                <p className="text-lg font-semibold text-gray-900">{totalCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6 py-3">
        {/* Form */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm p-4 mb-3">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-5 gap-2 mb-2">
              <input
                type="text"
                required
                value={formData.expenseName}
                onChange={(e) => setFormData({ ...formData, expenseName: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Expense Name *"
              />

              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Amount *"
              />

              <input
                type="date"
                required
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />

              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Description (Optional)"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
              >
                <FiSave className="w-3.5 h-3.5" />
                {editingExpense ? 'Update Expense' : 'Add Expense'}
              </button>
              {editingExpense && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  <FiX className="w-3.5 h-3.5" />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 260px)' }}>
          <div className="overflow-auto h-full">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Expense Name</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Category</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Description</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-sm">Loading expenses...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <FiFileText className="w-12 h-12 text-gray-300" />
                        <span className="text-sm font-medium">No expenses found</span>
                        <span className="text-xs text-gray-400">Add your first expense to get started</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {displayedExpenses.map((expense, index) => (
                      <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-700 text-sm">{formatDate(expense.expenseDate)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{expense.expenseName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                          {expense.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-gray-900">₱{parseFloat(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {hasMore && (
                      <tr ref={observerTarget}>
                        <td colSpan="6" className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                            <span className="text-sm">Loading more...</span>
                          </div>
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
  )
}

export default Expenses
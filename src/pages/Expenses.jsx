import { useState, useEffect, useRef } from 'react'
import { FiEdit2, FiTrash2, FiSearch, FiCalendar, FiSave, FiX, FiTrendingDown, FiFileText, FiPlus, FiChevronDown, FiDollarSign } from 'react-icons/fi'
import { addExpense, getExpenses, updateExpense, deleteExpense, getMasterData, saveMasterData, MASTER_DATA_DEFAULTS } from '../firebase/services'

// ── Category Dropdown Component ────────────────────────────────────────────────
function CategoryDropdown({ label, value, onChange, categories, onCategoriesChange, placeholder = 'Select category...' }) {
  const [open, setOpen] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [lastAddedCategory, setLastAddedCategory] = useState(null)
  const [savedMessage, setSavedMessage] = useState(false)
  const ref = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false)
        setNewCategory('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAdd = async () => {
    const trimmed = newCategory.trim()
    if (!trimmed) return
    if (categories.includes(trimmed)) {
      onChange(trimmed)
      setNewCategory('')
      setOpen(false)
      return
    }

    try {
      const updatedCategories = [...categories, trimmed]
      onCategoriesChange(updatedCategories)
      
      // Save to master data
      await saveMasterData({
        expenseCategories: updatedCategories,
      })
      
      onChange(trimmed)
      setLastAddedCategory(trimmed)
      setSavedMessage(true)
      setNewCategory('')
      setTimeout(() => {
        setOpen(false)
        setLastAddedCategory(null)
        setSavedMessage(false)
      }, 1500)
    } catch (error) {
      console.error('Error adding category:', error)
      alert('Failed to add category.')
    }
  }

  const handleDelete = async (category, e) => {
    e.stopPropagation()
    e.preventDefault()
    
    try {
      const updatedCategories = categories.filter(c => c !== category)
      onCategoriesChange(updatedCategories)
      
      // Save to master data
      await saveMasterData({
        expenseCategories: updatedCategories,
      })
      
      if (value === category) onChange('')
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category.')
    }
  }

  const handleSelect = (category) => {
    onChange(category)
    setOpen(false)
    setNewCategory('')
  }

  return (
    <div ref={ref} className="relative w-full">
      {label && <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setNewCategory('') }}
        className="w-full flex items-center justify-between px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 hover:border-blue-400 transition-colors"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <FiChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-2xl z-50"
        >
          {savedMessage && (
            <div className="px-3 py-2 bg-green-50 border-b border-green-200 text-xs text-green-700 font-medium flex items-center gap-1.5">
              <span className="w-4 h-4 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">✓</span>
              Saved to Master Data
            </div>
          )}

          <div className="flex items-center gap-1.5 p-2 border-b border-gray-100 bg-gray-50">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
                if (e.key === 'Escape') { setOpen(false); setNewCategory('') }
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Type new category..."
              className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={(e) => { e.stopPropagation(); handleAdd() }}
              disabled={!newCategory.trim()}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <FiPlus className="w-3 h-3" />
              Add
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {categories.filter(cat => cat !== 'Bank Deposit').length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No categories yet. Add one above.</p>
            ) : (
              categories.filter(cat => cat !== 'Bank Deposit').map(category => {
                const isSelected = value === category
                const isNewlyAdded = category === lastAddedCategory
                return (
                  <div
                    key={category}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer group transition-colors
                      ${isNewlyAdded ? 'bg-green-100 border-l-3 border-green-600' : isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => handleSelect(category)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs ${isNewlyAdded ? 'text-green-700 font-semibold' : isSelected ? 'text-blue-700 font-semibold' : 'text-gray-800'}`}>
                        {category}
                      </span>
                      {isNewlyAdded && <span className="text-xs font-medium text-green-700">NEW</span>}
                    </div>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                      onClick={(e) => handleDelete(category, e)}
                      className="flex items-center gap-1 px-1.5 py-0.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete this category"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Expenses Component ────────────────────────────────────────────────────
function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('all')
  const [editingExpense, setEditingExpense] = useState(null)
  const [formMode, setFormMode] = useState('expense') // 'expense' or 'deposit'
  const [showModal, setShowModal] = useState(false)
  
  // Lazy loading
  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)

  const [formData, setFormData] = useState({
    expenseName: '',
    category: MASTER_DATA_DEFAULTS.expenseCategories[0],
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
  })

  const [categories, setCategories] = useState([...MASTER_DATA_DEFAULTS.expenseCategories])

  useEffect(() => {
    loadExpenses()
    getMasterData().then(data => {
      if (data) {
        if (data.expenseCategories?.length) setCategories(data.expenseCategories)
      }
    })
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
    
    // Exclude bank deposits from regular expenses
    const isBankDeposit = expense.category === 'Bank Deposit'
    const matchesCategory = (categoryFilter === 'All' && !isBankDeposit) || (categoryFilter !== 'All' && expense.category === categoryFilter && !isBankDeposit)
    
    const dateRange = getDateRange(dateFilter)
    const matchesDate = !dateRange || new Date(expense.expenseDate) >= dateRange.start
    
    return matchesSearch && matchesCategory && matchesDate
  })

  // Bank deposits (separate from regular expenses)
  const bankDeposits = expenses.filter(expense => {
    const matchesSearch = expense.expenseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const isBankDeposit = expense.category === 'Bank Deposit'
    
    const dateRange = getDateRange(dateFilter)
    const matchesDate = !dateRange || new Date(expense.expenseDate) >= dateRange.start
    
    return matchesSearch && isBankDeposit && matchesDate
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
    const amountValue = parseFloat(formData.amount)
    if (!Number.isFinite(amountValue) || amountValue < 0) {
      alert('Please enter a valid amount.')
      return
    }
    
    // Set category to "Bank Deposit" if in deposit mode
    const payload = { 
      ...formData, 
      amount: amountValue,
      category: formMode === 'deposit' ? 'Bank Deposit' : formData.category
    }
    
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, payload)
        setExpenses(expenses.map(exp => 
          exp.id === editingExpense.id ? { ...exp, ...payload } : exp
        ))
        setEditingExpense(null)
      } else {
        const newExpense = await addExpense(payload)
        setExpenses([newExpense, ...expenses])
      }
      
      setFormData({
        expenseName: '',
        category: categories[0] ?? MASTER_DATA_DEFAULTS.expenseCategories[0],
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        description: '',
      })
      setFormMode('expense')
      
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
    })
    // Set form mode based on category
    setFormMode(expense.category === 'Bank Deposit' ? 'deposit' : 'expense')
    // Open modal
    setShowModal(true)
  }

  const handleCancelEdit = () => {
    setEditingExpense(null)
    setFormData({
      expenseName: '',
      category: categories[0] ?? MASTER_DATA_DEFAULTS.expenseCategories[0],
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      description: '',
    })
    setFormMode('expense')
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
  const totalBankDeposits = bankDeposits.reduce((sum, dep) => sum + parseFloat(dep.amount || 0), 0)
  const bankDepositCount = bankDeposits.length

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <h1 className="text-xl font-semibold text-gray-900">Expense Management</h1>
          
          {/* Statistics - Inline */}
          <div className="flex flex-wrap gap-4">
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
             
            </div>
            {bankDepositCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <FiFileText className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 leading-none">Bank Deposits</p>
                  <p className="text-lg font-semibold text-gray-900">₱{totalBankDeposits.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search & Filters & Action Buttons */}
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
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
            className="w-full md:w-auto px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="All">All Categories</option>
            {categories.filter(cat => cat !== 'Bank Deposit').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setFormMode('expense')
              setEditingExpense(null)
              setFormData({
                expenseName: '',
                category: categories[0] ?? MASTER_DATA_DEFAULTS.expenseCategories[0],
                amount: '',
                expenseDate: new Date().toISOString().split('T')[0],
                description: '',
              })
              setShowModal(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap shadow-sm"
          >
            <FiPlus className="w-4 h-4" />
            Add Expense
          </button>
          <button
            onClick={() => {
              setFormMode('deposit')
              setEditingExpense(null)
              setFormData({
                expenseName: '',
                category: 'Bank Deposit',
                amount: '',
                expenseDate: new Date().toISOString().split('T')[0],
                description: '',
              })
              setShowModal(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium text-sm whitespace-nowrap shadow-sm"
          >
            <FiDollarSign className="w-4 h-4" />
            Bank Deposit
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-3 flex flex-col">
        {/* Modal Overlay */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingExpense ? (formMode === 'deposit' ? 'Update Bank Deposit' : 'Update Expense') : (formMode === 'deposit' ? 'Record Bank Deposit' : 'Add New Expense')}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    handleCancelEdit()
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4">
                <form onSubmit={(e) => {
                  handleSubmit(e)
                  setShowModal(false)
                }}>
                  {/* Expense Form */}
                  {formMode === 'expense' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={formData.expenseName}
                          onChange={(e) => setFormData({ ...formData, expenseName: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Expense Name *"
                        />

                        <CategoryDropdown
                          value={formData.category}
                          onChange={(val) => setFormData({ ...formData, category: val })}
                          categories={categories}
                          onCategoriesChange={setCategories}
                        />

                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          step="0.01"
                          min="0"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Amount *"
                        />

                        <input
                          type="date"
                          required
                          value={formData.expenseDate}
                          onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Description (Optional)"
                      />

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                        >
                          <FiSave className="w-4 h-4" />
                          {editingExpense ? 'Update Expense' : 'Add Expense'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowModal(false)
                            handleCancelEdit()
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bank Deposit Form */}
                  {formMode === 'deposit' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={formData.expenseName}
                          onChange={(e) => setFormData({ ...formData, expenseName: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          placeholder="Description (e.g., Deposit sales to bank) *"
                        />

                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          step="0.01"
                          min="0"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          placeholder="Amount *"
                        />

                        <input
                          type="date"
                          required
                          value={formData.expenseDate}
                          onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        />
                      </div>

                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        placeholder="Notes (Optional)"
                      />

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium text-sm shadow-sm"
                        >
                          <FiSave className="w-4 h-4" />
                          {editingExpense ? 'Update Deposit' : 'Record Deposit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowModal(false)
                            handleCancelEdit()
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Combined Expenses & Bank Deposits - 2 Column Table */}
        <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 flex-1">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          ) : (displayedExpenses.length === 0 && bankDeposits.length === 0) ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 flex-1">
              <FiFileText className="w-12 h-12 text-gray-300" />
              <span className="text-sm font-medium text-gray-500">No records found</span>
              <span className="text-xs text-gray-400">Add your first expense or bank deposit to get started</span>
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-gray-200 h-full">
                {/* Column 1 - First Half */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Category</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase">Amount</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {displayedExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 text-xs text-gray-700">{formatDate(expense.expenseDate)}</td>
                          <td className="px-3 py-2 text-xs font-medium text-gray-900">{expense.expenseName}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-xs font-semibold text-red-600">₱{parseFloat(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEdit(expense)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(expense.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Column 2 - Second Half */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Type</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase">Amount</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {bankDeposits.map((deposit) => (
                        <tr key={deposit.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 text-xs text-gray-700">{formatDate(deposit.expenseDate)}</td>
                          <td className="px-3 py-2 text-xs font-medium text-gray-900">{deposit.expenseName}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Bank Deposit
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-xs font-semibold text-purple-700">₱{parseFloat(deposit.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEdit(deposit)}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(deposit.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {hasMore && !loading && (
            <div ref={observerTarget} className="flex items-center justify-center gap-2 text-gray-500 py-4 border-t border-gray-200 bg-gray-50">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-sm">Loading more...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Expenses
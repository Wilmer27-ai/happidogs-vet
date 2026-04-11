import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiAlertCircle } from 'react-icons/fi'
import { getAllPetActivities, getClients, getPets, getMedicines, getStoreItems, getExpenses, getMasterData, getSales, MASTER_DATA_DEFAULTS } from '../firebase/services'

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(10)
  const observerTarget = useRef(null)
  const [displayCountActivity, setDisplayCountActivity] = useState(10)
  const observerActivityTarget = useRef(null)
  const [selectedFollowUpDate, setSelectedFollowUpDate] = useState(null)
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false)
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [salesYear, setSalesYear] = useState(new Date().getFullYear())
  const [productMonth, setProductMonth] = useState(new Date().getMonth())
  const [stats, setStats] = useState({
    totalClients: 0,
    totalPets: 0,
    todayConsultations: 0,
    todayRevenue: 0,
    todaySales: 0,
    todayExpenses: 0,
    weekRevenue: 0,
    weekSales: 0,
    monthRevenue: 0,
    monthSales: 0,
    monthExpenses: 0,
    monthlySalesTrend: [],
    monthlySalesRange: '',
    monthlyExpensesTrend: [],
    monthlyProductSales: [],
    lowStockItems: 0,
    outOfStockItems: 0,
    upcomingFollowUps: [],
    weeklyTrend: [],
    recentActivity: []
  })

  useEffect(() => {
    loadDashboardData()
  }, [salesYear, productMonth])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [activities, clients, pets, medicines, storeItems, expenses, masterData, sales] = await Promise.all([
        getAllPetActivities(),
        getClients(),
        getPets(),
        getMedicines(),
        getStoreItems(),
        getExpenses(),
        getMasterData(),
        getSales()
      ])

      const lowStockThreshold = masterData?.lowStockThreshold ?? MASTER_DATA_DEFAULTS.lowStockThreshold

      const consultations = activities.filter(a => a.medicines && a.medicines.length > 0)

      // Split sales: consultation sales use 'date' field (YYYY-MM-DD); POS sales use 'saleDate' (ISO)
      const consultationSales = sales.filter(s => s.type === 'consultation')
      const storeSales = sales.filter(s => s.type !== 'consultation')

      // Date calculations
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const monthStartCurrent = new Date(today.getFullYear(), today.getMonth(), 1)
      const productMonthStart = new Date(today.getFullYear(), productMonth, 1)
      const productMonthEnd = new Date(today.getFullYear(), productMonth + 1, 1)

      // Today's data
      const todayConsultations = consultations.filter(c => {
        const consultDate = new Date(c.date)
        consultDate.setHours(0, 0, 0, 0)
        return consultDate.getTime() === today.getTime()
      })
      const todayRevenue = consultationSales
        .filter(s => { const d = new Date(s.date + 'T00:00:00'); d.setHours(0,0,0,0); return d.getTime() === today.getTime() })
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0)

      // Today's expenses
      const todayExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.expenseDate)
        expenseDate.setHours(0, 0, 0, 0)
        return expenseDate.getTime() === today.getTime()
      })
      const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
      const monthExpensesTotal = expenses
        .filter(e => new Date(e.expenseDate) >= monthAgo)
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

      // Week revenue
      const weekRevenue = consultationSales
        .filter(s => new Date(s.date + 'T00:00:00') >= weekAgo)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0)

      // Month revenue
      const monthRevenue = consultationSales
        .filter(s => new Date(s.date + 'T00:00:00') >= monthAgo)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0)

      // Store sales (petstore only)
      const todaySalesTotal = storeSales
        .filter(s => { const d = new Date(s.saleDate); d.setHours(0,0,0,0); return d.getTime() === today.getTime() })
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0)
      const weekSalesTotal = storeSales
        .filter(s => new Date(s.saleDate) >= weekAgo)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0)
      const monthSalesTotal = storeSales
        .filter(s => new Date(s.saleDate) >= monthAgo)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0)

      // Monthly sales trend (selected year, Jan-Dec, total sales)
      const startMonth = new Date(salesYear, 0, 1)
      const endMonth = new Date(salesYear + 1, 0, 1)
      const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(salesYear, i, 1)
        return {
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          label: d.toLocaleDateString('en-US', { month: 'short' }),
          year: d.getFullYear()
        }
      })

      const monthlyTotalsMap = {}
      ;[...consultationSales, ...storeSales].forEach(s => {
        const d = s.type === 'consultation'
          ? new Date((s.date || '') + 'T00:00:00')
          : new Date(s.saleDate || s.createdAt || Date.now())
        if (d < startMonth || d >= endMonth) return
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthlyTotalsMap[key] = (monthlyTotalsMap[key] || 0) + (s.totalAmount || 0)
      })

      const monthlySalesTrend = months.map(m => ({
        label: m.label,
        year: m.year,
        value: monthlyTotalsMap[m.key] || 0
      }))

      const monthlyExpensesMap = {}
      expenses.forEach(e => {
        const d = new Date(e.expenseDate || e.createdAt || Date.now())
        if (d < startMonth || d >= endMonth) return
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthlyExpensesMap[key] = (monthlyExpensesMap[key] || 0) + (parseFloat(e.amount) || 0)
      })

      const monthlyExpensesTrend = months.map(m => ({
        label: m.label,
        year: m.year,
        value: monthlyExpensesMap[m.key] || 0
      }))

      const monthlySalesRange = `${months[0].label} - ${months[months.length - 1].label} ${salesYear}`

      // Monthly product list (selected month, store sales only)
      const monthlyProductSales = (() => {
        const productMap = {}
        storeSales
          .filter(s => {
            const d = new Date(s.saleDate || s.createdAt || Date.now())
            return d >= productMonthStart && d < productMonthEnd
          })
          .forEach(s => {
            const key = s.itemName || 'Unknown Item'
            if (!productMap[key]) productMap[key] = { name: key, quantity: 0, total: 0 }
            productMap[key].quantity += (s.quantity || 0)
            productMap[key].total += (s.totalAmount || 0)
          })

        return Object.values(productMap)
          .sort((a, b) => b.total - a.total)
      })()

      // Stock items
      const allItems = [...medicines, ...storeItems]
      const lowStockItems = allItems.filter(item => item.stockQuantity <= lowStockThreshold && item.stockQuantity > 0).length
      const outOfStockItems = allItems.filter(item => item.stockQuantity === 0).length

      // Weekly trend (last 7 days)
      const weeklyTrend = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const dayConsultations = consultations.filter(c => {
          const consultDate = new Date(c.date)
          consultDate.setHours(0, 0, 0, 0)
          return consultDate.getTime() === date.getTime()
        })
        
        weeklyTrend.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          count: dayConsultations.length
        })
      }

      // Upcoming follow-ups (all future, disappears after due date passes)
      const upcomingFollowUps = activities
        .filter(c => {
          if (!c.followUpDate) return false
          const followUpDate = new Date(c.followUpDate + 'T00:00:00')
          return followUpDate >= today
        })
        .map(c => {
          const client = clients.find(cl => cl.id === c.clientId)
          return {
            id: c.id,
            petName: c.petName,
            clientName: c.clientName || (client ? `${client.firstName} ${client.lastName}` : 'Unknown'),
            phoneNumber: client?.phoneNumber || 'N/A',
            followUpDate: c.followUpDate,
            activityType: c.activityType || 'Consultation',
            diagnosis: c.diagnosis || '',
            followUpNote: c.followUpNote || ''
          }
        })
        .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))

      // Recent activity: last 10 events across sales and expenses, newest first
      const recentActivity = [
        ...sales.map(s => ({
          date: s.type === 'consultation'
            ? new Date((s.date || '') + 'T00:00:00')
            : new Date(s.saleDate || s.createdAt || Date.now()),
          type: s.type === 'consultation' ? 'Consultation' : 'POS Sale',
          label: s.type === 'consultation'
            ? `${s.clientName || 'Client'}${s.petNames?.length ? ' — ' + s.petNames.join(', ') : ''}`
            : `${s.itemName || 'Sale'} × ${s.quantity || 1}`,
          amount: s.totalAmount || 0,
          positive: true
        })),
        ...expenses.map(e => ({
          date: new Date(e.expenseDate || e.createdAt || Date.now()),
          type: 'Expense',
          label: `${e.expenseName || e.category || 'Expense'}`,
          amount: parseFloat(e.amount) || 0,
          positive: false
        }))
      ].sort((a, b) => b.date - a.date)

      setStats({
        totalClients: clients.length,
        totalPets: pets.length,
        todayConsultations: todayConsultations.length,
        todayRevenue,
        todaySales: todaySalesTotal,
        todayExpenses: todayExpensesTotal,
        weekRevenue,
        weekSales: weekSalesTotal,
        monthRevenue,
        monthSales: monthSalesTotal,
        monthExpenses: monthExpensesTotal,
        monthlySalesTrend,
        monthlySalesRange,
        monthlyExpensesTrend,
        monthlyProductSales,
        lowStockItems,
        outOfStockItems,
        upcomingFollowUps,
        weeklyTrend,
        recentActivity
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Lazy loading for follow-ups
  const displayedFollowUps = stats.upcomingFollowUps.slice(0, displayCount)
  const hasMore = displayCount < stats.upcomingFollowUps.length
  const displayedActivity = stats.recentActivity.slice(0, displayCountActivity)
  const hasMoreActivity = displayCountActivity < stats.recentActivity.length

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          setDisplayCount(prev => prev + 10)
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
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreActivity) {
          setDisplayCountActivity(prev => prev + 10)
        }
      },
      { threshold: 0.1 }
    )
    if (observerActivityTarget.current) {
      observer.observe(observerActivityTarget.current)
    }
    return () => observer.disconnect()
  }, [hasMoreActivity])

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(dateString + 'T00:00:00')
    compareDate.setHours(0, 0, 0, 0)
    
    if (compareDate.getTime() === today.getTime()) return 'Today'
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (compareDate.getTime() === tomorrow.getTime()) return 'Tomorrow'
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const today = new Date()
  const monthStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1)
  const monthEnd = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0)
  const monthDays = monthEnd.getDate()
  const startDay = monthStart.getDay()

  const monthOptions = Array.from({ length: 12 }, (_, i) => (
    new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' })
  ))
  const yearOptions = Array.from({ length: 6 }, (_, i) => today.getFullYear() - 2 + i)

  const handleMonthChange = (value) => {
    const next = new Date(calendarDate)
    next.setMonth(parseInt(value, 10))
    setCalendarDate(next)
  }

  const handleYearChange = (value) => {
    const next = new Date(calendarDate)
    next.setFullYear(parseInt(value, 10))
    setCalendarDate(next)
  }

  const followUpsByDate = stats.upcomingFollowUps.reduce((acc, followUp) => {
    const dateKey = followUp.followUpDate
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(followUp)
    return acc
  }, {})

  const openFollowUpsForDate = (dateKey) => {
    if (!followUpsByDate[dateKey]) return
    setSelectedFollowUpDate(dateKey)
    setIsFollowUpModalOpen(true)
  }

  const closeFollowUpModal = () => {
    setIsFollowUpModalOpen(false)
    setSelectedFollowUpDate(null)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  const maxConsultations = Math.max(...stats.weeklyTrend.map(d => d.count), 1)
  const todayProfit = (stats.todayRevenue + stats.todaySales) - stats.todayExpenses
  const maxMonthlySales = Math.max(...stats.monthlySalesTrend.map(item => item.value), 1)
  const maxProductTotal = Math.max(...stats.monthlyProductSales.map(item => item.total), 1)
  const chartMax = 100000
  const monthlyAxisTicks = [100000, 50000, 20000, 0]
  const currentYear = new Date().getFullYear()
  const salesYearColor = salesYear === currentYear
    ? 'bg-blue-600'
    : salesYear === currentYear - 1
      ? 'bg-amber-500'
      : 'bg-gray-500'

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs text-gray-500">Overview of your veterinary clinic</p>
      </div>

      {/* Content — no outer scroll, panels scroll internally */}
      <div className="flex-1 overflow-hidden p-4 flex flex-col gap-3 min-h-0">

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 flex-shrink-0">
          <div className="bg-white rounded-lg px-4 py-2.5 border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('/clients-pets')}>
            <p className="text-xs text-gray-500">Total Clients</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
          </div> 
            <div className="bg-white rounded-lg px-4 py-2.5 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500">Daily Sales</p>
            <p className="text-2xl font-bold text-gray-900">₱{(stats.todayRevenue + stats.todaySales).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg px-4 py-2.5 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500">Monthly Sales</p>
            <p className="text-2xl font-bold text-gray-900">₱{(stats.monthRevenue + stats.monthSales).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg px-4 py-2.5 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500">Daily Expenses</p>
            <p className="text-2xl font-bold text-gray-900">₱{stats.todayExpenses.toLocaleString()}</p>
          </div>
        
          <div className="bg-white rounded-lg px-4 py-2.5 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500">Monthly Expenses</p>
            <p className="text-2xl font-bold text-gray-900">₱{stats.monthExpenses.toLocaleString()}</p>
          </div>
        </div>

        {/* Main 3-col grid — fills remaining height */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-3 min-h-0">

          {/* Col 1: Weekly Chart + Revenue/Expense Summary */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-sm font-semibold text-gray-900">Weekly Consultations</h3>
              <p className="text-xs text-gray-500">Last 7 days</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="flex items-end justify-between gap-2 h-24">
                {stats.weeklyTrend.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col justify-end items-center h-16">
                      <div
                        className="w-full bg-gray-900 rounded-t transition-all"
                        style={{ height: `${(day.count / maxConsultations) * 100}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                      ></div>
                      <span className="text-xs font-medium text-gray-700 mt-1">{day.count}</span>
                    </div>
                    <span className="text-xs text-gray-400">{day.day}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Revenue</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Today', total: stats.todayRevenue + stats.todaySales, consult: stats.todayRevenue, store: stats.todaySales },
                      { label: 'This Week', total: stats.weekRevenue + stats.weekSales, consult: stats.weekRevenue, store: stats.weekSales },
                      { label: 'This Month', total: stats.monthRevenue + stats.monthSales, consult: stats.monthRevenue, store: stats.monthSales },
                    ].map(({ label, total, consult, store }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">{label}</p>
                          <p className="text-sm font-bold text-gray-900">₱{total.toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-gray-400">C ₱{consult.toLocaleString()} · S ₱{store.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Today's Summary</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">Expenses</p>
                      <p className="text-sm font-bold text-gray-900">₱{stats.todayExpenses.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">Profit</p>
                      <p className="text-sm font-bold text-gray-900">₱{todayProfit.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">Out of Stock</p>
                      <p className="text-sm font-bold text-gray-900">{stats.outOfStockItems}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Upcoming Follow-Ups */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Follow-Up Calendar</h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{stats.upcomingFollowUps.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {stats.upcomingFollowUps.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FiAlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No upcoming follow-ups</p>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={calendarDate.getMonth()}
                        onChange={(e) => handleMonthChange(e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"
                      >
                        {monthOptions.map((label, idx) => (
                          <option key={label} value={idx}>{label}</option>
                        ))}
                      </select>
                      <select
                        value={calendarDate.getFullYear()}
                        onChange={(e) => handleYearChange(e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-xs text-gray-500">Tap a day to view details</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center font-semibold">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: startDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-14"></div>
                    ))}
                    {Array.from({ length: monthDays }).map((_, i) => {
                      const day = i + 1
                      const dateKey = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      const items = followUpsByDate[dateKey] || []
                      const isToday = day === today.getDate() && calendarDate.getMonth() === today.getMonth() && calendarDate.getFullYear() === today.getFullYear()
                      return (
                        <button
                          key={dateKey}
                          type="button"
                          onClick={() => openFollowUpsForDate(dateKey)}
                          disabled={items.length === 0}
                          className={`h-14 rounded-md border text-left p-2 transition-colors ${
                            items.length > 0
                              ? 'border-blue-200 hover:bg-blue-50'
                              : 'border-gray-200 text-gray-300 cursor-default'
                          } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold ${items.length > 0 ? 'text-gray-900' : 'text-gray-300'}`}>{day}</span>
                            {items.length > 0 && (
                              <span className="text-[10px] font-semibold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                                {items.length}
                              </span>
                            )}
                          </div>
                          {items.length > 0 && (
                            <div className="mt-1">
                              <div className="h-1.5 w-full rounded-full bg-blue-200">
                                <div className="h-1.5 rounded-full bg-blue-600" style={{ width: '100%' }}></div>
                              </div>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          

        </div>

        {/* Bottom stats row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Monthly Sales</h3>
                <p className="text-xs text-gray-500">Jan-Dec totals</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={salesYear}
                  onChange={(e) => setSalesYear(parseInt(e.target.value, 10))}
                  className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"
                >
                  {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <p className="text-sm font-bold text-gray-900">
                  ₱{(stats.monthRevenue + stats.monthSales).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-500">
              <div className="flex items-center gap-1">
                <span className={`inline-block w-2.5 h-2.5 rounded ${salesYearColor}`}></span>
                {salesYear}
              </div>
            </div>
            <div className="mt-3">
              <div className="h-36 relative pl-10">
                <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-[10px] text-gray-500">
                  {monthlyAxisTicks.map((value, idx) => (
                    <div key={`axis-${idx}`} className="text-right pr-2 leading-none">
                      ₱{value.toLocaleString()}
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 ml-10 grid grid-rows-4 gap-3">
                  {[0, 1, 2, 3].map((row) => (
                    <div key={`grid-${row}`} className="border-t border-gray-100"></div>
                  ))}
                </div>
                <div className="absolute inset-0 ml-10 grid grid-cols-12 items-end">
                  {stats.monthlySalesTrend.map((item, index) => (
                    <div key={`month-${index}`} className="flex items-end justify-center">
                      <div
                        className={`w-4 sm:w-5 rounded-t ${salesYearColor}`}
                        style={{ height: `${(item.value / chartMax) * 100}%`, minHeight: item.value > 0 ? '6px' : '0' }}
                        title={`Sales: ₱${item.value.toLocaleString()}\nExpenses: ₱${(stats.monthlyExpensesTrend[index]?.value || 0).toLocaleString()}`}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 ml-10 grid grid-cols-12 text-[10px] text-gray-500">
                {stats.monthlySalesTrend.map((item, index) => (
                  <div key={`label-${index}`} className="text-center">
                    <div className="text-gray-400">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-center text-xs text-gray-500">
                {stats.monthlySalesRange}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900">Products Sold</h3>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-gray-500">Selected month</p>
              <select
                value={productMonth}
                onChange={(e) => setProductMonth(parseInt(e.target.value, 10))}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"
              >
                {monthOptions.map((label, idx) => (
                  <option key={label} value={idx}>{label}</option>
                ))}
              </select>
            </div>
            {stats.monthlyProductSales.length > 0 ? (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wide">
                  <span>Product</span>
                  <span>Total</span>
                </div>
                <div className="mt-2 overflow-x-auto">
                  <div className="flex items-end gap-4 min-w-max h-44 pr-2">
                    {stats.monthlyProductSales.map((item) => (
                      <div key={item.name} className="flex flex-col items-center justify-end w-14">
                        <div className="text-[10px] font-semibold text-gray-900 mb-1">
                          ₱{item.total.toLocaleString()}
                        </div>
                        <div className="h-28 w-full flex items-end justify-center">
                          <div
                            className="w-8 rounded-t bg-blue-600"
                            style={{ height: `${Math.max((item.total / maxProductTotal) * 100, 6)}%` }}
                            title={`Total: ₱${item.total.toLocaleString()}\nQty: ${item.quantity}`}
                          ></div>
                        </div>
                        <div className="mt-1 text-[10px] text-gray-500 text-center truncate w-full">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-gray-400">Qty {item.quantity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-3">No sales for this month.</p>
            )}
          </div>
        </div>
      </div>
      </div>
      {isFollowUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Follow-Ups</h3>
                <p className="text-xs text-gray-500">{formatDate(selectedFollowUpDate)}</p>
              </div>
              <button type="button" onClick={closeFollowUpModal} className="text-gray-400 hover:text-gray-600">
                <FiAlertCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {(followUpsByDate[selectedFollowUpDate] || []).map((followUp) => (
                <div key={followUp.id} className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{followUp.petName}</p>
                    <span className="text-xs text-gray-500">{followUp.activityType}</span>
                  </div>
                  <p className="text-xs text-gray-500">Owner: {followUp.clientName}</p>
                  <p className="text-xs text-gray-500">Contact: {followUp.phoneNumber}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {followUp.followUpNote || followUp.diagnosis || 'No notes'}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
              <button type="button" onClick={closeFollowUpModal} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Dashboard
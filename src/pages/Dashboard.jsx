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
    lowStockItems: 0,
    outOfStockItems: 0,
    upcomingFollowUps: [],
    weeklyTrend: [],
    recentActivity: []
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

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

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs text-gray-500">Overview of your veterinary clinic</p>
      </div>

      {/* Content — no outer scroll, panels scroll internally */}
      <div className="flex-1 overflow-hidden p-4 flex flex-col gap-3 min-h-0">

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-3 flex-shrink-0">
          <div className="bg-white rounded-lg px-4 py-2.5 border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('/clients-pets')}>
            <p className="text-xs text-gray-500">Clients</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
          </div>
          <div className="bg-white rounded-lg px-4 py-2.5 border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('/pet-records')}>
            <p className="text-xs text-gray-500">Pets</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalPets}</p>
          </div>
          <div className="bg-white rounded-lg px-4 py-2.5 border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('/consultation-history')}>
            <p className="text-xs text-gray-500">Today's Consults</p>
            <p className="text-2xl font-bold text-gray-900">{stats.todayConsultations}</p>
          </div>
          <div className="bg-white rounded-lg px-4 py-2.5 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500">Today's Revenue</p>
            <p className="text-2xl font-bold text-gray-900">₱{(stats.todayRevenue + stats.todaySales).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg px-4 py-2.5 border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('/medicines-stocks')}>
            <p className="text-xs text-gray-500">Low Stock</p>
            <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
          </div>
        </div>

        {/* Main 3-col grid — fills remaining height */}
        <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">

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
              <h3 className="text-sm font-semibold text-gray-900">Upcoming Follow-Ups</h3>
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
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-semibold text-gray-600">Date</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-gray-600">Pet</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-gray-600">Owner</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-gray-600">Contact</th>
                      <th className="px-3 py-1.5 text-left font-semibold text-gray-600">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedFollowUps.map((followUp) => (
                      <tr key={followUp.id} className="hover:bg-gray-50">
                        <td className="px-3 py-1.5 whitespace-nowrap font-semibold text-gray-900">
                          {formatDate(followUp.followUpDate)}
                        </td>
                        <td className="px-3 py-1.5 font-semibold text-gray-900 max-w-[60px] truncate">{followUp.petName}</td>
                        <td className="px-3 py-1.5 text-gray-700 max-w-[70px] truncate">{followUp.clientName}</td>
                        <td className="px-3 py-1.5 text-gray-700 whitespace-nowrap">{followUp.phoneNumber}</td>
                        <td className="px-3 py-1.5 text-gray-500 max-w-[100px] truncate" title={followUp.followUpNote || followUp.diagnosis}>
                          {followUp.followUpNote || followUp.diagnosis || '—'}
                        </td>
                      </tr>
                    ))}
                    {hasMore && (
                      <tr ref={observerTarget}>
                        <td colSpan="5" className="px-3 py-2 text-center">
                          <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Col 3: Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{stats.recentActivity.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {stats.recentActivity.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-400">No recent activity</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {displayedActivity.map((event, i) => (
                    <div key={i} className="px-3 py-2 flex items-start justify-between hover:bg-gray-50">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">{event.type}</p>
                        <p className="text-xs font-medium text-gray-900 truncate">{event.label}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-xs font-semibold text-gray-900">{event.positive ? '+' : '-'}₱{event.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-gray-400">{event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  ))}
                  {hasMoreActivity && (
                    <div ref={observerActivityTarget} className="py-2 text-center">
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Dashboard
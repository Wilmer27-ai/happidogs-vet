import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiAlertCircle } from 'react-icons/fi'
import { getAllPetActivities, getClients, getPets, getMedicines, getStoreItems, getExpenses } from '../firebase/services'

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(10)
  const observerTarget = useRef(null)
  const [stats, setStats] = useState({
    totalClients: 0,
    totalPets: 0,
    todayConsultations: 0,
    todayRevenue: 0,
    todayExpenses: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    upcomingFollowUps: [],
    weeklyTrend: []
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [activities, clients, pets, medicines, storeItems, expenses] = await Promise.all([
        getAllPetActivities(),
        getClients(),
        getPets(),
        getMedicines(),
        getStoreItems(),
        getExpenses()
      ])

      const consultations = activities.filter(a => a.medicines && a.medicines.length > 0)

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
      const todayRevenue = todayConsultations.reduce((sum, c) => sum + (c.totalAmount || 0), 0)

      // Today's expenses
      const todayExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.expenseDate)
        expenseDate.setHours(0, 0, 0, 0)
        return expenseDate.getTime() === today.getTime()
      })
      const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

      // Week revenue
      const weekConsultations = consultations.filter(c => new Date(c.date) >= weekAgo)
      const weekRevenue = weekConsultations.reduce((sum, c) => sum + (c.totalAmount || 0), 0)

      // Month revenue
      const monthConsultations = consultations.filter(c => new Date(c.date) >= monthAgo)
      const monthRevenue = monthConsultations.reduce((sum, c) => sum + (c.totalAmount || 0), 0)

      // Stock items
      const allItems = [...medicines, ...storeItems]
      const lowStockItems = allItems.filter(item => item.stockQuantity <= 10 && item.stockQuantity > 0).length
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

      // Upcoming follow-ups (next 30 days)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      const upcomingFollowUps = consultations
        .filter(c => {
          if (!c.followUpDate) return false
          const followUpDate = new Date(c.followUpDate)
          return followUpDate >= today && followUpDate <= thirtyDaysFromNow
        })
        .map(c => {
          const client = clients.find(cl => cl.id === c.clientId)
          return {
            id: c.id,
            petName: c.petName,
            clientName: c.clientName || (client ? `${client.firstName} ${client.lastName}` : 'Unknown'),
            phoneNumber: client?.phoneNumber || 'N/A',
            followUpDate: c.followUpDate,
            activityType: c.activityType,
            diagnosis: c.diagnosis
          }
        })
        .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))

      setStats({
        totalClients: clients.length,
        totalPets: pets.length,
        todayConsultations: todayConsultations.length,
        todayRevenue,
        todayExpenses: todayExpensesTotal,
        weekRevenue,
        monthRevenue,
        lowStockItems,
        outOfStockItems,
        upcomingFollowUps,
        weeklyTrend
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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(dateString)
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
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  const maxConsultations = Math.max(...stats.weeklyTrend.map(d => d.count), 1)
  const todayProfit = stats.todayRevenue - stats.todayExpenses

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your veterinary clinic</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/clients-pets')}>
              <p className="text-xs text-gray-500 mb-1">Clients</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/pet-records')}>
              <p className="text-xs text-gray-500 mb-1">Pets</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPets}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/consultation-history')}>
              <p className="text-xs text-gray-500 mb-1">Today</p>
              <p className="text-3xl font-bold text-gray-900">{stats.todayConsultations}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Revenue</p>
              <p className="text-3xl font-bold text-gray-900">₱{stats.todayRevenue.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/medicines-stocks')}>
              <p className="text-xs text-gray-500 mb-1">Low Stock</p>
              <p className="text-3xl font-bold text-gray-900">{stats.lowStockItems}</p>
            </div>
          </div>

          {/* Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Consultations Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">Weekly Consultations</h3>
                <span className="text-sm text-gray-500">Last 7 days</span>
              </div>
              <div className="flex items-end justify-between gap-3 h-40">
                {stats.weeklyTrend.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col justify-end items-center h-32">
                      <div 
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                        style={{ height: `${(day.count / maxConsultations) * 100}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                      ></div>
                      <span className="text-xs font-medium text-gray-900 mt-2">{day.count}</span>
                    </div>
                    <span className="text-xs text-gray-500">{day.day}</span>
                  </div>
                ))}
              </div>

              {/* Revenue & Expenses Summary - Redesigned */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-6">
                  {/* Revenue Column */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Revenue</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600">Today</p>
                        <p className="text-lg font-bold text-emerald-600">₱{stats.todayRevenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">This Week</p>
                        <p className="text-lg font-bold text-gray-900">₱{stats.weekRevenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">This Month</p>
                        <p className="text-lg font-bold text-emerald-600">₱{stats.monthRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expenses & Stock Column */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Today's Summary</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600">Expenses</p>
                        <p className="text-lg font-bold text-red-600">₱{stats.todayExpenses.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Profit</p>
                        <p className={`text-lg font-bold ${todayProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₱{todayProfit.toLocaleString()}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600">Low Stock</p>
                          <p className="text-sm font-bold text-orange-600">{stats.lowStockItems}</p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-600">Out of Stock</p>
                          <p className="text-sm font-bold text-red-600">{stats.outOfStockItems}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Follow-Ups Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: '450px' }}>
              <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold text-gray-900">Upcoming Follow-Ups</h3>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                  {stats.upcomingFollowUps.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {stats.upcomingFollowUps.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 font-medium">No upcoming follow-ups</p>
                      <p className="text-xs text-gray-400 mt-1">All clear for the next 30 days</p>
                    </div>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">Date</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">Pet</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">Owner</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {displayedFollowUps.map((followUp) => (
                        <tr key={followUp.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded ${
                              formatDate(followUp.followUpDate) === 'Today' 
                                ? 'bg-gray-200 text-gray-800'
                                : formatDate(followUp.followUpDate) === 'Tomorrow'
                                ? 'bg-gray-200 text-gray-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {formatDate(followUp.followUpDate)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900 truncate">{followUp.petName}</p>
                            <p className="text-xs text-gray-500 truncate">{followUp.activityType}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-700 truncate">{followUp.clientName}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-600 truncate">{followUp.phoneNumber}</p>
                          </td>
                        </tr>
                      ))}
                      {hasMore && (
                        <tr ref={observerTarget}>
                          <td colSpan="4" className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2 text-gray-500">
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                              <span className="text-xs">Loading more...</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
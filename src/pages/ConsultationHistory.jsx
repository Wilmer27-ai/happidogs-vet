import { useState, useEffect, useRef } from 'react'
import { FiSearch, FiEye, FiCalendar } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { getAllPetActivities, getClients, getPets } from '../firebase/services'

function ConsultationHistory() {
  const navigate = useNavigate()
  const [consultations, setConsultations] = useState([])
  const [clients, setClients] = useState([])
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  
  // Lazy loading
  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [activitiesData, clientsData, petsData] = await Promise.all([
        getAllPetActivities(),
        getClients(),
        getPets()
      ])
      
      // Filter only activities that have medicines (are completed consultations)
      const completedConsultations = activitiesData.filter(activity => 
        activity.medicines && activity.medicines.length > 0
      )
      
      setConsultations(completedConsultations)
      setClients(clientsData)
      setPets(petsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
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

  // Filter consultations
  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = 
      consultation.petName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultation.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultation.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const dateRange = getDateRange(dateFilter)
    const matchesDate = !dateRange || new Date(consultation.date) >= dateRange.start
    
    return matchesSearch && matchesDate
  })

  // Sort by date descending
  const sortedConsultations = [...filteredConsultations].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  )

  // Displayed consultations with lazy loading
  const displayedConsultations = sortedConsultations.slice(0, displayCount)
  const hasMore = displayCount < sortedConsultations.length

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
  }, [searchQuery, dateFilter])

  const handleViewConsultation = (consultation) => {
    navigate('/consultation-summary', { state: { consultation } })
  }

  // Statistics
  const totalConsultations = consultations.length
  const totalRevenue = consultations.reduce((sum, c) => sum + (c.totalAmount || 0), 0)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Consultation History</h1>
          
          {/* Statistics */}
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-500">Total Consultations</p>
              <p className="text-lg font-semibold text-gray-900">{totalConsultations}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-lg font-semibold text-green-600">₱{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by pet, owner, or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <button
            onClick={() => navigate('/new-consultation')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm whitespace-nowrap shadow-sm"
          >
            New Consultation
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 px-6 py-4 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 text-sm">Loading consultations...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-md border border-gray-200 shadow-sm h-full overflow-hidden">
            <div className="overflow-auto h-full">
              {displayedConsultations.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm font-medium">No consultations found</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {searchQuery ? 'Try adjusting your search' : 'Start by creating a new consultation'}
                    </p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Pet Name</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Owner</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">Activity Type</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayedConsultations.map((consultation) => (
                      <tr key={consultation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-700">{formatDate(consultation.date)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{consultation.petName}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {consultation.clientName || getClientName(consultation.clientId)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {consultation.activityType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleViewConsultation(consultation)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium shadow-sm transition-colors"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {hasMore && (
                      <tr ref={observerTarget}>
                        <td colSpan="5" className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                            <span className="text-sm">Loading more...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConsultationHistory
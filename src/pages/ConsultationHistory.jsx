import { useState, useEffect, useRef } from 'react'
import { FiSearch, FiCalendar, FiTrash2 } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { getAllPetActivities, getConsultations, getClients, getPets, deleteConsultation } from '../firebase/services'

function ConsultationHistory() {
  const navigate = useNavigate()
  const [consultations, setConsultations] = useState([])
  const [activities, setActivities] = useState([])
  const [clients, setClients] = useState([])
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [displayCount, setDisplayCount] = useState(20)
  const observerTarget = useRef(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [consultationsData, activitiesData, clientsData, petsData] = await Promise.all([
        getConsultations(),
        getAllPetActivities(),
        getClients(),
        getPets()
      ])
      setConsultations(consultationsData)
      setActivities(activitiesData)
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

  const getPetName = (petId) => {
    const pet = pets.find(p => p.id === petId)
    return pet ? pet.name : 'Unknown'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const getDateRange = (filter) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    switch (filter) {
      case 'today': return { start: today }
      case 'week': { const d = new Date(today); d.setDate(d.getDate() - 7); return { start: d } }
      case 'month': { const d = new Date(today); d.setMonth(d.getMonth() - 1); return { start: d } }
      default: return null
    }
  }

  // Build groups from consultations collection + match activities by consultationId
  const groupedConsultations = () => {
    return consultations.map(consultation => {
      const relatedActivities = activities.filter(a => a.consultationId === consultation.consultationId)
      return {
        ...consultation,
        activities: relatedActivities
      }
    })
  }

  const filteredGroups = groupedConsultations().filter(group => {
    const clientName = group.clientName || getClientName(group.clientId)
    const petNames = group.activities.map(a => a.petName || getPetName(a.petId)).join(' ')
    const activityTypes = group.activities.map(a => a.activityType).join(' ')
    const diagnoses = group.activities.map(a => a.diagnosis || '').join(' ')

    const matchesSearch =
      petNames.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activityTypes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      diagnoses.toLowerCase().includes(searchQuery.toLowerCase())

    const dateRange = getDateRange(dateFilter)
    const matchesDate = !dateRange || new Date(group.date) >= dateRange.start

    return matchesSearch && matchesDate
  })

  const sortedGroups = [...filteredGroups].sort((a, b) => new Date(b.date) - new Date(a.date))
  const displayedGroups = sortedGroups.slice(0, displayCount)
  const hasMore = displayCount < sortedGroups.length

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore) setDisplayCount(prev => prev + 20) },
      { threshold: 0.1 }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore])

  useEffect(() => { setDisplayCount(20) }, [searchQuery, dateFilter])

  const handleViewConsultation = (group) => {
    navigate('/consultation-summary', { state: { group } })
  }

  const handleDeleteConsultation = async (group) => {
    if (!window.confirm('Delete this consultation record from history?')) return
    try {
      // Only deletes the consultation record — activities stay intact
      await deleteConsultation(group.id)
      setConsultations(prev => prev.filter(c => c.id !== group.id))
    } catch (e) {
      console.error(e)
      alert('Failed to delete.')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Consultation History</h1>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by pet, owner, or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
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

      {/* Table */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 text-sm">Loading consultations...</p>
            </div>
          </div>
        ) : displayedGroups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">No consultations found</p>
              <p className="text-gray-400 text-xs mt-1">
                {searchQuery ? 'Try adjusting your search' : 'Start by creating a new consultation'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Date</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Owner</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Pets</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Activity Types</th>
                  <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-wide border border-gray-600 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedGroups.map((group, index) => {
                  const clientName = group.clientName || getClientName(group.clientId)
                  const petNames = [...new Set(group.activities.map(a => a.petName || getPetName(a.petId)))]
                  const activityTypes = [...new Set(group.activities.map(a => a.activityType))]

                  return (
                    <tr key={group.consultationId}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-3 py-2.5 border border-gray-200 text-gray-600 whitespace-nowrap">
                        {formatDate(group.date)}
                      </td>
                      <td className="px-3 py-2.5 border border-gray-200 font-medium text-gray-900">
                        {clientName}
                      </td>
                      <td className="px-3 py-2.5 border border-gray-200 text-gray-700">
                        {petNames.join(', ')}
                      </td>
                      <td className="px-3 py-2.5 border border-gray-200 text-gray-700">
                        {activityTypes.join(', ')}
                      </td>
                      <td className="px-3 py-2.5 border border-gray-200 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewConsultation(group)}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteConsultation(group)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-0.5 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {hasMore && (
                  <tr ref={observerTarget}>
                    <td colSpan="5" className="px-4 py-3 text-center text-xs text-gray-400">
                      Loading more...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConsultationHistory
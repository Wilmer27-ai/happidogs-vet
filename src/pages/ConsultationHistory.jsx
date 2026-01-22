// ConsultationHistory.jsx
import { useState, useEffect } from 'react'
import { FiEye, FiSearch, FiX, FiCalendar, FiArrowLeft } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { getConsultations } from '../firebase/services'
import ConsultationDetailsModal from '../components/ConsultationDetailsModal'

function ConsultationHistory() {
  const navigate = useNavigate()
  const [consultations, setConsultations] = useState([])
  const [filteredConsultations, setFilteredConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [customDate, setCustomDate] = useState('')
  const [selectedConsultation, setSelectedConsultation] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadConsultations()
  }, [])

  useEffect(() => {
    filterConsultations()
  }, [consultations, searchQuery, dateFilter, customDate])

  const loadConsultations = async () => {
    try {
      const data = await getConsultations()
      setConsultations(data)
      setFilteredConsultations(data)
    } catch (error) {
      console.error('Error loading consultations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterConsultations = () => {
    let filtered = consultations

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(consultation =>
        consultation.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        consultation.petName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        consultation.reason?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Date filter
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    if (dateFilter === 'today') {
      filtered = filtered.filter(consultation => {
        const cDate = consultation.dateTime?.split('T')[0] || consultation.dateTime?.split(' ')[0]
        return cDate === today
      })
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(consultation => {
        const cDate = new Date(consultation.dateTime)
        return cDate >= weekAgo && cDate <= now
      })
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(consultation => {
        const cDate = new Date(consultation.dateTime)
        return cDate >= monthAgo && cDate <= now
      })
    } else if (dateFilter === 'custom' && customDate) {
      filtered = filtered.filter(consultation => {
        const consultationDate = consultation.dateTime?.split('T')[0] || consultation.dateTime?.split(' ')[0]
        return consultationDate === customDate
      })
    }

    setFilteredConsultations(filtered)
  }

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter)
    if (filter !== 'custom') {
      setCustomDate('')
    }
  }

  const handleCustomDateChange = (e) => {
    setCustomDate(e.target.value)
    if (e.target.value) {
      setDateFilter('custom')
    } else {
      setDateFilter('all')
    }
  }

  const clearCustomDate = () => {
    setCustomDate('')
    setDateFilter('all')
  }

  const handleViewDetails = (consultation) => {
    setSelectedConsultation(consultation)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedConsultation(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatCustomDateDisplay = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString + 'T00:00:00')
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Calculate statistics
  const getTodayConsultations = () => {
    const today = new Date().toISOString().split('T')[0]
    return consultations.filter(c => {
      const cDate = c.dateTime?.split('T')[0] || c.dateTime?.split(' ')[0]
      return cDate === today
    }).length
  }

  const getThisWeekConsultations = () => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return consultations.filter(c => {
      const cDate = new Date(c.dateTime)
      return cDate >= weekAgo && cDate <= now
    }).length
  }

  const getTotalRevenue = () => {
    return consultations.reduce((sum, c) => sum + (c.totalAmount || 0), 0)
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Consultation History</h1>
            <p className="text-sm text-gray-500 mt-1">View all past consultations and records</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/new-consultation')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          New Consultation
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-col gap-3">
          {/* Search Bar */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by client, pet, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Filter Buttons */}
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => handleDateFilterChange('all')}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                dateFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handleDateFilterChange('today')}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                dateFilter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleDateFilterChange('week')}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                dateFilter === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => handleDateFilterChange('month')}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                dateFilter === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
            
            {/* Calendar Date Picker */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative">
                <input
                  type="date"
                  value={customDate}
                  onChange={handleCustomDateChange}
                  className={`pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                    customDate ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700'
                  }`}
                  style={{ colorScheme: customDate ? 'dark' : 'light' }}
                />
                <FiCalendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                  customDate ? 'text-white' : 'text-gray-700'
                }`} />
              </div>
              {customDate && (
                <button
                  onClick={clearCustomDate}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Clear date"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Total Records</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{consultations.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Today</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{getTodayConsultations()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">This Week</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{getThisWeekConsultations()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">₱{getTotalRevenue().toLocaleString()}</p>
        </div>
      </div>

      {/* Consultations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Loading consultations...</p>
          </div>
        ) : filteredConsultations.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">
              {searchQuery || dateFilter !== 'all' ? 'No consultations match your filters' : 'No consultations found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs text-gray-500 font-medium uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 font-medium uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 font-medium uppercase">Pet</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 font-medium uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 font-medium uppercase">Diagnosis</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500 font-medium uppercase">Total</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredConsultations.map((consultation) => (
                  <tr key={consultation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiCalendar className="w-4 h-4" />
                        {formatDate(consultation.dateTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{consultation.clientName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{consultation.petName}</span>
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          {consultation.petSpecies || 'Pet'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{consultation.reason || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{consultation.diagnosis || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">₱{consultation.totalAmount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(consultation)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Consultation Details Modal */}
      <ConsultationDetailsModal
        consultation={selectedConsultation}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}

export default ConsultationHistory
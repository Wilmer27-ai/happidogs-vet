import { useState, useEffect } from 'react'
import { FiSearch } from 'react-icons/fi'
import { getClients } from '../../firebase/services'

function ClientStep({ onSelectClient, onNext }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const data = await getClients()
      setClients(data)
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client => 
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phoneNumber.includes(searchQuery)
  )

  const handleSelectClient = (client) => {
    onSelectClient(client)
    onNext()
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    Loading clients...
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {client.firstName[0]}{client.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {client.firstName} {client.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {client.phoneNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {client.address}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSelectClient(client)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="text-gray-400">
                      <p className="text-sm">No clients found</p>
                      <p className="text-xs mt-1">Try adjusting your search or add a new client</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ClientStep
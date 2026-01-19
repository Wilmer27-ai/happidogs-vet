// NewConsultation.jsx
function NewConsultation() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">New Consultation</h1>
        <p className="text-sm text-gray-500 mt-1">Record a new patient consultation</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 max-w-4xl">
        {['Client', 'Pet', 'Details', 'Medicines', 'Follow-Up', 'Save'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <span className="text-xs mt-2 text-gray-600">{step}</span>
            </div>
            {index < 5 && (
              <div className="w-16 h-0.5 bg-gray-200 mb-6 mx-2"></div>
            )}
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Select or Add Client</h2>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or phone number..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sample client list */}
        <div className="space-y-2">
          {['Maria Santos - 09171234567', 'Juan Dela Cruz - 09181234567', 'Anna Garcia - 09191234567'].map((client) => (
            <div key={client} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                  </svg>
                </div>
                <span>{client}</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>

        <button className="w-full mt-4 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors">
          + Add New Client
        </button>
      </div>
    </div>
  )
}

export default NewConsultation
// MasterData.jsx
function MasterData() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Master Data</h1>
        <p className="text-sm text-gray-500 mt-1">Manage system reference data</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pet Breeds */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pet Breeds</h2>
            <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              + Add Breed
            </button>
          </div>
          <div className="space-y-2">
            {['Golden Retriever', 'Labrador', 'Persian Cat', 'Siamese Cat', 'Beagle'].map((breed) => (
              <div key={breed} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">{breed}</span>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Services</h2>
            <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              + Add Service
            </button>
          </div>
          <div className="space-y-2">
            {['Consultation', 'Vaccination', 'Grooming', 'Surgery', 'Deworming'].map((service) => (
              <div key={service} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">{service}</span>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnosis Types */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Diagnosis Types</h2>
            <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              + Add Diagnosis
            </button>
          </div>
          <div className="space-y-2">
            {['Skin Disease', 'Respiratory', 'Digestive', 'Parasitic', 'Injury'].map((diagnosis) => (
              <div key={diagnosis} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">{diagnosis}</span>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medicine Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Medicine Categories</h2>
            <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              + Add Category
            </button>
          </div>
          <div className="space-y-2">
            {['Antibiotic', 'Anti-inflammatory', 'Vitamin', 'Vaccine', 'Dewormer'].map((category) => (
              <div key={category} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">{category}</span>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterData
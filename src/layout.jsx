import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  FiPlus, 
  FiFileText, 
  FiUsers, 
  FiPackage, 
  FiDatabase, 
  FiBarChart2, 
  FiSettings, 
  FiLogOut,
  FiMenu,
  FiX
} from 'react-icons/fi'
import { useState } from 'react'
import logo from './assets/happidogslogo.png'

function Layout() {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'New Consultation', path: '/new-consultation', icon: FiPlus },
    { name: 'Consultation History', path: '/consultation-history', icon: FiFileText },
    { name: 'Clients & Pets', path: '/clients-pets', icon: FiUsers },
    { name: 'Medicines & Stocks', path: '/medicines-stocks', icon: FiPackage },
    { name: 'Suppliers', path: '/suppliers', icon: FiPackage },
    { name: 'Expenses', path: '/expenses', icon: FiPackage },
    { name: 'Master Data', path: '/master-data', icon: FiDatabase },
    { name: 'Reports', path: '/reports', icon: FiBarChart2 },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
      >
        {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-72 bg-gray-900 text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo/Brand */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-800 flex-shrink-0">
          <div className="w-12 h-12 flex-shrink-0">
            <img 
              src={logo} 
              alt="HappiDogs Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight">HappiDogs</h1>
            <p className="text-sm text-gray-400 truncate">Veterinary Services</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-hidden">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                group flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium
                transition-all duration-200
                ${isActive(item.path) 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
                }
              `}
            >
              <item.icon className={`
                w-6 h-6 flex-shrink-0 transition-transform duration-200
                ${isActive(item.path) ? '' : 'group-hover:scale-110'}
              `} />
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-4 border-t border-gray-800 space-y-2 flex-shrink-0">
          <button
            onClick={() => {/* Handle logout */}}
            className="group w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 hover:shadow-md"
          >
            <FiLogOut className="w-6 h-6 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="truncate">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto lg:ml-0">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
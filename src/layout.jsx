import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from './pages/AuthContext'
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
  FiX,
  FiShoppingBag,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiAlertCircle
} from 'react-icons/fi'
import { useState } from 'react'
import logo from './assets/happidogslogo.png'

function Layout() {
  const location = useLocation()
  const { logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Add logout handler
  const handleLogout = async () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to logout:', error)
    } finally {
      setShowLogoutConfirm(false)
    }
  }

  const cancelLogout = () => {
    setShowLogoutConfirm(false)
  }

  const navigation = [
    { name: 'New Consultation', path: '/new-consultation', icon: FiPlus },
    { name: 'POS', path: '/pet-store', icon: FiShoppingBag },
    { name: 'Consultation History', path: '/consultation-history', icon: FiFileText },
    { name: 'Clients & Pets', path: '/clients-pets', icon: FiUsers },
    { name: 'Medicines & Stocks', path: '/medicines-stocks', icon: FiPackage },
    { name: 'Suppliers', path: '/suppliers', icon: FiPackage },
    { name: 'Expenses', path: '/expenses', icon: FiDollarSign },
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
        bg-gray-900 text-white flex flex-col
        transform transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'w-72'}
      `}>
        {/* Logo/Brand - Clickable to toggle collapse */}
        <div className={`p-6 border-b border-gray-800 flex-shrink-0 ${
          isCollapsed ? 'lg:py-4' : ''
        }`}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex items-center w-full group transition-all duration-200 hover:opacity-80 ${
              isCollapsed ? 'flex-col gap-2 justify-center' : 'gap-3'
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className={`flex-shrink-0 transition-all duration-300 ${
              isCollapsed ? 'w-10 h-10' : 'w-12 h-12'
            }`}>
              <img 
                src={logo} 
                alt="HappiDogs Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 flex items-center gap-2 ${
              isCollapsed ? 'hidden' : ''
            }`}>
              <div className="flex-1">
                <h1 className="text-xl font-bold tracking-tight">HappiDogs</h1>
                <p className="text-sm text-gray-400 truncate">Veterinary Services</p>
              </div>
              <FiChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </button>

          {/* Mobile - Non-clickable logo */}
          <div className="lg:hidden flex items-center gap-3">
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
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 px-4 py-6 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                group flex items-center rounded-xl text-base font-medium
                transition-all duration-200 relative
                ${isCollapsed ? 'lg:justify-center lg:px-3' : 'gap-4 px-4'}
                ${isCollapsed ? 'lg:py-3' : 'py-3.5'}
                ${isActive(item.path) 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
                }
              `}
              title={isCollapsed ? item.name : ''}
            >
              <item.icon className={`
                flex-shrink-0 transition-transform duration-200
                ${isCollapsed ? 'lg:w-6 lg:h-6' : 'w-6 h-6'}
                ${isActive(item.path) ? '' : 'group-hover:scale-110'}
              `} />
              <span className={`truncate transition-all duration-300 ${
                isCollapsed ? 'lg:hidden' : ''
              }`}>
                {item.name}
              </span>
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  {item.name}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-800"></div>
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`
              group flex items-center rounded-xl text-sm font-medium 
              text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 hover:shadow-md relative
              ${isCollapsed ? 'lg:justify-center lg:px-2 lg:py-2' : 'gap-3 px-3 py-2.5 w-full'}
            `}
            title={isCollapsed ? 'Logout' : ''}
          >
            <FiLogOut className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
              isCollapsed ? 'lg:w-5 lg:h-5' : 'w-5 h-5'
            }`} />
            <span className={`truncate transition-all duration-300 ${
              isCollapsed ? 'lg:hidden' : ''
            }`}>
              Logout
            </span>
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                Logout
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-800"></div>
              </div>
            )}
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
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <FiAlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to log out? You will need to sign in again to access the system.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelLogout}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout
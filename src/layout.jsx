import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  FiPlus, 
  FiFileText, 
  FiUsers, 
  FiPackage, 
  FiDatabase, 
  FiBarChart2, 
  FiSettings, 
  FiLogOut 
} from 'react-icons/fi' // Changed from 'react-icons/feather'
import { useState } from 'react'

function Layout() { // Also changed from App to Layout
  const location = useLocation()

  const navigation = [
    { name: 'New Consultation', path: '/new-consultation', icon: FiPlus },
    { name: 'Consultation History', path: '/consultation-history', icon: FiFileText },
    { name: 'Clients & Pets', path: '/clients-pets', icon: FiUsers },
    { name: 'Medicines & Stocks', path: '/medicines-stocks', icon: FiPackage },
    { name: 'Master Data', path: '/master-data', icon: FiDatabase },
    { name: 'Reports', path: '/reports', icon: FiBarChart2 },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM2 10a8 8 0 1116 0 8 8 0 01-16 0z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Happidogs</h1>
            <p className="text-xs text-gray-400">Veterinary System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive(item.path) 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-3 border-t border-gray-800 space-y-1">
          <Link
            to="/settings"
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-colors duration-150
              ${isActive('/settings') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
            `}
          >
            <FiSettings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
          <button
            onClick={() => {/* Handle logout */}}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-150"
          >
            <FiLogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

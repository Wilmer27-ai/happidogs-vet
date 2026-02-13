import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Layout from './layout.jsx'
import { AuthProvider } from './pages/AuthContext'
import ProtectedRoute from './pages/ProtectedRoute'

// Import pages
import Login from './pages/Login'
import NewConsultation from './pages/NewConsultation'
import ConsultationHistory from './pages/ConsultationHistory'
import ClientsPets from './pages/ClientsPets'
import MedicinesStocks from './pages/MedicinesStocks'
import PetStore from './pages/Petstore'
import SalesHistory from './pages/SalesHistory'
import Expenses from './pages/Expenses' 
import Suppliers from './pages/Suppliers.jsx'
import CreatePurchaseOrder from './pages/CreatePurchaseOrder.jsx'
import MasterData from './pages/MasterData'
import Reports from './pages/Reports'
import PetActivityHistory from './pages/PetActivityHistory'
import PetRecords from './pages/PetRecords'
import ConsultationSummary from './pages/ConsultationSummary'
import Dashboard from './pages/dashboard.jsx'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <Dashboard />
      },
      {
        path: '/dashboard',
        element: <Dashboard />
      },
      {
        path: '/new-consultation',
        element: <NewConsultation />
      },
      {
        path: '/consultation-history',
        element: <ConsultationHistory />
      },
      {
        path: '/pet-records',
        element: <PetRecords />
      },
      {
        path: '/consultation-summary',
        element: <ConsultationSummary />
      },
      {
        path: '/clients-pets',
        element: <ClientsPets />
      },
      {
        path: '/medicines-stocks',
        element: <MedicinesStocks />
      },
      {
        path: '/pet-store',
        element: <PetStore />
      },
      {
        path: '/sales-history',
        element: <SalesHistory />
      },
      {
        path: '/suppliers',
        element: <Suppliers />
      },
      {
        path: '/create-purchase-order',
        element: <CreatePurchaseOrder />
      },
      {
        path: '/expenses',
        element: <Expenses />
      },
      {
        path: '/master-data',
        element: <MasterData />
      },
      {
        path: '/reports',
        element: <Reports />
      },
      {
        path: '/pet-activity',
        element: <PetActivityHistory />
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
)

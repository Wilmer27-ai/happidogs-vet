import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Layout from './layout.jsx'
import { AuthProvider } from './pages/AuthContext'
import ProtectedRoute from './pages/ProtectedRoute'

// Import pages
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ClientsPets from './pages/ClientsPets.jsx'
import ConsultationHistory from './pages/ConsultationHistory.jsx'
import ConsultationSummary from './pages/ConsultationSummary.jsx'
import CreatePurchaseOrder from './pages/CreatePurchaseOrder.jsx'
import Expenses from './pages/Expenses.jsx'
import MasterData from './pages/MasterData.jsx'
import MedicinesStocks from './pages/MedicinesStocks.jsx'
import NewConsultation from './pages/NewConsultation.jsx'
import PetActivityHistory from './pages/PetActivityHistory.jsx'
import PetRecords from './pages/PetRecords.jsx'
import Petstore from './pages/Petstore.jsx'
import Reports from './pages/Reports.jsx'
import SalesHistory from './pages/SalesHistory.jsx'
import Suppliers from './pages/Suppliers.jsx'
import ProtectedRoute from './pages/ProtectedRoute.jsx'

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
        element: <Petstore />
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

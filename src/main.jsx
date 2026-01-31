import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Layout from './layout.jsx'

// Import pages
import NewConsultation from './pages/NewConsultation'
import ConsultationHistory from './pages/ConsultationHistory'
import ClientsPets from './pages/ClientsPets'
import MedicinesStocks from './pages/MedicinesStocks'
import PetStore from './pages/Petstore'
import Expenses from './pages/Expenses' 
import Suppliers from './pages/Suppliers.jsx'
import CreatePurchaseOrder from './pages/CreatePurchaseOrder.jsx'
import MasterData from './pages/MasterData'
import Reports from './pages/Reports'
import PetActivityHistory from './pages/PetActivityHistory'


const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <NewConsultation />
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
    <RouterProvider router={router} />
  </StrictMode>
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Layout from './layout.jsx'

// Import pages (create these later)
import NewConsultation from './pages/NewConsultation'
import ConsultationHistory from './pages/ConsultationHistory'
import ClientsPets from './pages/ClientsPets'
import MedicinesStocks from './pages/MedicinesStocks'
import MasterData from './pages/MasterData'
import Reports from './pages/Reports'


const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
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
        path: '/master-data',
        element: <MasterData />
      },
      {
        path: '/reports',
        element: <Reports />
      },
      {
        index: true,
        element: <NewConsultation /> // Default route
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

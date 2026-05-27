// src/pages/SalesHistory.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiShoppingBag, FiTrash2, FiArrowLeft, FiPrinter } from 'react-icons/fi'
import { getSalesPage, voidSale } from '../firebase/services'
import PasswordVerificationModal from '../components/PasswordVerificationModal'
import { useAuth } from './AuthContext'
import logo from '../assets/myLogo.png'

function SalesHistory() {
  const navigate = useNavigate()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [shopFilter, setShopFilter] = useState('all')
  const [lastDoc, setLastDoc] = useState(null)
  const [pageSize] = useState(50)
  const [fetchingMore, setFetchingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const observerTarget = useRef(null)
  
  // Void/Password modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [saleToVoid, setSaleToVoid] = useState(null)
  const [voidLoading, setVoidLoading] = useState(false)
  const [saleToPrint, setSaleToPrint] = useState(null)

  useEffect(() => { loadSales() }, [])

  const { role, userProfile, currentUser } = useAuth()

  // If a limited user, default the shop filter to their shop so they only see their own sales
  useEffect(() => {
    if (role === 'limited') {
      const shop = userProfile?.shopName || ''
      setShopFilter(shop || 'all')
    }
  }, [role, userProfile])

  useEffect(() => {
    if (!saleToPrint) return

    const timer = window.setTimeout(() => window.print(), 50)
    return () => window.clearTimeout(timer)
  }, [saleToPrint])

  useEffect(() => {
    const handleAfterPrint = () => setSaleToPrint(null)
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

  const loadSales = async () => {
    setLoading(true)
    try {
      setSales([])
      setLastDoc(null)
      setHasMore(true)
      if (role === 'limited') {
        const shopName = (userProfile?.shopName || '').trim()
        const uid = currentUser?.uid || null

        // Fetch recent sales (last 30 days) and user-created sales to handle cases where shopName was missing or inconsistent
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 30)
        const dateFrom = cutoff

        const resRecent = await getSalesPage({ limit: pageSize, startAfterDoc: null, dateFrom })
        const resUser = uid ? await getSalesPage({ limit: pageSize, startAfterDoc: null, createdByUid: uid }) : { docs: [], lastDoc: null }

        // Client-side filter: include sales that match shopName case-insensitively OR createdByUid === uid
        const norm = (s) => (s || '').trim().toLowerCase()
        const map = new Map()
        ;[...resRecent.docs, ...resUser.docs].forEach(d => {
          const sname = norm(d.shopName)
          if (sname === norm(shopName) || (uid && d.createdByUid === uid)) {
            map.set(d.id, d)
          }
        })
        const getTime = (s) => {
          const v = s.createdAt || s.saleDate || s.date || 0
          return v && v.toDate ? v.toDate().getTime() : new Date(v).getTime()
        }
        const merged = Array.from(map.values()).sort((a, b) => getTime(b) - getTime(a))
        setSales(merged)
        setLastDoc(resRecent.lastDoc || resUser.lastDoc)
        setHasMore((resRecent.docs.length === pageSize) || (resUser.docs.length === pageSize))
      } else {
        const res = await getSalesPage({ limit: pageSize, startAfterDoc: null, shopName: null })
        setSales(res.docs)
        setLastDoc(res.lastDoc)
        setHasMore(res.docs.length === pageSize)
      }
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const parts = String(dateString).split('T')[0].split('-')
      if (parts.length === 3) {
        const [year, month, day] = parts
        return new Date(Number(year), Number(month) - 1, Number(day))
          .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return 'N/A' }
  }

  const getDateRange = (filter) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    switch (filter) {
      case 'today': return { start: today }
      case 'week': { const d = new Date(today); d.setDate(d.getDate() - 7); return { start: d } }
      case 'month': { const d = new Date(today); d.setMonth(d.getMonth() - 1); return { start: d } }
      default: return null
    }
  }

  // ── Normalize each sale — handle both consultation sales and petstore sales ──
  const normalizeSale = (sale) => {
    // Consultation sale (saved by SummaryStep via saveSalesRecord)
    if (sale.type === 'consultation') {
      return {
        ...sale,
        displayType: 'Consultation',
        displayName: sale.clientName || 'Unknown Client',
        shopName: sale.shopName || 'Main Clinic',
        displayItems: (sale.items || []).map(i => ({
          name: i.medicineName || i.itemName || '',
          qty: i.quantity || 0,
          unit: i.unit || '',
          amount: i.subtotal ?? ((i.pricePerUnit ?? 0) * (i.quantity || 0))
        })),
        totalAmount: sale.totalAmount ?? 0,
        date: sale.date || sale.saleDate || sale.createdAt || '',
        isVoided: sale.status === 'void',
      }
    }

    const saleItems = Array.isArray(sale.items) ? sale.items : []

    // Petstore sale (saved by handleCheckout in Petstore.jsx via addSale)
    if (saleItems.length > 0) {
      return {
        ...sale,
        displayType: sale.saleKind === 'pos' || sale.type === 'store' ? 'POS Sale' : 'Store Sale',
        displayName:
          saleItems.length === 1
            ? (saleItems[0].itemName || 'Unknown Item')
            : `${saleItems[0]?.itemName || 'Multiple Items'} +${saleItems.length - 1} more`,
        shopName: sale.shopName || 'Main Clinic',
        displayItems: saleItems.map(i => ({
          name: i.itemName || '',
          qty: i.quantity || 0,
          unit: i.unit || i.sellUnit || '',
          amount: i.totalAmount ?? ((i.pricePerUnit ?? i.sellingPrice ?? 0) * (i.quantity || 0))
        })),
        totalAmount: sale.totalAmount ?? saleItems.reduce((sum, item) => sum + (item.totalAmount ?? 0), 0),
        date: sale.saleDate || sale.date || sale.createdAt || '',
        isVoided: sale.status === 'void',
      }
    }

    // Legacy Petstore sale (one document per item)
    return {
      ...sale,
      displayType: sale.itemType === 'medicine' ? 'Medicine Sale' : 'Store Sale',
      displayName: sale.itemName || 'Unknown Item',
      shopName: sale.shopName || 'Main Clinic',
      displayItems: [{
        name: sale.itemName || '',
        qty: sale.quantity || 0,
        unit: sale.unit || '',
        amount: sale.totalAmount ?? 0
      }],
      totalAmount: sale.totalAmount ?? 0,
      date: sale.saleDate || sale.date || sale.createdAt || '',
      isVoided: sale.status === 'void',
    }
  }

  const filteredSales = sales
    .map(normalizeSale)
    .filter(sale => {
      const matchesSearch =
        sale.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.displayType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sale.displayItems || []).some(i => i.name?.toLowerCase().includes(searchQuery.toLowerCase()))

      const dateRange = getDateRange(dateFilter)
      const saleDate = new Date(sale.date)
      const matchesDate = !dateRange || saleDate >= dateRange.start

      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'consultation' && sale.type === 'consultation') ||
        (typeFilter === 'store' && sale.type !== 'consultation')

      // If limited user, restrict to their shop only. Admins see all (or can filter).
      const matchesShop = role === 'limited'
        ? (((sale.shopName || '') === (userProfile?.shopName || '')) || (sale.createdByUid && sale.createdByUid === currentUser?.uid))
        : (shopFilter === 'all' || (sale.shopName || '').toLowerCase() === shopFilter.toLowerCase())

      return matchesSearch && matchesDate && matchesType && matchesShop
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const displayedSales = filteredSales

  // Load next page when sentinel becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !fetchingMore && !loading) {
        // fetch next page
        (async () => {
          try {
            setFetchingMore(true)
            if (role === 'limited') {
                const shopName = (userProfile?.shopName || '').trim()
                const uid = currentUser?.uid || null
                const cutoff = new Date()
                cutoff.setDate(cutoff.getDate() - 30)
                const dateFrom = cutoff
                // Load next recent page
                const resRecent = await getSalesPage({ limit: pageSize, startAfterDoc: lastDoc, dateFrom })
                // Also load user-created sales (first page)
                const resUser = uid ? await getSalesPage({ limit: pageSize, startAfterDoc: null, createdByUid: uid }) : { docs: [], lastDoc: null }
                const norm = (s) => (s || '').trim().toLowerCase()
                const map = new Map()
                ;[...sales, ...resRecent.docs, ...resUser.docs].forEach(d => {
                  const sname = norm(d.shopName)
                  if (sname === norm(shopName) || (uid && d.createdByUid === uid)) {
                    map.set(d.id, d)
                  }
                })
                const getTime = (s) => {
                  const v = s.createdAt || s.saleDate || s.date || 0
                  return v && v.toDate ? v.toDate().getTime() : new Date(v).getTime()
                }
                const merged = Array.from(map.values()).sort((a, b) => getTime(b) - getTime(a))
                setSales(merged)
                setLastDoc(resRecent.lastDoc || resUser.lastDoc)
                setHasMore((resRecent.docs.length === pageSize) || (resUser.docs.length === pageSize))
            } else {
              const res = await getSalesPage({ limit: pageSize, startAfterDoc: lastDoc, shopName: null })
              setSales(prev => [...prev, ...res.docs])
              setLastDoc(res.lastDoc)
              setHasMore(res.docs.length === pageSize)
            }
          } catch (err) {
            console.error('Error loading next sales page:', err)
            setHasMore(false)
          } finally {
            setFetchingMore(false)
          }
        })()
      }
    }, { threshold: 0.1 })

    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [lastDoc, hasMore, fetchingMore, loading, role, userProfile, pageSize, sales, currentUser])

  const totalRevenue = filteredSales.filter(s => !s.isVoided).reduce((sum, s) => sum + (s.totalAmount ?? 0), 0)

  const handleVoidClick = (sale) => {
    setSaleToVoid(sale)
    setIsPasswordModalOpen(true)
  }

  const handlePrintClick = (sale) => {
    setSaleToPrint(sale)
  }

  const handlePasswordConfirm = async (password) => {
    // Simple password check - you can configure this password
    // For security, consider using environment variables or a more robust verification
    const VOID_PASSWORD = 'admin123' // You can change this to your preferred password
    
    if (password !== VOID_PASSWORD) {
      throw new Error('Incorrect password. Please try again.')
    }

    setVoidLoading(true)
    try {
      await voidSale(saleToVoid, 'Manual void by user')
      alert('✅ Sale voided successfully. Stock has been restored.')
      
      // Reload sales (refresh pages)
      await loadSales()
      
      // Close modal
      setIsPasswordModalOpen(false)
      setSaleToVoid(null)
    } catch (error) {
      console.error('Error voiding sale:', error)
      throw new Error('Failed to void sale. Please try again.')
    } finally {
      setVoidLoading(false)
    }
  }

  const handlePasswordClose = () => {
    setIsPasswordModalOpen(false)
    setSaleToVoid(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .sale-print-area, .sale-print-area * { visibility: visible !important; }
          .sale-print-area {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            max-width: 100% !important;
            padding: 8mm 12mm !important;
            color: #000 !important;
            background: #fff !important;
            font-size: 11px !important;
            box-shadow: none !important;
          }
          .sale-print-area .text-center { text-align: center !important; }
          .sale-print-area .text-center img { width: 40px !important; height: 40px !important; object-fit: contain !important; }
          .sale-print-area .border-b-2 { border-bottom-width: 2px !important; }
          .sale-print-area .border-dashed { border-style: dashed !important; }
          .sale-print-area .border-dotted { border-style: dotted !important; }
          .sale-print-area table { width: 100% !important; border-collapse: collapse !important; }
          .sale-print-area th, .sale-print-area td { padding: 2px 0 !important; border: none !important; }
          .sale-print-area .mb-2 { margin-bottom: 6px !important; }
          .sale-print-area .font-semibold { font-weight: 700 !important; }
          .sale-print-area .text-[10px] { font-size: 10px !important; }
          /* Pin footer visual spacing near bottom of printed area */
          .sale-print-area .border-t-2 { margin-top: 2mm !important; }
          .sale-print-area .receipt-footer-line {
            border-top: 1px solid #000 !important;
            margin-top: 2mm !important;
            padding-top: 2mm !important;
          }
          .sale-print-area .receipt-cut-line {
            border-top: 1px dashed rgba(0, 0, 0, 0.35) !important;
            margin-top: 4mm !important;
            padding-top: 2mm !important;
          }
          @page { size: A4; margin: 0mm; }
        }
      `}</style>

      <div className="sale-print-area hidden">
        {saleToPrint && (
          <div>
            <div className="text-center border-b-2 border-gray-900 pb-2 mb-2">
              <div className="flex items-center justify-center gap-2 mb-1">
                <img src={logo} alt="HappiDogs" className="w-10 h-10 object-contain" />
                <div className="text-left leading-tight">
                  <p className="font-black text-[12px] uppercase tracking-wide">HappiDogs</p>
                  <p className="text-[10px] text-gray-600">Veterinary Services</p>
                </div>
              </div>
              <p className="text-[10px] font-medium text-gray-700">{saleToPrint.displayType}</p>
              <p className="text-[10px] text-gray-500">{formatDate(saleToPrint.date)}</p>
              <p className="text-[10px] text-gray-500">{new Date(saleToPrint.date).toLocaleTimeString()}</p>
            </div>

            <div className="mb-2 text-[10px] text-gray-700 space-y-0.5">
              <div className="flex justify-between gap-2">
                <span className="font-medium">Store</span>
                <span className="text-right">{saleToPrint.shopName || 'Main Clinic'}</span>
              </div>
    
              {saleToPrint.type === 'consultation' && (
                <div className="flex justify-between gap-2">
                  <span className="font-medium">Client</span>
                  <span className="text-right">{saleToPrint.displayName}</span>
                </div>
              )}
            </div>

            <div className="mb-2 border-t border-dashed border-gray-400 pt-2">
              {(saleToPrint.displayItems || []).map((item, index) => (
                <div key={`${item.name}-${index}`} className="mb-2 pb-2 border-b border-dotted border-gray-300 last:border-b-0 last:pb-0 last:mb-0">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-[11px] leading-tight">{item.name}</span>
                    <span className="font-semibold text-[11px]">₱{Number(item.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-gray-700 flex justify-between gap-2 mt-0.5">
                    <span>{item.qty} {item.unit}</span>
                    <span>₱{Number(item.amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-gray-900 pt-2 receipt-footer-line">
              <div className="flex justify-between font-bold text-[12px]">
                <span>Total</span>
                <span>₱{Number(saleToPrint.totalAmount || 0).toLocaleString()}</span>
              </div>
              <p className="text-center text-[10px] text-gray-500 mt-2">Thank you for your purchase</p>
              <div className="receipt-cut-line" />
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredSales.length} record{filteredSales.length !== 1 ? 's' : ''} ·
              <span className="ml-1 font-medium text-green-600">₱{totalRevenue.toLocaleString()} total</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/pet-store')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium text-xs md:text-sm transition-colors"
            title="Back to Petstore"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

          <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search by client, item, or type..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
            <option value="all">All Types</option>
            <option value="consultation">Consultations</option>
            <option value="store">Store Sales</option>
          </select>
          {role === 'limited' ? (
            <div className="w-full md:w-auto px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-700">
              {userProfile?.shopName || 'Your Shop'}
            </div>
          ) : (
            <select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
              <option value="all">All Shops</option>
              {[...new Set(sales.map(s => s.shopName).filter(Boolean))].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 text-sm">Loading sales...</p>
            </div>
          </div>
        ) : displayedSales.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FiShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">No sales found</p>
              <p className="text-gray-400 text-xs mt-1">
                {searchQuery ? 'Try adjusting your search' : 'No sales recorded yet'}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[calc(120vh-300px)] overflow-y-auto flex flex-col">
            <div className="w-full overflow-x-auto flex-1">
              <table className="w-full min-w-[760px] text-xs border-collapse">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Date</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Type</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Source</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Client / Item</th>
                  <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide border border-gray-600">Items Sold</th>
                  <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wide border border-gray-600">Total</th>
                  <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-wide border border-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedSales.map((sale, index) => (
                  <tr key={sale.id || index}
                    className={`${sale.isVoided ? 'bg-red-50 opacity-75' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    <td className="px-3 py-2.5 border border-gray-200 text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {formatDate(sale.date)}
                        {sale.isVoided && <span className="text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">VOID</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        sale.type === 'consultation'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {sale.displayType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200 text-gray-700 whitespace-nowrap">
                      <span className="text-xs font-medium text-gray-700">{sale.shopName || 'Main Clinic'}</span>
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200 font-medium text-gray-900">
                      {sale.displayName}
                      {/* Show pets for consultation sales */}
                      {sale.type === 'consultation' && sale.petNames?.length > 0 && (
                        <p className="text-xs text-gray-500 font-normal mt-0.5">
                          Pets: {sale.petNames.join(', ')}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200 text-gray-700">
                      {(sale.displayItems || []).length > 0 ? (
                        <div className="space-y-0.5">
                          {sale.displayItems.slice(0, 3).map((item, i) => (
                            <div key={i} className="text-gray-700">
                              <span className="font-medium">{item.name}</span>
                              {item.qty > 0 && (
                                <span className="text-gray-500"> × {item.qty} {item.unit}</span>
                              )}
                            </div>
                          ))}
                          {sale.displayItems.length > 3 && (
                            <p className="text-gray-400 italic">+{sale.displayItems.length - 3} more</p>
                          )}
                          {/* Consultation fee line */}
                          {sale.type === 'consultation' && sale.consultationFee > 0 && (
                            <div className="text-gray-500 italic">
                              + Consultation fee ₱{sale.consultationFee.toLocaleString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200 text-right font-bold text-gray-900">
                      ₱{(sale.totalAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 border border-gray-200 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handlePrintClick(sale)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                          title="Print this transaction"
                        >
                          <FiPrinter className="w-4 h-4" />
                          Print
                        </button>
                        <button
                          onClick={() => handleVoidClick(sale)}
                          disabled={voidLoading || sale.isVoided}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={sale.isVoided ? 'This sale has been voided' : 'Void this sale and restore stock'}
                        >
                          <FiTrash2 className="w-4 h-4" />
                          {sale.isVoided ? 'Voided' : 'Void'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>

            {/* Sentinel for intersection observer to trigger next page load (invisible) */}
            {hasMore && (
              <div ref={observerTarget} className="w-full h-2" />
            )}
          </div>
        )}
      </div>

      {/* Password Verification Modal */}
      <PasswordVerificationModal
        isOpen={isPasswordModalOpen}
        onClose={handlePasswordClose}
        onConfirm={handlePasswordConfirm}
        title="Void Sale"
        message="Please verify by entering your password to confirm voiding this sale."
        saleData={saleToVoid}
      />
    </div>
  )
}

export default SalesHistory
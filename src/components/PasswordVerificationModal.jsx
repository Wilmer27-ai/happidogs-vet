// src/components/PasswordVerificationModal.jsx
import { useState } from 'react'
import { FiX, FiAlertCircle } from 'react-icons/fi'

function PasswordVerificationModal({ isOpen, onClose, onConfirm, title = 'Password Required', message = 'Please enter your password to continue.', saleData = null }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Password is required')
      return
    }

    setLoading(true)
    setError('')
    try {
      await onConfirm(password)
      setPassword('')
    } catch (err) {
      setError(err.message || 'Invalid password. Please try again.')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  // Format sale data for display
  const formatSaleInfo = () => {
    if (!saleData) return null
    
    const saleType = saleData.type === 'consultation' ? 'Consultation' : (saleData.itemType === 'medicine' ? 'Medicine Sale' : 'Store Sale')
    const displayName = saleData.clientName || saleData.itemName || 'Unknown'
    const amount = saleData.totalAmount || 0
    const items = saleData.items || (saleData.itemName ? [{ name: saleData.itemName, qty: saleData.quantity }] : [])
    
    return {
      type: saleType,
      name: displayName,
      amount: amount,
      items: items
    }
  }

  const saleInfo = formatSaleInfo()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Sale Data Display - Simplified */}
          {saleInfo && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 font-semibold">{saleInfo.type}</span>
                <span className="text-lg font-bold text-red-600">₱{saleInfo.amount.toLocaleString()}</span>
              </div>
              <div className="text-sm text-gray-700 font-medium truncate">{saleInfo.name}</div>
              {saleInfo.items && saleInfo.items.length > 0 && (
                <div className="text-xs text-gray-600">
                  {saleInfo.items.slice(0, 3).map((item, idx) => (
                    <div key={idx}>
                      {item.name || item.medicineName || item.itemName}{item.qty ? ` × ${item.qty}` : ''}
                    </div>
                  ))}
                  {saleInfo.items.length > 3 && <div className="text-gray-500">+{saleInfo.items.length - 3} more</div>}
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-gray-600">{message}</p>

          {/* Password Input */}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder="Enter password"
              disabled={loading}
              autoFocus
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PasswordVerificationModal

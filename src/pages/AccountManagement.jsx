import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth'
import { getApps, initializeApp } from 'firebase/app'
import { FiAlertCircle, FiCheck, FiRefreshCw, FiShield, FiUsers } from 'react-icons/fi'
import firebaseApp from '../firebase/config'
import { useAuth } from './AuthContext'
import { getAppUsers, setAppUserProfile, updateAppUserProfile } from '../firebase/services'

const SECONDARY_APP_NAME = 'account-management-creator'
const LIMITED_ROUTES = ['/pet-store', '/medicines-stocks', '/expenses']
const ROUTE_LABELS = {
  '/pet-store': 'POS',
  '/medicines-stocks': 'Medicines & Stocks',
  '/expenses': 'Expenses',
}

const initialCreateForm = {
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  shopName: 'Second Shop',
}

function formatDate(value) {
  if (!value) return 'N/A'
  const date = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getSecondaryAuth() {
  const existingApp = getApps().find((app) => app.name === SECONDARY_APP_NAME)
  const secondaryApp = existingApp || initializeApp(firebaseApp.options, SECONDARY_APP_NAME)
  return getAuth(secondaryApp)
}

const secondaryAuth = getSecondaryAuth()

function AccountManagement() {
  const navigate = useNavigate()
  const { currentUser, role } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(initialCreateForm)
  const [accounts, setAccounts] = useState([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const isAdmin = !currentUser || role === 'admin'

  const allowedRouteLabels = useMemo(
    () => LIMITED_ROUTES.map((path) => ROUTE_LABELS[path]).filter(Boolean),
    []
  )

  useEffect(() => {
    if (isAdmin) {
      loadAdminData()
      return
    }

    setLoading(false)
  }, [isAdmin])

  const loadAdminData = async () => {
    setLoading(true)
    setError('')
    try {
      const accountData = await getAppUsers()
      setAccounts(accountData)
    } catch (err) {
      setError('Failed to load access accounts.')
      console.error('Error loading account management data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const email = form.email.trim().toLowerCase()
      const displayName = form.displayName.trim()
      const shopName = form.shopName.trim() || 'Second Shop'

      if (!displayName) {
        throw new Error('Display name is required')
      }

      if (!email) {
        throw new Error('Email is required')
      }

      if (form.password.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }

      if (form.password !== form.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      const credentials = await createUserWithEmailAndPassword(secondaryAuth, email, form.password)

      await setAppUserProfile(credentials.user.uid, {
        uid: credentials.user.uid,
        email: credentials.user.email,
        displayName: displayName || credentials.user.email,
        role: 'limited',
        allowedRoutes: LIMITED_ROUTES,
        shopName,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      try {
        await signOut(secondaryAuth)
      } catch {
        // Ignore cleanup errors for the secondary auth instance.
      }

      setSuccess('Account created successfully. Use the login page to sign in.')
      setForm(initialCreateForm)
      setIsCreateModalOpen(false)
      await loadAdminData()
    } catch (err) {
      const message = err?.code === 'auth/email-already-in-use'
        ? 'That email already has a Firebase account.'
        : err?.message || 'Failed to create account.'
      setError(message)
      console.error('Error creating account:', err)
      try {
        await signOut(secondaryAuth)
      } catch {
        // Ignore cleanup errors.
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleAccountStatus = async (account) => {
    try {
      await updateAppUserProfile(account.id, {
        active: account.active === false,
        updatedAt: new Date().toISOString(),
      })
      await loadAdminData()
    } catch (err) {
      setError('Failed to update account status.')
      console.error('Error updating account status:', err)
    }
  }

  const managedAccounts = [...accounts].sort((a, b) => {
    const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime()
    const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime()
    return bTime - aTime
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-4 text-sm font-medium shadow-sm">
          Loading access manager...
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-gray-900">
            <FiAlertCircle className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-semibold">Access restricted</h1>
          </div>
          <p className="mt-3 text-sm text-gray-500">You do not have permission to open account management.</p>
          <button
            type="button"
            onClick={() => navigate('/pet-store')}
            className="mt-6 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Go to POS
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 px-4 py-6 text-gray-900 lg:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">
                <FiUsers className="h-4 w-4" />
                Account Management
              </p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight lg:text-3xl">Access accounts</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create login accounts for POS, expenses, and medicines & stocks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <FiCheck className="h-4 w-4" />
              New account
            </button>
          </div>
        </div>

        {(error || success) && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || success}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Created accounts</h2>
              <p className="mt-1 text-sm text-gray-500">All direct login accounts for POS and back-office access.</p>
            </div>
            <button
              type="button"
              onClick={loadAdminData}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Shop</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {managedAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-6 text-center text-sm text-gray-500">
                        No accounts yet.
                      </td>
                    </tr>
                  ) : (
                    managedAccounts.map((account) => {
                      const isActive = account.active !== false
                      const roleLabel = account.role === 'limited' ? 'Limited' : (account.role || 'Admin')
                      const modulesLabel = account.role === 'limited'
                        ? LIMITED_ROUTES.map((path) => ROUTE_LABELS[path]).join(', ')
                        : 'All modules'

                      return (
                        <tr key={account.id}>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <div>{account.displayName || 'Unnamed account'}</div>
                            <div className="text-xs text-gray-400">{modulesLabel}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{account.email}</td>
                          <td className="px-4 py-3 text-gray-600">{account.shopName || 'Second Shop'}</td>
                          <td className="px-4 py-3 text-gray-600">{roleLabel}</td>
                          <td className="px-4 py-3 text-gray-600">{isActive ? 'Active' : 'Disabled'}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(account.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => toggleAccountStatus(account)}
                              className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              {isActive ? 'Disable' : 'Enable'}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Create account</h2>
                <p className="mt-1 text-sm text-gray-500">Add a direct login account for POS, expenses, or stocks access.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-md px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleCreateAccount}>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Full name</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Branch staff name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Repeat password"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Shop name</label>
                <input
                  type="text"
                  value={form.shopName}
                  onChange={(event) => setForm((current) => ({ ...current, shopName: event.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Second Shop"
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-900">Allowed modules</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {LIMITED_ROUTES.map((path) => (
                    <span key={path} className="rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                      {ROUTE_LABELS[path]}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiCheck className="h-4 w-4" />}
                Create account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountManagement

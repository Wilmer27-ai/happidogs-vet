import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { FiAlertCircle, FiCheck, FiCopy, FiExternalLink, FiLink, FiRefreshCw, FiShield, FiUsers } from 'react-icons/fi'
import { auth } from '../firebase/config'
import { useAuth } from './AuthContext'
import {
  createAccessInvite,
  getAccessInviteByToken,
  getAccessInvites,
  getAppUsers,
  setAppUserProfile,
  updateAccessInvite,
  updateAppUserProfile,
} from '../firebase/services'

const LIMITED_ROUTES = ['/pet-store', '/medicines-stocks', '/expenses']
const ROUTE_LABELS = {
  '/pet-store': 'POS',
  '/medicines-stocks': 'Medicines & Stocks',
  '/expenses': 'Expenses',
}

const initialInviteForm = {
  displayName: '',
  email: '',
  shopName: 'Second Shop',
}

const initialSetupForm = {
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function formatDate(value) {
  if (!value) return 'N/A'
  const date = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function makeToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '')
  }

  return `${Date.now()}${Math.random().toString(36).slice(2)}`
}

function AccountManagement() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { currentUser, userProfile, role } = useAuth()
  const isInviteMode = Boolean(token)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [inviteForm, setInviteForm] = useState(initialInviteForm)
  const [setupForm, setSetupForm] = useState(initialSetupForm)
  const [invite, setInvite] = useState(null)
  const [invites, setInvites] = useState([])
  const [accounts, setAccounts] = useState([])
  const [generatedLink, setGeneratedLink] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const isAdmin = !currentUser || role === 'admin'
  const inviteLinkBase = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/#/access-invite`
  }, [])

  useEffect(() => {
    if (isInviteMode) {
      loadInvite()
      return
    }

    if (isAdmin) {
      loadAdminData()
    } else {
      setLoading(false)
    }
  }, [isInviteMode, isAdmin, token])

  const loadAdminData = async () => {
    setLoading(true)
    setError('')
    try {
      const [inviteData, accountData] = await Promise.all([getAccessInvites(), getAppUsers()])
      setInvites(inviteData)
      setAccounts(accountData)
    } catch (err) {
      setError('Failed to load access accounts.')
      console.error('Error loading account management data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadInvite = async () => {
    setLoading(true)
    setError('')
    try {
      const inviteData = await getAccessInviteByToken(token)
      setInvite(inviteData)
      if (inviteData) {
        setSetupForm((current) => ({
          ...current,
          displayName: inviteData.displayName || '',
          email: inviteData.email || '',
        }))
      }
    } catch (err) {
      setError('Invalid or expired access link.')
      console.error('Error loading invite:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateInvite = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const tokenValue = makeToken()
      const inviteData = {
        token: tokenValue,
        displayName: inviteForm.displayName.trim(),
        email: inviteForm.email.trim().toLowerCase(),
        shopName: inviteForm.shopName.trim(),
        role: 'limited',
        allowedRoutes: LIMITED_ROUTES,
        createdByUid: currentUser?.uid || null,
        createdByEmail: currentUser?.email || null,
      }

      await createAccessInvite(inviteData)
      const link = `${inviteLinkBase}/${tokenValue}`
      setGeneratedLink(link)
      setSuccess('Invite link generated.')
      setInviteForm(initialInviteForm)
      setIsInviteModalOpen(false)
      await loadAdminData()
    } catch (err) {
      setError('Failed to generate invite link.')
      console.error('Error creating invite:', err)
    } finally {
      setSaving(false)
    }
  }

  const copyLink = async () => {
    if (!generatedLink) return
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 1600)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const toggleInviteStatus = async (inviteItem) => {
    try {
      await updateAccessInvite(inviteItem.id, { active: !inviteItem.active, updatedAt: new Date().toISOString() })
      await loadAdminData()
    } catch (err) {
      setError('Failed to update invite status.')
      console.error('Error updating invite status:', err)
    }
  }

  const toggleAccountStatus = async (account) => {
    try {
      await updateAppUserProfile(account.id, { active: !account.active, updatedAt: new Date().toISOString() })
      await loadAdminData()
    } catch (err) {
      setError('Failed to update account status.')
      console.error('Error updating account status:', err)
    }
  }

  const handleSetupSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (!invite) {
        throw new Error('Invite not found')
      }

      if (!invite.active || invite.used) {
        throw new Error('This access link is no longer available')
      }

      if (invite.email && invite.email.toLowerCase() !== setupForm.email.trim().toLowerCase()) {
        throw new Error('Please use the invited email address')
      }

      if (setupForm.password.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }

      if (setupForm.password !== setupForm.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      const credentials = await createUserWithEmailAndPassword(
        auth,
        setupForm.email.trim().toLowerCase(),
        setupForm.password,
      )

      await setAppUserProfile(credentials.user.uid, {
        uid: credentials.user.uid,
        email: credentials.user.email,
        displayName: setupForm.displayName.trim() || invite.displayName || credentials.user.email,
        role: 'limited',
        allowedRoutes: invite.allowedRoutes || LIMITED_ROUTES,
        shopName: invite.shopName || 'Second Shop',
        active: true,
        inviteId: invite.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      await updateAccessInvite(invite.id, {
        used: true,
        active: false,
        usedAt: new Date().toISOString(),
        usedByUid: credentials.user.uid,
      })

      setSuccess('Account created successfully.')
      navigate('/pet-store', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to complete account setup.')
      console.error('Error completing invite setup:', err)
    } finally {
      setSaving(false)
    }
  }

  const allowedRouteLabels = LIMITED_ROUTES.map((path) => ROUTE_LABELS[path]).filter(Boolean)
  // Merge accounts and invites by email into a single compact row to save space.
  const mergedByEmail = {}

  accounts.forEach((account) => {
    const key = (account.email || '').toLowerCase() || `account-${account.id}`
    mergedByEmail[key] = { account, invites: [] }
  })

  invites.forEach((inv) => {
    const key = (inv.email || '').toLowerCase() || `invite-${inv.id}`
    if (mergedByEmail[key]) {
      mergedByEmail[key].invites.push(inv)
    } else {
      mergedByEmail[key] = { account: null, invites: [inv] }
    }
  })

  const combinedAccessItems = Object.entries(mergedByEmail).map(([key, { account, invites }]) => {
    const inviteItem = invites && invites.length > 0 ? invites[0] : null
    const accountStatus = account ? (account.active === false ? 'Disabled' : 'Active') : null
    const inviteStatus = inviteItem ? (inviteItem.used ? 'Used' : inviteItem.active ? 'Pending' : 'Disabled') : null
    const status = account ? (inviteItem ? `${accountStatus} • Invite: ${inviteStatus}` : accountStatus) : inviteStatus

    const actionLabel = account
      ? (account.active === false ? 'Enable' : 'Disable')
      : (inviteItem && inviteItem.active ? 'Disable' : 'Enable')

    const onAction = account ? () => toggleAccountStatus(account) : () => toggleInviteStatus(inviteItem)

    const extraAction = inviteItem
      ? () => {
          const link = `${inviteLinkBase}/${inviteItem.token}`
          navigator.clipboard.writeText(link)
        }
      : null

    return {
      id: `combined-${key}`,
      kind: account ? 'Account' : 'Invite',
      name: account?.displayName || inviteItem?.displayName || account?.email || inviteItem?.email || key,
      email: account?.email || inviteItem?.email || 'No email',
      shop: account?.shopName || inviteItem?.shopName || 'Second Shop',
      status,
      actionLabel,
      onAction,
      extraAction,
      extraActionLabel: inviteItem ? 'Copy link' : null,
    }
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

  if (isInviteMode) {
    if (!invite) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 text-gray-900">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <FiAlertCircle className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">Access link unavailable</h1>
            </div>
            <p className="text-sm text-gray-500">This invite is invalid, revoked, or already used.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900 lg:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">
                <FiShield className="h-4 w-4" />
                Restricted Access Setup
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 lg:text-3xl">Finish the branch account setup</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500">
                This account will only be able to open {allowedRouteLabels.join(', ')}. Fill in the details below to activate the access link.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {allowedRouteLabels.map((label) => (
                  <div key={label} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Allowed</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                <p className="font-medium text-gray-900">Invite details</p>
                <p className="mt-2">Name: {invite.displayName || 'Not set'}</p>
                <p>Email: {invite.email || 'Not set'}</p>
                <p>Shop: {invite.shopName || 'Second Shop'}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm lg:p-8">
              <h2 className="text-xl font-semibold tracking-tight">Create account</h2>
              <p className="mt-2 text-sm text-gray-500">Set a password to activate your restricted account.</p>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSetupSubmit}>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Full name</label>
                  <input
                    type="text"
                    value={setupForm.displayName}
                    onChange={(event) => setSetupForm((current) => ({ ...current, displayName: event.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Branch staff name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={setupForm.email}
                    onChange={(event) => setSetupForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={setupForm.password}
                    onChange={(event) => setSetupForm((current) => ({ ...current, password: event.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="At least 6 characters"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm password</label>
                  <input
                    type="password"
                    value={setupForm.confirmPassword}
                    onChange={(event) => setSetupForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Repeat password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiCheck className="h-4 w-4" />}
                  Activate account
                </button>
              </form>
            </div>
          </div>
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
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">
                <FiUsers className="h-4 w-4" />
                Account Management
              </p>
              <h1 className="mt-4 text-2xl font-bold tracking-tight lg:text-3xl">Branch access and invite links</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
           
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <FiLink className="h-4 w-4" />
                Generate invite link
              </button>
            </div>
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
              <h2 className="text-lg font-semibold text-gray-900">Access accounts and invites</h2>
              <p className="mt-1 text-sm text-gray-500">One table for both created accounts and pending invite links.</p>
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
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {combinedAccessItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-6 text-center text-sm text-gray-500">
                        No accounts or invites yet.
                      </td>
                    </tr>
                  ) : (
                    combinedAccessItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-gray-600">{item.email}</td>
                        <td className="px-4 py-3 text-gray-600">{item.shop}</td>
                        <td className="px-4 py-3 text-gray-600">{item.status}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={item.onAction}
                              className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              {item.actionLabel}
                            </button>
                            {item.extraAction && (
                              <button
                                type="button"
                                onClick={item.extraAction}
                                className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                {item.extraActionLabel}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Generate invite link</h2>
                <p className="mt-1 text-sm text-gray-500">Create a restricted access link for the second shop.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="rounded-md px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleGenerateInvite}>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Display name</label>
                <input
                  type="text"
                  value={inviteForm.displayName}
                  onChange={(event) => setInviteForm((current) => ({ ...current, displayName: event.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Branch staff name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Shop name</label>
                <input
                  type="text"
                  value={inviteForm.shopName}
                  onChange={(event) => setInviteForm((current) => ({ ...current, shopName: event.target.value }))}
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

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? 'Generating...' : 'Generate'}
                </button>
              </div>

              {generatedLink && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-900">Generated link</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="min-w-0 flex-1 rounded-md border border-blue-200 bg-white px-3 py-2.5 text-sm text-gray-700"
                    />
                    <button
                      type="button"
                      onClick={copyLink}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      {copiedLink ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
                      {copiedLink ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(generatedLink, '_blank', 'noopener,noreferrer')}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
                  >
                    <FiExternalLink className="h-4 w-4" />
                    Open invite
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountManagement

import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/auth.css'
import { changeAccountPassword } from '../services/auth'

const STEP = { EMAIL: 'email', NEW_PASSWORD: 'new_password', DONE: 'done' }

export default function ResetPassword() {
  const [step, setStep] = useState(STEP.EMAIL)
  const [email, setEmail] = useState('')
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleEmailSubmit(e) {
    e.preventDefault()
    setError('')
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setError('Please enter your email address.')
      return
    }
    setEmail(normalizedEmail)
    setStep(STEP.NEW_PASSWORD)
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.newPassword !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      await changeAccountPassword({
        email,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      setStep(STEP.DONE)
    } catch (err) {
      setError(err.message || 'Unable to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="brand">
          <span className="brandIcon">🎓</span>
          <span className="brandName">Skwela Ta</span>
        </div>

        {step === STEP.EMAIL && (
          <>
            <h1 className="title">Change your password</h1>
            <p className="subtitle">Enter your account email to continue</p>
            <form onSubmit={handleEmailSubmit} className="form" noValidate>
              {error && <div className="error" role="alert">{error}</div>}
              <div className="field">
                <label htmlFor="reset-email" className="label">Email address</label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  placeholder="juan@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                />
              </div>
              <button type="submit" className="btn">Continue</button>
            </form>
          </>
        )}

        {step === STEP.NEW_PASSWORD && (
          <>
            <h1 className="title">Verify and change password</h1>
            <p className="subtitle">Confirm your current password for <strong>{email}</strong></p>
            <form onSubmit={handlePasswordSubmit} className="form" noValidate>
              {error && <div className="error" role="alert">{error}</div>}
              <div className="field">
                <label htmlFor="reset-current-password" className="label">Current password</label>
                <input
                  id="reset-current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input"
                  value={form.currentPassword}
                  onChange={(e) => { setForm((f) => ({ ...f, currentPassword: e.target.value })); setError('') }}
                />
              </div>
              <div className="field">
                <label htmlFor="reset-new-password" className="label">New password</label>
                <input
                  id="reset-new-password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input"
                  placeholder="At least 8 characters"
                  value={form.newPassword}
                  onChange={(e) => { setForm((f) => ({ ...f, newPassword: e.target.value })); setError('') }}
                />
              </div>
              <div className="field">
                <label htmlFor="reset-confirm-password" className="label">Confirm new password</label>
                <input
                  id="reset-confirm-password"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input"
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={(e) => { setForm((f) => ({ ...f, confirm: e.target.value })); setError('') }}
                />
              </div>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Saving…' : 'Save new password'}
              </button>
            </form>
          </>
        )}

        {step === STEP.DONE && (
          <div className="successBlock">
            <div className="successIcon">✓</div>
            <h1 className="title">Password updated</h1>
            <p className="subtitle">Your password has been changed successfully.</p>
            <Link to="/login" className="btn" style={{ display: 'block', textAlign: 'center', marginTop: '24px' }}>
              Back to sign in
            </Link>
          </div>
        )}

        {step !== STEP.DONE && (
          <p className="foot">
            Remembered it?{' '}
            <Link to="/login" className="link">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  )
}

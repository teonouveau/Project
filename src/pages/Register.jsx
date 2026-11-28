import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/auth.css'
import { registerAccount } from '../services/auth'
import PasswordToggleIcon from '../components/PasswordToggleIcon'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  function getPasswordStrength(password) {
    if (!password) return null

    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 2) return { label: 'Weak', className: 'weak' }
    if (score === 3) return { label: 'Medium', className: 'medium' }
    return { label: 'Strong', className: 'strong' }
  }

  const passwordStrength = getPasswordStrength(form.password)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!/\d/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
      setError('Password must include a number and a special character.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await registerAccount(form)
      navigate('/login', { replace: true, state: { authEntry: true } })
    } catch (err) {
      setError(err.message || 'Unable to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page auth-blue">
      <div className="card">
        <div className="brand">
          <span className="brandIcon">🎓</span>
          <span className="brandName">Skwela Ta</span>
        </div>
        <h1 className="title">Create your account</h1>
        <p className="subtitle">Start your learning journey today</p>

        <form onSubmit={handleSubmit} className="form" noValidate>
          {error && <div className="error" role="alert">{error}</div>}

          <div className="field">
            <label htmlFor="register-name" className="label">Full name</label>
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="input"
              placeholder="Juan dela Cruz"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="register-email" className="label">Email address</label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              placeholder="juan@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="register-password" className="label">Password</label>
            <div className="passwordInput">
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="input"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="passwordToggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <PasswordToggleIcon visible={showPassword} />
              </button>
            </div>
            {passwordStrength && (
              <div className={`passwordStrength ${passwordStrength.className}`} aria-live="polite">
                <div className="passwordStrengthBar">
                  <span />
                  <span />
                  <span />
                </div>
                <span>{passwordStrength.label} password</span>
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="register-confirm" className="label">Confirm password</label>
            <div className="passwordInput">
              <input
                id="register-confirm"
                name="confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="input"
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={handleChange}
              />
              <button
                type="button"
                className="passwordToggle"
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirm}
                onClick={() => setShowConfirm((visible) => !visible)}
              >
                <PasswordToggleIcon visible={showConfirm} />
              </button>
            </div>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="foot">
          Already have an account?{' '}
          <Link to="/login" state={{ authEntry: true }} className="link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/auth.css'
import { loginAccount } from '../services/auth'
import PasswordToggleIcon from '../components/PasswordToggleIcon'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await loginAccount(form.email, form.password)
      navigate('/setup')
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
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
        <h1 className="title">Welcome back</h1>
        <p className="subtitle">Sign in to continue learning</p>

        <form onSubmit={handleSubmit} className="form" noValidate>
          {error && <div className="error" role="alert">{error}</div>}

          <div className="field">
            <label htmlFor="login-email" className="label">Email address</label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className="label">
              Password
              <Link to="/reset-password" className="labelLink">Forgot password?</Link>
            </label>
            <div className="passwordInput">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="input"
                placeholder="Your password"
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
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="foot">
          Don't have an account?{' '}
          <Link to="/signup" className="link">Sign Up</Link>
        </p>
      </div>
    </div>
  )
}
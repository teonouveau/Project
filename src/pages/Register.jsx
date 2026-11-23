import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/auth.css'
import { registerAccount } from '../services/auth'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await registerAccount(form)
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Unable to create account.')
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
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="input"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label htmlFor="register-confirm" className="label">Confirm password</label>
            <input
              id="register-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              className="input"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="foot">
          Already have an account?{' '}
          <Link to="/login" className="link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
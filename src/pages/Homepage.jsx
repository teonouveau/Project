import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Home.css'

const VERSES = [
  { text: '"Commit to the Lord whatever you do, and He will establish your plans."', ref: '– Proverbs 16:3' },
  { text: '"I can do all things through Christ who strengthens me."', ref: '– Philippians 4:13' },
  { text: '"Study to show yourself approved unto God."', ref: '– 2 Timothy 2:15' },
  { text: '"The beginning of wisdom is this: Get wisdom."', ref: '– Proverbs 4:7' },
]

/* ── SVG Nav Icons ────────────────────────────────────────── */
const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
)

const IconTasks = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
)

const IconSchedule = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
  </svg>
)

const IconStudy = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
)

const IconGWA = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M9 9h1.5a1.5 1.5 0 0 1 0 3H9v3"/>
    <path d="M9 9V7"/>
    <path d="M15 9v6"/>
    <path d="M15 12h-2"/>
  </svg>
)

const NAV_ITEMS = [
  { key: 'home',     icon: <IconHome />,     label: 'Home' },
  { key: 'tasks',    icon: <IconTasks />,    label: 'Tasks & Events' },
  { key: 'schedule', icon: <IconSchedule />, label: 'Schedule' },
  { key: 'study',    icon: <IconStudy />,    label: 'Study' },
  { key: 'gwa',      icon: <IconGWA />,      label: 'GWA Calculator' },
]

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function today() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

const SAMPLE_SCHEDULE = [
  { id: 1, name: 'No classes today', time: 'Have a great day!', color: 'green' },
]

export default function Homepage() {
  const navigate = useNavigate()

  /* ── user ─────────────────────────────────────────────── */
  let user = null
  try { user = JSON.parse(localStorage.getItem('skwela_user')) }
  catch { localStorage.removeItem('skwela_user') }

  const displayName = user?.name?.trim() || 'User'
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  /* ── verse of the day ─────────────────────────────────── */
  const verse = VERSES[new Date().getDay() % VERSES.length]

  /* ── tasks state ──────────────────────────────────────── */
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('skwela_tasks')) || [] }
    catch { return [] }
  })

  function saveTasks(next) {
    setTasks(next)
    localStorage.setItem('skwela_tasks', JSON.stringify(next))
  }

  function toggleTask(id) {
    saveTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function deleteTask(id) {
    saveTasks(tasks.filter(t => t.id !== id))
  }

  /* ── inline add-task row ──────────────────────────────── */
  const [newTask, setNewTask] = useState('')
  const [newDue, setNewDue]   = useState('')

  function addTaskInline(e) {
    e.preventDefault()
    if (!newTask.trim()) return
    const task = { id: Date.now(), name: newTask.trim(), due: newDue, done: false }
    saveTasks([...tasks, task])
    setNewTask('')
    setNewDue('')
  }

  /* ── modal add-task ───────────────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false)
  const [modalName, setModalName] = useState('')
  const [modalDue, setModalDue]   = useState('')

  function openModal() { setModalOpen(true) }
  function closeModal() { setModalOpen(false); setModalName(''); setModalDue('') }

  function addTaskModal(e) {
    e.preventDefault()
    if (!modalName.trim()) return
    saveTasks([...tasks, { id: Date.now(), name: modalName.trim(), due: modalDue, done: false }])
    closeModal()
  }

  /* ── study note modal ─────────────────────────────────── */
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [uploadedFile, setUploadedFile]   = useState(null)
  const fileRef = useRef(null)

  function handleFileChange(e) {
    if (e.target.files[0]) setUploadedFile(e.target.files[0])
  }

  /* ── settings dropdown ────────────────────────────────── */
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target))
        setSettingsOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleLogout() {
    localStorage.removeItem('skwela_user')
    navigate('/login')
  }

  /* ── streak ───────────────────────────────────────────── */
  const streak = Number(localStorage.getItem('skwela_streak') || 0)

  /* ── active nav ───────────────────────────────────────── */
  const [activeNav, setActiveNav] = useState('home')

  const doneTasks  = tasks.filter(t => t.done).length
  const totalTasks = tasks.length

  /* ── render ───────────────────────────────────────────── */
  return (
    <div className="home-page">

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside className="home-sidebar">
        <div className="home-sidebar-brand">
          <span className="owl">🦉</span>
          <span>ESKWELA TA</span>
        </div>

        <nav className="home-sidebar-nav">
          {NAV_ITEMS.map(({ key, icon, label }) => (
            <button
              key={key}
              className={`home-nav-item${activeNav === key ? ' active' : ''}`}
              onClick={() => setActiveNav(key)}
            >
              <span className="nav-icon">{icon}</span>
              <small>{label}</small>
            </button>
          ))}
        </nav>

        <div className="home-sidebar-footer">
          <div className="home-sidebar-user">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{displayName}</div>
              <div className="user-role">Student</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Top Bar ────────────────────────────────────────── */}
      <header className="home-topbar">
        <div className="home-topbar-left">
          <h1>Dashboard</h1>
          <p>{today()}</p>
        </div>
        <div className="home-topbar-right">
          <div className="topbar-streak">
            <span>💧</span>
            <strong>{streak}</strong>
            <span style={{ fontSize: 11, fontWeight: 400, color: '#5a8aaa' }}>streak</span>
          </div>

          <div style={{ position: 'relative' }} ref={settingsRef}>
            <button
              className="topbar-btn"
              aria-label="Settings"
              onClick={() => setSettingsOpen(o => !o)}
              title="Settings"
            >
              ⚙️
            </button>
            {settingsOpen && (
              <div className="settings-dropdown">
                <button onClick={() => { setSettingsOpen(false) }}>👤 &nbsp;Profile</button>
                <button onClick={() => { setSettingsOpen(false) }}>⚙️ &nbsp;Settings</button>
                <hr />
                <button className="danger" onClick={handleLogout}>🚪 &nbsp;Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="home-content">

        {/* Hero */}
        <section className="home-hero">
          <div className="home-mascot" aria-hidden="true">🦉</div>
          <div className="home-speech">
            <strong>Hello, {displayName}!</strong>
            <span>{verse.text}</span>
            <small>{verse.ref}</small>
          </div>
          <div className="home-hero-spacer" />
        </section>

        {/* Grid */}
        <div className="home-grid">

          {/* Left column */}
          <div>
            {/* Today status */}
            <div className="home-today">
              <h2>No classes today</h2>
              <p>Enjoy your break, bro. 🎉</p>
            </div>

            {/* Study note */}
            <button className="home-note" onClick={() => setNoteModalOpen(true)}>
              <div className="home-note-icon">📝</div>
              <div className="home-note-text">
                <strong>Make a study note</strong>
                <span>Upload PDF to convert into a Note</span>
              </div>
            </button>

            {/* Classes */}
            <div className="home-card" style={{ marginBottom: 20 }}>
              <div className="home-card-header">
                <div className="home-card-title">
                  <span className="home-section-line" />
                  Classes
                </div>
                <span className="home-card-count">0/0</span>
              </div>
              <div className="home-card-body">
                <div className="home-empty">
                  <span>📚</span>
                  <p>No classes today</p>
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="home-card">
              <div className="home-card-header">
                <div className="home-card-title">
                  <span className="home-section-line" />
                  Tasks &amp; Deadlines
                </div>
                <span className="home-card-count">{doneTasks}/{totalTasks}</span>
              </div>

              {tasks.length === 0 ? (
                <div className="home-card-body">
                  <div className="home-empty">
                    <span>📋</span>
                    <p>No tasks yet</p>
                  </div>
                </div>
              ) : (
                <div className="home-task-list">
                  {tasks.map(task => {
                    const isOverdue = task.due && !task.done && new Date(task.due) < new Date()
                    return (
                      <div key={task.id} className="home-task-item">
                        <button
                          className={`task-check${task.done ? ' done' : ''}`}
                          onClick={() => toggleTask(task.id)}
                          aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {task.done && '✓'}
                        </button>
                        <div className="task-info">
                          <div className={`task-name${task.done ? ' done' : ''}`}>{task.name}</div>
                          {task.due && (
                            <div className={`task-due${isOverdue ? ' overdue' : ''}`}>
                              {isOverdue ? '⚠ ' : ''}Due: {new Date(task.due).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                        <button
                          className="task-delete"
                          onClick={() => deleteTask(task.id)}
                          aria-label="Delete task"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Inline add row */}
              <form className="home-add-task-row" onSubmit={addTaskInline}>
                <input
                  type="text"
                  placeholder="+ Add a task…"
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  aria-label="New task name"
                />
                <input
                  type="date"
                  value={newDue}
                  onChange={e => setNewDue(e.target.value)}
                  aria-label="Due date"
                  style={{ width: 130, height: 36, border: '1px solid #dde3ea', borderRadius: 8, padding: '0 8px', fontSize: 13, color: '#1d3547', outline: 'none' }}
                />
                <button type="submit">Add</button>
              </form>
            </div>
          </div>

          {/* Right column */}
          <div className="home-right">

            {/* Quick stats */}
            <div className="home-card">
              <div className="home-card-header">
                <div className="home-card-title">
                  <span className="home-section-line" />
                  Quick Stats
                </div>
              </div>
              <div className="stat-grid">
                <div className="stat-box">
                  <div className="stat-num">{totalTasks}</div>
                  <div className="stat-label">Total Tasks</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num">{doneTasks}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num">{totalTasks - doneTasks}</div>
                  <div className="stat-label">Remaining</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num">{streak}</div>
                  <div className="stat-label">Day Streak</div>
                </div>
              </div>
            </div>

            {/* Upcoming */}
            <div className="home-card">
              <div className="home-card-header">
                <div className="home-card-title">
                  <span className="home-section-line" />
                  Upcoming
                </div>
              </div>
              <div className="schedule-list">
                {SAMPLE_SCHEDULE.map(s => (
                  <div key={s.id} className="schedule-item">
                    <div className={`schedule-dot ${s.color}`} />
                    <div className="schedule-info">
                      <div className="schedule-name">{s.name}</div>
                      <div className="schedule-time">{s.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivation */}
            <div className="home-card">
              <div className="home-card-header">
                <div className="home-card-title">
                  <span className="home-section-line" />
                  Verse of the Day
                </div>
              </div>
              <div className="home-card-body">
                <p style={{ fontSize: 13, color: '#42566a', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
                  {verse.text}
                </p>
                <p style={{ fontSize: 11, color: '#8fa0b0', marginTop: 8 }}>{verse.ref}</p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── Floating FAB (mobile only) ─────────────────────── */}
      <button className="home-floating-add" onClick={openModal} aria-label="Add task">+</button>

      {/* ── Add Task Modal ──────────────────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="modal-box" role="dialog" aria-modal="true" aria-label="Add task">
            <h2>Add a New Task</h2>
            <form onSubmit={addTaskModal}>
              <div className="modal-field">
                <label htmlFor="modal-task-name">Task name</label>
                <input
                  id="modal-task-name"
                  type="text"
                  placeholder="e.g. Submit Math assignment"
                  value={modalName}
                  onChange={e => setModalName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <label htmlFor="modal-task-due">Due date (optional)</label>
                <input
                  id="modal-task-due"
                  type="date"
                  value={modalDue}
                  onChange={e => setModalDue(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-add">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Study Note Modal ────────────────────────────────── */}
      {noteModalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setNoteModalOpen(false); setUploadedFile(null) } }}>
          <div className="modal-box" role="dialog" aria-modal="true" aria-label="Study note">
            <h2>📝 Make a Study Note</h2>
            <div className="note-modal-body">
              <label
                className="note-upload-zone"
                htmlFor="pdf-upload"
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
              >
                <span>📄</span>
                {uploadedFile
                  ? <span className="note-upload-name">✓ {uploadedFile.name}</span>
                  : <>Click to upload a PDF<br /><small>or drag and drop it here</small></>
                }
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  ref={fileRef}
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => { setNoteModalOpen(false); setUploadedFile(null) }}>Cancel</button>
              <button
                className="btn-add"
                disabled={!uploadedFile}
                style={{ opacity: uploadedFile ? 1 : 0.5, cursor: uploadedFile ? 'pointer' : 'not-allowed' }}
                onClick={() => {
                  alert(`"${uploadedFile.name}" uploaded! (PDF conversion coming soon)`)
                  setNoteModalOpen(false)
                  setUploadedFile(null)
                }}
              >
                Convert to Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

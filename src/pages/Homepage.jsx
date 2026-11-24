import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import startImage from '../assets/start-transparent.png'
import '../styles/Home.css'
import TasksEvents from './TasksEvents'
import Study from './Study'
import GwaCalculato from './GwaCalculato'
import Schedule from './Schedule'

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
    <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
  </svg>
)
const IconSchedule = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
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
    <path d="M9 9h1.5a1.5 1.5 0 0 1 0 3H9v3M9 9V7M15 9v6M15 12h-2"/>
  </svg>
)

const NAV_ITEMS = [
  { key: 'home',     icon: <IconHome />,     label: 'Home' },
  { key: 'tasks',    icon: <IconTasks />,    label: 'Tasks & Events' },
  { key: 'schedule', icon: <IconSchedule />, label: 'Schedule' },
  { key: 'study',    icon: <IconStudy />,    label: 'Study' },
  { key: 'gwa',      icon: <IconGWA />,      label: 'GWA Calculator' },
]

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function today() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

const PAGE_TITLES = {
  home: 'Dashboard',
  tasks: 'Tasks & Events',
  schedule: 'Schedule',
  study: 'Note Generator',
  gwa: 'GWA Calculator',
}

const SAMPLE_SCHEDULE = [
  { id: 1, name: 'No classes today', time: 'Have a great day!', color: 'green' },
]

/* ══════════════════════════════════════════════════════════════
   Homepage
   ══════════════════════════════════════════════════════════════ */
export default function Homepage() {
  const navigate = useNavigate()

  /* ── user ──────────────────────────────────────────────── */
  let user = null
  try { user = JSON.parse(localStorage.getItem('skwela_user')) }
  catch { localStorage.removeItem('skwela_user') }
  let setup = null
  try { setup = JSON.parse(localStorage.getItem('skwela_setup')) }
  catch { localStorage.removeItem('skwela_setup') }
  const displayName = setup?.name?.trim() || user?.name?.trim() || 'User'
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()

  const verse = VERSES[new Date().getDay() % VERSES.length]
  const streak = Number(localStorage.getItem('skwela_streak') || 0)

  /* ── dashboard tasks (separate from Tasks & Events page) ── */
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('skwela_tasks')) || [] } catch { return [] }
  })
  function saveTasks(next) { setTasks(next); localStorage.setItem('skwela_tasks', JSON.stringify(next)) }
  function toggleTask(id)  { saveTasks(tasks.map(t => t.id===id ? {...t, done:!t.done} : t)) }
  function deleteTask(id)  { saveTasks(tasks.filter(t => t.id!==id)) }

  const [newTask, setNewTask] = useState('')
  const [newDue,  setNewDue]  = useState('')
  const [inlineTaskOpen, setInlineTaskOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  function addTaskInline(e) {
    e.preventDefault()
    if (!newTask.trim()) return
    saveTasks([...tasks, { id: Date.now(), name: newTask.trim(), due: newDue, done: false }])
    setNewTask(''); setNewDue('')
    setInlineTaskOpen(false)
  }

  /* ── study note modal ──────────────────────────────────── */
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [uploadedFile,  setUploadedFile]  = useState(null)
  const fileRef = useRef(null)
  function handleFileChange(e) { if (e.target.files[0]) setUploadedFile(e.target.files[0]) }

  /* ── settings dropdown ─────────────────────────────────── */
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef(null)
  useEffect(() => {
    function outside(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])
  function handleLogout() { localStorage.removeItem('skwela_user'); navigate('/login') }

  /* ── active nav ────────────────────────────────────────── */
  const [activeNav, setActiveNav] = useState('home')

  const doneTasks  = tasks.filter(t => t.done).length
  const totalTasks = tasks.length

  /* ── render ────────────────────────────────────────────── */
  return (
    <div className={`home-page${activeNav === 'home' ? ' home-mode' : ''}${activeNav === 'study' ? ' study-mode' : ''}${activeNav === 'gwa' ? ' gwa-mode' : ''}${activeNav === 'schedule' ? ' schedule-mode' : ''}${activeNav === 'tasks' ? ' tasks-mode' : ''}`}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="home-sidebar">
        <div className="home-sidebar-brand">
        <img className="owl" src={startImage} alt="" />
          <span>ESKWELA TA</span>
        </div>

        <nav className="home-sidebar-nav">
          {NAV_ITEMS.map(({ key, icon, label }) => (
            <button
              key={key}
              className={`home-nav-item${activeNav===key?' active':''}`}
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

      {/* ── Top Bar ──────────────────────────────────────────── */}
      <header className={`home-topbar${['home', 'study', 'gwa'].includes(activeNav) ? ' home-topbar-themed' : ''}${activeNav === 'study' ? ' study-topbar' : ''}${activeNav === 'gwa' ? ' gwa-topbar' : ''}`}>
        <div className="home-topbar-left">
          <h1>{PAGE_TITLES[activeNav]}</h1>
          <p>
            {activeNav === 'home'
              ? 'Stay on track, achieve more. ✨'
              : activeNav === 'study'
                ? 'Study well - Owly'
                : activeNav === 'gwa'
                  ? 'Track your progress and achieve more.'
                : today()}
          </p>
        </div>
        <div className="home-topbar-right">
          {activeNav === 'home' ? (
            <>
              <button
                className="topbar-btn"
                type="button"
                title="Refresh dashboard"
                aria-label="Refresh dashboard"
                onClick={() => window.location.reload()}
              >
                ↻
              </button>
              <button
                className="topbar-btn"
                type="button"
                title="Open schedule"
                aria-label="Open schedule"
                onClick={() => setActiveNav('schedule')}
              >
                <IconSchedule />
              </button>
            </>
          ) : activeNav !== 'study' && activeNav !== 'gwa' ? (
            <div className="topbar-streak">
              <span>💧</span>
              <strong>{streak}</strong>
              <span style={{ fontSize:11, fontWeight:400, color:'#5a8aaa' }}>streak</span>
            </div>
          ) : null}
          {activeNav !== 'home' && (
            <div style={{ position:'relative' }} ref={settingsRef}>
              <button className="topbar-btn" onClick={() => setSettingsOpen(o => !o)} title="Settings">⚙️</button>
              {settingsOpen && (
                <div className="settings-dropdown">
                  <button onClick={() => setSettingsOpen(false)}>👤 &nbsp;Profile</button>
                  <button onClick={() => setSettingsOpen(false)}>⚙️ &nbsp;Settings</button>
                  <hr />
                  <button className="danger" onClick={handleLogout}>🚪 &nbsp;Sign out</button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className={`home-content${['study', 'gwa'].includes(activeNav) ? ' has-themed-topbar' : ''}${activeNav === 'schedule' ? ' schedule-content' : ''}`}>

        {/* Tasks & Events */}
        {activeNav === 'tasks'    && <TasksEvents />}

        {/* Placeholders */}
        {activeNav === 'schedule' && <Schedule />}
        {activeNav === 'study'    && <Study />}
        {activeNav === 'gwa'      && <GwaCalculato />}

        {/* Home Dashboard */}
        {activeNav === 'home' && (
          <>
            {/* Hero */}
            <section className="home-hero">
              <div className="home-hero-brand">ESKWELA TA</div>
              <img className="home-mascot" src={startImage} alt="Eskwela Ta mascot" />
              <div className="home-speech">
                <strong>Hello, {displayName}!</strong>
                <span>{verse.text}</span>
                <small>{verse.ref}</small>
              </div>
              <div className="home-hero-spacer" />
              <div className="home-hero-streak" aria-label={`${streak} day streak`}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5C9.4 6.3 5.2 11 5.2 15.1a6.8 6.8 0 0 0 13.6 0C18.8 11 14.6 6.3 12 2.5Z" fill="currentColor"/><path d="M9 16.5a3 3 0 0 0 3 3" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span>{streak}</span>
              </div>
              <div className="home-hero-settings" ref={settingsRef}>
                <button className="home-hero-settings-button" type="button" aria-label="Settings" title="Settings" onClick={() => setSettingsOpen(open => !open)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.4 13.5 21 14.7l-1.6 2.8-1.9-.8a7.8 7.8 0 0 1-1.6.9l-.3 2h-3.2l-.3-2a7.8 7.8 0 0 1-1.6-.9l-1.9.8L7 14.7l1.6-1.2a7 7 0 0 1 0-1.9L7 10.4l1.6-2.8 1.9.8a7.8 7.8 0 0 1 1.6-.9l.3-2h3.2l.3 2a7.8 7.8 0 0 1 1.6.9l1.9-.8 1.6 2.8-1.6 1.2a7 7 0 0 1 0 1.9ZM14 12a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z" fill="currentColor"/></svg>
                </button>
                {settingsOpen && (
                  <div className="settings-dropdown">
                    <button onClick={() => setSettingsOpen(false)}>👤 &nbsp;Profile</button>
                    <button onClick={() => setSettingsOpen(false)}>⚙️ &nbsp;Settings</button>
                    <hr />
                    <button className="danger" onClick={handleLogout}>🚪 &nbsp;Sign out</button>
                  </div>
                )}
              </div>
            </section>

            {/* Two-column grid */}
            <div className="home-grid">

              {/* Left */}
              <div>
                <div className="home-today">
                  <svg className="home-today-icon" viewBox="0 0 32 32" aria-hidden="true">
                    <path d="M4 7.5h8a6 6 0 0 1 6 6v13a5 5 0 0 0-5-4H4zM28 7.5h-8a6 6 0 0 0-2 0M18 26.5a5 5 0 0 1 5-4h5v-15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
                    <path d="M18 13.5v13a5 5 0 0 1 5-4h5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
                  </svg>
                  <div>
                  <h2>No classes today</h2>
                  <p>Enjoy your break, bro.</p>
                  </div>
                </div>

                <button className="home-note" onClick={() => setNoteModalOpen(true)}>
                  <div className="home-note-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M4 4h13v13H4z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m9 15 1.2-3.2L18.6 3.4a1.7 1.7 0 0 1 2.4 2.4l-8.4 8.4L9 15Z" fill="currentColor"/><path d="M7 20h13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </div>
                  <div className="home-note-text">
                    <strong>Make a study note</strong>
                    <span>Upload PDF to convert into a Note</span>
                  </div>
                </button>

                {/* Classes card */}
                <div className="home-card" style={{ marginBottom:20 }}>
                  <div className="home-card-header">
                    <div className="home-card-title"><span className="home-section-line" />Classes</div>
                    <span className="home-card-count">0/0</span>
                  </div>
                  <div className="home-card-body">
                    <div className="home-empty">
                      <span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 3h10l-1 5 4 3v2H4v-2l4-3-1-5ZM8 13l1.5 3h5L16 13M7 20h10M9 16v2m6-2v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/></svg></span>
                      <p>No classes today</p>
                    </div>
                  </div>
                </div>

                {/* Tasks card */}
                <div className="home-card">
                  <div className="home-card-header">
                    <div className="home-card-title"><span className="home-section-line" />Tasks &amp; Deadlines</div>
                    <span className="home-card-count">{doneTasks}/{totalTasks}</span>
                  </div>

                  {tasks.length === 0 ? (
                    <div className="home-card-body">
                      <div className="home-empty">
                        <span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 0 0-2 2v13h16V7a2 2 0 0 0-2-2h-2M9 3h6v4H9zM8 11h8m-8 4h8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"/></svg></span>
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
                              className={`task-check${task.done?' done':''}`}
                              onClick={() => toggleTask(task.id)}
                            >{task.done && '✓'}</button>
                            <div className="task-info">
                              <div className={`task-name${task.done?' done':''}`}>{task.name}</div>
                              {task.due && (
                                <div className={`task-due${isOverdue?' overdue':''}`}>
                                  {isOverdue ? '⚠ ' : ''}Due: {new Date(task.due).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}
                                </div>
                              )}
                            </div>
                            <button className="task-delete" onClick={() => deleteTask(task.id)}>×</button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>
                {inlineTaskOpen ? (
                  <form className="home-add-task-row" onSubmit={addTaskInline}>
                    <input type="text" placeholder="Task name" value={newTask} onChange={e => setNewTask(e.target.value)} autoFocus />
                    <input type="date" aria-label="Due date" value={newDue} onChange={e => setNewDue(e.target.value)} />
                    <button type="submit">Add</button>
                    <button type="button" className="home-add-task-cancel" onClick={() => { setInlineTaskOpen(false); setNewTask(''); setNewDue('') }}>Cancel</button>
                  </form>
                ) : (
                  <button className="home-add-task-trigger" type="button" onClick={() => setInlineTaskOpen(true)}>＋ Add task</button>
                )}
              </div>

              {/* Right */}
              <div className="home-right">
                {/* Quick stats */}
                <div className="home-card">
                  <div className="home-card-header">
                    <div className="home-card-title"><span className="home-section-line" />Quick Stats</div>
                  </div>
                  <div className="stat-grid">
                    <div className="stat-box"><div className="stat-num">{totalTasks}</div><div className="stat-label">Total Tasks</div></div>
                    <div className="stat-box"><div className="stat-num">{doneTasks}</div><div className="stat-label">Completed</div></div>
                    <div className="stat-box"><div className="stat-num">{totalTasks-doneTasks}</div><div className="stat-label">Remaining</div></div>
                    <div className="stat-box"><div className="stat-num">{streak}</div><div className="stat-label">Day Streak</div></div>
                  </div>
                </div>

                {/* Upcoming */}
                <div className="home-card">
                  <div className="home-card-header">
                    <div className="home-card-title"><span className="home-section-line" />Upcoming</div>
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

                {/* Verse */}
                <div className="home-card">
                  <div className="home-card-header">
                    <div className="home-card-title"><span className="home-section-line" />Verse of the Day</div>
                  </div>
                  <div className="home-card-body">
                    <p style={{ fontSize:13, color:'#42566a', lineHeight:1.6, fontStyle:'italic', margin:0 }}>{verse.text}</p>
                    <p style={{ fontSize:11, color:'#8fa0b0', marginTop:8 }}>{verse.ref}</p>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}

      </main>

      <nav className="home-mobile-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ key, icon, label }) => (
          <button
            key={key}
            className={`home-mobile-nav-item${activeNav === key ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveNav(key)}
          >
            <span>{icon}</span>
            <small>{key === 'tasks' ? 'Tasks & Events' : key === 'gwa' ? 'GWA Calculator' : label}</small>
          </button>
        ))}
      </nav>

      {activeNav === 'home' && (
        <>
          {quickActionsOpen && (
            <div className="home-quick-actions" aria-label="Quick actions">
              <button
                type="button"
                className="home-quick-action"
                onClick={() => {
                  setQuickActionsOpen(false)
                  setActiveNav('schedule')
                }}
              >
                <span>Upload schedule</span>
                <i className="upload">+</i>
              </button>
              <button
                type="button"
                className="home-quick-action"
                onClick={() => {
                  setQuickActionsOpen(false)
                  setActiveNav('schedule')
                }}
              >
                <span>Edit schedule</span>
                <i className="edit">+</i>
              </button>
              <button
                type="button"
                className="home-quick-action"
                onClick={() => {
                  setQuickActionsOpen(false)
                  setNoteModalOpen(true)
                }}
              >
                <span>Study note</span>
                <i className="study">+</i>
              </button>
            </div>
          )}
          <button
            className={`home-floating-add${quickActionsOpen ? ' open' : ''}`}
            type="button"
            aria-label={quickActionsOpen ? "Close quick actions" : "Open quick actions"}
            aria-expanded={quickActionsOpen}
            title={quickActionsOpen ? "Close quick actions" : "Open quick actions"}
            onClick={() => setQuickActionsOpen(open => !open)}
          >
            {quickActionsOpen ? '×' : '+'}
          </button>
        </>
      )}

      {/* ── Study Note Modal ─────────────────────────────────── */}
      {noteModalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target===e.currentTarget) { setNoteModalOpen(false); setUploadedFile(null) } }}>
          <div className="modal-box" role="dialog" aria-modal="true">
            <h2>📝 Make a Study Note</h2>
            <div className="note-modal-body">
              <label className="note-upload-zone" htmlFor="pdf-upload">
                <span>📄</span>
                {uploadedFile
                  ? <span className="note-upload-name">✓ {uploadedFile.name}</span>
                  : <>Click to upload a PDF<br /><small>or drag and drop it here</small></>
                }
                <input id="pdf-upload" type="file" accept="application/pdf" ref={fileRef} onChange={handleFileChange} />
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => { setNoteModalOpen(false); setUploadedFile(null) }}>Cancel</button>
              <button
                className="btn-add"
                disabled={!uploadedFile}
                style={{ opacity: uploadedFile?1:0.5, cursor: uploadedFile?'pointer':'not-allowed' }}
                onClick={() => {
                  alert(`"${uploadedFile.name}" uploaded! (PDF conversion coming soon)`)
                  setNoteModalOpen(false); setUploadedFile(null)
                }}
              >Convert to Note</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import startImage from '../assets/start-transparent.png'
import '../styles/Home.css'
import Navbar, { ScheduleIcon } from '../components/navbar'
import ClassReminderNotification from '../components/ClassReminderNotification'
import { DEFAULT_CLASSES, parseScheduleCsv, SCHEDULE_STORAGE_KEY } from '../services/schedule'
import TasksEvents, { AddItemModal } from './TasksEvents'
import Study from './Study'
import GwaCalculato from './GwaCalculato'
import Schedule from './Schedule'

const VERSES = [
  { text: '"Commit to the Lord whatever you do, and He will establish your plans."', ref: '– Proverbs 16:3' },
  { text: '"I can do all things through Christ who strengthens me."', ref: '– Philippians 4:13' },
  { text: '"Study to show yourself approved unto God."', ref: '– 2 Timothy 2:15' },
  { text: '"The beginning of wisdom is this: Get wisdom."', ref: '– Proverbs 4:7' },
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

function readTaskArray(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function isValidScheduleClass(item) {
  return item
    && Number.isInteger(item.day)
    && item.day >= 0
    && item.day < 7
    && typeof item.name === 'string'
    && /^\d{2}:\d{2}$/.test(item.start)
    && /^\d{2}:\d{2}$/.test(item.end)
    && item.end > item.start
}

function readScheduleClasses() {
  try {
    const saved = JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY))
    return Array.isArray(saved) ? saved : DEFAULT_CLASSES
  } catch (error) {
    console.error('Could not read the saved schedule.', error)
    return DEFAULT_CLASSES
  }
}

function scheduleTimeInMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function formatScheduleTime(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
}

function getUpcomingSchedule(classes, now) {
  const todayIndex = (now.getDay() + 6) % 7
  return classes.filter(isValidScheduleClass).map(item => {
    const startMinutes = scheduleTimeInMinutes(item.start)
    const endMinutes = scheduleTimeInMinutes(item.end)
    const daysAhead = (item.day - todayIndex + 7) % 7
    const startsAt = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + daysAhead,
      Math.floor(startMinutes / 60),
      startMinutes % 60,
    )
    const endsAt = new Date(startsAt.getTime() + (endMinutes - startMinutes) * 60_000)

    if (endsAt <= now) {
      startsAt.setDate(startsAt.getDate() + 7)
      endsAt.setDate(endsAt.getDate() + 7)
    }

    return { ...item, startsAt, endsAt }
  }).sort((first, second) => first.startsAt - second.startsAt)
}

function loadHomeTasks() {
  const taskItems = readTaskArray('te_items')
  const legacyTasks = readTaskArray('skwela_tasks')
  if (!legacyTasks.length) return taskItems

  const existingIds = new Set(taskItems.map(task => String(task.id)))
  const migratedTasks = legacyTasks
    .filter(task => !existingIds.has(String(task.id)))
    .map(task => ({
      ...task,
      type: task.type || 'task',
      category: task.category || 'General',
      remindTime: task.remindTime || '07:00',
      remindBefore: task.remindBefore ?? false,
    }))
  const combined = [...taskItems, ...migratedTasks]
  localStorage.setItem('te_items', JSON.stringify(combined))
  localStorage.removeItem('skwela_tasks')
  return combined
}

/* ══════════════════════════════════════════════════════════════
   Homepage
   ══════════════════════════════════════════════════════════════ */
export default function Homepage() {
  const navigate = useNavigate()
  const location = useLocation()

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
  const attendanceEnabled = localStorage.getItem('skwela_attendance_streak_enabled') !== 'false'

  /* ── dashboard tasks ────────────────────────────────────── */
  const [tasks, setTasks] = useState(loadHomeTasks)
  const [scheduleClasses, setScheduleClasses] = useState(readScheduleClasses)
  const [scheduleTime, setScheduleTime] = useState(() => new Date())
  function saveTasks(next) {
    setTasks(next)
    localStorage.setItem('te_items', JSON.stringify(next))
  }
  function toggleTask(id) {
    saveTasks(tasks.map(task => task.id === id
      ? { ...task, done: !task.done, completedAt: !task.done ? new Date().toISOString() : undefined }
      : task))
  }
  function deleteTask(id) { saveTasks(tasks.filter(task => task.id !== id)) }

  useEffect(() => {
    function refreshSchedule() {
      setScheduleClasses(readScheduleClasses())
      setScheduleTime(new Date())
    }

    const clock = window.setInterval(() => setScheduleTime(new Date()), 30_000)
    window.addEventListener('focus', refreshSchedule)
    window.addEventListener('storage', refreshSchedule)
    return () => {
      window.clearInterval(clock)
      window.removeEventListener('focus', refreshSchedule)
      window.removeEventListener('storage', refreshSchedule)
    }
  }, [])

  const [addItemModalOpen, setAddItemModalOpen] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [scheduleImportOpen, setScheduleImportOpen] = useState(false)
  const [scheduleImportError, setScheduleImportError] = useState('')
  const scheduleFileRef = useRef(null)
  function addHomeItem(item) {
    saveTasks([...tasks, item])
    setAddItemModalOpen(false)
  }

  async function handleScheduleUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const importedClasses = parseScheduleCsv(await file.text())
      localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(importedClasses))
      setScheduleClasses(importedClasses)
      setScheduleTime(new Date())
      setScheduleImportError('')
      setScheduleImportOpen(false)
      setActiveNav('schedule')
    } catch (error) {
      setScheduleImportError(
        error instanceof Error ? error.message : 'Could not import this schedule file.',
      )
    }
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
  useEffect(() => {
    if (!scheduleImportOpen) return undefined
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setScheduleImportOpen(false)
        setScheduleImportError('')
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [scheduleImportOpen])
  function handleLogout() { localStorage.removeItem('skwela_user'); navigate('/login') }

  /* ── active nav ────────────────────────────────────────── */
  const [activeNav, setActiveNav] = useState(() => (
    Object.prototype.hasOwnProperty.call(PAGE_TITLES, location.state?.activePage)
      ? location.state.activePage
      : 'home'
  ))
  function handleNavigate(page) {
    if (page === 'home') {
      setTasks(loadHomeTasks())
      setScheduleClasses(readScheduleClasses())
      setScheduleTime(new Date())
    }
    setActiveNav(page)
  }

  const doneTasks  = tasks.filter(t => t.done).length
  const totalTasks = tasks.length
  const currentMinutes = scheduleTime.getHours() * 60 + scheduleTime.getMinutes()
  const todayIndex = (scheduleTime.getDay() + 6) % 7
  const todayClasses = scheduleClasses
    .filter(item => isValidScheduleClass(item) && item.day === todayIndex)
    .sort((first, second) => scheduleTimeInMinutes(first.start) - scheduleTimeInMinutes(second.start))
  const currentClass = todayClasses.find(item => (
    scheduleTimeInMinutes(item.start) <= currentMinutes
    && scheduleTimeInMinutes(item.end) > currentMinutes
  ))
  const nextTodayClass = todayClasses.find(item => scheduleTimeInMinutes(item.start) > currentMinutes)
  const scheduledOccurrences = getUpcomingSchedule(scheduleClasses, scheduleTime)
  const nearestUpcomingClass = scheduledOccurrences.find(item => item.startsAt > scheduleTime)
  const upcomingClasses = scheduledOccurrences.slice(0, 3)
  const todayHeadline = currentClass
    ? `${currentClass.name} is in progress`
    : nextTodayClass
      ? `Next class: ${nextTodayClass.name}`
      : todayClasses.length
        ? 'All classes finished'
        : 'No classes today'
  const todayMessage = currentClass
    ? `Until ${formatScheduleTime(currentClass.end)}${currentClass.room ? ` · ${currentClass.room}` : ''}`
    : nextTodayClass
      ? `${formatScheduleTime(nextTodayClass.start)}${nextTodayClass.room ? ` · ${nextTodayClass.room}` : ''}`
      : todayClasses.length
        ? `You had ${todayClasses.length} ${todayClasses.length === 1 ? 'class' : 'classes'} today.`
        : 'Enjoy your break, bro.'

  /* ── render ────────────────────────────────────────────── */
  return (
    <div className={`home-page${activeNav === 'home' ? ' home-mode' : ''}${activeNav === 'study' ? ' study-mode' : ''}${activeNav === 'gwa' ? ' gwa-mode' : ''}${activeNav === 'schedule' ? ' schedule-mode' : ''}${activeNav === 'tasks' ? ' tasks-mode' : ''}`}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="home-sidebar">
        <div className="home-sidebar-brand">
        <img className="owl" src={startImage} alt="" />
          <span>ESKWELA TA</span>
        </div>

        <Navbar activePage={activeNav} onNavigate={handleNavigate} placement="sidebar" />

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
                <ScheduleIcon />
              </button>
            </>
          ) : attendanceEnabled && activeNav !== 'study' && activeNav !== 'gwa' ? (
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
                  <button onClick={() => { setSettingsOpen(false); navigate('/settings') }}>⚙️ &nbsp;Settings</button>
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
              {attendanceEnabled && (
                <div className="home-hero-streak" aria-label={`${streak} day streak`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5C9.4 6.3 5.2 11 5.2 15.1a6.8 6.8 0 0 0 13.6 0C18.8 11 14.6 6.3 12 2.5Z" fill="currentColor"/><path d="M9 16.5a3 3 0 0 0 3 3" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <span>{streak}</span>
                </div>
              )}
              <div className="home-hero-settings">
                <button className="home-hero-settings-button" type="button" aria-label="Settings" title="Settings" onClick={() => navigate('/settings')}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.4 13.5 21 14.7l-1.6 2.8-1.9-.8a7.8 7.8 0 0 1-1.6.9l-.3 2h-3.2l-.3-2a7.8 7.8 0 0 1-1.6-.9l-1.9.8L7 14.7l1.6-1.2a7 7 0 0 1 0-1.9L7 10.4l1.6-2.8 1.9.8a7.8 7.8 0 0 1 1.6-.9l.3-2h3.2l.3 2a7.8 7.8 0 0 1 1.6.9l1.9-.8 1.6 2.8-1.6 1.2a7 7 0 0 1 0 1.9ZM14 12a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z" fill="currentColor"/></svg>
                </button>
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
                  <h2>{todayHeadline}</h2>
                  <p>{todayMessage}</p>
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
                <div className="home-card home-classes-card">
                  <div className="home-card-header">
                    <div className="home-card-title"><span className="home-section-line" />Classes</div>
                    <span className="home-card-count">{nearestUpcomingClass ? '0/1' : '0/0'}</span>
                  </div>
                  {!nearestUpcomingClass ? (
                    <div className="home-card-body">
                      <div className="home-empty">
                        <span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 3h10l-1 5 4 3v2H4v-2l4-3-1-5ZM8 13l1.5 3h5L16 13M7 20h10M9 16v2m6-2v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/></svg></span>
                        <p>No upcoming classes</p>
                      </div>
                    </div>
                  ) : (
                    <div className="home-card-body home-class-list" aria-label="Next upcoming class">
                      <div className="home-class-item" key={nearestUpcomingClass.id}>
                        <div className={`schedule-dot ${nearestUpcomingClass.color || 'blue'}`} />
                        <div className="home-class-info">
                          <div className="schedule-name">{nearestUpcomingClass.name}</div>
                          <div className="schedule-time">
                            {nearestUpcomingClass.startsAt.toDateString() === scheduleTime.toDateString()
                              ? ''
                              : `${nearestUpcomingClass.startsAt.toLocaleDateString(undefined, { weekday: 'short' })} · `}
                            {formatScheduleTime(nearestUpcomingClass.start)} – {formatScheduleTime(nearestUpcomingClass.end)}
                          </div>
                          <div className="home-class-status upcoming">Up next</div>
                        </div>
                      </div>
                    </div>
                  )}
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
                <button
                  className="home-add-task-trigger"
                  type="button"
                  onClick={() => setAddItemModalOpen(true)}
                >
                  ＋ Add task
                </button>
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
                    {attendanceEnabled && <div className="stat-box"><div className="stat-num">{streak}</div><div className="stat-label">Day Streak</div></div>}
                  </div>
                </div>

                {/* Upcoming */}
                <div className="home-card">
                  <div className="home-card-header">
                    <div className="home-card-title"><span className="home-section-line" />Upcoming</div>
                  </div>
                  <div className="schedule-list">
                    {upcomingClasses.length ? upcomingClasses.map(classItem => {
                      const inProgress = classItem.startsAt <= scheduleTime && classItem.endsAt > scheduleTime
                      const dayLabel = classItem.startsAt.toDateString() === scheduleTime.toDateString()
                        ? 'Today'
                        : classItem.startsAt.toLocaleDateString(undefined, { weekday: 'short' })
                      return (
                        <div key={classItem.id} className="schedule-item">
                          <div className={`schedule-dot ${classItem.color || 'blue'}`} />
                          <div className="schedule-info">
                            <div className="schedule-name">{classItem.name}</div>
                            <div className="schedule-time">
                              {inProgress
                                ? `Now · until ${formatScheduleTime(classItem.end)}`
                                : `${dayLabel} · ${formatScheduleTime(classItem.start)}`}
                            </div>
                          </div>
                        </div>
                      )
                    }) : (
                      <div className="schedule-item">
                        <div className="schedule-dot" />
                        <div className="schedule-info">
                          <div className="schedule-name">No upcoming classes</div>
                          <div className="schedule-time">Add classes to your schedule</div>
                        </div>
                      </div>
                    )}
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

      <Navbar activePage={activeNav} onNavigate={handleNavigate} />

      <ClassReminderNotification
        classItem={nearestUpcomingClass}
        displayName={displayName}
        scheduleTime={scheduleTime}
      />

      {activeNav === 'home' && (
        <>
          {quickActionsOpen && (
            <div className="home-quick-actions" aria-label="Quick actions">
              <button
                type="button"
                className="home-quick-action"
                onClick={() => {
                  setQuickActionsOpen(false)
                  setScheduleImportError('')
                  setScheduleImportOpen(true)
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

      {scheduleImportOpen && (
        <div
          className="schedule-import-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setScheduleImportOpen(false)
              setScheduleImportError('')
            }
          }}
        >
          <section
            className="schedule-import-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-import-title"
          >
            <header className="schedule-import-header">
              <button
                className="schedule-import-back"
                type="button"
                aria-label="Back"
                onClick={() => {
                  setScheduleImportOpen(false)
                  setScheduleImportError('')
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m15 18-6-6 6-6M9 12h12" />
                </svg>
              </button>
              <h2 id="schedule-import-title">Import Schedule</h2>
              <span aria-hidden="true" />
            </header>
            <button
              className="schedule-import-upload"
              type="button"
              autoFocus
              onClick={() => scheduleFileRef.current?.click()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 16V4m0 0L8 8m4-4 4 4M5 14v5h14v-5" />
              </svg>
              Upload schedule
            </button>
            <input
              ref={scheduleFileRef}
              className="schedule-import-input"
              type="file"
              accept=".csv,text/csv"
              aria-label="Choose a schedule CSV file"
              onChange={handleScheduleUpload}
            />
            {scheduleImportError && (
              <p className="schedule-import-error" role="alert">{scheduleImportError}</p>
            )}
            <span className="schedule-import-or">Or</span>
            <button
              className="schedule-import-manual"
              type="button"
              onClick={() => {
                setScheduleImportOpen(false)
                setScheduleImportError('')
                setActiveNav('schedule')
              }}
            >
              EDIT schedule manually
            </button>
          </section>
        </div>
      )}

      {addItemModalOpen && (
        <AddItemModal onClose={() => setAddItemModalOpen(false)} onAdd={addHomeItem} />
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

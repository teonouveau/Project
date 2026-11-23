import { useState, useCallback } from 'react'
import '../styles/TasksEvents.css'

/* ── helpers ───────────────────────────────────────────────── */
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function daysUntil(iso) {
  if (!iso) return null
  const now = new Date(); now.setHours(0,0,0,0)
  const due = new Date(iso + 'T00:00:00')
  return Math.ceil((due - now) / 86400000)
}

function badge(item) {
  if (item.done) return { text: 'Done', cls: 'done-b' }
  const d = daysUntil(item.due)
  if (d === null) return null
  if (d < 0)  return { text: `${Math.abs(d)}d late`, cls: 'overdue' }
  if (d <= 3) return { text: `in ${d}d`, cls: 'soon' }
  return { text: `in ${d}d`, cls: 'far' }
}

function groupByCategory(items) {
  const map = {}
  items.forEach(item => {
    const cat = item.category || 'General'
    if (!map[cat]) map[cat] = []
    map[cat].push(item)
  })
  return map
}

function nextDue(items) {
  const pending = items.filter(i => !i.done && i.due).sort((a,b) => a.due.localeCompare(b.due))
  return pending[0]?.due || null
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function groupByDate(items) {
  const map = {}
  items.forEach(item => {
    const key = item.completedAt ? item.completedAt.split('T')[0] : 'Unknown'
    if (!map[key]) map[key] = []
    map[key].push(item)
  })
  return map
}

/* ── Storage helpers ───────────────────────────────────────── */
function load(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def } catch { return def }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

/* ══════════════════════════════════════════════════════════════
   Calendar component
   ══════════════════════════════════════════════════════════════ */
function Calendar({ selected, onChange }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const initDate = selected ? new Date(selected + 'T00:00:00') : today
  const [view, setView] = useState({ year: initDate.getFullYear(), month: initDate.getMonth() })

  function prevMonth() {
    setView(v => {
      const m = v.month === 0 ? 11 : v.month - 1
      const y = v.month === 0 ? v.year - 1 : v.year
      return { year: y, month: m }
    })
  }
  function nextMonth() {
    setView(v => {
      const m = v.month === 11 ? 0 : v.month + 1
      const y = v.month === 11 ? v.year + 1 : v.year
      return { year: y, month: m }
    })
  }

  // Build grid
  const firstDay = new Date(view.year, view.month, 1).getDay()
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const daysInPrev  = new Date(view.year, view.month, 0).getDate()

  const cells = []
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, thisMonth: false })
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, thisMonth: true })
  while (cells.length % 7 !== 0)
    cells.push({ day: cells.length - firstDay - daysInMonth + 1, thisMonth: false })

  function cellISO(cell) {
    if (!cell.thisMonth) return null
    return `${view.year}-${String(view.month+1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`
  }

  return (
    <div className="te-calendar">
      <div className="te-cal-header">
        <button className="te-cal-nav" onClick={prevMonth}>‹</button>
        <span className="te-cal-month">{MONTHS_LONG[view.month]} {view.year}</span>
        <button className="te-cal-nav" onClick={nextMonth}>›</button>
      </div>
      <div className="te-cal-grid">
        {DAYS_SHORT.map(d => <div key={d} className="te-cal-dow">{d}</div>)}
        {cells.map((cell, i) => {
          const iso = cellISO(cell)
          const isToday = iso && iso === todayISO()
          const isSel   = iso && iso === selected
          return (
            <button
              key={i}
              className={[
                'te-cal-day',
                !cell.thisMonth ? 'other-month' : '',
                isToday ? 'today' : '',
                isSel   ? 'selected' : '',
              ].join(' ')}
              onClick={() => iso && onChange(iso)}
              disabled={!cell.thisMonth}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Task Form Modal
   ══════════════════════════════════════════════════════════════ */
const CATEGORIES = ['General','BSIT PARSERS','Math','Science','English','Filipino','PE','Others']

function TaskFormModal({ onClose, onAdd }) {
  const [name, setName]       = useState('')
  const [due,  setDue]        = useState(addDays(todayISO(), 7))
  const [remind, setRemind]   = useState(true)
  const [category, setCat]    = useState('General')
  const [quickSel, setQuick]  = useState('')

  function applyQuick(label) {
    setQuick(label)
    if (label === 'Tomorrow')   setDue(addDays(todayISO(), 1))
    if (label === 'In 3 days')  setDue(addDays(todayISO(), 3))
    if (label === 'Next week')  setDue(addDays(todayISO(), 7))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      id: Date.now(),
      type: 'task',
      name: name.trim(),
      due,
      category,
      remind,
      done: false,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className="te-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="te-modal">
        <p className="te-form-title">NEW TASK</p>
        <h2 className="te-form-heading">NEW TASK</h2>
        <form onSubmit={handleSubmit}>
          <input
            className="te-name-input"
            placeholder="e.g., Change assignment"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />

          {/* Date row */}
          <div className="te-row-btn" style={{ marginBottom: 6 }}>
            <span className="te-row-btn-icon">📅</span>
            <div className="te-row-btn-body">
              <div className="te-row-btn-label">{formatDate(due) || 'Pick a date'}</div>
            </div>
            <input
              type="date"
              value={due}
              min={todayISO()}
              onChange={e => { setDue(e.target.value); setQuick('') }}
              style={{ position:'absolute', opacity:0, width:'100%', inset:0, cursor:'pointer', zIndex:2 }}
            />
            <span className="te-row-btn-arrow">›</span>
          </div>

          <div className="te-quick-dates">
            {['Tomorrow','In 3 days','Next week'].map(q => (
              <button
                key={q} type="button"
                className={`te-quick-chip${quickSel === q ? ' active' : ''}`}
                onClick={() => applyQuick(q)}
              >{q}</button>
            ))}
          </div>

          {/* Remind me */}
          <div className="te-row-btn">
            <span className="te-row-btn-icon">🔔</span>
            <div className="te-row-btn-body">
              <div className="te-row-btn-label">Remind me</div>
              <div className="te-row-btn-sub">Default to 7:00 AM</div>
            </div>
            <span className="te-row-btn-arrow">›</span>
          </div>

          {/* Remind before due toggle */}
          <div className="te-toggle-row">
            <span className="te-toggle-icon">🌿</span>
            <div className="te-toggle-body">
              <div className="te-toggle-label">Remind me before due</div>
              <div className="te-toggle-sub">{remind ? 'On' : 'Off'}</div>
            </div>
            <label className="te-toggle">
              <input type="checkbox" checked={remind} onChange={e => setRemind(e.target.checked)} />
              <span className="te-toggle-track" />
            </label>
          </div>

          {/* Category */}
          <div className="te-category-row">
            <div className="te-category-cb" />
            <span className="te-category-label">Category:</span>
            <select className="te-category-select" value={category} onChange={e => setCat(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <span style={{ color:'#c0d4e8', fontSize:14 }}>›</span>
          </div>

          <div className="te-form-actions">
            <button type="button" className="te-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="te-btn-submit">Add Task</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Event Form Modal  (with calendar)
   ══════════════════════════════════════════════════════════════ */
function EventFormModal({ onClose, onAdd }) {
  const [name, setName]       = useState('')
  const [startDate, setStart] = useState(todayISO())
  const [duration, setDur]    = useState(5)
  const [category, setCat]    = useState('General')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      id: Date.now(),
      type: 'event',
      name: name.trim(),
      due: addDays(startDate, duration - 1),
      startDate,
      duration,
      category,
      done: false,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className="te-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="te-modal">
        <p className="te-form-title">NEW EVENT</p>
        <form onSubmit={handleSubmit}>
          <input
            className="te-name-input"
            placeholder="e.g., CyberDays"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />

          {/* Duration */}
          <div className="te-duration-row">
            <div>
              <div className="te-duration-label">How many days?</div>
              <div className="te-duration-sub">{formatDate(startDate)}</div>
            </div>
            <div className="te-duration-ctrl">
              <button type="button" className="te-duration-btn"
                onClick={() => setDur(d => Math.max(1, d-1))}>−</button>
              <span className="te-duration-num">{duration}</span>
              <button type="button" className="te-duration-btn"
                onClick={() => setDur(d => d+1)}>+</button>
            </div>
          </div>

          <p style={{ fontSize:12, color:'#8fa0b0', margin:'0 0 8px' }}>Tap a day to set when it starts</p>

          <Calendar selected={startDate} onChange={setStart} />

          {/* Category */}
          <div className="te-category-row">
            <div className="te-category-cb" />
            <span className="te-category-label">Category:</span>
            <select className="te-category-select" value={category} onChange={e => setCat(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <span style={{ color:'#c0d4e8', fontSize:14 }}>›</span>
          </div>

          <div className="te-form-actions">
            <button type="button" className="te-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="te-btn-submit">Add Event</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Repeating Reminder Modal
   ══════════════════════════════════════════════════════════════ */
const DOW = ['S','M','T','W','T','F','S']

function RepeatFormModal({ onClose, onAdd }) {
  const [name, setName]     = useState('')
  const [days, setDays]     = useState([])  // 0=Sun … 6=Sat
  const [time, setTime]     = useState('08:00')

  function toggleDay(i) {
    setDays(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i])
  }

  function applyPreset(preset) {
    if (preset === 'Weekdays') setDays([1,2,3,4,5])
    if (preset === 'Weekends') setDays([0,6])
    if (preset === 'Every day') setDays([0,1,2,3,4,5,6])
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      id: Date.now(),
      name: name.trim(),
      days,
      time,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className="te-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="te-modal">
        <p className="te-form-title">NEW REPEATING REMINDER</p>
        <form onSubmit={handleSubmit}>
          <input
            className="te-name-input"
            placeholder="e.g., Wash clothes"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />

          <p style={{ fontSize:12, fontWeight:600, color:'#42566a', margin:'0 0 8px' }}>Repeat on</p>

          <div className="te-preset-row">
            {['Weekdays','Weekends','Every day'].map(p => (
              <button key={p} type="button" className="te-preset-chip" onClick={() => applyPreset(p)}>{p}</button>
            ))}
          </div>

          <div className="te-days-row">
            {DOW.map((d,i) => (
              <button
                key={i} type="button"
                className={`te-day-chip${days.includes(i) ? ' active' : ''}`}
                onClick={() => toggleDay(i)}
              >{d}</button>
            ))}
          </div>

          {/* Time */}
          <div className="te-time-row">
            <span className="te-time-icon">🔔</span>
            <div className="te-time-label">
              <strong>Time</strong>
              <span>When should this fire?</span>
            </div>
            <input
              type="time"
              className="te-time-input"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
            <span style={{ color:'#c0d4e8', fontSize:14 }}>›</span>
          </div>

          <div className="te-form-actions">
            <button type="button" className="te-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="te-btn-submit">Add Reminder</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Checklist Item Modal
   ══════════════════════════════════════════════════════════════ */
function ChecklistModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ id: Date.now(), name: name.trim(), done: false })
  }
  return (
    <div className="te-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="te-modal">
        <p className="te-form-title">NEW CHECKLIST ITEM</p>
        <p style={{ fontSize:12, color:'#8fa0b0', margin:'0 0 14px' }}>Something quick you don't want to forget</p>
        <form onSubmit={handleSubmit}>
          <input
            className="te-name-input"
            placeholder="e.g., Bring project materials"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <div className="te-form-actions">
            <button type="button" className="te-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="te-btn-submit" style={{ background:'#f5a623' }}>Add Item</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Choose Type Sheet
   ══════════════════════════════════════════════════════════════ */
function ChooseTypeSheet({ onClose, onChoose }) {
  return (
    <div className="te-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="te-modal">
        <p className="te-choose-title">WHAT DO YOU WANT TO ADD?</p>
        <button className="te-choose-option" onClick={() => onChoose('task')}>
          <div className="te-choose-option-icon blue">📋</div>
          <div className="te-choose-option-text">
            <strong>Task</strong>
            <span>A single to-do with a due date, like an assignment or quiz</span>
          </div>
          <span className="te-choose-option-arrow">›</span>
        </button>
        <button className="te-choose-option" onClick={() => onChoose('event')}>
          <div className="te-choose-option-icon orange">📅</div>
          <div className="te-choose-option-text">
            <strong>Event</strong>
            <span>Spans several days, like "Exam days" or a school activity</span>
          </div>
          <span className="te-choose-option-arrow">›</span>
        </button>
        <button className="te-choose-cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════ */
export default function TasksEvents() {
  const [tab, setTab] = useState('pending')

  /* ── Pending items (tasks + events) ───────────────────── */
  const [items, setItems] = useState(() => load('te_items', []))
  function saveItems(next) { setItems(next); save('te_items', next) }

  function addItem(item) {
    saveItems([...items, item])
    setModal(null)
  }
  function toggleItem(id) {
    saveItems(items.map(i =>
      i.id === id
        ? { ...i, done: !i.done, completedAt: !i.done ? new Date().toISOString() : undefined }
        : i
    ))
  }
  function deleteItem(id) { saveItems(items.filter(i => i.id !== id)) }

  /* ── Repeating reminders ───────────────────────────────── */
  const [repeats, setRepeats] = useState(() => load('te_repeats', []))
  function saveRepeats(next) { setRepeats(next); save('te_repeats', next) }
  function addRepeat(r) { saveRepeats([...repeats, r]); setModal(null) }
  function deleteRepeat(id) { saveRepeats(repeats.filter(r => r.id !== id)) }

  /* ── Checklist ─────────────────────────────────────────── */
  const [clItems, setClItems] = useState(() => load('te_checklist', []))
  function saveClItems(next) { setClItems(next); save('te_checklist', next) }
  function addClItem(item) { saveClItems([...clItems, item]); setModal(null) }
  function toggleCl(id) { saveClItems(clItems.map(i => i.id===id ? {...i,done:!i.done} : i)) }
  function deleteCl(id) { saveClItems(clItems.filter(i => i.id!==id)) }

  /* ── Modals ────────────────────────────────────────────── */
  // null | 'choose' | 'task' | 'event' | 'repeat' | 'checklist'
  const [modal, setModal] = useState(null)

  function fabClick() {
    if (tab === 'pending')   setModal('choose')
    if (tab === 'repeats')   setModal('repeat')
    if (tab === 'checklist') setModal('checklist')
    // history tab FAB does nothing
  }

  /* ── Derived data ──────────────────────────────────────── */
  const pending  = items.filter(i => !i.done)
  const history  = items.filter(i =>  i.done)
  const groups   = groupByCategory(pending)
  const histGroups = groupByDate(history)

  /* ── Tab counts ────────────────────────────────────────── */
  const TAB_DATA = {
    pending:   { label: 'Pending',   icon: '', count: pending.length,   sub: `${items.filter(i=>i.done).length} task completed` },
    repeats:   { label: 'Repeats',   icon: '↻ ', count: repeats.length, sub: `${repeats.length} repeating reminders` },
    history:   { label: 'History',   icon: '◷ ', count: history.length, sub: `${history.length} task completed` },
    checklist: { label: 'Checklist', icon: '☰ ', count: clItems.length, sub: `${clItems.length} items` },
  }
  const cur = TAB_DATA[tab]

  /* ── render ────────────────────────────────────────────── */
  return (
    <div className="te-page">

      {/* Hero */}
      <div className="te-hero">
        <div className="te-hero-top">
          <div className="te-hero-title">
            <h2>Tasks &amp; Deadline Reminders</h2>
            <p>Stay on track, achieve more. ✨</p>
          </div>
          <div className="te-hero-actions">
            <button className="te-hero-btn" title="Sync">↻</button>
            <button className="te-hero-btn" title="Gallery">🖼</button>
            <button className="te-hero-btn" title="Settings">⚙️</button>
          </div>
        </div>

        <div className="te-tabs">
          {['pending','repeats','history','checklist'].map(t => (
            <button
              key={t}
              className={`te-tab${tab===t?' active':''}`}
              onClick={() => setTab(t)}
            >
              {TAB_DATA[t].icon}{TAB_DATA[t].label}
            </button>
          ))}
        </div>

        <div className="te-stat-card">
          <span className="te-stat-mascot">🦉</span>
          <div className="te-stat-body">
            <p className="te-stat-label">{cur.label}</p>
            <p className="te-stat-num">{cur.count}</p>
            <p className="te-stat-sub">Keep it up! 🔥</p>
            <div className="te-stat-pill">
              <span>📊</span>
              {cur.sub}
            </div>
          </div>
        </div>
      </div>

      {/* ── PENDING TAB ──────────────────────────────────────── */}
      {tab === 'pending' && (
        <>
          {pending.length === 0 ? (
            <div className="te-empty">
              <div className="te-empty-icon">🙂</div>
              <h3>Your plate is clear!</h3>
              <p>You have no pending tasks.<br/>Tap the + button to add new task and keep moving forward.</p>
            </div>
          ) : (
            <>
              <p className="te-swipe-hint">swipe right to mark as done, swipe left to mark as cancelled</p>
              {Object.entries(groups).map(([cat, catItems]) => (
                <div key={cat}>
                  <div className="te-group-header">
                    <div className="te-group-label">
                      <div className="te-group-icon">📁</div>
                      {cat}
                    </div>
                    <span className="te-group-next">
                      {nextDue(catItems) ? `Next: ${formatDate(nextDue(catItems))}` : ''}
                    </span>
                  </div>
                  {catItems.map(item => {
                    const b = badge(item)
                    return (
                      <div key={item.id} className="te-item-card">
                        <button
                          className={`te-item-check${item.done?' done':''}`}
                          onClick={() => toggleItem(item.id)}
                        >{item.done && '✓'}</button>
                        <div className="te-item-body">
                          <p className={`te-item-name${item.done?' done':''}`}>{item.name}</p>
                          <p className="te-item-meta">
                            {item.due && formatDate(item.due)} · 8:00 AM
                          </p>
                        </div>
                        {b && <span className={`te-item-badge ${b.cls}`}>{b.text}</span>}
                        <button className="te-item-delete" onClick={() => deleteItem(item.id)}>×</button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* ── REPEATS TAB ──────────────────────────────────────── */}
      {tab === 'repeats' && (
        <>
          {repeats.length === 0 ? (
            <div className="te-empty">
              <div className="te-empty-icon">↻</div>
              <h3>No repeating reminders</h3>
              <p>Set one up and it'll fire every week on the days you pick.<br/>Tap the + button to create one.</p>
            </div>
          ) : (
            repeats.map(r => {
              const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
              const on = r.days.length ? r.days.map(d => dayLabels[d]).join(', ') : 'No days set'
              return (
                <div key={r.id} className="te-item-card">
                  <span style={{ fontSize:22 }}>↻</span>
                  <div className="te-item-body">
                    <p className="te-item-name">{r.name}</p>
                    <p className="te-item-meta">{on} · {r.time}</p>
                  </div>
                  <button className="te-item-delete" onClick={() => deleteRepeat(r.id)}>×</button>
                </div>
              )
            })
          )}
        </>
      )}

      {/* ── HISTORY TAB ──────────────────────────────────────── */}
      {tab === 'history' && (
        <>
          {history.length === 0 ? (
            <div className="te-empty">
              <div className="te-empty-icon">📜</div>
              <h3>No completed tasks yet</h3>
              <p>Tasks you mark as done will appear here.</p>
            </div>
          ) : (
            Object.entries(histGroups)
              .sort(([a],[b]) => b.localeCompare(a))
              .map(([date, dateItems]) => (
                <div key={date}>
                  <p className="te-history-date">{formatDate(date)}</p>
                  {dateItems.map(item => (
                    <div key={item.id} className="te-history-card">
                      <div className="te-history-check">✓</div>
                      <div className="te-history-body">
                        <p className="te-history-name">{item.name}</p>
                        <p className="te-history-meta">
                          Due: {formatDate(item.due)} · Done at {item.completedAt ? new Date(item.completedAt).toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'}) : ''}
                        </p>
                      </div>
                      <button className="te-history-delete" onClick={() => deleteItem(item.id)}>🗑</button>
                    </div>
                  ))}
                </div>
              ))
          )}
        </>
      )}

      {/* ── CHECKLIST TAB ────────────────────────────────────── */}
      {tab === 'checklist' && (
        <>
          {clItems.length === 0 ? (
            <div className="te-empty">
              <div className="te-empty-icon">☰</div>
              <h3>Nothing on your checklist</h3>
              <p>A quick tick-off list for anything that doesn't need a due date.<br/>Tap the + button to add an item.</p>
            </div>
          ) : (
            clItems.map(item => (
              <div key={item.id} className="te-checklist-item">
                <button
                  className={`te-checklist-cb${item.done?' done':''}`}
                  onClick={() => toggleCl(item.id)}
                >{item.done && '✓'}</button>
                <span className={`te-checklist-name${item.done?' done':''}`}>{item.name}</span>
                <button className="te-item-delete" onClick={() => deleteCl(item.id)}>×</button>
              </div>
            ))
          )}
        </>
      )}

      {/* FAB — hidden on history tab */}
      {tab !== 'history' && (
        <button className="te-fab" onClick={fabClick} aria-label="Add">+</button>
      )}

      {/* ── Modals ───────────────────────────────────────────── */}
      {modal === 'choose'    && <ChooseTypeSheet onClose={() => setModal(null)} onChoose={t => setModal(t)} />}
      {modal === 'task'      && <TaskFormModal   onClose={() => setModal(null)} onAdd={addItem} />}
      {modal === 'event'     && <EventFormModal  onClose={() => setModal(null)} onAdd={addItem} />}
      {modal === 'repeat'    && <RepeatFormModal onClose={() => setModal(null)} onAdd={addRepeat} />}
      {modal === 'checklist' && <ChecklistModal  onClose={() => setModal(null)} onAdd={addClItem} />}
    </div>
  )
}

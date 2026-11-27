import { useState, useRef, useEffect, useCallback } from 'react'
import owlImage from '../assets/owl1-transparent.png'
import '../styles/TasksEvents.css'

/* ════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ════════════════════════════════════════════════════════════ */
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_LONG  = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December']
const DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DOW_LABELS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const CATEGORIES   = ['General','BSIT PARSERS','Math','Science','English','Filipino','PE','Others']

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}
function pad(n) { return String(n).padStart(2,'0') }

function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${pad(m)} ${ampm}`
}

function daysUntil(iso) {
  if (!iso) return null
  const now = new Date(); now.setHours(0,0,0,0)
  const due = new Date(iso + 'T00:00:00')
  return Math.ceil((due - now) / 86400000)
}

function getBadge(item) {
  const d = daysUntil(item.due)
  if (d === null) return null
  if (d < 0)  return { text: `${Math.abs(d)}d late`, cls: 'overdue' }
  if (d === 0) return { text: 'Today', cls: 'soon' }
  if (d <= 3) return { text: `in ${d}d`, cls: 'soon' }
  return { text: `in ${d}d`, cls: 'far' }
}

function groupBy(arr, fn) {
  return arr.reduce((acc, item) => {
    const key = fn(item)
    ;(acc[key] = acc[key] || []).push(item)
    return acc
  }, {})
}

function nextDueInGroup(items) {
  const pending = items.filter(i => !i.done && i.due).sort((a,b) => a.due.localeCompare(b.due))
  return pending[0]?.due || null
}

function load(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def } catch { return def }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

/* ════════════════════════════════════════════════════════════
   CALENDAR
   ════════════════════════════════════════════════════════════ */
function Calendar({ selected, onChange, minDate }) {
  const init = selected ? new Date(selected + 'T00:00:00') : new Date()
  const [view, setView] = useState({ y: init.getFullYear(), m: init.getMonth() })

  function prev() {
    setView(v => v.m === 0 ? { y: v.y-1, m: 11 } : { y: v.y, m: v.m-1 })
  }
  function next() {
    setView(v => v.m === 11 ? { y: v.y+1, m: 0 } : { y: v.y, m: v.m+1 })
  }

  const firstDay     = new Date(view.y, view.m, 1).getDay()
  const daysInMonth  = new Date(view.y, view.m+1, 0).getDate()
  const daysInPrev   = new Date(view.y, view.m, 0).getDate()

  const cells = []
  for (let i = firstDay-1; i >= 0; i--)
    cells.push({ day: daysInPrev-i, cur: false })
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, cur: true })
  while (cells.length % 7 !== 0)
    cells.push({ day: cells.length - firstDay - daysInMonth + 1, cur: false })

  function iso(cell) {
    if (!cell.cur) return null
    return `${view.y}-${pad(view.m+1)}-${pad(cell.day)}`
  }

  return (
    <div className="te-calendar">
      <div className="te-cal-header">
        <button type="button" className="te-cal-nav" onClick={prev}>‹</button>
        <span className="te-cal-month">{MONTHS_LONG[view.m]} {view.y}</span>
        <button type="button" className="te-cal-nav" onClick={next}>›</button>
      </div>
      <div className="te-cal-grid">
        {DAYS_SHORT.map(d => <div key={d} className="te-cal-dow">{d}</div>)}
        {cells.map((cell, i) => {
          const cellIso  = iso(cell)
          const isToday  = cellIso === todayISO()
          const isSel    = cellIso === selected
          const tooEarly = minDate && cellIso && cellIso < minDate
          return (
            <button
              type="button" key={i}
              className={['te-cal-day',
                !cell.cur ? 'other-month' : '',
                isToday   ? 'today'       : '',
                isSel     ? 'selected'    : '',
              ].join(' ')}
              onClick={() => cellIso && !tooEarly && onChange(cellIso)}
              disabled={!cell.cur || tooEarly}
            >{cell.day}</button>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   SWIPEABLE CARD  (drag left/right)
   ════════════════════════════════════════════════════════════ */
function SwipeCard({ children, onDone, onCancel }) {
  const ref   = useRef(null)
  const start = useRef(null)
  const [dx, setDx]       = useState(0)
  const [action, setAction] = useState(null) // 'done' | 'cancel' | null

  function pointerDown(e) {
    start.current = e.touches ? e.touches[0].clientX : e.clientX
    setAction(null)
  }
  function pointerMove(e) {
    if (start.current === null) return
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - start.current
    setDx(x)
    if (x >  60) setAction('done')
    else if (x < -60) setAction('cancel')
    else setAction(null)
  }
  function pointerUp() {
    if (action === 'done')   { onDone();   }
    else if (action === 'cancel') { onCancel(); }
    setDx(0); setAction(null); start.current = null
  }

  const bg = action === 'done' ? '#d4edda' : action === 'cancel' ? '#f8d7da' : '#fff'
  const style = {
    transform: `translateX(${dx}px)`,
    background: bg,
    transition: start.current ? 'none' : 'transform 0.2s, background 0.2s',
  }

  return (
    <div
      ref={ref}
      style={style}
      onMouseDown={pointerDown} onMouseMove={pointerMove} onMouseUp={pointerUp} onMouseLeave={pointerUp}
      onTouchStart={pointerDown} onTouchMove={pointerMove} onTouchEnd={pointerUp}
    >
      {children}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   CHOOSE TYPE SHEET
   ════════════════════════════════════════════════════════════ */
function ChooseTypeSheet({ onClose, onChoose }) {
  return (
    <div className="te-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
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

/* ════════════════════════════════════════════════════════════
   TASK FORM MODAL
   ════════════════════════════════════════════════════════════ */
function TaskFormModal({ onClose, onAdd, editItem }) {
  const [name,       setName]    = useState(editItem?.name       || '')
  const [due,        setDue]     = useState(editItem?.due        || addDays(todayISO(), 7))
  const [remindTime, setRTime]   = useState(editItem?.remindTime || '07:00')
  const [remindBefore, setRB]    = useState(editItem?.remindBefore ?? true)
  const [category,   setCat]     = useState(editItem?.category   || 'General')
  const [quickSel,   setQuick]   = useState('')
  const [showCal,    setShowCal] = useState(false)
  const [nameErr,    setNameErr] = useState(false)

  function applyQuick(label) {
    setQuick(label)
    setShowCal(false)
    if (label === 'Tomorrow')  setDue(addDays(todayISO(), 1))
    if (label === 'In 3 days') setDue(addDays(todayISO(), 3))
    if (label === 'Next week') setDue(addDays(todayISO(), 7))
  }

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) { setNameErr(true); return }
    onAdd({
      id: editItem?.id || Date.now(),
      type: 'task',
      name: name.trim(),
      due,
      remindTime,
      remindBefore,
      category,
      done: editItem?.done ?? false,
      completedAt: editItem?.completedAt,
      createdAt: editItem?.createdAt || new Date().toISOString(),
    })
  }

  return (
    <div className="te-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="te-modal te-modal-scroll">
        <p className="te-form-title">{editItem ? 'EDIT TASK' : 'NEW TASK'}</p>
        <h2 className="te-form-heading">{editItem ? 'EDIT TASK' : 'NEW TASK'}</h2>
        <form onSubmit={submit}>

          {/* Name */}
          <input
            className={`te-name-input${nameErr?' error':''}`}
            placeholder="e.g., Change assignment"
            value={name}
            onChange={e => { setName(e.target.value); setNameErr(false) }}
            autoFocus
          />
          {nameErr && <p style={{color:'#d9534f',fontSize:11,margin:'-10px 0 10px'}}>Task name is required.</p>}

          {/* Date row — clicking opens inline calendar */}
          <button
            type="button" className="te-row-btn"
            style={{ marginBottom: 6, position:'relative' }}
            onClick={() => setShowCal(c => !c)}
          >
            <span className="te-row-btn-icon">📅</span>
            <div className="te-row-btn-body">
              <div className="te-row-btn-label">{formatDate(due) || 'Pick a date'}</div>
              <div className="te-row-btn-sub">Tap to change</div>
            </div>
            <span className="te-row-btn-arrow">{showCal ? '∧' : '›'}</span>
          </button>

          {showCal && (
            <Calendar
              selected={due}
              minDate={todayISO()}
              onChange={d => { setDue(d); setShowCal(false); setQuick('') }}
            />
          )}

          <div className="te-quick-dates">
            {['Tomorrow','In 3 days','Next week'].map(q => (
              <button
                key={q} type="button"
                className={`te-quick-chip${quickSel===q?' active':''}`}
                onClick={() => applyQuick(q)}
              >{q}</button>
            ))}
          </div>

          {/* Remind me — time picker */}
          <div className="te-row-btn" style={{ cursor:'default' }}>
            <span className="te-row-btn-icon">🔔</span>
            <div className="te-row-btn-body">
              <div className="te-row-btn-label">Remind me</div>
              <div className="te-row-btn-sub">{formatTime(remindTime)}</div>
            </div>
            <input
              type="time" value={remindTime}
              onChange={e => setRTime(e.target.value)}
              className="te-time-input"
              style={{ marginLeft:'auto' }}
            />
          </div>

          {/* Remind before due toggle */}
          <div className="te-toggle-row">
            <span className="te-toggle-icon">🌿</span>
            <div className="te-toggle-body">
              <div className="te-toggle-label">Remind me before due</div>
              <div className="te-toggle-sub">{remindBefore ? 'On — 1 day before due date' : 'Off'}</div>
            </div>
            <label className="te-toggle">
              <input type="checkbox" checked={remindBefore} onChange={e => setRB(e.target.checked)} />
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
            <button type="submit" className="te-btn-submit" style={{ background:'#f5a623' }}>
              {editItem ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   EVENT FORM MODAL
   ════════════════════════════════════════════════════════════ */
function EventFormModal({ onClose, onAdd, editItem }) {
  const [name,     setName]  = useState(editItem?.name      || '')
  const [start,    setStart] = useState(editItem?.startDate || todayISO())
  const [duration, setDur]   = useState(editItem?.duration  || 5)
  const [category, setCat]   = useState(editItem?.category  || 'General')
  const [nameErr,  setNErr]  = useState(false)

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) { setNErr(true); return }
    onAdd({
      id: editItem?.id || Date.now(),
      type: 'event',
      name: name.trim(),
      due: addDays(start, duration - 1),
      startDate: start,
      duration,
      category,
      done: editItem?.done ?? false,
      completedAt: editItem?.completedAt,
      createdAt: editItem?.createdAt || new Date().toISOString(),
    })
  }

  return (
    <div className="te-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="te-modal te-modal-scroll">
        <p className="te-form-title">{editItem ? 'EDIT EVENT' : 'NEW EVENT'}</p>
        <form onSubmit={submit}>
          <input
            className={`te-name-input${nameErr?' error':''}`}
            placeholder="e.g., CyberDays"
            value={name}
            onChange={e => { setName(e.target.value); setNErr(false) }}
            autoFocus
          />
          {nameErr && <p style={{color:'#d9534f',fontSize:11,margin:'-10px 0 10px'}}>Event name is required.</p>}

          {/* Duration stepper */}
          <div className="te-duration-row">
            <div>
              <div className="te-duration-label">How many days?</div>
              <div className="te-duration-sub">
                {formatDate(start)} → {formatDate(addDays(start, duration - 1))}
              </div>
            </div>
            <div className="te-duration-ctrl">
              <button type="button" className="te-duration-btn"
                onClick={() => setDur(d => Math.max(1, d-1))}>−</button>
              <span className="te-duration-num">{duration}</span>
              <button type="button" className="te-duration-btn"
                onClick={() => setDur(d => d+1)}>+</button>
            </div>
          </div>

          <p style={{ fontSize:12, color:'#8fa0b0', margin:'0 0 6px' }}>
            Tap a day to set when the event starts
          </p>
          <Calendar selected={start} onChange={setStart} />

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
            <button type="submit" className="te-btn-submit">
              {editItem ? 'Save Changes' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AddItemModal({ onClose, onAdd }) {
  const [modal, setModal] = useState('choose')

  if (modal === 'choose') {
    return <ChooseTypeSheet onClose={onClose} onChoose={setModal} />
  }
  if (modal === 'task') {
    return <TaskFormModal onClose={onClose} onAdd={onAdd} />
  }
  return <EventFormModal onClose={onClose} onAdd={onAdd} />
}

/* ════════════════════════════════════════════════════════════
   REPEAT FORM MODAL
   ════════════════════════════════════════════════════════════ */
function RepeatFormModal({ onClose, onAdd, editItem }) {
  const [name,  setName] = useState(editItem?.name  || '')
  const [days,  setDays] = useState(editItem?.days  || [])
  const [time,  setTime] = useState(editItem?.time  || '08:00')
  const [nameErr, setNE] = useState(false)

  function toggleDay(i) {
    setDays(d => d.includes(i) ? d.filter(x => x!==i) : [...d, i].sort((a,b)=>a-b))
  }
  function preset(p) {
    if (p === 'Weekdays')  setDays([1,2,3,4,5])
    if (p === 'Weekends')  setDays([0,6])
    if (p === 'Every day') setDays([0,1,2,3,4,5,6])
  }

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) { setNE(true); return }
    onAdd({
      id: editItem?.id || Date.now(),
      name: name.trim(),
      days,
      time,
      createdAt: editItem?.createdAt || new Date().toISOString(),
    })
  }

  // next fire date
  function nextFire() {
    if (!days.length) return null
    const today = new Date(); today.setHours(0,0,0,0)
    const todayDow = today.getDay()
    const [h, m] = time.split(':').map(Number)
    const now = new Date()
    // find soonest matching day
    for (let offset = 0; offset <= 7; offset++) {
      const candidate = new Date(today); candidate.setDate(today.getDate() + offset)
      const dow = candidate.getDay()
      if (!days.includes(dow)) continue
      // same day: check if time hasn't passed
      if (offset === 0) {
        const fireTime = new Date(today); fireTime.setHours(h, m, 0, 0)
        if (now >= fireTime) continue
      }
      return `${MONTHS_SHORT[candidate.getMonth()]} ${candidate.getDate()} at ${formatTime(time)}`
    }
    return null
  }
  const nf = nextFire()

  return (
    <div className="te-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="te-modal te-modal-scroll">
        <p className="te-form-title">
          {editItem ? 'EDIT REPEATING REMINDER' : 'NEW REPEATING REMINDER'}
        </p>
        <form onSubmit={submit}>
          <input
            className={`te-name-input${nameErr?' error':''}`}
            placeholder="e.g., Wash clothes"
            value={name}
            onChange={e => { setName(e.target.value); setNE(false) }}
            autoFocus
          />
          {nameErr && <p style={{color:'#d9534f',fontSize:11,margin:'-10px 0 10px'}}>Name is required.</p>}

          <p style={{ fontSize:12, fontWeight:600, color:'#42566a', margin:'0 0 8px' }}>Repeat on</p>

          <div className="te-preset-row">
            {['Weekdays','Weekends','Every day'].map(p => (
              <button
                key={p} type="button"
                className={`te-preset-chip${
                  (p==='Weekdays' && JSON.stringify(days)===JSON.stringify([1,2,3,4,5])) ||
                  (p==='Weekends' && JSON.stringify(days)===JSON.stringify([0,6])) ||
                  (p==='Every day' && days.length===7) ? ' active' : ''
                }`}
                onClick={() => preset(p)}
              >{p}</button>
            ))}
          </div>

          <div className="te-days-row">
            {['S','M','T','W','T','F','S'].map((d,i) => (
              <button
                key={i} type="button"
                className={`te-day-chip${days.includes(i)?' active':''}`}
                onClick={() => toggleDay(i)}
                title={DOW_LABELS[i]}
              >{d}</button>
            ))}
          </div>

          {/* Time */}
          <div className="te-time-row">
            <span className="te-time-icon">🔔</span>
            <div className="te-time-label">
              <strong>Time</strong>
              <span>When this reminder fires</span>
            </div>
            <input
              type="time" className="te-time-input"
              value={time} onChange={e => setTime(e.target.value)}
            />
          </div>

          {nf && (
            <div className="te-next-fire">
              <span>⏭</span> Next fire: <strong>{nf}</strong>
            </div>
          )}

          <div className="te-form-actions">
            <button type="button" className="te-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="te-btn-submit">
              {editItem ? 'Save Changes' : 'Add Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   CHECKLIST ITEM MODAL
   ════════════════════════════════════════════════════════════ */
function ChecklistModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  const [err,  setErr]  = useState(false)

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) { setErr(true); return }
    onAdd({ id: Date.now(), name: name.trim(), done: false, createdAt: new Date().toISOString() })
  }

  return (
    <div className="te-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="te-modal">
        <p className="te-form-title">NEW CHECKLIST ITEM</p>
        <p style={{ fontSize:12, color:'#8fa0b0', margin:'0 0 14px' }}>
          Something quick you don't want to forget
        </p>
        <form onSubmit={submit}>
          <input
            className={`te-name-input${err?' error':''}`}
            placeholder="e.g., Bring project materials"
            value={name}
            onChange={e => { setName(e.target.value); setErr(false) }}
            autoFocus
          />
          {err && <p style={{color:'#d9534f',fontSize:11,margin:'-10px 0 10px'}}>Item text is required.</p>}
          <div className="te-form-actions">
            <button type="button" className="te-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="te-btn-submit">
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   ITEM DETAIL MODAL  (tap a card to view/edit/delete)
   ════════════════════════════════════════════════════════════ */
function ItemDetailModal({ item, onClose, onEdit, onDelete, onToggle }) {
  const b = getBadge(item)
  return (
    <div className="te-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="te-modal">
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <p style={{ fontSize:11, color:'#8fa0b0', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
              {item.type === 'event' ? 'Event' : 'Task'} · {item.category || 'General'}
            </p>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#1d3547', margin:0 }}>{item.name}</h3>
          </div>
          {b && <span className={`te-item-badge ${b.cls}`}>{b.text}</span>}
        </div>

        <div className="te-detail-rows">
          <div className="te-detail-row">
            <span>📅</span>
            <div>
              <strong>Due date</strong>
              <span>{item.due ? formatDate(item.due) : 'No due date'}</span>
            </div>
          </div>
          {item.type === 'event' && item.startDate && (
            <div className="te-detail-row">
              <span>📆</span>
              <div>
                <strong>Event span</strong>
                <span>
                  {formatDate(item.startDate)} → {formatDate(item.due)}
                  &nbsp;({item.duration} day{item.duration!==1?'s':''})
                </span>
              </div>
            </div>
          )}
          {item.remindTime && (
            <div className="te-detail-row">
              <span>🔔</span>
              <div>
                <strong>Reminder</strong>
                <span>{formatTime(item.remindTime)}{item.remindBefore ? ' · also 1 day before' : ''}</span>
              </div>
            </div>
          )}
          <div className="te-detail-row">
            <span>📊</span>
            <div>
              <strong>Status</strong>
              <span>{item.done
                ? item.completedAt ? `Completed on ${new Date(item.completedAt).toLocaleDateString()}` : 'Completed'
                : 'Pending'}</span>
            </div>
          </div>
          <div className="te-detail-row">
            <span>🕐</span>
            <div>
              <strong>Created</strong>
              <span>{item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'})
                : 'Unknown'}</span>
            </div>
          </div>
        </div>

        <div className="te-form-actions" style={{ marginTop:20 }}>
          <button type="button" className="te-btn-cancel" onClick={onClose}>Close</button>
          <button
            type="button" className="te-btn-submit"
            style={{ background: item.done ? '#6c757d' : '#087bc4' }}
            onClick={() => { onToggle(item.id); onClose() }}
          >
            {item.done ? '↩ Mark Pending' : '✓ Mark Done'}
          </button>
          <button
            type="button" className="te-btn-submit"
            style={{ background:'#f5a623' }}
            onClick={() => { onEdit(item); onClose() }}
          >✎ Edit</button>
          <button
            type="button" className="te-btn-submit"
            style={{ background:'#d9534f' }}
            onClick={() => { onDelete(item.id); onClose() }}
          >🗑 Delete</button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   CONFIRM MODAL  (generic)
   ════════════════════════════════════════════════════════════ */
function ConfirmModal({ title, message, confirmLabel, confirmColor, onConfirm, onClose }) {
  return (
    <div className="te-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="te-modal" style={{ maxWidth:380 }}>
        <h3 style={{ fontSize:17, fontWeight:700, color:'#1d3547', margin:'0 0 10px' }}>{title}</h3>
        <p style={{ fontSize:13, color:'#6b7f90', margin:'0 0 20px' }}>{message}</p>
        <div className="te-form-actions">
          <button type="button" className="te-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            type="button" className="te-btn-submit"
            style={{ background: confirmColor || '#d9534f' }}
            onClick={() => { onConfirm(); onClose() }}
          >{confirmLabel || 'Confirm'}</button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   NOTIFICATION TOAST
   ════════════════════════════════════════════════════════════ */
function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="te-toast">
      <span>✅</span> {msg}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════ */
export default function TasksEvents() {
  const [tab, setTab] = useState('pending')
  const [classroomConnectOpen, setClassroomConnectOpen] = useState(false)
  const [skipClassroomWarning, setSkipClassroomWarning] = useState(
    () => localStorage.getItem('te_skip_classroom_warning') === 'true',
  )

  function connectClassroom() {
    if (localStorage.getItem('te_skip_classroom_warning') === 'true') {
      window.open('https://classroom.google.com/', '_blank', 'noopener,noreferrer')
      return
    }
    setClassroomConnectOpen(true)
  }

  /* ── items ─────────────────────────────────────────────── */
  const [items, setItems] = useState(() => load('te_items', []))
  function saveItems(next) { setItems(next); save('te_items', next) }

  function addItem(item) {
    // edit vs add
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id)
      const next = idx >= 0
        ? prev.map(i => i.id === item.id ? item : i)
        : [...prev, item]
      save('te_items', next)
      return next
    })
    setModal(null)
    showToast(item.id ? 'Task saved!' : 'Task added!')
  }

  function toggleItem(id) {
    setItems(prev => {
      const next = prev.map(i =>
        i.id === id
          ? { ...i, done: !i.done, completedAt: !i.done ? new Date().toISOString() : undefined }
          : i
      )
      save('te_items', next)
      return next
    })
  }

  function deleteItem(id) {
    setItems(prev => { const n = prev.filter(i => i.id!==id); save('te_items',n); return n })
  }

  function restoreItem(id) {
    setItems(prev => {
      const n = prev.map(i => i.id===id ? {...i, done:false, completedAt:undefined} : i)
      save('te_items', n); return n
    })
    showToast('Task restored to Pending.')
  }

  function clearHistory() {
    setItems(prev => { const n = prev.filter(i => !i.done); save('te_items',n); return n })
    showToast('History cleared.')
  }

  /* ── repeats ───────────────────────────────────────────── */
  const [repeats, setRepeats] = useState(() => load('te_repeats', []))
  function saveRepeats(next) { setRepeats(next); save('te_repeats', next) }

  function addRepeat(r) {
    setRepeats(prev => {
      const idx = prev.findIndex(x => x.id === r.id)
      const next = idx >= 0 ? prev.map(x => x.id===r.id ? r : x) : [...prev, r]
      save('te_repeats', next); return next
    })
    setModal(null)
    showToast('Reminder saved!')
  }
  function deleteRepeat(id) {
    setRepeats(prev => { const n = prev.filter(r => r.id!==id); save('te_repeats',n); return n })
  }

  /* ── checklist ─────────────────────────────────────────── */
  const [clItems, setClItems] = useState(() => load('te_checklist', []))
  function saveClItems(next) { setClItems(next); save('te_checklist', next) }

  function addClItem(item) {
    setClItems(prev => { const n = [...prev, item]; save('te_checklist',n); return n })
    setModal(null)
    showToast('Item added!')
  }
  function toggleCl(id) {
    setClItems(prev => {
      const n = prev.map(i => i.id===id ? {...i,done:!i.done} : i)
      save('te_checklist',n); return n
    })
  }
  function deleteCl(id) {
    setClItems(prev => { const n = prev.filter(i => i.id!==id); save('te_checklist',n); return n })
  }
  function clearChecklist() {
    setClItems([]); save('te_checklist',[])
    showToast('Checklist cleared.')
  }
  function clearDoneChecklist() {
    setClItems(prev => { const n = prev.filter(i => !i.done); save('te_checklist',n); return n })
    showToast('Completed items removed.')
  }

  /* ── modals ────────────────────────────────────────────── */
  // null | 'choose' | 'task' | 'event' | 'repeat' | 'checklist'
  //      | { type:'detail', item } | { type:'edit-task', item }
  //      | { type:'edit-event', item } | { type:'edit-repeat', item }
  //      | { type:'confirm', ... }
  const [modal, setModal]     = useState(null)
  const [editTarget, setEdit] = useState(null)

  function openEdit(item) {
    setEdit(item)
    setModal(item.type === 'event' ? 'event' : 'task')
  }
  function openEditRepeat(r) {
    setEdit(r)
    setModal('repeat')
  }

  function fabClick() {
    if (tab === 'pending')   { setEdit(null); setModal('choose') }
    if (tab === 'repeats')   { setEdit(null); setModal('repeat') }
    if (tab === 'checklist') { setModal('checklist') }
    if (tab === 'history')   {
      setModal({ type:'confirm',
        title:'Clear all history',
        message:'This will permanently remove all completed tasks.',
        confirmLabel:'Clear History',
        onConfirm: clearHistory,
      })
    }
  }

  /* ── toast ─────────────────────────────────────────────── */
  const [toast, setToast] = useState(null)
  function showToast(msg) { setToast(msg) }

  /* ── derived ───────────────────────────────────────────── */
  const pending  = items.filter(i => !i.done)
  const history  = items.filter(i =>  i.done).sort((a,b) => (b.completedAt||'').localeCompare(a.completedAt||''))
  const groups   = groupBy(pending, i => i.category || 'General')
  const histGrps = groupBy(history, i => i.completedAt?.split('T')[0] || 'Unknown')

  const TAB_DATA = {
    pending:   { label:'Pending',   icon:'',   count: pending.length,  sub: `${history.length} task completed` },
    repeats:   { label:'Repeats',   icon:'↻ ', count: repeats.length,  sub: `${repeats.length} repeating reminders` },
    history:   { label:'History',   icon:'◷ ', count: history.length,  sub: `${history.length} task completed` },
    checklist: { label:'Checklist', icon:'☰ ', count: clItems.length,  sub: `${clItems.filter(i=>i.done).length}/${clItems.length} done` },
  }
  const cur = TAB_DATA[tab]

  /* ── reminder check on mount ──────────────────────────── */
  useEffect(() => {
    let setup = {}
    try {
      setup = JSON.parse(localStorage.getItem('skwela_setup') || '{}')
    } catch {
      setup = {}
    }
    if (setup?.notifications === false) return

    const now = new Date()
    const todayStr = todayISO()
    const tomorrowStr = addDays(todayStr, 1)
    const alerts = []
    items.filter(i => !i.done).forEach(item => {
      if (item.remindBefore && item.due === tomorrowStr)
        alerts.push(`"${item.name}" is due tomorrow!`)
      if (item.due === todayStr)
        alerts.push(`"${item.name}" is due today!`)
    })
    if (alerts.length) {
      setTimeout(() => showToast(`⚠ ${alerts[0]}${alerts.length>1?` (+${alerts.length-1} more)`:''}`), 800)
    }
    // repeating reminders
    const h = now.getHours(), m = now.getMinutes()
    const curTime = `${pad(h)}:${pad(m)}`
    const todayDow = now.getDay()
    repeats.forEach(r => {
      if (r.days.includes(todayDow)) {
        const [rh, rm] = r.time.split(':').map(Number)
        const diff = (rh*60+rm) - (h*60+m)
        if (diff >= 0 && diff <= 2)
          setTimeout(() => showToast(`🔔 Reminder: ${r.name}`), diff * 60000)
      }
    })
  }, []) // eslint-disable-line

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */
  return (
    <div className="te-page">

      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="te-hero">
        <div className="te-hero-top">
          <div className="te-hero-title">
            <h2>Tasks &amp; Deadline Reminders</h2>
            <p>Stay on track, achieve more. ✨</p>
          </div>
          <div className="te-hero-actions">
            <button className="te-hero-btn" type="button" title="Sync data" aria-label="Sync data" onClick={() => showToast('Data synced!')}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7V3m0 0h-4m4 0-3.2 3.2A8 8 0 0 0 4 9m0 8v4m0 0h4m-4 0 3.2-3.2A8 8 0 0 0 20 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              className="te-hero-btn te-classroom-btn"
              type="button"
              onClick={connectClassroom}
              title="Google Classroom"
              aria-label="Connect Google Classroom"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2" y="3" width="20" height="18" rx="3" fill="#0f9d58" />
                <rect x="5" y="6" width="14" height="12" rx="1.5" fill="#fff" />
                <circle cx="9" cy="10" r="1.7" fill="#fbbc04" />
                <circle cx="15" cy="10" r="1.7" fill="#4285f4" />
                <path d="M6.7 15c.2-1.6 1-2.4 2.3-2.4s2.1.8 2.3 2.4M12.7 15c.2-1.6 1-2.4 2.3-2.4s2.1.8 2.3 2.4" fill="none" stroke="#0f9d58" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M4 5V4.5A1.5 1.5 0 0 1 5.5 3H8" fill="none" stroke="#34a853" strokeWidth="1.5" />
              </svg>
            </button>
            <button className="te-hero-btn" type="button" title="Settings" aria-label="Settings" onClick={() => showToast('Settings coming soon.')}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.4 13.5 21 14.7l-1.6 2.8-1.9-.8a7.8 7.8 0 0 1-1.6.9l-.3 2h-3.2l-.3-2a7.8 7.8 0 0 1-1.6-.9l-1.9.8L7 14.7l1.6-1.2a7 7 0 0 1 0-1.9L7 10.4l1.6-2.8 1.9.8a7.8 7.8 0 0 1 1.6-.9l.3-2h3.2l.3 2a7.8 7.8 0 0 1 1.6.9l1.9-.8 1.6 2.8-1.6 1.2a7 7 0 0 1 0 1.9ZM14 12a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z" fill="currentColor"/></svg>
            </button>
          </div>
        </div>

        <div className="te-tabs">
          {['pending','repeats','history','checklist'].map(t => (
            <button
              key={t}
              className={`te-tab${tab===t?' active':''}`}
              onClick={() => setTab(t)}
            >
              {t === 'pending' ? (
                <svg className="te-tab-calendar" viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 2v3M11 2v3M2 6h12M5 8h1M8 8h1M11 8h1M5 11h1M8 11h1" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              ) : TAB_DATA[t].icon}{TAB_DATA[t].label}
            </button>
          ))}
        </div>

        <div className="te-stat-card">
          <img className="te-stat-mascot" src={owlImage} alt="" />
          <div className="te-stat-body">
            <p className="te-stat-label">{tab === 'pending' ? 'Task Remaining' : cur.label}</p>
            <p className="te-stat-num">{cur.count}</p>
            <p className="te-stat-sub">Keep it up! 🔥</p>
            <div className="te-stat-pill">
              <span>📊</span> {cur.sub}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PENDING TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'pending' && (
        pending.length === 0
          ? (
            <div className="te-empty">
              <div className="te-empty-icon te-empty-smile" aria-hidden="true">
                <svg viewBox="0 0 64 36">
                  <path d="M9 10c5 15 41 15 46 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="m8 10-3-2m54 2 3-2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Your plate is clear!</h3>
              <p>You have no pending tasks.<br/>Click the + button to add a new task and keep moving forward.</p>
            </div>
          ) : (
            <>
              <p className="te-swipe-hint">
                Drag a card right to mark done · left to cancel/delete · click to view details
              </p>
              {Object.entries(groups).map(([cat, catItems]) => (
                <div key={cat}>
                  <div className="te-group-header">
                    <div className="te-group-label">
                      <div className="te-group-icon">📁</div>
                      {cat}
                    </div>
                    <span className="te-group-next">
                      {nextDueInGroup(catItems) ? `Next: ${formatDate(nextDueInGroup(catItems))}` : ''}
                    </span>
                  </div>
                  {catItems.map(item => {
                    const b = getBadge(item)
                    return (
                      <SwipeCard
                        key={item.id}
                        onDone={() => { toggleItem(item.id); showToast(`"${item.name}" marked done!`) }}
                        onCancel={() => setModal({ type:'confirm',
                          title:'Remove task?',
                          message:`"${item.name}" will be deleted.`,
                          confirmLabel:'Delete',
                          onConfirm: () => deleteItem(item.id),
                        })}
                      >
                        <div
                          className="te-item-card"
                          onClick={() => setModal({ type:'detail', item })}
                        >
                          <button
                            className={`te-item-check${item.done?' done':''}`}
                            onClick={e => { e.stopPropagation(); toggleItem(item.id); showToast(`"${item.name}" marked done!`) }}
                          >{item.done && '✓'}</button>
                          <div className="te-item-body">
                            <p className={`te-item-name${item.done?' done':''}`}>{item.name}</p>
                            <p className="te-item-meta">
                              {item.type === 'event'
                                ? `${formatDate(item.startDate)} → ${formatDate(item.due)} (${item.duration}d)`
                                : item.due ? `${formatDate(item.due)} · ${item.remindTime ? formatTime(item.remindTime) : '8:00 AM'}` : 'No due date'
                              }
                            </p>
                          </div>
                          {b && <span className={`te-item-badge ${b.cls}`}>{b.text}</span>}
                          <button
                            className="te-item-delete"
                            onClick={e => { e.stopPropagation(); deleteItem(item.id) }}
                            title="Delete"
                          >×</button>
                        </div>
                      </SwipeCard>
                    )
                  })}
                </div>
              ))}
            </>
          )
      )}

      {/* ══════════════════════════════════════════════════════
          REPEATS TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'repeats' && (
        repeats.length === 0
          ? (
            <div className="te-empty">
              <div className="te-empty-icon" style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:700 }}>↻</div>
              <h3>No repeating reminders</h3>
              <p>Set one up and it'll fire every week on the days you pick.<br/>Click the + button to create one.</p>
            </div>
          ) : (
            repeats.map(r => {
              const on = r.days.length
                ? r.days.map(d => DOW_LABELS[d]).join(', ')
                : 'No days set'
              return (
                <div key={r.id} className="te-item-card" style={{ cursor:'pointer' }}
                  onClick={() => { setEdit(r); setModal('repeat') }}
                >
                  <span style={{ fontSize:22, flexShrink:0 }}>↻</span>
                  <div className="te-item-body">
                    <p className="te-item-name">{r.name}</p>
                    <p className="te-item-meta">{on} · {formatTime(r.time)}</p>
                  </div>
                  <button
                    className="te-item-delete"
                    onClick={e => {
                      e.stopPropagation()
                      setModal({ type:'confirm',
                        title:'Delete reminder?',
                        message:`"${r.name}" will be permanently removed.`,
                        confirmLabel:'Delete',
                        onConfirm: () => deleteRepeat(r.id),
                      })
                    }}
                  >×</button>
                </div>
              )
            })
          )
      )}

      {/* ══════════════════════════════════════════════════════
          HISTORY TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'history' && (
        history.length === 0
          ? (
            <div className="te-empty">
              <div className="te-empty-icon" style={{ fontSize:28 }}>📜</div>
              <h3>No completed tasks yet</h3>
              <p>Tasks you mark as done will appear here.</p>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
                <button className="te-text-btn" onClick={() => setModal({ type:'confirm',
                  title:'Clear all history',
                  message:'All completed tasks will be permanently removed.',
                  confirmLabel:'Clear History',
                  onConfirm: clearHistory,
                })}>
                  🗑 Clear all
                </button>
              </div>
              {Object.entries(histGrps)
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
                            Due: {formatDate(item.due)} · Done at {item.completedAt
                              ? new Date(item.completedAt).toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'})
                              : '—'}
                          </p>
                        </div>
                        <button
                          className="te-restore-btn"
                          title="Restore to Pending"
                          onClick={() => restoreItem(item.id)}
                        >↩</button>
                        <button
                          className="te-history-delete"
                          title="Delete"
                          onClick={() => deleteItem(item.id)}
                        >×</button>
                      </div>
                    ))}
                  </div>
                ))
              }
            </>
          )
      )}

      {/* ══════════════════════════════════════════════════════
          CHECKLIST TAB
         ══════════════════════════════════════════════════════ */}
      {tab === 'checklist' && (
        clItems.length === 0
          ? (
            <div className="te-empty">
              <div className="te-empty-icon" style={{ fontSize:24, fontWeight:700 }}>☰</div>
              <h3>Nothing on your checklist</h3>
              <p>A quick tick-off list for anything that doesn't need a due date.<br/>Click + to add an item.</p>
            </div>
          ) : (
            <>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginBottom:8 }}>
                {clItems.some(i => i.done) && (
                  <button className="te-text-btn" onClick={clearDoneChecklist}>✓ Clear done</button>
                )}
                <button className="te-text-btn te-text-btn-red" onClick={() => setModal({ type:'confirm',
                  title:'Clear checklist?',
                  message:'All items will be removed.',
                  confirmLabel:'Clear All',
                  onConfirm: clearChecklist,
                })}>🗑 Clear all</button>
              </div>
              {clItems.map(item => (
                <div key={item.id} className="te-checklist-item">
                  <button
                    className={`te-checklist-cb${item.done?' done':''}`}
                    onClick={() => toggleCl(item.id)}
                  >{item.done && '✓'}</button>
                  <span className={`te-checklist-name${item.done?' done':''}`}>{item.name}</span>
                  <button className="te-item-delete" onClick={() => deleteCl(item.id)}>×</button>
                </div>
              ))}
            </>
          )
      )}

      {/* ── FAB ─────────────────────────────────────────────── */}
      <button
        className="te-fab"
        onClick={fabClick}
        title={tab==='history' ? 'Clear history' : 'Add'}
        style={{ background: tab==='history' ? '#d9534f' : undefined }}
      >
        {tab === 'history' ? '🗑' : '+'}
      </button>

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      {/* ══════════════════════════════════════════════════════
          MODALS
         ══════════════════════════════════════════════════════ */}

      {classroomConnectOpen && (
        <div
          className="te-classroom-overlay"
          onClick={event => {
            if (event.target === event.currentTarget) setClassroomConnectOpen(false)
          }}
        >
          <section
            className="te-classroom-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="te-classroom-title"
          >
            <div className="te-classroom-modal-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="18" rx="3" fill="#0f9d58" />
                <rect x="5" y="6" width="14" height="12" rx="1.5" fill="#fff" />
                <circle cx="9" cy="10" r="1.7" fill="#fbbc04" />
                <circle cx="15" cy="10" r="1.7" fill="#4285f4" />
                <path d="M6.7 15c.2-1.6 1-2.4 2.3-2.4s2.1.8 2.3 2.4M12.7 15c.2-1.6 1-2.4 2.3-2.4s2.1.8 2.3 2.4" fill="none" stroke="#0f9d58" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <h2 id="te-classroom-title">Connect Google Classroom</h2>
            <p className="te-classroom-description">
              You'll sign in with the Google account you use for Classroom. Eskwela Ta can read your class list and coursework details to help organize your tasks. We don't add or change anything in your classes.
            </p>
            <div className="te-classroom-warning" role="note">
              <span aria-hidden="true">⚠</span>
              <p>Make sure you pick the same Gmail account you actually use in Google Classroom. Signing in with a different account won't find your classes.</p>
            </div>
            <a
              className="te-classroom-privacy"
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
            >
              Learn more about our Privacy Policy <span aria-hidden="true">→</span>
            </a>
            <label className="te-classroom-skip">
              <input
                type="checkbox"
                checked={skipClassroomWarning}
                onChange={event => setSkipClassroomWarning(event.target.checked)}
              />
              <span>Don't show this again</span>
            </label>
            <footer className="te-classroom-actions">
              <button type="button" onClick={() => setClassroomConnectOpen(false)}>Cancel</button>
              <a
                href="https://classroom.google.com/"
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  if (skipClassroomWarning) {
                    localStorage.setItem('te_skip_classroom_warning', 'true')
                  }
                  setClassroomConnectOpen(false)
                }}
              >
                Continue
              </a>
            </footer>
          </section>
        </div>
      )}

      {modal === 'choose' && (
        <ChooseTypeSheet onClose={() => setModal(null)} onChoose={t => setModal(t)} />
      )}

      {modal === 'task' && (
        <TaskFormModal
          onClose={() => { setModal(null); setEdit(null) }}
          onAdd={addItem}
          editItem={editTarget}
        />
      )}

      {modal === 'event' && (
        <EventFormModal
          onClose={() => { setModal(null); setEdit(null) }}
          onAdd={addItem}
          editItem={editTarget}
        />
      )}

      {modal === 'repeat' && (
        <RepeatFormModal
          onClose={() => { setModal(null); setEdit(null) }}
          onAdd={addRepeat}
          editItem={editTarget}
        />
      )}

      {modal === 'checklist' && (
        <ChecklistModal onClose={() => setModal(null)} onAdd={addClItem} />
      )}

      {modal?.type === 'detail' && (
        <ItemDetailModal
          item={modal.item}
          onClose={() => setModal(null)}
          onEdit={item => { setEdit(item); setModal(item.type === 'event' ? 'event' : 'task') }}
          onDelete={id => { deleteItem(id); showToast('Task deleted.') }}
          onToggle={id => { toggleItem(id); showToast('Status updated!') }}
        />
      )}

      {modal?.type === 'confirm' && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          confirmColor={modal.confirmColor}
          onConfirm={modal.onConfirm}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

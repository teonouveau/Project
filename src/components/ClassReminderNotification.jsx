import { useEffect, useRef, useState } from 'react'
import startImage from '../assets/start-transparent.png'
import '../styles/ClassReminderNotification.css'

const SESSION_KEY = 'skwela_class_reminder_shown'

function formatScheduleTime(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
}

function formatClockTime(date) {
  const hours = date.getHours()
  return `${hours % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')} ${hours >= 12 ? 'pm' : 'am'}`
}

function formatReminderDay(classDate, now) {
  if (classDate.toDateString() === now.toDateString()) return 'today'
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  if (classDate.toDateString() === tomorrow.toDateString()) return 'tomorrow'
  return `on ${classDate.toLocaleDateString(undefined, { weekday: 'long' })}`
}

function getReminderMessage(classItem, now) {
  return `You have ${classItem.name} at ${formatScheduleTime(classItem.start)} ${formatReminderDay(classItem.startsAt, now)}. Your class is starting soon. Don't forget to get ready!`
}

export default function ClassReminderNotification({ classItem, displayName, scheduleTime }) {
  const [notification, setNotification] = useState(null)
  const notifiedReminders = useRef(new Set())

  useEffect(() => {
    if (!classItem?.startsAt || classItem.startsAt <= new Date()) return undefined

    let preferences = {}
    try {
      preferences = JSON.parse(localStorage.getItem('skwela_setup') || '{}')
    } catch (error) {
      console.error('Could not read class reminder preferences.', error)
    }

    if (preferences.notifications === false || preferences.beforeClassReminder === false) {
      return undefined
    }

    const customMinutes = preferences.customMinutes
    const selectedMinutes = customMinutes !== '' && customMinutes != null
      ? Number(customMinutes)
      : Number(preferences.reminderMinutes ?? 15)
    const reminderMinutes = Number.isFinite(selectedMinutes) && selectedMinutes >= 1
      ? Math.min(180, Math.floor(selectedMinutes))
      : 15
    const reminderKey = `${classItem.id}:${classItem.startsAt.toISOString()}`
    if (notifiedReminders.current.has(reminderKey)) return undefined

    try {
      if (sessionStorage.getItem(SESSION_KEY) === reminderKey) {
        notifiedReminders.current.add(reminderKey)
        return undefined
      }
    } catch (error) {
      console.error('Could not check class reminder history.', error)
    }

    const now = new Date()
    const reminderAt = new Date(classItem.startsAt.getTime() - reminderMinutes * 60_000)
    const timeout = window.setTimeout(() => {
      const triggeredAt = new Date()
      if (triggeredAt >= classItem.startsAt) return

      notifiedReminders.current.add(reminderKey)
      try {
        sessionStorage.setItem(SESSION_KEY, reminderKey)
      } catch (error) {
        console.error('Could not save class reminder history.', error)
      }

      const message = getReminderMessage(classItem, triggeredAt)
      setNotification({ classItem, triggeredAt })
      if (document.visibilityState === 'hidden' && 'Notification' in window && window.Notification.permission === 'granted') {
        try {
          new window.Notification(`Hi, ${displayName}!`, {
            body: message,
            icon: startImage,
            tag: reminderKey,
          })
        } catch (error) {
          console.error('Could not show the browser class notification.', error)
        }
      }
    }, Math.max(0, reminderAt.getTime() - now.getTime()))

    return () => window.clearTimeout(timeout)
  }, [classItem, displayName, scheduleTime])

  useEffect(() => {
    if (!notification) return undefined
    const timeout = window.setTimeout(() => setNotification(null), 15_000)
    return () => window.clearTimeout(timeout)
  }, [notification])

  if (!notification) return null

  return (
    <aside className="class-reminder-toast" role="alert" aria-live="assertive" aria-atomic="true">
      <img className="class-reminder-owl" src={startImage} alt="" />
      <div className="class-reminder-panel">
        <header className="class-reminder-header">
          <strong>Hi, {displayName}! 👋</strong>
          <time>{formatClockTime(notification.triggeredAt)}</time>
        </header>
        <p>📚 {getReminderMessage(notification.classItem, notification.triggeredAt)}</p>
        <button
          className="class-reminder-dismiss"
          type="button"
          aria-label="Dismiss class reminder"
          onClick={() => setNotification(null)}
        >
          ×
        </button>
      </div>
    </aside>
  )
}
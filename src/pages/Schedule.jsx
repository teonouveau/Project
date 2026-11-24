import { useState } from "react";
import "./sched.css";

const STORAGE_KEY = "skwela_schedule";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const START_HOUR = 7;
const END_HOUR = 17;
const GRID_DURATION = (END_HOUR - START_HOUR) * 60;
const DEFAULT_CLASSES = [
  { id: 1, day: 0, name: "PC 315L", instructor: "Abrigana, W", room: "CL3", start: "07:30", end: "08:30", color: "blue" },
  { id: 2, day: 0, name: "PC 318", instructor: "Enoc, AB", room: "LLR1", start: "09:00", end: "10:00", color: "green" },
  { id: 3, day: 0, name: "CC 316", instructor: "Culanibang, JR", room: "CL3", start: "10:00", end: "11:00", color: "purple" },
  { id: 4, day: 1, name: "PC 315L", instructor: "Abrigana, W", room: "CL3", start: "07:30", end: "10:00", color: "blue" },
  { id: 5, day: 1, name: "CC 316", instructor: "Culanibang, JR", room: "CL3", start: "10:00", end: "11:00", color: "purple" },
  { id: 6, day: 1, name: "PC 315", instructor: "Abrigana, W", room: "CL3", start: "13:00", end: "15:00", color: "yellow" },
  { id: 7, day: 2, name: "PC 318", instructor: "Enoc, AB", room: "LLR1", start: "09:00", end: "10:00", color: "green" },
  { id: 8, day: 2, name: "CC 316", instructor: "Culanibang, JR", room: "CL3", start: "10:00", end: "11:00", color: "purple" },
  { id: 9, day: 2, name: "PC 317", instructor: "Narte, K", room: "CL3", start: "13:30", end: "15:30", color: "red" },
  { id: 10, day: 3, name: "PC 315L", instructor: "Abrigana, W", room: "CL3", start: "07:30", end: "09:00", color: "blue" },
  { id: 11, day: 3, name: "PC 318", instructor: "Enoc, AB", room: "LLR1", start: "09:00", end: "10:30", color: "green" },
  { id: 12, day: 3, name: "PC 316", instructor: "Abrigana, W", room: "CL3", start: "13:00", end: "14:00", color: "yellow" },
  { id: 13, day: 3, name: "PC 317", instructor: "Narte, K", room: "CL3", start: "14:00", end: "16:00", color: "red" },
  { id: 14, day: 4, name: "PC 315L", instructor: "Abrigana, W", room: "CL3", start: "07:30", end: "09:00", color: "blue" },
  { id: 15, day: 4, name: "PC 318", instructor: "Enoc, AB", room: "LLR1", start: "10:00", end: "11:00", color: "green" },
  { id: 16, day: 4, name: "PC 317", instructor: "Narte, K", room: "CL3", start: "12:30", end: "13:30", color: "red" },
  { id: 17, day: 4, name: "PC 316", instructor: "Abrigana, W", room: "CL3", start: "13:30", end: "14:30", color: "yellow" },
];

const COLORS = ["blue", "green", "purple", "yellow", "red"];
function readClasses() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch (error) {
    console.error("Could not read the saved schedule.", error);
  }
  return DEFAULT_CLASSES;
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatHour(hour) {
  return `${hour % 12 || 12}:00 ${hour >= 12 ? "PM" : "AM"}`;
}

function classOnDate(item, date) {
  const day = date.getDay();
  return day !== 0 && item.day === day - 1;
}

function Schedule() {
  const [classes, setClasses] = useState(readClasses);
  const [view, setView] = useState("weekly");
  const [semester, setSemester] = useState("1st sem");
  const [showSaturday, setShowSaturday] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  function persist(nextClasses) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextClasses));
      setClasses(nextClasses);
      setError("");
      setDialog(null);
    } catch (storageError) {
      console.error("Could not save the schedule.", storageError);
      setError("Could not save your schedule. Please check your browser storage.");
    }
  }

  function exportSchedule() {
    const header = ["Day", "Course", "Instructor", "Room", "Start", "End"];
    const rows = classes.map((item) => [
      DAY_NAMES[item.day] || "Saturday",
      item.name,
      item.instructor,
      item.room,
      formatTime(item.start),
      formatTime(item.end),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-schedule.csv";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function openNewClass(day = 0, start = "08:00") {
    if (!editMode) return;
    const startMinutes = timeToMinutes(start);
    const endMinutes = Math.min(startMinutes + 60, END_HOUR * 60);
    setDialog({
      id: null,
      day,
      name: "",
      instructor: "",
      room: "",
      start,
      end: `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`,
      color: "blue",
    });
    setError("");
  }

  function saveClass(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item = {
      id: dialog.id || Date.now(),
      day: Number(form.get("day")),
      name: String(form.get("name")).trim(),
      instructor: String(form.get("instructor")).trim(),
      room: String(form.get("room")).trim(),
      start: String(form.get("start")),
      end: String(form.get("end")),
      color: String(form.get("color")),
    };
    if (!item.name || !item.start || !item.end) {
      setError("Add a course name and both class times.");
      return;
    }
    if (timeToMinutes(item.end) <= timeToMinutes(item.start)) {
      setError("The end time must be later than the start time.");
      return;
    }
    if (timeToMinutes(item.start) < START_HOUR * 60 || timeToMinutes(item.end) > END_HOUR * 60) {
      setError("Classes must fit between 7:00 AM and 5:00 PM.");
      return;
    }
    const next = dialog.id
      ? classes.map((current) => current.id === dialog.id ? item : current)
      : [...classes, item];
    persist(next);
  }

  function removeClass(id) {
    persist(classes.filter((item) => item.id !== id));
  }

  const dayCount = showSaturday ? 6 : 5;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const monthOffset = (monthStart.getDay() + 6) % 7;
  const monthCells = Array.from(
    { length: Math.ceil((monthOffset + monthDays) / 7) * 7 },
    (_, index) => index - monthOffset + 1,
  );
  return (
    <main className="schedule-page">
      <header className="schedule-banner">
        <div className="schedule-banner-top">
          <div className="schedule-heading">
            <h1>{view === "weekly" ? "Weekly View" : "Monthly View"}</h1>
            <button
              type="button"
              className="schedule-semester"
              aria-label="Select semester"
              onClick={() => setSemester((current) => current === "1st sem" ? "2nd sem" : current === "2nd sem" ? "Summer" : "1st sem")}
            >
              <span aria-hidden="true">●</span>{semester}
            </button>
          </div>
          <div className="schedule-actions">
            <button
              type="button"
              className={`schedule-icon-button${editMode ? " selected" : ""}`}
              aria-label={editMode ? "Stop editing schedule" : "Edit schedule"}
              aria-pressed={editMode}
              title={editMode ? "Done editing" : "Edit schedule"}
              onClick={() => setEditMode((editing) => !editing)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 17.25 11.06-11.06 3.75 3.75L6.75 21H3v-3.75ZM16.94 4.56l1.5-1.5a1.414 1.414 0 0 1 2 0l1 1a1.414 1.414 0 0 1 0 2l-1.5 1.5-3-3Z" fill="currentColor"/></svg>
            </button>
            <button type="button" className="schedule-icon-button" aria-label="Download schedule" title="Download schedule as CSV" onClick={exportSchedule}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20h14v-2H5v2ZM11 3h2v9h4l-5 5-5-5h4V3Z" fill="currentColor"/></svg>
            </button>
            <button type="button" className="schedule-icon-button" aria-label="Schedule settings" title="Schedule settings" onClick={() => setDialog({ settings: true })}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m19.4 13.5 1.4 1.1-1.4 2.4-1.7-.7a7.7 7.7 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a7.7 7.7 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8L6.2 10.6l1.4-2.4 1.7.7a7.7 7.7 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a7.7 7.7 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8ZM12 14.5a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z" fill="currentColor"/></svg>
            </button>
          </div>
        </div>

        <div className="schedule-view-switch" role="tablist" aria-label="Schedule view">
          <button type="button" role="tab" aria-selected={view === "weekly"} className={view === "weekly" ? "active" : ""} onClick={() => setView("weekly")}>
            <span aria-hidden="true">▦</span> Weekly
          </button>
          <button type="button" role="tab" aria-selected={view === "monthly"} className={view === "monthly" ? "active" : ""} onClick={() => setView("monthly")}>
            <span aria-hidden="true">▦</span> Monthly
          </button>
        </div>
      </header>

      <section className="schedule-board" aria-label={`${view} class schedule`}>
        {editMode && view === "weekly" && <p className="schedule-edit-hint">Editing is on — select an empty time slot to add a class.</p>}
        {error && <p className="schedule-error" role="alert">{error}</p>}
        {view === "weekly" ? (
          <div className="schedule-week-scroll">
            <div className="schedule-week" style={{ "--schedule-days": dayCount }}>
              <div className="schedule-column-heading schedule-time-heading">TIME</div>
              {DAYS.slice(0, dayCount).map((day) => (
                <div className="schedule-column-heading" key={day}>
                  <span>{day}</span>
                </div>
              ))}
              <div className="schedule-time-column">
                {hours.map((hour) => (
                  <div className="schedule-hour-label" key={hour} style={{ top: `${((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }}>{formatHour(hour)}</div>
                ))}
              </div>
              {DAYS.slice(0, dayCount).map((day, dayIndex) => (
                <div className={`schedule-day-column${editMode ? " editing" : ""}`} key={day} onClick={(event) => {
                  if (event.target !== event.currentTarget || !editMode) return;
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const minuteOffset = Math.max(0, event.clientY - bounds.top);
                  const snapped = Math.floor(minuteOffset / 30) * 30 + START_HOUR * 60;
                  const start = `${String(Math.floor(snapped / 60)).padStart(2, "0")}:${String(snapped % 60).padStart(2, "0")}`;
                  openNewClass(dayIndex, start);
                }}>
                  {classes.filter((item) => item.day === dayIndex).map((item) => {
                    const top = ((timeToMinutes(item.start) - START_HOUR * 60) / GRID_DURATION) * 100;
                    const height = ((timeToMinutes(item.end) - timeToMinutes(item.start)) / GRID_DURATION) * 100;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={`schedule-class-card ${item.color || "blue"}`}
                        style={{ top: `${top}%`, height: `${height}%` }}
                        title={`${item.name}: ${formatTime(item.start)}–${formatTime(item.end)}${item.room ? `, ${item.room}` : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (editMode) {
                            setDialog({ ...item });
                            setError("");
                          }
                        }}
                      >
                        <strong>{item.name}</strong>
                        <span>{item.instructor}</span>
                        <span>{item.room}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="schedule-month-view">
            <div className="schedule-month-heading">
              <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
              <h2>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
              <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
            </div>
            <div className="schedule-month-grid">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div className="schedule-month-day-name" key={day}>{day}</div>)}
              {monthCells.map((date, index) => {
                const inMonth = date > 0 && date <= monthDays;
                const cellDate = inMonth ? new Date(month.getFullYear(), month.getMonth(), date) : null;
                const dayClasses = cellDate ? classes.filter((item) => classOnDate(item, cellDate)) : [];
                return (
                  <div className={`schedule-month-cell${inMonth ? "" : " outside"}${cellDate?.toDateString() === new Date().toDateString() ? " today" : ""}`} key={index}>
                    {inMonth && <strong>{date}</strong>}
                    {dayClasses.slice(0, 3).map((item) => <span className={`schedule-month-class ${item.color || "blue"}`} key={item.id}>{item.name}</span>)}
                    {dayClasses.length > 3 && <small>+{dayClasses.length - 3} more</small>}
                  </div>
                );
              })}
            </div>
            {classes.length === 0 && <p className="schedule-month-empty">Add classes in Weekly View while editing is on.</p>}
          </div>
        )}
      </section>

      {dialog && (
        <div className="schedule-dialog-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) { setDialog(null); setError(""); } }}>
          {dialog.settings ? (
            <section className="schedule-dialog" role="dialog" aria-modal="true" aria-labelledby="schedule-settings-title">
              <h2 id="schedule-settings-title">Schedule settings</h2>
              <label className="schedule-checkbox">
                <input type="checkbox" checked={showSaturday} onChange={(event) => setShowSaturday(event.target.checked)} />
                Show Saturday in weekly view
              </label>
              <div className="schedule-dialog-actions"><button type="button" onClick={() => setDialog(null)}>Done</button></div>
            </section>
          ) : (
            <form className="schedule-dialog" onSubmit={saveClass}>
              <h2>{dialog.id ? "Edit class" : "Add a class"}</h2>
              <label>Course name<input name="name" autoFocus defaultValue={dialog.name} placeholder="e.g. PC 315L" /></label>
              <div className="schedule-form-row">
                <label>Day<select name="day" defaultValue={dialog.day}>{DAY_NAMES.map((day, index) => <option value={index} key={day}>{day}</option>)}</select></label>
                <label>Color<select name="color" defaultValue={dialog.color}>{COLORS.map((color) => <option value={color} key={color}>{color[0].toUpperCase() + color.slice(1)}</option>)}</select></label>
              </div>
              <div className="schedule-form-row">
                <label>Start time<input name="start" type="time" required defaultValue={dialog.start} /></label>
                <label>End time<input name="end" type="time" required defaultValue={dialog.end} /></label>
              </div>
              <div className="schedule-form-row">
                <label>Instructor<input name="instructor" defaultValue={dialog.instructor} placeholder="Optional" /></label>
                <label>Room<input name="room" defaultValue={dialog.room} placeholder="Optional" /></label>
              </div>
              {error && <p className="schedule-error" role="alert">{error}</p>}
              <div className="schedule-dialog-actions">
                {dialog.id && <button className="schedule-delete" type="button" onClick={() => removeClass(dialog.id)}>Delete</button>}
                <button className="schedule-cancel" type="button" onClick={() => { setDialog(null); setError(""); }}>Cancel</button>
                <button className="schedule-save" type="submit">Save class</button>
              </div>
            </form>
          )}
        </div>
      )}
    </main>
  );
}

export default Schedule;

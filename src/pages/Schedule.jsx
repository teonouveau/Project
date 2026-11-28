import { useEffect, useRef, useState } from "react";
import scheduleHeaderImage from "../assets/mysched_header.png";
import { DEFAULT_CLASSES, SCHEDULE_STORAGE_KEY } from "../services/schedule";
import "../styles/sched.css";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const START_HOUR = 7;
const END_HOUR = 17;
const GRID_DURATION = (END_HOUR - START_HOUR) * 60;
const COLORS = ["blue", "green", "purple", "yellow", "red"];
function readClasses() {
  try {
    const saved = JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY));
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
  return item.day === (date.getDay() + 6) % 7;
}

function drawSchedulePreview(canvas, headerImage, classes, dayCount) {
  const width = 1000;
  const headerHeight = Math.round(width * headerImage.naturalHeight / headerImage.naturalWidth);
  const tableX = 28;
  const tableWidth = width - tableX * 2;
  const timeWidth = 120;
  const headerRowHeight = 58;
  const hourHeight = 78;
  const gridTop = headerHeight + 32;
  const gridHeight = hourHeight * (END_HOUR - START_HOUR);
  const height = gridTop + headerRowHeight + gridHeight + 32;

  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the schedule image canvas.");

  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.drawImage(headerImage, 0, 0, width, headerHeight);

  const columnWidth = (tableWidth - timeWidth) / dayCount;
  context.fillStyle = "#e6e8e9";
  context.fillRect(tableX, gridTop, timeWidth, headerRowHeight);
  context.fillStyle = "#292d30";
  context.font = "700 18px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("TIME", tableX + timeWidth / 2, gridTop + headerRowHeight / 2);

  DAYS.slice(0, dayCount).forEach((day, index) => {
    const x = tableX + timeWidth + index * columnWidth;
    context.fillStyle = "#0876d1";
    context.fillRect(x, gridTop, columnWidth, headerRowHeight);
    context.fillStyle = "#081e31";
    context.font = "600 18px system-ui, sans-serif";
    context.fillText(day, x + columnWidth / 2, gridTop + headerRowHeight / 2);
  });

  for (let hour = 0; hour <= END_HOUR - START_HOUR; hour += 1) {
    const y = gridTop + headerRowHeight + hour * hourHeight;
    context.fillStyle = "#f8f8f8";
    context.fillRect(tableX, y, timeWidth, hourHeight);
    context.fillStyle = "#fff";
    context.fillRect(tableX + timeWidth, y, tableWidth - timeWidth, hourHeight);
    context.strokeStyle = "#d5dce1";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(tableX, y);
    context.lineTo(tableX + tableWidth, y);
    context.stroke();
    context.fillStyle = "#3a4045";
    context.font = "14px system-ui, sans-serif";
    context.textAlign = "left";
    context.fillText(formatHour(START_HOUR + hour), tableX + 6, y + 18);
  }

  for (let column = 0; column <= dayCount; column += 1) {
    const x = tableX + timeWidth + column * columnWidth;
    context.strokeStyle = "#d5dce1";
    context.beginPath();
    context.moveTo(x, gridTop);
    context.lineTo(x, gridTop + headerRowHeight + gridHeight);
    context.stroke();
  }
  context.strokeStyle = "#d5dce1";
  context.strokeRect(tableX, gridTop, tableWidth, headerRowHeight + gridHeight);

  const colors = {
    blue: "#4269e8",
    green: "#35cf40",
    purple: "#ce36d6",
    yellow: "#f3c928",
    red: "#f21e23",
  };
  const fontSize = dayCount > 5 ? 14 : 17;
  const lineHeight = fontSize * 1.25;
  classes.filter((item) => item.day < dayCount).forEach((item) => {
    const x = tableX + timeWidth + item.day * columnWidth + 6;
    const y = gridTop + headerRowHeight
      + ((timeToMinutes(item.start) - START_HOUR * 60) / 60) * hourHeight + 4;
    const cardWidth = columnWidth - 12;
    const cardHeight = ((timeToMinutes(item.end) - timeToMinutes(item.start)) / 60) * hourHeight - 8;
    context.save();
    context.shadowColor = "rgba(20, 32, 45, 0.24)";
    context.shadowBlur = 8;
    context.shadowOffsetY = 3;
    context.fillStyle = colors[item.color] || colors.blue;
    context.beginPath();
    context.roundRect(x, y, cardWidth, cardHeight, 14);
    context.fill();
    context.restore();

    const details = [item.name, item.instructor, item.room].filter(Boolean);
    const visibleDetails = details.slice(0, Math.max(1, Math.floor((cardHeight - 12) / lineHeight)));
    const firstLineY = y + cardHeight / 2 - ((visibleDetails.length - 1) * lineHeight) / 2;
    context.fillStyle = "#fff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    visibleDetails.forEach((detail, index) => {
      context.font = `${index === 0 ? "700" : "500"} ${fontSize}px system-ui, sans-serif`;
      context.fillText(detail, x + cardWidth / 2, firstLineY + index * lineHeight, cardWidth - 10);
    });
  });
}

function Schedule() {
  useEffect(() => {
    const scrollRoots = [document.documentElement, document.body];
    scrollRoots.forEach((root) => root.classList.add("schedule-scrollbar-hidden"));
    return () => {
      scrollRoots.forEach((root) => root.classList.remove("schedule-scrollbar-hidden"));
    };
  }, []);

  const [classes, setClasses] = useState(readClasses);
  const [view, setView] = useState("weekly");
  const [semester, setSemester] = useState("1st sem");
  const [showWeekend, setShowWeekend] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState("");
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imagePreviewReady, setImagePreviewReady] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState("");
  const imageCanvas = useRef(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    if (!imagePreviewOpen) return undefined;

    const canvas = imageCanvas.current;
    if (!canvas) return undefined;

    let cancelled = false;
    setImagePreviewReady(false);
    setImagePreviewError("");

    const headerImage = new Image();
    headerImage.onload = () => {
      if (cancelled) return;
      try {
        drawSchedulePreview(canvas, headerImage, classes, showWeekend ? DAYS.length : 5);
        setImagePreviewReady(true);
      } catch (renderError) {
        console.error("Could not render the schedule image.", renderError);
        setImagePreviewError("Could not create the schedule image preview.");
      }
    };
    headerImage.onerror = () => {
      if (cancelled) return;
      const loadError = new Error("The schedule header image could not be loaded.");
      console.error("Could not load the schedule image header.", loadError);
      setImagePreviewError("Could not load the schedule header image.");
    };
    headerImage.src = scheduleHeaderImage;

    return () => {
      cancelled = true;
      headerImage.onload = null;
      headerImage.onerror = null;
    };
  }, [classes, imagePreviewOpen, showWeekend]);

  function persist(nextClasses) {
    try {
      localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(nextClasses));
      setClasses(nextClasses);
      setError("");
      setDialog(null);
    } catch (storageError) {
      console.error("Could not save the schedule.", storageError);
      setError("Could not save your schedule. Please check your browser storage.");
    }
  }

  function downloadScheduleImage() {
    const canvas = imageCanvas.current;
    if (!canvas || !imagePreviewReady) return;

    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          const downloadError = new Error("The schedule image could not be created.");
          console.error("Could not create the schedule image download.", downloadError);
          setImagePreviewError("Could not create the schedule image. Please try again.");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "my-schedule.png";
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "image/png");
    } catch (downloadError) {
      console.error("Could not download the schedule image.", downloadError);
      setImagePreviewError("Could not download the schedule image. Please try again.");
    }
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

  const dayCount = showWeekend ? DAYS.length : 5;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const monthOffset = (monthStart.getDay() + 6) % 7;
  const monthCells = Array.from(
    { length: Math.ceil((monthOffset + monthDays) / 7) * 7 },
    (_, index) => index - monthOffset + 1,
  );

  if (imagePreviewOpen) {
    return (
      <main className="schedule-image-page">
        <header className="schedule-image-header">
          <button type="button" className="schedule-image-back" aria-label="Back to schedule" onClick={() => setImagePreviewOpen(false)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6M9 12h12" /></svg>
          </button>
          <div>
            <h1>Schedule Image</h1>
            <p>Save it below to print or share! <span aria-hidden="true">✨</span></p>
          </div>
        </header>

        <button type="button" className="schedule-image-download" disabled={!imagePreviewReady} onClick={downloadScheduleImage}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 5-5m-5 5-5-5M4 20h16" /></svg>
          Download
        </button>
        <p className="schedule-image-customize">Want to download a customized image?</p>
        <p className="schedule-image-preview-label">Preview</p>
        <div className="schedule-image-preview">
          {!imagePreviewReady && !imagePreviewError && <p role="status">Preparing image preview…</p>}
          {imagePreviewError && <p role="alert">{imagePreviewError}</p>}
          <canvas
            ref={imageCanvas}
            className={`schedule-image-canvas${imagePreviewReady ? " ready" : ""}`}
            role="img"
            aria-label="Preview of your weekly class schedule"
          />
        </div>
      </main>
    );
  }

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
            <button
              type="button"
              className="schedule-icon-button"
              aria-label="Preview schedule image"
              title="Preview and download schedule image"
              onClick={() => setImagePreviewOpen(true)}
            >
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
                <input type="checkbox" checked={showWeekend} onChange={(event) => setShowWeekend(event.target.checked)} />
                Show Saturday and Sunday in weekly view
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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import startImage from "../assets/start-transparent.png";
import nameStepImage from "../assets/start1-transparent.png";
import owl1Image from "../assets/owl1-transparent.png";
import owl2Image from "../assets/owl2-transparent.png";
import "../styles/Set.css";

const steps = [
  { title: "Ready to start your success?", text: "Plan ahead with your schedule, stay organized, and achieve your goals." },
  { title: "What should we call you?", text: "A name makes your experience feel more personal.", field: "name" },
  { title: "Pick your look.", text: "Choose the appearance you prefer.", field: "theme" },
  { title: "Add your schedule now?", text: "You can add your class schedule now, or do it later from the Schedule tab.", field: "schedule" },
  { title: "Let's turn on your alerts.", text: "", field: "notifications" },
  { title: "When should we notify you?", text: "", field: "reminders" },
  { title: "Pick your sound and vibration.", text: "", field: "style" },
  { title: "Pick your Widgets.", text: "", field: "widgets" },
  { title: "You're all set!", text: "Here's what we set up for you.", field: "summary" },
  { title: "Setting the class for you...", text: "", field: "finish" },
];

export default function Setup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [theme, setTheme] = useState("Light");
  const [schedule] = useState("Morning");
  const [scheduleChoice, setScheduleChoice] = useState("now");
  const [notifications, setNotifications] = useState(true);
  const [batteryAllowed, setBatteryAllowed] = useState(true);
  const [dndDisabled, setDndDisabled] = useState(false);
  const [classReminder, setClassReminder] = useState(true);
  const [beforeClassReminder, setBeforeClassReminder] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [customMinutes, setCustomMinutes] = useState("");
  const [notificationStyle, setNotificationStyle] = useState("Normal");
  const [volume, setVolume] = useState(100);
  const [widgets, setWidgets] = useState(["Schedule", "Tasks"]);
  const [testingSound, setTestingSound] = useState(false);

  const current = steps[step];
  const stepImage =
    current.field === "name"
      ? nameStepImage
      : ["theme", "notifications", "style"].includes(current.field)
        ? owl2Image
        : ["summary", "finish"].includes(current.field)
          ? owl1Image
          : startImage;

  useEffect(() => {
    if (current.field !== "finish") return undefined;

    const timer = window.setTimeout(() => {
      navigate("/homepage", { replace: true });
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [current.field, navigate]);

  function toggleWidget(value) {
    setWidgets((selected) =>
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  }

  function finishSetup() {
    localStorage.setItem(
      "skwela_setup",
      JSON.stringify({
        name: name.trim(),
        theme,
        schedule: scheduleChoice === "later" ? "Later" : schedule,
        notifications,
        batteryAllowed,
        dndDisabled,
        classReminder,
        beforeClassReminder,
        reminderMinutes,
        customMinutes,
        notificationStyle,
        volume,
        widgets,
      }),
    );
  }

  function continueSetup() {
    if (step === steps.length - 1) {
      return;
    }
    if (current.field === "name" && !name.trim()) {
      setNameError("Please enter your name to continue.");
      return;
    }
    if (current.field === "summary") finishSetup();
    setStep((value) => value + 1);
  }

  function goBack() {
    if (step === 0) return;
    setStep((value) => value - 1);
  }

  return (
    <main className="setup-page">
      <section className={`setup-card ${theme === "Dark" ? "setup-theme-dark" : ""}`} aria-label="Eskwela Ta setup">
        <header className="setup-header">
          {step > 0 ? (
            <button className="setup-back" type="button" onClick={goBack} aria-label="Go back">
              ←
            </button>
          ) : (
            <span className="setup-back-spacer" />
          )}
          <div
            className="setup-progress"
            role="progressbar"
            aria-label="Setup progress"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={step + 1}
          >
            <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </header>

        <div className="setup-content">
          <img
            className="setup-logo"
            src={stepImage}
            alt="Eskwela Ta"
          />
          <h1>{current.title}</h1>
          <p className="setup-description">{current.text}</p>

          {current.field === "name" && (
            <label className="setup-field">
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (event.target.value.trim()) setNameError("");
                }}
                placeholder="Your name"
                autoComplete="name"
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? "setup-name-error" : undefined}
              />
              {nameError && <small id="setup-name-error" className="setup-name-error" role="alert">{nameError}</small>}
            </label>
          )}

          {current.field === "theme" && (
            <div className="setup-theme-options">
              {["Light", "Dark"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={theme === item ? "selected" : ""}
                  onClick={() => setTheme(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {current.field === "schedule" && (
            <div className="setup-schedule-options">
              <button
                type="button"
                className={scheduleChoice === "now" ? "selected" : ""}
                onClick={() => setScheduleChoice("now")}
              >
                Yes, add it now
              </button>
              <button
                type="button"
                className={scheduleChoice === "later" ? "selected" : ""}
                onClick={() => setScheduleChoice("later")}
              >
                Skip, I'll add it later
              </button>
            </div>
          )}

          {current.field === "notifications" && (
            <div className="setup-alert-list">
              <button type="button" className={notifications ? "selected" : ""} onClick={() => setNotifications((value) => !value)}>
                <span>
                  <strong>Notifications</strong>
                  <small>We’ll let you know when important classes or tasks are coming up.</small>
                </span>
                <span className="setup-alert-status">{notifications ? "Granted" : "Not Granted"}</span>
              </button>
              <button type="button" className={batteryAllowed ? "setup-alert-optimization selected" : "setup-alert-optimization"} onClick={() => setBatteryAllowed((value) => !value)}>
                <span>
                  <strong>Battery Optimization</strong>
                  <small>Reminders arriving later. This can delay them.</small>
                </span>
                <span className="setup-alert-status">{batteryAllowed ? "Allow" : "Not Allow"}</span>
              </button>
              <button type="button" className={dndDisabled ? "setup-alert-disabled" : ""} onClick={() => setDndDisabled((value) => !value)}>
                <span>
                  <strong>Do Not Disturb</strong>
                  <small>So classes or assignments won't be silent at night.</small>
                </span>
                <span className="setup-alert-status setup-alert-status-danger">{dndDisabled ? "Disabled" : "Disable"}</span>
              </button>
            </div>
          )}

          {current.field === "reminders" && (
            <div className="setup-reminder-cards">
              <button
                type="button"
                className={classReminder ? "selected" : ""}
                onClick={() => setClassReminder((value) => !value)}
              >
                <span>
                  <strong>Notify at Class Time</strong>
                  <small>Remind before class starts</small>
                </span>
              </button>
              <button
                type="button"
                className={beforeClassReminder ? "selected" : ""}
                onClick={() => setBeforeClassReminder((value) => !value)}
              >
                <span>
                  <strong>Notify Before Class</strong>
                  <small>Remind before class start</small>
                </span>
              </button>

              <small className="setup-reminder-label">Notify me before class</small>
              <div className="setup-reminder-times">
                {[5, 10, 15, 20, 30].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className={!customMinutes && reminderMinutes === minutes ? "selected" : ""}
                    onClick={() => {
                      setReminderMinutes(minutes);
                      setCustomMinutes("");
                    }}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>

              <label className="setup-custom-reminder">
                <span>Want different minutes?</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(event.target.value)}
                  placeholder=""
                  aria-label="Custom notification minutes"
                />
              </label>
            </div>
          )}

          {current.field === "style" && (
            <div className="setup-sound-options">
              {[
                ["No vibration", "Silent"],
                ["Normal", "Gentle Buzz"],
                ["Strong", "Strong Buzz"],
              ].map(([item, description]) => (
                <button
                  key={item}
                  type="button"
                  className={notificationStyle === item ? "selected" : ""}
                  onClick={() => setNotificationStyle(item)}
                >
                  <span>
                    <strong>{item}</strong>
                    <small>{description}</small>
                  </span>
                </button>
              ))}
              <label className="setup-volume">
                <span>Volume</span>
                <strong>{volume}%</strong>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  aria-label="Notification volume"
                />
              </label>
              <button
                type="button"
                className="setup-test-sound"
                onClick={() => {
                  setTestingSound(true);
                  window.setTimeout(() => setTestingSound(false), 1500);
                }}
              >
                {testingSound ? "Playing..." : "Test Sound & Vibration"}
              </button>
            </div>
          )}

          {current.field === "widgets" && (
            <div className="setup-widget-options">
              {[
                ["Schedule", "Today's classes"],
                ["Tasks", "Pending items"],
                ["Widget Dark Mode", "Off"],
              ].map(([item, description]) => (
                <button
                  key={item}
                  type="button"
                  className={widgets.includes(item) ? "selected" : ""}
                  onClick={() => toggleWidget(item)}
                >
                  <span>
                    <strong>{item}</strong>
                    <small>{description}</small>
                  </span>
                </button>
              ))}
            </div>
          )}

          {current.field === "summary" && (
            <div className="setup-summary">
              <div><span>✓</span><strong>Appearance</strong><small>{theme}</small></div>
              <div><span>✓</span><strong>Notifications</strong><small>{notifications ? "Granted" : "Not granted"}</small></div>
              <div><span>✓</span><strong>Reminders</strong><small>{customMinutes ? `${customMinutes} min` : `${reminderMinutes} min`}</small></div>
              <div><span>✓</span><strong>Vibration</strong><small>{notificationStyle}</small></div>
              <div><span>✓</span><strong>Notification</strong><small>{beforeClassReminder ? "On" : "Off"}</small></div>
              <div><span>✓</span><strong>Widgets</strong><small>{widgets.length ? widgets.join(", ") : "None"}</small></div>
            </div>
          )}

          {current.field === "finish" && (
            <div className="setup-ready" aria-label="Setup complete">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        {current.field !== "finish" && (
          <footer className="setup-footer">
            <button type="button" className="setup-button" onClick={continueSetup}>
              {step === 0 ? "Let's get started!" : current.field === "summary" ? "Finish" : "Continue"}
            </button>
          </footer>
        )}
      </section>
    </main>
  );
}

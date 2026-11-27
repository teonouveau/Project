import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import owlLogo from "../assets/owl-logo.png";
import "../styles/settings.css";

function readObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("skwela_user"));
  } catch {
    localStorage.removeItem("skwela_user");
    return null;
  }
}

function SettingsIcon({ type }) {
  if (type === "scheduler") return <span aria-hidden="true">✓</span>;
  if (type === "study") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5c2.8-.9 5.6-.5 8 1.2v13c-2.4-1.7-5.2-2.1-8-1.2v-13Zm16 0c-2.8-.9-5.6-.5-8 1.2v13c2.4-1.7 5.2-2.1 8-1.2v-13Z" />
      </svg>
    );
  }
  if (type === "attendance") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.5C9.4 6.3 5.2 11 5.2 15.1a6.8 6.8 0 0 0 13.6 0C18.8 11 14.6 6.3 12 2.5Z" />
      </svg>
    );
  }
  if (type === "appearance") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.2 15.2A8.3 8.3 0 0 1 8.8 4.8 8.5 8.5 0 1 0 19.2 15.2Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </svg>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [user] = useState(readUser);
  const [preferences, setPreferences] = useState(() => readObject("skwela_setup"));
  const [attendanceEnabled, setAttendanceEnabled] = useState(
    () => localStorage.getItem("skwela_attendance_streak_enabled") !== "false",
  );

  const theme = preferences.theme === "Dark" ? "Dark" : "Light";
  const notificationsEnabled = preferences.notifications !== false;
  const displayName = preferences.name?.trim() || user?.name?.trim();
  const initials = displayName
    ? displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  useEffect(() => {
    document.documentElement.dataset.theme = theme.toLowerCase();
  }, [theme]);

  function updatePreference(key, value) {
    const next = { ...preferences, [key]: value };
    localStorage.setItem("skwela_setup", JSON.stringify(next));
    setPreferences(next);
  }

  function openHomeTab(activePage) {
    navigate("/homepage", { state: { activePage } });
  }

  function toggleAttendance(event) {
    const enabled = event.target.checked;
    localStorage.setItem("skwela_attendance_streak_enabled", String(enabled));
    setAttendanceEnabled(enabled);
  }

  function signOut() {
    localStorage.removeItem("skwela_user");
    navigate("/login", { replace: true });
  }

  return (
    <main className={`settings-page${theme === "Dark" ? " theme-dark" : ""}`}>
      <header className="settings-hero">
        <div className="settings-topline">
          <button
            className="settings-back"
            type="button"
            aria-label="Back to Home"
            onClick={() => navigate("/homepage")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5m0 0 7-7m-7 7 7 7" />
            </svg>
          </button>
          <img className="settings-logo" src={owlLogo} alt="Eskwela Ta owl" />
        </div>
        <h1>Settings</h1>
        <p>Manage your account and preferences.</p>
      </header>

      <div className="settings-content">
        <section className="settings-account" aria-label="Account">
          <div className="settings-avatar" aria-hidden="true">{initials}</div>
          <strong>{user ? `Welcome, ${displayName || "Student"}` : "You're browsing as a guest"} <span aria-hidden="true">✓</span></strong>
          <p>{user ? user.email || "Your account is signed in." : "Sign in to sync your data."}</p>
          <button
            type="button"
            onClick={user ? signOut : () => navigate("/login")}
          >
            {user ? "Sign out" : "Sign in"}
          </button>
        </section>

        <section className="settings-section" aria-labelledby="settings-features-title">
          <h2 id="settings-features-title">Features</h2>
          <div className="settings-card">
            <button className="settings-row" type="button" onClick={() => openHomeTab("schedule")}>
              <span className="settings-icon scheduler"><SettingsIcon type="scheduler" /></span>
              <span className="settings-row-copy">
                <strong>Scheduler</strong>
                <small>Read &amp; sync academic calendar</small>
              </span>
              <span className="settings-chevron" aria-hidden="true">›</span>
            </button>
            <button className="settings-row" type="button" onClick={() => openHomeTab("study")}>
              <span className="settings-icon study"><SettingsIcon type="study" /></span>
              <span className="settings-row-copy">
                <strong>Study Tools</strong>
                <small>Smart notes &amp; flashcard maker</small>
              </span>
              <span className="settings-chevron" aria-hidden="true">›</span>
            </button>
            <label className="settings-row settings-streak-row">
              <span className="settings-icon attendance"><SettingsIcon type="attendance" /></span>
              <span className="settings-row-copy">
                <strong>Attendance Streak</strong>
                <small>Track daily class attendance</small>
              </span>
              <input
                type="checkbox"
                checked={attendanceEnabled}
                onChange={toggleAttendance}
                aria-label="Enable attendance streak"
              />
            </label>
          </div>
        </section>

        <section className="settings-section" aria-labelledby="settings-appearance-title">
          <h2 id="settings-appearance-title">Appearance</h2>
          <div className="settings-card">
            <button
              className="settings-row"
              type="button"
              onClick={() => updatePreference("theme", theme === "Dark" ? "Light" : "Dark")}
              aria-label={`Switch to ${theme === "Dark" ? "light" : "dark"} theme`}
            >
              <span className="settings-icon appearance"><SettingsIcon type="appearance" /></span>
              <span className="settings-row-copy">
                <strong>Appearance</strong>
                <small>{theme} theme</small>
              </span>
              <span className="settings-chevron" aria-hidden="true">›</span>
            </button>
          </div>
        </section>

        <section className="settings-section" aria-labelledby="settings-notifications-title">
          <h2 id="settings-notifications-title">Notifications</h2>
          <div className="settings-card">
            <button
              className="settings-row"
              type="button"
              onClick={() => updatePreference("notifications", !notificationsEnabled)}
              aria-pressed={notificationsEnabled}
            >
              <span className="settings-icon notifications"><SettingsIcon type="notifications" /></span>
              <span className="settings-row-copy">
                <strong>Notification Settings</strong>
                <small>{notificationsEnabled ? "Class alerts, remind next timing" : "Class and task alerts are off"}</small>
              </span>
              <span className="settings-chevron" aria-hidden="true">›</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
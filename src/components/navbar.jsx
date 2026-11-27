export function ScheduleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  );
}

const NAV_ITEMS = [
  {
    key: "home",
    label: "Home",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    key: "tasks",
    label: "Tasks & Events",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    key: "schedule",
    label: "Schedule",
    icon: <ScheduleIcon />,
  },
  {
    key: "study",
    label: "Study",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    key: "gwa",
    label: "GPA Calculator",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 9h1.5a1.5 1.5 0 0 1 0 3H9v3M9 9V7M15 9v6M15 12h-2" />
      </svg>
    ),
  },
];

export default function Navbar({ activePage, onNavigate, placement = "mobile" }) {
  const isSidebar = placement === "sidebar";
  return (
    <nav className={isSidebar ? "home-sidebar-nav" : "home-mobile-nav"} aria-label="Main navigation">
      {NAV_ITEMS.map(({ key, icon, label }) => (
        <button
          key={key}
          className={isSidebar
            ? `home-nav-item${activePage === key ? " active" : ""}`
            : `home-mobile-nav-item${activePage === key ? " active" : ""}`}
          type="button"
          aria-current={activePage === key ? "page" : undefined}
          onClick={() => onNavigate(key)}
        >
          <span className={isSidebar ? "nav-icon" : undefined}>{icon}</span>
          <small>{label}</small>
        </button>
      ))}
    </nav>
  );
}
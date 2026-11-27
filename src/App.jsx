import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Homepage from "./pages/Homepage";
import LoadingPage from "./pages/LoadingPage";
import Setup from "./pages/Setup";
import Settings from "./pages/settings";

function PrivateRoute({ children }) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("skwela_user"));
  } catch {
    localStorage.removeItem("skwela_user");
  }
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("skwela_user"));
  } catch {
    localStorage.removeItem("skwela_user");
  }
  return user ? <Navigate to="/homepage" replace /> : children;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let theme = "light";
    try {
      const setup = JSON.parse(localStorage.getItem("skwela_setup") || "{}");
      if (setup?.theme === "Dark") theme = "dark";
    } catch {
      localStorage.removeItem("skwela_setup");
    }
    document.documentElement.dataset.theme = theme;
  }, []);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/setup" element={<Setup />} />

        <Route path="/signup" element={<Register />} />

        <Route path="/register" element={<Navigate to="/signup" replace />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/reset-password"
          element={
            <GuestRoute>
              <ResetPassword />
            </GuestRoute>
          }
        />

        <Route
          path="/homepage"
          element={
            <PrivateRoute>
              <Homepage />
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        <Route path="/dashboard" element={<Navigate to="/homepage" replace />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
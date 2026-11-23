import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Homepage from "./pages/Homepage";
import LoadingPage from "./pages/loadingpPage";

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

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />

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

        <Route path="/dashboard" element={<Navigate to="/homepage" replace />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
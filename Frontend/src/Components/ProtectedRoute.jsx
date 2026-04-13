import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * ProtectedRoute — requires the user to be authenticated (any role).
 * Saves the attempted path so after login they return to where they tried to go.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token || !userStr) {
    // Redirect to login, preserve the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    JSON.parse(userStr); // validate it's valid JSON
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

import { Navigate } from "react-router-dom";
import React from "react";
export default function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token || !userStr) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(userStr);

    if (user.role !== "admin") {
      return <Navigate to="/" replace />;
    }
  } catch {
    return <Navigate to="/" replace />;
  }

  return children;
}

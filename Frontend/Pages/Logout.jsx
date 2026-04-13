import { useState } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";

const Logout = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle"); // idle | loggingOut | done

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  })();

  const handleLogout = () => {
    setStatus("loggingOut");

    setTimeout(() => {
      // Clear all auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // 🔥 Tell navbar to update instantly
      window.dispatchEvent(new Event("authChange"));

      setStatus("done");

      setTimeout(() => {
        navigate("/");
      }, 1200);
    }, 800);
  };

  const handleCancel = () => {
    const role = user?.role;
    if (role === "admin") navigate("/dashboard");
    else if (role === "police") navigate("/bar");
    else if (role === "user") navigate("/citizen");
    else navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">

        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2 text-gray-800">
          {status === "done" ? "Logged Out" : "Logout"}
        </h2>

        {user?.name && status === "idle" && (
          <p className="text-gray-500 mb-1 text-sm">
            Signed in as <span className="font-semibold text-gray-700">{user.name}</span>
          </p>
        )}

        {status === "idle" && (
          <>
            <p className="text-gray-500 mb-8 text-sm">
              Are you sure you want to log out?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 text-white py-3 rounded hover:bg-red-600 transition font-medium"
              >
                Yes, Logout
              </button>
              <button
                onClick={handleCancel}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {status === "loggingOut" && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Logging you out...</p>
          </div>
        )}

        {status === "done" && (
          <div className="mt-4 p-3 rounded bg-green-100 text-green-700 text-sm">
            You have been successfully logged out. Redirecting...
          </div>
        )}
      </div>
    </div>
  );
};

export default Logout;
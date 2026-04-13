import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import Login from "../Pages/Login";
import Register from "../Pages/Register";
import CrimeReportingHome from "../Pages/Home";
import ReportCrime from "../Pages/CrimeReport/report.jsx";

import Dashboard from "./Components/Dashboard/dashboard.jsx";
import AdminReport from "./Components/Dashboard/adminreport.jsx";
import AdminRoute from "./Components/AdminRoute.jsx";
import PoliceRoute from "./Components/PoliceRoute.jsx";
import CitizenRoute from "./Components/CitizenRoute.jsx";
import NewBoard from "../Pages/police/Dashui.jsx";
import Policereport from "./Components/Policedashboard/Policereport.jsx";
import Notifications from "../Pages/notification/notification.jsx";
import CitizenDashboard from "../Pages/Citizendashboard/citizen.jsx";
import CitizenSettings from "../Pages/Citizendashboard/CitizenSettings.jsx";
import SendFeedback from "../Pages/Feedback/SendFeedback.jsx";
import AdminFeedback from "../Pages/Feedback/admingetfeed.jsx";
import CrimeMap from "../Pages/Citizendashboard/CrimeMap.jsx";
import UserApp from "../Pages/Complainfeature/Userapp.jsx";
import AdminApp from "../Pages/Complainfeature/Adminapp.jsx";
import Verify from "./Components/Dashboard/verify.jsx";
import ForwardToPolice from "./Components/Policedashboard/Forwardtopolice.jsx";
import EmergencyContactsApp from "./Components/Policedashboard/Emergencycontacts.jsx";
import AdminLayout from "./Components/Layouts/AdminLayout.jsx";
import PoliceLayout from "./Components/Layouts/PoliceLayout.jsx";
import CitizenLayout from "./Components/Layouts/CitizenLayout.jsx";

import ForgotPassword from "../Pages/ForgotPassword.jsx";
import ResetPassword from "../Pages/ResetPassword.jsx";
import Logout from "../Pages/Logout.jsx";
import Users from "../Pages/Citizendashboard/user.jsx";
import SOSList from "./Components/Policedashboard/SOSlist.jsx";
import CommunityBoard from "../Pages/Citizendashboard/CommunityBoard.jsx";
import TransparencyHub from "../Pages/Citizendashboard/TransparencyHub.jsx";

// Helper: redirect already-logged-in users away from auth pages
function GuestOnlyRoute({ children }) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role === "admin") return <Navigate to="/dashboard" replace />;
      if (user.role === "police") return <Navigate to="/bar" replace />;
      if (user.role === "user") return <Navigate to="/citizen" replace />;
    } catch {
      // bad data — let them through to login/register
    }
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── PUBLIC ROUTES ─────────────────────────────────────────── */}
        <Route path="/" element={<CrimeReportingHome />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/logout" element={<Logout />} />

        {/* Auth pages — redirect if already logged in */}
        <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
        <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />

        {/* ── ADMIN ROUTES (role: admin) ─────────────────────────────── */}
        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/adReport" element={<AdminReport />} />
          <Route path="/user" element={<Users />} />
          <Route path="/Comp" element={<AdminApp />} />
          <Route path="/forward-admin" element={<ForwardToPolice />} />
          <Route path="/admin/feedback" element={<AdminFeedback />} />
          <Route path="/admin/verify/:id" element={<Verify />} />
          <Route path="/admin/performance" element={<TransparencyHub />} />
          <Route path="/Map" element={<CrimeMap />} />
        </Route>

        {/* ── POLICE ROUTES (role: police) ──────────────────────────── */}
        <Route element={<PoliceRoute><PoliceLayout /></PoliceRoute>}>
          <Route path="/bar" element={<NewBoard />} />
          <Route path="/complain" element={<Policereport />} />
          <Route path="/forward" element={<ForwardToPolice />} />
          <Route path="/sos" element={<SOSList />} />
          <Route path="/emergency-police" element={<EmergencyContactsApp />} />
        </Route>

        {/* ── CITIZEN ROUTES (role: user) ────────────────────────────── */}
        <Route element={<CitizenRoute><CitizenLayout /></CitizenRoute>}>
          <Route path="/citizen" element={<CitizenDashboard />} />
          <Route path="/community" element={<CommunityBoard />} />
          <Route path="/transparency" element={<TransparencyHub />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/feedback" element={<SendFeedback />} />
          <Route path="/report" element={<ReportCrime />} />
          <Route path="/Co" element={<UserApp />} />
          <Route path="/map-citizen" element={<CrimeMap />} />
          <Route path="/emergency" element={<EmergencyContactsApp />} />
          <Route path="/citizen/settings" element={<CitizenSettings />} />
        </Route>

        {/* ── CATCH-ALL ─────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

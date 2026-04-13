import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from "react";
import Login from "../Pages/Login";
import Register from "../Pages/Register";
import CrimeReportingHome from "../Pages/Home";
import ReportCrime from "../Pages/CrimeReport/report.jsx";

import Dashboard from "./Components/Dashboard/dashboard.jsx";
import AdminReport from "./Components/Dashboard/adminreport.jsx";
import AdminRoute from "./Components/AdminRoute.jsx";
import PoliceDashboard from "./Components/Policedashboard/Policereport.jsx";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<CrimeReportingHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/logout" element={<Logout />} />

        {/* Admin routes */}
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

        {/* Police routes */}
        <Route element={<PoliceLayout />}>
          <Route path="/bar" element={<NewBoard />} />
          <Route path="/complain" element={<Policereport />} />
          <Route path="/forward" element={<ForwardToPolice />} />
          <Route path="/sos" element={<SOSList />} />
          <Route path="/emergency-police" element={<EmergencyContactsApp />} />
        </Route>

        {/* Citizen routes */}
        <Route element={<CitizenLayout />}>
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

      </Routes>
    </BrowserRouter>
  );
}

export default App;

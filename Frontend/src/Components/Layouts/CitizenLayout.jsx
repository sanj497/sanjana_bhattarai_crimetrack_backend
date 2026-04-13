import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, FileText, Bell, MessageSquare, Settings, AlertTriangle, ShieldAlert, LogOut, ChevronLeft, ChevronRight, Shield, Users, BarChart3 } from "lucide-react";

const getUser = () => {
  try { return JSON.parse(localStorage.getItem("user")) || {}; } catch { return {}; }
};

const navItems = [
  { icon: <LayoutDashboard size={20} />, label: "Overview", path: "/citizen" },
  { icon: <Users size={20} />, label: "Community", path: "/community" },
  { icon: <BarChart3 size={20} />, label: "Transparency", path: "/transparency" },
  { icon: <FileText size={20} />, label: "Documents", path: "#" },
  { icon: <Bell size={20} />, label: "Notifications", path: "/notifications" },
  { icon: <MessageSquare size={20} />, label: "Complaints", path: "/Co" },
  { icon: <Settings size={20} />, label: "Settings", path: "/citizen/settings" },
];

export default function CitizenLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const getPageTitle = () => {
    const item = navItems.find(i => i.path === location.pathname);
    if (item) return item.label;
    if (location.pathname === "/Report") return "Report Crime";
    if (location.pathname === "/emergency") return "Emergency Services";
    if (location.pathname === "/Feedback") return "Submit Feedback";
    return "Citizen Portal";
  };

  const pageTitle = getPageTitle();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F9FC] font-sans text-[#111827]">
      {/* SIDEBAR */}
      <aside className={`flex flex-col bg-[#0B1F3B] text-gray-300 transition-all duration-300 ease-in-out z-20 ${sidebarOpen ? "w-64" : "w-20"} shrink-0 border-r border-[#112445]`}>
        {/* LOGO */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-[#112445]">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-[#00B8D9]" />
              <span className="font-bold text-white text-xl" style={{ fontFamily: "Poppins, sans-serif" }}>CrimeTrack</span>
            </div>
          )}
          {!sidebarOpen && (
             <Shield className="h-8 w-8 text-[#00B8D9] mx-auto" />
          )}
        </div>
        
        {/* Toggle Button Inside Sidebar (Absolute trick typically, but we'll put it inline or just make the logo area clickable) */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-20 -right-3 h-6 w-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-[#1E5EFF] z-50 cursor-pointer shadow-sm transition"
        >
          {sidebarOpen ? <ChevronLeft size={14}/> : <ChevronRight size={14}/>}
        </button>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2 relative">
          <div className={`text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 px-3 ${!sidebarOpen && "hidden"}`}>Menu</div>
          
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.label} to={item.path} title={!sidebarOpen ? item.label : ""} className={`flex items-center gap-3 px-3 py-3 rounded-[10px] transition-colors ${isActive ? "bg-[#1E5EFF]/10 text-[#00B8D9] font-semibold" : "hover:bg-[#112445] hover:text-white"}`}>
                <div className="flex items-center justify-center">{item.icon}</div>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}

          <div className={`mt-6 mb-2 border-t border-[#112445] pt-6 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${!sidebarOpen && "hidden"}`}>Priority Actions</div>
          
          <Link to="/Report" title={!sidebarOpen ? "Report Crime" : ""} className={`flex items-center gap-3 px-3 py-3 rounded-[10px] transition-colors ${location.pathname === "/Report" ? "bg-red-500/10 text-[#E63946] font-semibold" : "text-gray-300 hover:bg-[#112445] hover:text-[#E63946]"}`}>
            <AlertTriangle size={20} />
            {sidebarOpen && <span className="truncate">Report Crime</span>}
          </Link>
          
          <Link to="/emergency" title={!sidebarOpen ? "Emergency" : ""} className="flex items-center gap-3 px-3 py-3 rounded-[10px] transition-colors bg-[#E63946] text-white hover:bg-red-700 shadow-[0_4px_12px_rgba(230,57,70,0.3)] mt-2">
            <ShieldAlert size={20} className="animate-pulse" />
            {sidebarOpen && <span className="truncate font-bold">Emergency Signal</span>}
          </Link>
          
          <Link to="/Feedback" title={!sidebarOpen ? "Feedback" : ""} className={`flex items-center gap-3 px-3 py-3 rounded-[10px] transition-colors mt-2 ${location.pathname === "/Feedback" ? "bg-[#1E5EFF]/10 text-[#00B8D9] font-semibold" : "text-gray-300 hover:bg-[#112445] hover:text-white"}`}>
            <MessageSquare size={20} />
            {sidebarOpen && <span className="truncate">Submit Feedback</span>}
          </Link>
        </nav>

        {/* BOTTOM USER/LOGOUT AREA */}
        <div className="p-4 border-t border-[#112445]">
          <Link to="/logout" title={!sidebarOpen ? "Logout" : ""} className="flex items-center gap-3 px-3 py-3 rounded-[10px] text-gray-400 hover:text-white hover:bg-[#112445] transition-colors">
            <LogOut size={20} />
            {sidebarOpen && <span>Disconnect</span>}
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 z-10 sticky top-0 shadow-sm">
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Citizen Portal Dashboard</div>
            <h2 className="text-xl font-bold text-[#0B1F3B]" style={{ fontFamily: "Poppins, sans-serif" }}>{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:block text-sm text-[#1E5EFF] bg-[#1E5EFF]/10 px-4 py-2 rounded-full font-semibold border border-[#1E5EFF]/20">
               {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
             </div>
             {(() => {
               const u = getUser();
               const initials = u.username ? u.username.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) : "U";
               return (
                 <div className="flex items-center gap-2">
                   <div className="hidden sm:block text-right">
                     <div className="text-xs font-bold text-[#0B1F3B]">{u.username || "Citizen"}</div>
                     <div className="text-[10px] text-gray-400">{u.email || ""}</div>
                   </div>
                   <div className="h-10 w-10 bg-[#0B1F3B] text-white flex items-center justify-center rounded-full font-bold shadow-md">
                     {initials}
                   </div>
                 </div>
               );
             })()}
          </div>
        </header>

        {/* OUTLET CONTAINER */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

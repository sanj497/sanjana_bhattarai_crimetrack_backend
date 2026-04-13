import React, { useState, useMemo } from "react";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  FileText, 
  Users, 
  Send, 
  Settings, 
  MessageSquare, 
  Shield, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Bell,
  RefreshCw,
  BarChart3
} from "lucide-react";

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const menu = useMemo(
        () => [
            { name: "Dashboard",     icon: <LayoutDashboard size={20} />, path: "/dashboard" },
            { name: "Live Map",      icon: <MapIcon size={20} />,         path: "/Map"       },
            { name: "Report Desk",   icon: <FileText size={20} />,        path: "/adReport"  },
            { name: "User Directory",icon: <Users size={20} />,           path: "/user"      },
            { name: "Case Tracker",  icon: <Send size={20} />,            path: "/forward-admin" },
            { name: "Complaints",    icon: <Settings size={20} />,        path: "/Comp"      },
            { name: "Feedback",      icon: <MessageSquare size={20} />,   path: "/admin/feedback" },
            { name: "Performance",   icon: <BarChart3 size={20} />,       path: "/admin/performance" },
        ],
        []
    );

    const activeItem = useMemo(() => {
        const found = menu.find(item => location.pathname === item.path || location.pathname.startsWith(item.path + "/"));
        return found ? found.name : "Admin Panel";
    }, [location.pathname, menu]);

    return (
        <div className="flex h-screen overflow-hidden bg-[#F7F9FC] font-sans text-[#111827]">
            {/* SIDEBAR */}
            <aside className={`flex flex-col bg-[#0B1F3B] text-gray-300 transition-all duration-300 ease-in-out z-20 ${sidebarOpen ? "w-64" : "w-20"} shrink-0 border-r border-[#112445] relative`}>
                
                {/* LOGO AREA */}
                <div className="h-20 flex items-center justify-between px-5 border-b border-[#112445]">
                    {sidebarOpen && (
                        <div className="flex items-center gap-3">
                            <Shield className="h-8 w-8 text-[#00B8D9]" />
                            <span className="font-bold text-white text-xl tracking-tight">AdminHQ</span>
                        </div>
                    )}
                    {!sidebarOpen && (
                        <Shield className="h-8 w-8 text-[#00B8D9] mx-auto" />
                    )}
                </div>

                {/* Toggle Button */}
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute top-20 -right-3 h-6 w-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-[#1E5EFF] z-50 cursor-pointer shadow-sm transition"
                >
                    {sidebarOpen ? <ChevronLeft size={14}/> : <ChevronRight size={14}/>}
                </button>

                {/* NAVIGATION */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2">
                    <div className={`text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 px-3 ${!sidebarOpen && "hidden"}`}>Command Center</div>
                    
                    {menu.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
                        return (
                            <Link 
                                key={item.name} 
                                to={item.path} 
                                title={!sidebarOpen ? item.name : ""} 
                                className={`flex items-center gap-3 px-3 py-3 rounded-[10px] transition-all ${isActive ? "bg-[#1E5EFF]/10 text-[#00B8D9] font-semibold" : "hover:bg-[#112445] hover:text-white"}`}
                            >
                                <div className="flex items-center justify-center min-w-[20px]">{item.icon}</div>
                                {sidebarOpen && <span className="truncate text-sm">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* FOOTER AREA */}
                <div className="p-4 border-t border-[#112445]">
                    <button 
                        onClick={() => navigate("/logout")}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-[10px] text-gray-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* HEADER */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0 z-10 sticky top-0 shadow-sm">
                    <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Administrator Portal</div>
                        <h2 className="text-xl font-extrabold text-[#0B1F3B] tracking-tight">{activeItem}</h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end mr-2">
                             <div className="text-xs font-bold text-[#0B1F3B]">Main Administrator</div>
                             <div className="text-[10px] text-gray-400">admin@crimetrack.gov</div>
                        </div>
                        <div className="h-10 w-10 bg-[#0B1F3B] text-white flex items-center justify-center rounded-xl font-black shadow-lg transform rotate-3 hover:rotate-0 transition-transform cursor-default">
                            A
                        </div>
                    </div>
                </header>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto bg-[#F7F9FC]">
                    <div className="p-0">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}

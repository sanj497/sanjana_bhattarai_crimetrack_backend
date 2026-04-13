import React, { useState } from 'react';
import { Shield, AlertTriangle, FileText, MapPin, Bell, Search, Menu, X, Siren, LogOut, LayoutDashboard, Send, PhoneCall } from 'lucide-react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';

export default function PoliceLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/bar' },
    { name: 'Reports', icon: FileText, path: '/complain' },
    { name: 'Forwarded', icon: Send, path: '/forward' },
    { name: 'SOS Alerts', icon: Siren, path: '/sos', badge: '3' },
    { name: 'Emergency', icon: PhoneCall, path: '/emergency' },
  ];

  const currentPage = menuItems.find(item => item.path === location.pathname)?.name || 'Police Dashboard';

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col z-20`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Shield className="text-blue-500" size={24} />
              <span className="font-bold text-lg tracking-tight">POLICE HQ</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-slate-700 rounded text-slate-400">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 py-3 px-4 rounded transition-all duration-200 ${
                location.pathname === item.path ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-medium">{item.name}</span>
                  {item.badge && <span className="bg-red-500 text-[10px] px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => navigate('/logout')}
            className="flex items-center gap-3 py-3 px-4 rounded w-full bg-slate-700 hover:bg-red-600 transition-colors font-semibold shadow-sm"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Header */}
        <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">{currentPage}</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Search cases..." 
                className="bg-slate-900 border border-slate-700 rounded-lg py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500"
              />
              <Search className="absolute left-3 top-2 text-slate-500" size={16} />
            </div>
            
            <div className="flex items-center gap-4 border-l border-slate-700 pl-6">
              <button className="relative text-slate-400 hover:text-white">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold">Sgt. Wilson</div>
                  <div className="text-[10px] text-slate-500">Badge #4492</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs ring-2 ring-slate-700">W</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto">
            <Outlet />
        </div>
      </div>
    </div>
  );
}

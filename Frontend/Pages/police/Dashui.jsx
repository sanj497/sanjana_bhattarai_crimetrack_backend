import React, { useState } from 'react';
import { Shield, Users, AlertTriangle, FileText, MapPin, Bell, Search, Menu, X, Siren, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NewBoard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const stats = [
    { label: 'Active Cases', value: '342', icon: FileText, color: 'bg-blue-500' },
    { label: 'Officers on Duty', value: '87', icon: Users, color: 'bg-blue-600' },
    { label: 'Incidents Today', value: '23', icon: AlertTriangle, color: 'bg-blue-700' },
    { label: 'Patrol Units', value: '45', icon: MapPin, color: 'bg-blue-800' }
  ];

  const incidents = [
    { id: 1, type: 'Theft', location: 'Main St', time: '10:30 AM', status: 'Active' },
    { id: 2, type: 'Traffic', location: '5th Ave', time: '11:15 AM', status: 'Resolved' },
    { id: 3, type: 'Disturbance', location: 'Park Rd', time: '12:00 PM', status: 'Active' }
  ];

  const navItems = ['Dashboard', 'Cases', 'Officers', 'Reports', 'Map', 'Settings'];

  return (
    <div className="p-8 font-sans bg-slate-950 min-h-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">OPERATIONAL COMMAND</h2>
          <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">Real-time Precinct Oversight</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                 <Shield size={20} />
              </div>
              <div>
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">System Status</div>
                 <div className="text-sm font-bold text-white uppercase">Secured</div>
              </div>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 hover:border-blue-500/30 transition-all group overflow-hidden relative shadow-lg">
            <div className={`absolute top-0 right-0 h-24 w-24 ${stat.color} opacity-[0.03] rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform duration-500`} />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{stat.label}</p>
                <p className="text-4xl font-black text-white leading-none">{stat.value}</p>
              </div>
              <div className={`${stat.color} h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SOS Banner */}
      <div className="bg-gradient-to-r from-red-600/20 to-transparent rounded-[32px] border border-red-500/20 p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 bg-red-600 rounded-[24px] flex items-center justify-center shadow-lg shadow-red-600/20">
             <AlertTriangle className="text-white animate-pulse" size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Emergency SOS Broadcast</h3>
            <p className="text-red-200/60 text-sm font-medium">Coordinate immediately with all available active patrol units.</p>
          </div>
        </div>
        
        <Link
          to="/police/sos"
          className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest px-10 py-5 rounded-2xl transition-all shadow-xl shadow-red-600/20 active:scale-95"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          Trigger Dispatch
        </Link>
      </div>

      {/* Recent Incidents */}
      <div className="bg-slate-900 border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
             <Siren className="text-blue-500" size={24} />
             Priority Response Queue
          </h3>
          <Link to="/police/reports" className="text-xs font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest">Full Case Log</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Time</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {incidents.map(inc => (
                <tr key={inc.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                     <span className="text-sm font-bold text-white group-hover:text-blue-500 transition-colors">{inc.type}</span>
                  </td>
                  <td className="px-8 py-6 text-slate-400 text-sm">{inc.location}</td>
                  <td className="px-8 py-6 text-slate-500 text-xs font-medium">{inc.time}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${inc.status === 'Active' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                      {inc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
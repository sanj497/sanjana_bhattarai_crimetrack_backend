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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-blue-900 text-white transition-all duration-300 overflow-hidden`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-8">
            <Shield size={32} />
            <h1 className="text-xl font-bold">Police HQ</h1>
          </div>
          <nav className="space-y-2 flex-1">
            {navItems.map(item => (
              <a
                key={item}
                href={item === 'Cases' ? '/complain' : '#'}
                className="block py-2 px-4 rounded hover:bg-blue-800 transition"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* SOS Nav Item */}
          <a
            href="/sos"
            className="flex items-center gap-3 py-2 px-4 rounded bg-red-600 hover:bg-red-700 transition font-semibold text-white mt-4"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            SOS
          </a>

          {/* Logout Button */}
          <button
            onClick={() => navigate('/logout')}
            className="flex items-center gap-3 py-2 px-4 rounded bg-blue-800 hover:bg-red-600 transition font-semibold text-white mt-4"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border rounded-lg w-64" />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded relative">
              <Bell size={24} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="text-white" size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SOS Banner */}
          <div className="bg-white rounded-lg shadow border border-red-200 p-5 mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={18} className="text-red-600" />
                <h3 className="text-lg font-bold text-red-600">Emergency SOS</h3>
              </div>
              <p className="text-gray-500 text-sm">Broadcast an emergency alert to all available units immediately.</p>
            </div>
            
            <a
              href="/sos"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              Trigger SOS
            </a>
          </div>

          {/* Recent Incidents */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Recent Incidents</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {incidents.map(inc => (
                    <tr key={inc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{inc.type}</td>
                      <td className="px-6 py-4">{inc.location}</td>
                      <td className="px-6 py-4">{inc.time}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-sm ${inc.status === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
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
      </div>
    </div>
  );
}
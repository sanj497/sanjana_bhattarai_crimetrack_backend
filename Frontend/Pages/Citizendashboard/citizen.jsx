import React, { useState, useEffect } from "react";
import { Shield, FileText, Bell, Activity, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CitizenDashboard() {
  const [user, setUser] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("User parsing failed");
      }
    }
  }, []);

  return (
    <div className="p-6 md:p-10 font-sans min-h-full bg-[#F7F9FC]">
      {/* Welcome Banner */}
      <div className="mb-8 p-8 md:p-12 rounded-[24px] bg-[#0B1F3B] text-white relative overflow-hidden shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-[#112445]">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#1E5EFF] via-[#0B1F3B] to-[#0B1F3B]" />
        </div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-white/10 text-[#00B8D9] font-medium text-xs mb-4 border border-white/5 backdrop-blur-sm">
              <Activity className="h-4 w-4" /> Identity Verified
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
               Welcome back, <span className="text-[#00B8D9]">{user.username || 'Citizen'}</span>
            </h1>
            <p className="text-gray-400 max-w-lg leading-relaxed">
               You are securely connected to the central intelligence hub. Manage your active alerts, review intelligence, and collaborate with your local dispatch unit.
            </p>
            <div className="mt-6">
                <Link to="/report" className="inline-flex items-center justify-center gap-2 bg-[#E63946] text-white px-6 py-3 rounded-[10px] font-bold hover:bg-red-700 transition shadow-[0_4px_14px_0_rgba(230,57,70,0.39)]">
                   File New Report <ChevronRight className="h-4 w-4" />
                </Link>
            </div>
          </div>
          <div className="hidden md:flex opacity-10">
            <Shield className="h-32 w-32 text-white" />
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-6 rounded-[16px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-start gap-4 hover:-translate-y-1 transition duration-200">
            <div className="p-4 bg-[#E63946]/10 text-[#E63946] rounded-[14px]">
               <Bell className="h-6 w-6" />
            </div>
            <div>
               <p className="text-sm text-gray-500 font-semibold mb-1 uppercase tracking-wider">Active Alerts</p>
               <h3 className="text-3xl font-bold text-[#0B1F3B]" style={{ fontFamily: "Poppins, sans-serif" }}>0</h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[16px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-start gap-4 hover:-translate-y-1 transition duration-200">
            <div className="p-4 bg-[#1E5EFF]/10 text-[#1E5EFF] rounded-[14px]">
               <FileText className="h-6 w-6" />
            </div>
            <div>
               <p className="text-sm text-gray-500 font-semibold mb-1 uppercase tracking-wider">Filed Reports</p>
               <h3 className="text-3xl font-bold text-[#0B1F3B]" style={{ fontFamily: "Poppins, sans-serif" }}>0</h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[16px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-start gap-4 hover:-translate-y-1 transition duration-200">
            <div className="p-4 bg-[#00B8D9]/10 text-[#0B1F3B] rounded-[14px]">
               <Shield className="h-6 w-6" />
            </div>
            <div>
               <p className="text-sm text-gray-500 font-semibold mb-1 uppercase tracking-wider">Network Integrity</p>
               <h3 className="text-3xl font-bold text-[#0B1F3B]" style={{ fontFamily: "Poppins, sans-serif" }}>Optimal</h3>
            </div>
         </div>
      </div>

      {/* Emergency SOS Signal Section */}
      <div className="mb-8 bg-white rounded-[32px] border border-red-100 p-8 shadow-2xl shadow-red-500/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 h-32 w-32 bg-red-500 opacity-[0.02] rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
           <div className="flex items-center gap-6">
              <div className="h-16 w-16 bg-red-600 rounded-[24px] flex items-center justify-center shadow-lg shadow-red-600/30">
                 <Activity className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div>
                 <h3 className="text-2xl font-black text-[#0B1F3B] uppercase tracking-tighter">Personal Safety Unit</h3>
                 <p className="text-gray-500 text-sm font-medium">Instantly broadcast your live location to the central police command and pre-configured guardians.</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={async () => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                      const { latitude, longitude, accuracy } = pos.coords;
                      const token = localStorage.getItem("token");
                      try {
                        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/emergency/sos`, {
                          method: "POST",
                          headers: { 
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}` 
                          },
                          body: JSON.stringify({ latitude, longitude, accuracy })
                        });
                        const data = await res.json();
                        if (data.success) alert("🚨 SOS DISPATCHED: Authorities have been notified of your location.");
                      } catch (err) {
                        alert("Failed to send SOS. Please call emergency services.");
                      }
                    });
                  } else {
                    alert("Geolocation is not supported by this browser.");
                  }
                }}
                className="bg-red-600 hover:bg-black text-white font-black uppercase text-xs tracking-widest px-10 py-5 rounded-2xl transition-all shadow-xl shadow-red-600/20 active:scale-95 flex items-center gap-3"
              >
                <div className="h-2 w-2 rounded-full bg-white animate-ping" />
                Trigger Emergency SOS
              </button>
           </div>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-12 text-center min-h-[350px] flex flex-col justify-center items-center">
        <div className="p-6 bg-[#F7F9FC] text-[#1E5EFF] rounded-full mb-6 relative">
           <div className="absolute inset-0 bg-[#1E5EFF] rounded-full opacity-10 animate-ping"></div>
           <Clock className="h-10 w-10 relative z-10" />
        </div>
        <h3 className="text-2xl font-bold text-[#0B1F3B] mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>No Recent Activity</h3>
        <p className="text-gray-500 max-w-md leading-relaxed text-lg">
          Your dashboard is clear. Use the secure sidebar to file a new report, track an ongoing request, or submit an emergency alert to dispatch units locally.
        </p>
      </div>
    </div>
  );
}
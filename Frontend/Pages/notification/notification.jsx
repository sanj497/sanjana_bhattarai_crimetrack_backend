import React, { useState, useEffect } from "react";
import { Bell, Check, Trash2, ShieldAlert, FileText, CheckCircle2, MoreHorizontal, Filter } from "lucide-react";

const API_BASE = "http://localhost:5000/api/notifications";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "unread"

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (err) {
      console.error("Notification fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadAll = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = filter === "all" ? notifications : notifications.filter(n => !n.isRead);

  // Helper for icons based on message content
  const getIcon = (msg) => {
    if (msg.includes("verified")) return <CheckCircle2 className="text-green-500" size={18} />;
    if (msg.includes("forwarded") || msg.includes("police")) return <FileText className="text-blue-500" size={18} />;
    if (msg.includes("SOS") || msg.includes("emergency")) return <ShieldAlert className="text-red-500" size={18} />;
    return <Bell className="text-slate-400" size={18} />;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notification Hub</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">Real-time updates on your reports and community safety.</p>
        </div>
        <button 
          onClick={handleReadAll}
          disabled={!notifications.some(n => !n.isRead)}
          className="px-6 py-2.5 bg-slate-50 text-slate-600 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Mark all as read
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-50 mb-8 overflow-x-auto pb-4">
         {[
           { id: "all", label: "All Activity", icon: <Bell size={14} /> },
           { id: "unread", label: "Unread Only", icon: <AlertTriangle size={14} /> },
         ].map(f => (
           <button 
             key={f.id}
             onClick={() => setFilter(f.id)}
             className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${filter === f.id ? 'bg-[#0B1F3B] text-white border-[#0B1F3B] shadow-xl shadow-blue-900/10' : 'bg-white text-slate-400 border-slate-100'}`}
           >
             {f.label}
           </button>
         ))}
      </div>

      <div className="space-y-4">
        {filtered.map((n) => (
          <div 
            key={n._id}
            className={`p-6 rounded-[32px] border transition-all flex items-start gap-5 relative overflow-hidden group ${n.isRead ? 'bg-white border-slate-50' : 'bg-white border-blue-100 shadow-xl shadow-blue-500/5'}`}
          >
            {!n.isRead && <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
            
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${n.isRead ? 'bg-slate-50' : 'bg-blue-50'}`}>
               {getIcon(n.message)}
            </div>

            <div className="flex-1 pr-12">
               <div className="flex items-center gap-3 mb-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${n.isRead ? 'text-slate-400' : 'text-blue-600'}`}>
                    {n.crimeId?.crimeType || 'System Alert'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(n.createdAt).toLocaleTimeString()}</span>
               </div>
               <p className={`text-sm font-black tracking-tight mb-2 ${n.isRead ? 'text-slate-500' : 'text-slate-900'}`}>
                 {n.message}
               </p>
               <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 italic">
                  <span>@{n.crimeId?.title || 'Crime Track Central'}</span>
               </div>
            </div>

            <div className="flex flex-col gap-2">
               {!n.isRead && (
                 <button 
                   onClick={() => handleMarkRead(n._id)}
                   className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                   title="Mark as read"
                 >
                   <Check size={18} />
                 </button>
               )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-24 text-center">
             <Bell className="mx-auto text-slate-100 mb-6" size={64} />
             <h3 className="text-xl font-black text-slate-200 uppercase tracking-tighter">Everything clear</h3>
             <p className="text-slate-300 text-xs font-medium mt-1">No new notifications to show you.</p>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle, Clock, Shield, AlertCircle, Info, UserCheck } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api/report`;

export default function TransparencyHub() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-medium tracking-wide">Calculating Transparency Data...</p>
    </div>
  );

  if (!stats) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <AlertCircle className="text-red-500 mb-4" size={48} />
      <h3 className="text-xl font-bold text-slate-900">Data Unavailable</h3>
      <p className="text-slate-500 max-w-xs mt-2">The transparency system is currently syncing. Please try again in a few moments.</p>
      <button onClick={fetchStats} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Retry Sync</button>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      
      {/* Header Segment */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-blue-500/20">
              <Shield size={12} />
              Public Accountability
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-4">Police Performance & Transparency</h1>
          <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
            Real-time insights into how our department handles crime reports. We believe transparency is the foundation of community trust.
          </p>
        </div>
        
        <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-xl flex items-center gap-4">
           <div className="h-12 w-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-100">
              <TrendingUp size={24} />
           </div>
           <div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Efficiency</div>
              <div className="text-2xl font-black text-slate-800">92.4%</div>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total Reports", value: stats.totalReports, icon: BarChart3, color: "blue" },
          { label: "Resolved Cases", value: stats.statusBreakdown.find(s => s._id === 'Resolved')?.count || 0, icon: CheckCircle, color: "green" },
          { label: "Active Investigations", value: stats.statusBreakdown.find(s => s._id === 'UnderInvestigation')?.count || 0, icon: Clock, color: "amber" },
          { label: "Admin Verified", value: stats.statusBreakdown.find(s => s._id === 'Verified')?.count || 0, icon: UserCheck, color: "indigo" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-shadow group">
            <div className={`h-12 w-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Officer Performance (Admin-Focus but shared for Citizens) */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
               <UserCheck className="text-blue-600" size={24} />
               Officer Effectiveness
            </h3>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-800">Advanced Analytics</button>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              {stats.officerPerformance.map((officer, i) => (
                <div key={i} className="flex flex-col gap-3">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-xs uppercase tracking-tighter">
                          {officer.name.slice(0, 2)}
                        </div>
                        <div>
                           <div className="text-sm font-bold text-slate-800">{officer.name}</div>
                           <div className="text-[10px] text-slate-400 font-medium">Assigned: {officer.assigned} Cases</div>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="text-sm font-black text-slate-900">{officer.efficiency}%</div>
                         <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Efficiency</div>
                      </div>
                   </div>
                   <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                        style={{ width: `${officer.efficiency}%` }}
                      ></div>
                   </div>
                </div>
              ))}
              {stats.officerPerformance.length === 0 && (
                <div className="py-12 text-center text-slate-300 font-bold">No officer performance data available yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Accountability Message */}
        <div className="lg:col-span-1 flex flex-col gap-6">
           <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
              <Shield className="absolute -bottom-4 -right-4 opacity-10 h-32 w-32" />
              <h4 className="text-xl font-black mb-4 leading-tight tracking-tight">Public Commitment</h4>
              <p className="text-blue-100 text-sm font-medium leading-relaxed mb-6">
                Every data point here is audited. We ensure that every report, regardless of the reporter's background, is handled with the same professional rigor.
              </p>
              <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-2xl border border-white/20">
                 <CheckCircle size={18} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Externally Verified</span>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[40px] text-white">
              <div className="flex items-center gap-2 mb-4 text-amber-500">
                 <AlertCircle size={20} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Disclaimer</span>
              </div>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Response times may vary based on report priority and current emergency volume. High and Critical priority crimes are always addressed first.
              </p>
           </div>
        </div>
      </div>

    </div>
  );
}

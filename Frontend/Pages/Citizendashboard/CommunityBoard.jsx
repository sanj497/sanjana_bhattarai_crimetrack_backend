import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Shield, MapPin, Clock, Search, Send, UserCircle2, AlertCircle, Share2, Info } from 'lucide-react';

const API_BASE = "http://localhost:5000/api/report";

export default function CommunityBoard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [responses, setResponses] = useState([]);
  const [newResponse, setNewResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPublicReports();
  }, []);

  const fetchPublicReports = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/community`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setReports(data.reports);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async (reportId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/${reportId}/responses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setResponses(data.interactions);
    } catch (err) {
      console.error("Fetch responses error:", err);
    }
  };

  const handlePostResponse = async (e) => {
    e.preventDefault();
    if (!newResponse.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/${selectedReport._id}/responses`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ content: newResponse, type: "observation" })
      });
      if (res.ok) {
        setNewResponse("");
        fetchResponses(selectedReport._id);
      }
    } catch (err) {
      console.error("Post error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const openReport = (report) => {
    setSelectedReport(report);
    fetchResponses(report._id);
  };

  const filtered = reports.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.crimeType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityStyles = (sev) => {
    switch(sev) {
      case 'Critical': return 'bg-red-50 text-red-700 border-red-100';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Synchronizing Community Feed...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-blue-500/20">
              <Users size={12} />
              Public Awareness
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3">Community Watch Board</h1>
          <p className="text-slate-500 font-medium max-w-2xl text-sm italic">
            "Transparency fosters accountability." Explore verified incident reports and collaborate with your neighborhood.
          </p>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by area or type..." 
            className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-3xl w-full lg:w-96 shadow-xl shadow-slate-200/40 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Main Feed */}
        <div className="lg:col-span-7 space-y-6">
          {filtered.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
               <Shield className="mx-auto text-slate-100 mb-6" size={80} />
               <p className="text-slate-400 font-black uppercase tracking-widest text-sm underline decoration-slate-100">No Incidents Reported</p>
               <p className="text-slate-300 text-xs mt-2">Your community dashboard is currently clear.</p>
            </div>
          ) : (
            filtered.map((r) => (
              <div 
                key={r._id} 
                className={`p-8 bg-white rounded-[40px] border transition-all cursor-pointer group relative overflow-hidden ${selectedReport?._id === r._id ? 'border-blue-500 ring-8 ring-blue-500/5 shadow-2xl' : 'border-slate-50 hover:border-blue-200 shadow-sm'}`}
                onClick={() => openReport(r)}
              >
                {selectedReport?._id === r._id && <div className="absolute top-0 right-0 p-4"><Info size={20} className="text-blue-500" /></div>}
                
                <div className="flex items-center gap-2 mb-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getSeverityStyles(r.severity)}`}>
                    {r.severity} Priority
                  </span>
                  <span className="text-slate-200 text-xs">•</span>
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{r.crimeType}</span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight tracking-tight uppercase">
                  {r.title}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-8 font-medium leading-relaxed italic border-l-2 border-slate-100 pl-4">
                  {r.description}
                </p>

                <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-white font-bold">
                       {r.userId?.username?.charAt(0) || "A"}
                    </div>
                    <span className="text-[11px] font-black text-slate-800 tracking-tight">{r.userId?.username || "Citizen Representative"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold">
                    <MapPin size={14} className="text-blue-500" /> {r.location.address}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold">
                    <Clock size={14} /> {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Intelligence / Context Panel */}
        <div className="lg:col-span-5 relative">
          {selectedReport ? (
            <div className="sticky top-10 bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
              <div className="p-10 bg-[#0B1F3B] text-white relative">
                 <div className="flex justify-between items-start mb-6">
                    <div className="bg-blue-500 text-white h-12 w-12 rounded-2xl flex items-center justify-center font-black">
                       CT
                    </div>
                    <button className="text-white/40 hover:text-white transition-colors">
                       <Share2 size={20} />
                    </button>
                 </div>
                 <h2 className="text-2xl font-black mb-2 leading-none uppercase tracking-tighter">{selectedReport.title}</h2>
                 <p className="text-blue-400 text-[10px] font-black uppercase tracking-[4px]">Verification ID: {selectedReport._id.slice(-8).toUpperCase()}</p>
              </div>
              
              <div className="p-10 overflow-y-auto flex-1 bg-gradient-to-b from-slate-50/50 to-white">
                 {/* Narrative Block */}
                 <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                       <Info size={14} /> Official Summary
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative italic group font-medium text-slate-700 leading-relaxed text-sm">
                       <div className="absolute top-4 left-4 text-blue-100">
                          <AlertCircle size={40} />
                       </div>
                       <p className="relative z-10">"{selectedReport.description}"</p>
                    </div>
                 </div>

                 {/* Responses Feed */}
                 <div>
                    <div className="flex items-center justify-between mb-6">
                       <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 italic underline decoration-blue-500">
                         Collaboration Hub
                       </h4>
                       <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full">{responses.length} Active responses</span>
                    </div>

                    <div className="space-y-4 mb-8">
                      {responses.map((resp, i) => (
                        <div key={i} className="flex gap-4 group">
                          <div className="shrink-0 h-10 w-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                             <UserCircle2 size={20} />
                          </div>
                          <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex-1">
                             <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-black text-slate-800">{resp.userId?.username || "Neighbor"}</span>
                                <span className="text-[9px] text-slate-300 font-bold uppercase">{new Date(resp.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                             <p className="text-xs text-slate-500 font-medium leading-relaxed italic">"{resp.content}"</p>
                          </div>
                        </div>
                      ))}
                      {responses.length === 0 && (
                        <div className="p-10 text-center border-2 border-dashed border-slate-50 rounded-[40px]">
                           <MessageSquare className="mx-auto text-slate-100 mb-4" size={32} />
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Awaiting Neighborhood Input</p>
                        </div>
                      )}
                    </div>

                    {/* Post Interface */}
                    <form onSubmit={handlePostResponse} className="relative sticky bottom-0 mt-10">
                      <div className="bg-white rounded-[32px] border-2 border-slate-100 shadow-2xl p-2 flex items-center gap-2 focus-within:border-blue-500 transition-all">
                        <input 
                          type="text" 
                          className="flex-1 px-4 py-3 bg-transparent text-sm font-semibold outline-none text-slate-700"
                          placeholder="Add perspective or update..."
                          value={newResponse}
                          onChange={(e) => setNewResponse(e.target.value)}
                        />
                        <button 
                          disabled={submitting}
                          className="h-10 w-10 bg-[#0B1F3B] text-white flex items-center justify-center rounded-2xl hover:bg-blue-600 transition-all disabled:opacity-30 shadow-xl active:scale-95"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-300 font-bold text-center mt-3 uppercase tracking-widest">Public Contribution Policy Active</p>
                    </form>
                 </div>
              </div>
            </div>
          ) : (
            <div className="sticky top-10 h-[500px] flex flex-col items-center justify-center bg-white rounded-[48px] border border-slate-100 shadow-inner px-12 text-center">
               <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                  <MessageSquare className="text-slate-200" size={32} />
               </div>
               <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight mb-2 uppercase">Deep Intelligence Panel</h3>
               <p className="text-slate-400 text-xs font-medium leading-relaxed">
                 Select an incident report from the verified community feed to analyze the deep intelligence, view neighborhood perspectives, and contribute your observations.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

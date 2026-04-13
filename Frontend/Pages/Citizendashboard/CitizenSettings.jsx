import React, { useState, useEffect } from "react";
import { User, Mail, Shield, Plus, Trash2, Save, CheckCircle, AlertCircle } from "lucide-react";

const API_BASE = "http://localhost:5000/api/auth";

export default function CitizenSettings() {
  const [profile, setProfile] = useState({ username: "", email: "", guardians: [] });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // New Guardian Form State
  const [newGuardian, setNewGuardian] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username: profile.username, email: profile.email })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Profile updated successfully!", type: "success" });
        setProfile(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        setMessage({ text: data.msg || "Update failed", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Server error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuardian = async (e) => {
    e.preventDefault();
    if (!newGuardian.name || !newGuardian.email) return;
    
    const updatedGuardians = [...profile.guardians, newGuardian];
    await updateGuardians(updatedGuardians);
    setNewGuardian({ name: "", email: "", phone: "" });
  };

  const handleRemoveGuardian = async (index) => {
    const updatedGuardians = profile.guardians.filter((_, i) => i !== index);
    await updateGuardians(updatedGuardians);
  };

  const updateGuardians = async (guardiansList) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...profile, guardians: guardiansList })
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage({ text: "Guardians updated!", type: "success" });
      }
    } catch (err) {
      setMessage({ text: "Failed to update guardians", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account & Security</h1>
        <p className="text-slate-500 mt-2 font-medium underline decoration-blue-500/30">Manage your profile and emergency guardian network.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* PROFILE SECTION */}
        <section>
          <div className="flex items-center gap-2 mb-6 text-slate-400 font-black uppercase tracking-widest text-[10px]">
            <User size={14} />
            Personal Identification
          </div>
          <form onSubmit={handleUpdateProfile} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20">
            <div className="space-y-6">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 mb-2 block ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-semibold"
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 mb-2 block ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="email" 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-semibold"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#0B1F3B] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </form>
        </section>

        {/* GUARDIANS SECTION */}
        <section>
          <div className="flex items-center gap-2 mb-6 text-slate-400 font-black uppercase tracking-widest text-[10px]">
            <Shield size={14} />
            Emergency Guardians
          </div>
          <div className="space-y-4">
            {/* Guardian List */}
            {profile.guardians?.map((g, i) => (
              <div key={i} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-red-100 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                       {g.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{g.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{g.email}</div>
                    </div>
                 </div>
                 <button 
                   onClick={() => handleRemoveGuardian(i)}
                   className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                 >
                   <Trash2 size={18} />
                 </button>
              </div>
            ))}

            {/* Empty State */}
            {(!profile.guardians || profile.guardians.length === 0) && (
              <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-[32px]">
                 <p className="text-slate-400 text-xs font-bold">No guardians added yet.</p>
                 <p className="text-[10px] text-slate-300 mt-1">Add trusted contacts to be notified during SOS alerts.</p>
              </div>
            )}

            {/* Add Guardian Form */}
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 mt-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Add New Guardian</h4>
              <div className="space-y-3">
                <input 
                  type="text" placeholder="Full Name" 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={newGuardian.name}
                  onChange={e => setNewGuardian({...newGuardian, name: e.target.value})}
                />
                <input 
                  type="email" placeholder="Email Address" 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  value={newGuardian.email}
                  onChange={e => setNewGuardian({...newGuardian, email: e.target.value})}
                />
                <button 
                  onClick={handleAddGuardian}
                  className="w-full bg-blue-50 text-blue-600 border border-blue-100 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                  <Plus size={16} />
                  Add Guardian
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Global Status Message */}
      {message.text && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm animate-bounce z-50 ${message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
           {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
           {message.text}
        </div>
      )}
    </div>
  );
}

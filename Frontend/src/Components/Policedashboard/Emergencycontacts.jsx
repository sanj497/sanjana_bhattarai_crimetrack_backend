import { useState, useEffect } from "react";
import React from "react";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api/emergency`;

const categoryConfig = {
  police: { icon: "🚔", color: "bg-blue-600", light: "bg-blue-50 border-blue-200 text-blue-700" },
  fire: { icon: "🔥", color: "bg-red-600", light: "bg-red-50 border-red-200 text-red-700" },
  medical: { icon: "🏥", color: "bg-green-600", light: "bg-green-50 border-green-200 text-green-700" },
  disaster: { icon: "⚠️", color: "bg-yellow-600", light: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  women: { icon: "👩", color: "bg-pink-600", light: "bg-pink-50 border-pink-200 text-pink-700" },
  child: { icon: "🧒", color: "bg-purple-600", light: "bg-purple-50 border-purple-200 text-purple-700" },
  other: { icon: "📞", color: "bg-gray-600", light: "bg-gray-50 border-gray-200 text-gray-700" },
};

// ─── Quick Call Buttons (Police / Ambulance / Fire) ───────────────────────────
function QuickCallButtons() {
  const quickContacts = [
    { label: "Police",    number: "100", emoji: "🚔", bg: "bg-blue-600",  ring: "ring-blue-300" },
    { label: "Ambulance", number: "102", emoji: "🚑", bg: "bg-green-600", ring: "ring-green-300" },
    { label: "Fire",      number: "101", emoji: "🚒", bg: "bg-orange-500",ring: "ring-orange-300" },
  ];

  const handleCall = (contact) => {
    if (window.confirm(`📞 Call ${contact.label} at ${contact.number}?`)) {
      window.location.href = `tel:${contact.number}`;
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {quickContacts.map((c) => (
        <button
          key={c.number}
          onClick={() => handleCall(c)}
          className={`${c.bg} ${c.ring} text-white flex flex-col items-center justify-center gap-2 py-5 rounded-2xl shadow-lg ring-4 ring-opacity-30 active:scale-95 hover:brightness-110 transition-all`}
        >
          <span className="text-3xl">{c.emoji}</span>
          <span className="font-bold text-base tracking-wide">{c.label}</span>
          <span className="text-xl font-extrabold">{c.number}</span>
        </button>
      ))}
    </div>
  );
}

// ─── SOS Button ───────────────────────────────────────────────────────────────
function SOSButton() {
  const [status, setStatus] = useState("idle"); // idle | locating | sending | active | sent | error
  const [message, setMessage] = useState("");
  const [alertId, setAlertId] = useState(null);

  useEffect(() => {
    let interval;
    if (status === "active" && alertId) {
      interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => updateTracking(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
          (err) => console.error("Tracking error:", err)
        );
      }, 10000); // Update every 10 seconds
    }
    return () => clearInterval(interval);
  }, [status, alertId]);

  const updateTracking = async (lat, lng, accuracy) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/sos/${alertId}/track`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ latitude: lat, longitude: lng, accuracy }),
      });
    } catch (err) {
      console.error("Failed to update SOS location:", err);
    }
  };

  const handleSOS = async () => {
    if (!window.confirm("🆘 Send SOS alert with your location? This will notify authorities and your guardians.")) return;
    setStatus("locating");
    setMessage("Getting your precise location...");

    const sendAlert = async (lat, lng, accuracy) => {
      setStatus("sending");
      setMessage("Alerting emergency responders and guardians...");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/sos`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ latitude: lat, longitude: lng, accuracy, timestamp: new Date().toISOString() }),
        });
        const data = await res.json();
        if (data.success) {
          setAlertId(data.alertId);
          setStatus("active");
          setMessage("🆘 ALERT ACTIVE: Help is on the way. Your live location is being shared.");
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        setStatus("error");
        setMessage(`❌ Failed: ${err.message || "Network Error"}`);
        setTimeout(() => setStatus("idle"), 5000);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendAlert(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
        (err) => {
           console.warn("Geolocation denied, sending anonymous SOS");
           sendAlert(null, null, null);
        },
        { enableHighAccuracy: true }
      );
    } else {
      sendAlert(null, null, null);
    }
  };

  const buttonLabel = {
    idle:     { text: "SOS",                sub: "Tap for emergency help",  pulse: true  },
    locating: { text: "Locating...",         sub: "Getting your location",   pulse: false },
    sending:  { text: "Sending...",          sub: "Alerting responders",     pulse: false },
    active:   { text: "ACTIVE",              sub: "Live tracking on",        pulse: true  },
    sent:     { text: "✅ Sent!",            sub: "Help is on the way",      pulse: false },
    error:    { text: "Retry",              sub: "Alert failed",            pulse: true  },
  }[status];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        {buttonLabel.pulse && (
          <>
            <span className={`absolute w-44 h-44 rounded-full opacity-20 animate-ping ${status === 'active' ? 'bg-orange-500' : 'bg-red-500'}`} />
            <span className={`absolute w-36 h-36 rounded-full opacity-30 animate-ping ${status === 'active' ? 'bg-orange-500' : 'bg-red-500'}`} style={{ animationDelay: "0.3s" }} />
          </>
        )}
        <button
          onClick={handleSOS}
          disabled={status === "locating" || status === "sending" || status === "active"}
          className={`w-32 h-32 rounded-full text-white font-black text-3xl shadow-2xl z-10 border-4 border-white active:scale-95 transition-all disabled:opacity-80
            ${status === "active" ? "bg-orange-600 border-orange-200" : (status === "error" ? "bg-gray-600" : "bg-red-600 hover:bg-red-700")}`}
        >
          {status === "locating" || status === "sending"
            ? <span className="text-2xl animate-spin inline-block">⏳</span>
            : buttonLabel.text}
        </button>
      </div>

      <p className="text-sm text-gray-500 font-medium">{buttonLabel.sub}</p>

      {message && (
        <div className={`w-full max-w-sm text-center text-xs font-bold py-3 px-4 rounded-xl border ${
          status === "active" ? "bg-orange-50 text-orange-700 border-orange-200"
          : (status === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200")
        }`}>
          {message}
          {status === "active" && (
             <button 
               onClick={() => { setStatus("idle"); setAlertId(null); }}
               className="block mt-2 mx-auto text-[10px] underline text-orange-800"
             >
               Stop Emergency Tracking
             </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Contact Card ─────────────────────────────────────────────────────────────
function ContactCard({ contact, onDelete }) {
  const cfg = categoryConfig[contact.category] || categoryConfig.other;
  const handleCall = () => {
    if (confirm(`Call ${contact.name} at ${contact.number}?`)) {
      window.location.href = `tel:${contact.number}`;
    }
  };
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-2xl w-12 h-12 flex items-center justify-center rounded-xl ${cfg.color} text-white`}>
            {cfg.icon}
          </span>
          <div>
            <h3 className="font-bold text-gray-800 text-base leading-tight">{contact.name}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.light} capitalize`}>
              {contact.category}
            </span>
          </div>
        </div>
        <button onClick={() => onDelete(contact._id)} className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none" title="Delete">×</button>
      </div>
      {contact.description && <p className="text-sm text-gray-500">{contact.description}</p>}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-400">📍 {contact.region}</span>
        <button onClick={handleCall} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm ${cfg.color} hover:opacity-90 active:scale-95 transition-all shadow`}>
          📞 {contact.number}
        </button>
      </div>
    </div>
  );
}

// ─── Add Contact Modal ────────────────────────────────────────────────────────
function AddContactModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", number: "", category: "other", description: "", region: "National" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name || !form.number) { setError("Name and number are required."); return; }
    setLoading(true);
    try {
      const res = await fetch(API_BASE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onSaved(data.data);
      onClose();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">Add Emergency Contact</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>
        {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded-lg">{error}</p>}
        <div className="space-y-3">
          {[["name","Contact Name","text"],["number","Phone Number","tel"],["region","Region","text"]].map(([key,label,type]) => (
            <div key={key}>
              <label className="text-sm font-medium text-gray-600 block mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" placeholder={label} />
            </div>
          ))}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Category</label>
            <select value={form.category} onChange={e => setForm({...form,category:e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
              {Object.keys(categoryConfig).map(c => <option key={c} value={c}>{categoryConfig[c].icon} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" rows={2} placeholder="Brief description (optional)" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition">
            {loading ? "Saving..." : "Save Contact"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function EmergencyContactsApp() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("sos"); // "sos" | "contacts"

  const fetchContacts = async (category) => {
    setLoading(true);
    try {
      const url = category && category !== "all" ? `${API_BASE}?category=${category}` : API_BASE;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setContacts(data.data);
    } catch { setError("Failed to load contacts. Is the server running?"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContacts(filterCategory); }, [filterCategory]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${API_BASE}/seed`, { method: "POST" });
      const data = await res.json();
      if (data.success) fetchContacts(filterCategory);
    } catch { setError("Seed failed."); }
    finally { setSeeding(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this contact?")) return;
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      setContacts(prev => prev.filter(c => c._id !== id));
    } catch { setError("Delete failed."); }
  };

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.number.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 pt-10 pb-6 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🚨</span>
            <h1 className="text-2xl font-extrabold tracking-tight">Emergency Helpline</h1>
          </div>
          <p className="text-red-100 text-sm ml-12">Call directly in one tap · Immediate help</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto flex">
          {[["sos", "🆘 SOS"], ["contacts", "📋 All Contacts"]].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-sm font-bold transition-all border-b-2 ${
                activeTab === tab ? "border-red-600 text-red-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── SOS TAB ── */}
        {activeTab === "sos" && (
          <>
            {/* SOS Button */}
            <div className="bg-white rounded-3xl shadow-lg border border-red-100 p-8 flex flex-col items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Most Important</p>
              <SOSButton />
            </div>

            {/* Quick Call Buttons */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">Quick Call</p>
              <QuickCallButtons />
            </div>

            {/* Tip */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">💡 How it works</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                <li>Tap <strong>SOS</strong> to send your GPS location to responders</li>
                <li>Tap any quick button to <strong>call directly</strong></li>
                <li>No internet needed for calls — SIM only</li>
              </ul>
            </div>
          </>
        )}

        {/* ── CONTACTS TAB ── */}
        {activeTab === "contacts" && (
          <>
            {/* Search */}
            <div className="bg-white border border-gray-200 rounded-2xl flex items-center px-4 py-2.5 gap-2 shadow-sm">
              <span className="text-gray-400">🔍</span>
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search contacts or numbers..."
                className="bg-transparent text-gray-700 text-sm flex-1 outline-none" />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["all", ...Object.keys(categoryConfig)].map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filterCategory === cat ? "bg-red-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:border-red-300"
                  }`}>
                  {cat === "all" ? "🔴 All" : `${categoryConfig[cat].icon} ${cat.charAt(0).toUpperCase()+cat.slice(1)}`}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => setShowModal(true)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-700 active:scale-95 transition-all shadow">
                + Add Contact
              </button>
              <button onClick={handleSeed} disabled={seeding} className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50">
                {seeding ? "Seeding..." : "🌱 Load Defaults"}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl flex justify-between">
                {error}<button onClick={() => setError("")} className="font-bold">×</button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3 animate-pulse">📡</div>
                <p>Loading contacts...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">📭</div>
                <p className="font-medium">No contacts found</p>
                <p className="text-sm mt-1">Click "Load Defaults" to seed Nepal emergency numbers</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filtered.map(contact => <ContactCard key={contact._id} contact={contact} onDelete={handleDelete} />)}
              </div>
            )}

            <p className="text-center text-xs text-gray-400 pb-4">{filtered.length} contact{filtered.length !== 1 ? "s" : ""} available</p>
          </>
        )}
      </div>

      {showModal && <AddContactModal onClose={() => setShowModal(false)} onSaved={c => setContacts(prev => [c, ...prev])} />}
    </div>
  );
}
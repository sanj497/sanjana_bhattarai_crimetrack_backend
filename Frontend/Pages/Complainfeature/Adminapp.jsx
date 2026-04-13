import { useState, useEffect } from "react";
import React from "react";

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;
const CATEGORIES = ["Theft", "Assault", "Vandalism", "Fraud", "Other"];
const STATUSES   = ["Pending", "Verified", "In Progress", "Solved"];

const STATUS_COLORS = {
  Pending:       { bg: "#FFF3CD", text: "#856404", dot: "#FFC107" },
  Verified:      { bg: "#CCE5FF", text: "#004085", dot: "#0D6EFD" },
  "In Progress": { bg: "#D4EDDA", text: "#155724", dot: "#28A745" },
  Solved:        { bg: "#D1ECF1", text: "#0C5460", dot: "#17A2B8" },
};

const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || "Request failed");
  return data;
};

// ─── Components ───────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || { bg: "#eee", text: "#333", dot: "#999" };
  return (
    <span style={{ background: c.bg, color: c.text, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {status}
    </span>
  );
};

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#374151" }}>{label}</label>}
    <input style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} {...props} />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#374151" }}>{label}</label>}
    <textarea rows={3} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical" }} {...props} />
  </div>
);

const Btn = ({ children, color = "#1d4ed8", textColor = "#fff", ...props }) => (
  <button style={{ padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: color, color: textColor }} {...props}>{children}</button>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={onClose}>
    <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
        <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const StatCard = ({ label, value, color = "#1e293b" }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", flex: 1, minWidth: 100 }}>
    <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{label}</div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN APP — no login, reads token from localStorage
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminApp() {
  const [complaints, setComplaints]         = useState([]);
  const [selected, setSelected]             = useState(null);
  const [showUpdate, setShowUpdate]         = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState("");
  const [filterStatus, setFilterStatus]     = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [updateForm, setUpdateForm]         = useState({ status: "Verified", note: "", assignedOfficer: "" });

  const card = { background: "#fff", borderRadius: 12, padding: 18, border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 12 };

  const fetchAll = async () => {
    setLoading(true);
    try {
      let url = "/complaints?";
      if (filterStatus)   url += `status=${encodeURIComponent(filterStatus)}&`;
      if (filterCategory) url += `category=${filterCategory}`;
      const data = await authFetch(url);
      setComplaints(data.complaints);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const updateStatus = async () => {
    setLoading(true);
    try {
      await authFetch(`/complaints/${selected._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: updateForm.status,
          note: updateForm.note,
          ...(updateForm.assignedOfficer ? { assignedOfficer: updateForm.assignedOfficer } : {}),
        }),
      });
      setShowUpdate(false);
      setSelected(null);
      fetchAll();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const deleteComplaint = async (id) => {
    if (!confirm("Delete this complaint permanently?")) return;
    try {
      await authFetch(`/complaints/${id}`, { method: "DELETE" });
      fetchAll();
    } catch (e) { setError(e.message); }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { fetchAll(); }, [filterStatus, filterCategory]);

  const stats = {
    total:      complaints.length,
    pending:    complaints.filter(c => c.status === "Pending").length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    solved:     complaints.filter(c => c.status === "Solved").length,
  };

  return (
    <div style={{ minHeight: "calc(100vh - 80px)", background: "#0b0f1a", fontFamily: "Inter, system-ui, sans-serif", padding: 40 }}>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#f87171", padding: "16px", borderRadius: 12, marginBottom: 24, fontSize: 14, border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            {error}
            <button onClick={() => setError("")} style={{ float: "right", border: "none", background: "none", cursor: "pointer", color: "#f87171" }}>×</button>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: 20, marginBottom: 32, flexWrap: "wrap" }}>
          <StatCard label="Total Complaints" value={stats.total}      color="#fff" />
          <StatCard label="Pending"          value={stats.pending}    color="#fbbf24" />
          <StatCard label="In Progress"      value={stats.inProgress} color="#34d399" />
          <StatCard label="Solved"           value={stats.solved}     color="#3b82f6" />
        </div>

        {/* Header + Filters */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>Case Management</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid #1f2937", fontSize: 13, background: "#111827", color: "#fff", outline: "none" }}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid #1f2937", fontSize: 13, background: "#111827", color: "#fff", outline: "none" }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <Btn color="rgba(255,255,255,0.05)" textColor="#94a3b8" onClick={() => { setFilterStatus(""); setFilterCategory(""); }}>Clear Filters</Btn>
          </div>
        </div>

        {loading && <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Loading cases...</div>}

        {!loading && complaints.length === 0 && (
          <div style={{ ...card, textAlign: "center", padding: 60, color: "#4b5563", background: "#111827", border: "1px solid #1f2937" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>No complaints found matching your filters.</div>
          </div>
        )}

        {complaints.map(c => (
          <div key={c._id} style={{ ...card, background: "#111827", border: "1px solid #1f2937", padding: 24, borderRadius: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>{c.title}</div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6, display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <span>🏷️ {c.category}</span>
                  <span>👤 {c.userId?.name || "Anonymous"}</span>
                  <span>📅 {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                {c.location?.address && (
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>📍</span> {c.location.address}
                  </div>
                )}
                {c.assignedOfficer && (
                  <div style={{ fontSize: 13, color: "#3b82f6", marginTop: 8, fontWeight: 600 }}>
                    👮 Assigned: {c.assignedOfficer.name}
                  </div>
                )}
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
              <Btn color="#3b82f6" onClick={() => { setSelected(c); setUpdateForm({ status: c.status, note: "", assignedOfficer: "" }); setShowUpdate(true); }}>
                ✏️ Update Case
              </Btn>
              <Btn color="rgba(239, 68, 68, 0.1)" textColor="#ef4444" onClick={() => deleteComplaint(c._id)}>🗑 Delete</Btn>
            </div>
          </div>
        ))}
      </div>

      {/* Update Status Modal */}
      {showUpdate && selected && (
        <Modal title={`Update: ${selected.title}`} onClose={() => { setShowUpdate(false); setSelected(null); }}>
          <div style={{ marginBottom: 14, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, fontSize: 13 }}>
            <div style={{ fontWeight: 600 }}>{selected.title}</div>
            <div style={{ color: "#6b7280", marginTop: 2 }}>
              {selected.category} · Current: <strong>{selected.status}</strong>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#374151" }}>New Status</label>
            <select value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, background: "#fff" }}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Input label="Assigned Officer ID (optional)" placeholder="MongoDB ObjectId of officer"
            value={updateForm.assignedOfficer} onChange={e => setUpdateForm({ ...updateForm, assignedOfficer: e.target.value })} />
          <Textarea label="Note" placeholder="Add a note about this update..."
            value={updateForm.note} onChange={e => setUpdateForm({ ...updateForm, note: e.target.value })} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn color="#f3f4f6" textColor="#374151" onClick={() => { setShowUpdate(false); setSelected(null); }}>Cancel</Btn>
            <Btn color="#16a34a" onClick={updateStatus} disabled={loading}>{loading ? "Saving…" : "Update Status"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
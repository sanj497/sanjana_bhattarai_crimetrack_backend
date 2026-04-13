import { useState, useEffect } from "react";
import React from "react";

const API = "https://sanjana-bhattarai-crimetrack-backend.onrender.com/api";
const CATEGORIES = ["Theft", "Assault", "Vandalism", "Fraud", "Other"];

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

const Timeline = ({ history }) => (
  <div style={{ marginTop: 10 }}>
    {history.map((h, i) => (
      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", marginTop: 4, flexShrink: 0, background: STATUS_COLORS[h.status]?.dot || "#ccc" }} />
          {i < history.length - 1 && <div style={{ width: 2, flex: 1, background: "#e5e7eb", marginTop: 3 }} />}
        </div>
        <div style={{ paddingBottom: 4 }}>
          <StatusBadge status={h.status} />
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>{h.note}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(h.changedAt).toLocaleString()}</div>
        </div>
      </div>
    ))}
  </div>
);

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#374151" }}>{label}</label>}
    <input style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} {...props} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5, color: "#374151" }}>{label}</label>}
    <select style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }} {...props}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
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

// ═══════════════════════════════════════════════════════════════════════════════
// USER APP — no login, reads token from localStorage
// ═══════════════════════════════════════════════════════════════════════════════
export default function UserApp() {
  const [complaints, setComplaints] = useState([]);
  const [trackData, setTrackData]   = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [submitForm, setSubmitForm] = useState({ title: "", description: "", category: "Theft", address: "" });

  const card = { background: "#fff", borderRadius: 12, padding: 18, border: "1px solid #f0f0f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 12 };

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const data = await authFetch("/complaints/my");
      setComplaints(data.complaints);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const trackStatus = async (id) => {
    try {
      const data = await authFetch(`/complaints/${id}/track`);
      setTrackData(data.complaint);
    } catch (e) { setError(e.message); }
  };

  const submitComplaint = async () => {
    if (!submitForm.title || !submitForm.description) { setError("Title and description are required."); return; }
    setLoading(true);
    try {
      await authFetch("/complaints", {
        method: "POST",
        body: JSON.stringify({
          title: submitForm.title,
          description: submitForm.description,
          category: submitForm.category,
          location: { address: submitForm.address },
        }),
      });
      setShowSubmit(false);
      setSubmitForm({ title: "", description: "", category: "Theft", address: "" });
      fetchMyComplaints();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { fetchMyComplaints(); }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui,sans-serif" }}>

      {/* Navbar */}
      <div style={{ background: "#1e3a8a", color: "#fff", padding: "0 24px", display: "flex", alignItems: "center", height: 56, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
        <span style={{ fontSize: 20, marginRight: 10 }}>🙋</span>
        <span style={{ fontWeight: 800, fontSize: 15 }}>User Portal — My Complaints</span>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 16px" }}>
        {error && (
          <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
            {error}
            <button onClick={() => setError("")} style={{ float: "right", border: "none", background: "none", cursor: "pointer", color: "#dc2626" }}>×</button>
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e293b" }}>My Complaints</h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>{complaints.length} submitted</p>
          </div>
          <Btn onClick={() => setShowSubmit(true)}>+ Submit Complaint</Btn>
        </div>

        {loading && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading…</div>}

        {!loading && complaints.length === 0 && (
          <div style={{ ...card, textAlign: "center", padding: 48, color: "#94a3b8" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div style={{ fontWeight: 600 }}>No complaints yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Click "Submit Complaint" to get started</div>
          </div>
        )}

        {complaints.map(c => (
          <div key={c._id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  {c.category} · {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <div style={{ marginTop: 10 }}>
              <Btn color="#f3f4f6" textColor="#374151" onClick={() => trackStatus(c._id)}>
                🔍 Track Status
              </Btn>
            </div>
          </div>
        ))}
      </div>

      {/* Track Status Modal */}
      {trackData && (
        <Modal title="Complaint Status" onClose={() => setTrackData(null)}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{trackData.title}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{trackData.category}</div>
            {trackData.assignedOfficer && (
              <div style={{ fontSize: 13, color: "#3b82f6", marginTop: 4 }}>👮 Officer: {trackData.assignedOfficer.name}</div>
            )}
          </div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 }}>Status History</div>
          <Timeline history={trackData.statusHistory || []} />
          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Btn color="#f3f4f6" textColor="#374151" onClick={() => setTrackData(null)}>Close</Btn>
          </div>
        </Modal>
      )}

      {/* Submit Complaint Modal */}
      {showSubmit && (
        <Modal title="Submit New Complaint" onClose={() => setShowSubmit(false)}>
          <Input label="Title" placeholder="e.g. Mobile snatching near market"
            value={submitForm.title} onChange={e => setSubmitForm({ ...submitForm, title: e.target.value })} />
          <Textarea label="Description" placeholder="Describe the incident..."
            value={submitForm.description} onChange={e => setSubmitForm({ ...submitForm, description: e.target.value })} />
          <Select label="Category" options={CATEGORIES}
            value={submitForm.category} onChange={e => setSubmitForm({ ...submitForm, category: e.target.value })} />
          <Input label="Location / Address" placeholder="e.g. New Road, Kathmandu"
            value={submitForm.address} onChange={e => setSubmitForm({ ...submitForm, address: e.target.value })} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn color="#f3f4f6" textColor="#374151" onClick={() => setShowSubmit(false)}>Cancel</Btn>
            <Btn onClick={submitComplaint} disabled={loading}>{loading ? "Submitting…" : "Submit"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
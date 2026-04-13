import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";
const API = "http://localhost:5000/api/feedback";

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const fetchFeedbacks = async () => {
    try {
      const { data } = await axios.get(API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbacks(data.feedbacks);
    } catch (err) {
      console.error("Failed to fetch feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      await axios.delete(`${API}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbacks((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      alert("Failed to delete");
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  if (loading)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px", color: "#64748b" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, animate: "pulse 2s infinite" }}>Gathering community insights...</p>
      </div>
    );

  return (
    <div style={{ padding: "40px", background: "#0b0f1a", minHeight: "calc(100vh - 80px)", color: "#e5e7eb", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#fff", margin: 0 }}>📋 User Feedback</h2>
          <p style={{ fontSize: "14px", color: "#94a3b8", marginTop: "8px" }}>
            {feedbacks.length} response{feedbacks.length !== 1 ? "s" : ""} collected from citizens
          </p>
        </div>

        {/* Empty State */}
        {feedbacks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", color: "#4b5563", background: "#111827", borderRadius: "20px", border: "1px solid #1f2937" }}>
            <p style={{ fontSize: "48px", marginBottom: "16px" }}>💬</p>
            <p style={{ fontWeight: 600 }}>No feedback records found.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {feedbacks.map((f) => (
              <div
                key={f._id}
                style={{
                  background: "rgba(17, 24, 39, 0.7)", backdropFilter: "blur(12px)",
                  borderRadius: "20px", padding: "24px", border: "1px solid #1f2937",
                  transition: "all 0.3s ease", boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
                }}
              >
                {/* Card Header */}
                <div style={{ display: "flex", alignItems: "center", justifySpaceBetween: "space-between", marginBottom: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 800, fontSize: "16px", color: "#fff" }}>
                      {f.name || f.userId?.email?.split("@")[0] || "Anonymous User"}
                    </span>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{f.userId?.email || "No email provided"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ color: i < (f.rating || 0) ? "#fbbf24" : "#1f2937", fontSize: "14px" }}>★</span>
                    ))}
                    <span style={{ fontSize: "12px", color: "#4b5563", marginLeft: "6px" }}>({f.rating || 0}/5)</span>
                  </div>
                </div>

                {/* Message */}
                <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "12px", border: "1px solid #1f2937" }}>
                   <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6", fontStyle: "italic", margin: 0 }}>
                    "{f.message}"
                  </p>
                </div>

                {/* Card Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                  <div style={{ fontSize: "11px", color: "#4b5563", fontWeight: 600, letterSpacing: "0.5px" }}>
                    {new Date(f.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <button
                    onClick={() => handleDelete(f._id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      background: "rgba(239, 68, 68, 0.1)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)",
                      fontSize: "12px", fontWeight: 700, padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.color = "#f87171"; }}
                  >
                    🗑 DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
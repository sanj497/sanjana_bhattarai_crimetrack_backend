import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import React from "react";

const Forwardtopolice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const handleForward = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      alert("❌ Not authenticated. Please log in.");
      navigate("/login");
      return;
    }

    try {
      // FIXED: Use the FORWARD endpoint instead of VERIFY
      const res = await fetch(
        `https://sanjana-bhattarai-crimetrack-backend.onrender.com/api/report/${id}/forward`, // Changed from /verify to /forward
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminNotes }), // Add the body with adminNotes
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Error");

      alert("✅ Report forwarded to police successfully");
      navigate("/admin");
    } catch (err) {
      console.error("Forward error:", err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", background: "#0b0f1a", minHeight: "calc(100vh - 80px)", color: "#e5e7eb", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "32px", color: "#fff" }}>
          Escalate to Police
        </h2>
        
        <div style={{ 
          background: "rgba(245, 158, 11, 0.1)", borderLeft: "4px solid #fbbf24", 
          padding: "20px", borderRadius: "12px", marginBottom: "32px" 
        }}>
          <p style={{ fontSize: "14px", color: "#fbbf24", fontWeight: 600, margin: 0 }}>
            ⚠️ Only verified reports with sufficient evidence should be escalated for police investigation.
          </p>
        </div>
        
        <div style={{ 
          background: "rgba(17, 24, 39, 0.7)", backdropFilter: "blur(12px)",
          borderRadius: "20px", padding: "32px", border: "1px solid #1f2937",
          boxShadow: "0 15px 35px rgba(0,0,0,0.25)"
        }}>
          <div style={{ display: "grid", gap: "24px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#94a3b8", marginBottom: "12px" }}>
                Police Coordination Notes
              </label>
              <textarea
                placeholder="Include specific instructions, priority levels, or evidence summaries for the police department..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                style={{
                  width: "100%", padding: "16px", borderRadius: "12px", border: "1px solid #374151",
                  background: "#111827", color: "#fff", outline: "none", fontSize: "15px",
                  minHeight: "150px", resize: "vertical"
                }}
              />
            </div>

            <button
              onClick={handleForward}
              disabled={loading}
              style={{
                width: "100%", padding: "16px", borderRadius: "12px", color: "#fff",
                fontWeight: 800, fontSize: "16px", cursor: "pointer", transition: "all 0.2s",
                border: "none", background: "#3b82f6", 
                boxShadow: "0 8px 20px rgba(59, 130, 246, 0.2)",
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#2563eb"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#3b82f6"; }}
            >
              {loading ? "INITIALIZING TRANSFER..." : "FORWARD TO POLICE HQ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forwardtopolice;
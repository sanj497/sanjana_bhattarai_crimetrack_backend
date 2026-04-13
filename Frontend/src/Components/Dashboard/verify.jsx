import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import React from "react";

const Verify = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [action, setAction] = useState("verify");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [fetching, setFetching] = useState(true);

  // Fetch the specific report details
  useEffect(() => {
    const fetchReport = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert("❌ Not authenticated. Please log in.");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`https://sanjana-bhattarai-crimetrack-backend.onrender.com/api/report/${id}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.msg || "Error fetching report");
        }

        setReport(data);
      } catch (err) {
        console.error("Error fetching report:", err);
        alert(`❌ Error: ${err.message}`);
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");

    if (!token) {
      alert("❌ Not authenticated. Please log in.");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `https://sanjana-bhattarai-crimetrack-backend.onrender.com/api/report/${id}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: action,
            adminNotes: adminNotes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Error verifying report");
      }

      alert(`✅ Report ${action === "verify" ? "Verified" : "Rejected"} successfully`);
      navigate("/admin");
    } catch (err) {
      console.error("Verify error:", err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", color: "#94a3b8" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ border: "2px solid rgba(59, 130, 246, 0.2)", borderTopColor: "#3b82f6", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto" }}></div>
          <p style={{ marginTop: "16px", fontSize: "14px", fontWeight: 600 }}>Analyzing report data...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ padding: "40px", textAlign: "center", background: "#0b0f1a", minHeight: "calc(100vh - 80px)" }}>
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "24px", borderRadius: "20px", maxWidth: "400px", margin: "0 auto" }}>
          <p style={{ fontWeight: 800, fontSize: "18px", marginBottom: "16px" }}>Report not found</p>
          <button
            onClick={() => navigate("/admin")}
            style={{ background: "#ef4444", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", background: "#0b0f1a", minHeight: "calc(100vh - 80px)", color: "#e5e7eb", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "32px", color: "#fff" }}>
          Verify Crime Report
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          {/* Report Details Section */}
          <div style={{
            background: "rgba(17, 24, 39, 0.7)", backdropFilter: "blur(12px)",
            borderRadius: "20px", padding: "32px", border: "1px solid #1f2937",
            boxShadow: "0 15px 35px rgba(0,0,0,0.25)"
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "24px", color: "#3b82f6", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>📋</span> Case Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
              <div>
                <Label>Report ID</Label>
                <Value>{report._id}</Value>
              </div>
              <div>
                <Label>Crime Type</Label>
                <Value>{report.crimeType || report.category}</Value>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <Label>Description</Label>
                <div style={{ fontSize: "15px", color: "#94a3b8", lineHeight: "1.6", background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "12px", border: "1px solid #1f2937" }}>
                  {report.description}
                </div>
              </div>
              <div>
                <Label>Current Status</Label>
                <div style={{ marginTop: "8px" }}>
                  <span style={{
                    padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 800,
                    ...getStatusStyles(report.status)
                  }}>
                    {report.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <Label>Submission Date</Label>
                <Value>{new Date(report.createdAt).toLocaleString()}</Value>
              </div>
              <div>
                <Label>Reported By</Label>
                <Value>{report.isAnonymous ? "Anonymous User" : (report.userId?.name || "Verified Citizen")}</Value>
              </div>
              <div>
                <Label>Location</Label>
                <Value>{report.location?.address || "Coordinates set on map"}</Value>
              </div>
            </div>
          </div>
          
          {/* Action Form */}
          <form 
            onSubmit={handleSubmit} 
            style={{
              background: "rgba(17, 24, 39, 0.7)", backdropFilter: "blur(12px)",
              borderRadius: "20px", padding: "32px", border: "1px solid #1f2937",
              boxShadow: "0 15px 35px rgba(0,0,0,0.25)"
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "24px", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>⚖️</span> Administrative Action
            </h3>

            <div style={{ display: "grid", gap: "24px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#94a3b8", marginBottom: "12px" }}>
                  Decision
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  style={{
                    width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #374151",
                    background: "#111827", color: "#fff", outline: "none", fontSize: "15px",
                    cursor: "pointer", appearance: "none"
                  }}
                >
                  <option value="verify">✅ APPROVE & VERIFY REPORT</option>
                  <option value="reject">❌ REJECT INCIDENT</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "#94a3b8", marginBottom: "12px" }}>
                  Official Notes
                </label>
                <textarea
                  placeholder="Provide detailed justification for this action..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  style={{
                    width: "100%", padding: "16px", borderRadius: "12px", border: "1px solid #374151",
                    background: "#111827", color: "#fff", outline: "none", fontSize: "15px",
                    minHeight: "120px", resize: "vertical"
                  }}
                  required
                />
                <p style={{ fontSize: "12px", color: "#4b5563", marginTop: "10px" }}>
                  Note: This feedback will be shared with the report submitter.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "16px", borderRadius: "12px", color: "#fff",
                  fontWeight: 800, fontSize: "16px", cursor: "pointer", transition: "all 0.2s",
                  border: "none",
                  background: action === "verify" ? "#22c55e" : "#ef4444",
                  boxShadow: action === "verify" ? "0 8px 20px rgba(34, 197, 94, 0.2)" : "0 8px 20px rgba(239, 68, 68, 0.2)",
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? "PROCESSING ACTION..." : (action === "verify" ? "CONFIRM VERIFICATION" : "CONFIRM REJECTION")}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const Label = ({ children }) => (
  <div style={{ fontSize: "12px", fontWeight: 800, color: "#4b5563", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>{children}</div>
);

const Value = ({ children }) => (
  <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>{children || "—"}</div>
);

const getStatusStyles = (status) => {
  switch (status) {
    case "Pending":  return { background: "rgba(245, 158, 11, 0.1)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.2)" };
    case "Verified": return { background: "rgba(34, 197, 94, 0.1)",  color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.2)" };
    case "Rejected": return { background: "rgba(239, 68, 68, 0.1)",  color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)" };
    default:         return { background: "rgba(59, 130, 246, 0.1)",  color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.2)" };
  }
};

export default Verify;
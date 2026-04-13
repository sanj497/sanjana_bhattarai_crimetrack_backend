import { useEffect, useState } from "react";
import React from "react";
import {
  Camera,
  AlertTriangle,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Lock,
  AlertCircle,
  Hammer,
  CreditCard,
  Home,
  Pill,
  FileText,
  Inbox,
  Send,
  Bell,
  RefreshCw,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/report`;
const SOCKET_URL = `${import.meta.env.VITE_BACKEND_URL}`;

import { io } from "socket.io-client";

export default function AdminReport() {
  const [crimes, setCrimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  const fetchReports = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(API_URL, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!res.ok) throw new Error("Unauthorized or failed request");
      const data = await res.json();
      setCrimes(Array.isArray(data.crimes) ? data.crimes : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports on mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Setup Socket.io connection for real-time notifications (optional)
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    // Only setup socket if io is available
    if (io && token && userData.role) {
      try {
        const newSocket = io(SOCKET_URL, {
          auth: { token },
          transports: ["websocket", "polling"]
        });

        // Authenticate socket connection
        newSocket.on("connect", () => {
          console.log("Socket connected:", newSocket.id);
          newSocket.emit("authenticate", {
            userId: userData._id || userData.id,
            role: userData.role
          });
        });

        // Listen for new notifications
        newSocket.on("new_notification", (notification) => {
          console.log("New notification received:", notification);
          setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
          setUnreadCount(prev => prev + 1);

          // Auto-refresh reports if new crime report
          if (notification.type === "crime_report") {
            fetchReports();
          }

          // Show browser notification if supported
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(notification.message, {
              icon: "/favicon.ico",
              badge: "/favicon.ico"
            });
          }
        });

        setSocket(newSocket);

        // Request notification permission
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
        }

        return () => {
          newSocket.close();
        };
      } catch (err) {
        console.warn("Socket connection failed:", err);
      }
    } else {
      console.log("Socket.io not available - using polling only");
    }
  }, []);

  const markNotificationRead = (index) => {
    setNotifications(prev => prev.map((n, i) =>
      i === index ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleAction = async (id, status) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`https://sanjana-bhattarai-crimetrack-backend.onrender.com/api/report/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        alert(`Report ${status} successfully`);
        fetchReports();
      } else {
        const data = await res.json();
        alert(data.error || "Action failed");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  const statusColor = (status) => {
    if (status === "Pending") return "#f59e0b";
    if (status === "Verified" || status === "Accepted") return "#10b981";
    if (status === "Rejected") return "#ef4444";
    if (status === "ForwardedToPolice") return "#3b82f6";
    return "#64748b";
  };

  const getCrimeIcon = (type) => {
    const icons = {
      Theft: Lock,
      Assault: AlertTriangle,
      Vandalism: Hammer,
      Fraud: CreditCard,
      Burglary: Home,
      "Drug-related": Pill
    };
    return icons[type] || FileText;
  };

  const filteredCrimes =
    filter === "All" ? crimes : crimes.filter((c) => c.status === filter);

  if (loading)
    return (
      <div style={s.center}>
        <div style={s.spinner}></div>
        <div style={s.loadText}>Loading reports...</div>
      </div>
    );

  return (
    <div style={s.container}>
      {/* Filters and Actions Bar */}
      <div style={s.topBar}>
        <div style={s.filters}>
          {["All", "Pending", "Verified", "ForwardedToPolice", "Rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...s.filterBtn,
                ...(filter === f ? s.filterActive : {}),
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div style={s.actionsRight}>
           <button
            style={s.refreshBtn}
            onClick={fetchReports}
            title="Refresh reports"
          >
            <RefreshCw size={18} />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div style={s.grid}>
        {filteredCrimes.map((crime, i) => {
          const CrimeIcon = getCrimeIcon(crime.crimeType);
          return (
            <div key={i} style={s.card}>
              <div
                style={{
                  ...s.badge,
                  backgroundColor: statusColor(crime.status),
                }}
              >
                {crime.status}
              </div>

              {crime.evidence?.[0]?.url ? (
                <img
                  src={crime.evidence[0].url}
                  alt="Evidence"
                  style={s.img}
                />
              ) : (
                <div style={s.noImg}>
                  <Camera size={48} color="#64748b" />
                  <div style={{ marginTop: "8px" }}>No evidence</div>
                </div>
              )}

              <div style={s.content}>
                <div style={s.typeTag}>
                  <CrimeIcon size={14} />
                  {crime.crimeType}
                </div>
                <h3 style={s.cardTitle}>{crime.title || "Untitled"}</h3>
                <p style={s.desc}>
                  {crime.description?.substring(0, 80)}
                  {crime.description?.length > 80 ? "..." : ""}
                </p>
                <div style={s.location}>
                  <MapPin size={16} color="#3b82f6" />
                  <span style={{ fontSize: 12 }}>{crime.location?.address || "Unknown"}</span>
                </div>

                {/* ADMIM ACTIONS */}
                <div style={s.actions}>
                  {crime.status === "Pending" && (
                    <>
                      <button onClick={() => handleAction(crime._id, "Verified")} style={{ ...s.actionBtn, background: "#10b98120", color: "#10b981", borderColor: "#10b98140" }}>
                        <CheckCircle size={14} /> Verify
                      </button>
                      <button onClick={() => handleAction(crime._id, "Rejected")} style={{ ...s.actionBtn, background: "#ef444420", color: "#ef4444", borderColor: "#ef444440" }}>
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}
                  {crime.status === "Verified" && (
                    <button onClick={() => handleAction(crime._id, "ForwardedToPolice")} style={{ ...s.actionBtn, background: "#3b82f620", color: "#3b82f6", borderColor: "#3b82f640", width: "100%" }}>
                      <Send size={14} /> Forward to Police
                    </button>
                  )}
                  <button onClick={() => navigate(`/admin/verify/${crime._id}`)} style={{ ...s.actionBtn, background: "#1e293b", color: "#94a3b8", borderColor: "#334155", flex: 1 }}>
                    Review
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCrimes.length === 0 && (
        <div style={s.empty}>
          <Inbox size={64} color="#64748b" />
          <div style={{ marginTop: "16px", fontSize: "16px" }}>No reports in this category</div>
        </div>
      )}
    </div>
  );
}
const s = {
  container: { padding: "40px", minHeight: "calc(100vh - 80px)", background: "transparent", fontFamily: "Inter, system-ui, sans-serif" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", color: "#64748b" },
  spinner: { width: "40px", height: "40px", border: "3px solid rgba(59, 130, 246, 0.2)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "16px" },
  loadText: { fontSize: "14px", fontWeight: "600", letterSpacing: "0.5px" },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    background: "#fff",
    padding: "16px 24px",
    borderRadius: "16px",
    border: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
  },

  filters: { display: "flex", gap: "10px", flexWrap: "wrap" },
  filterBtn: { 
    padding: "10px 20px", 
    backgroundColor: "rgba(255,255,255,0.03)", 
    color: "#94a3b8", 
    border: "1px solid #1f2937", 
    borderRadius: "12px", 
    cursor: "pointer", 
    fontSize: "13px", 
    fontWeight: "600", 
    transition: "all 0.2s" 
  },
  filterActive: { 
    backgroundColor: "#3b82f6", 
    color: "#fff", 
    borderColor: "#3b82f6",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
  },

  actionsRight: { display: "flex", alignItems: "center", gap: "12px" },
  refreshBtn: {
    background: "rgba(59, 130, 246, 0.1)",
    border: "1px solid rgba(59, 130, 246, 0.2)",
    borderRadius: "12px",
    padding: "10px 20px",
    color: "#3b82f6",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.2s"
  },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" },
  card: { 
    backgroundColor: "#111827", 
    borderRadius: "20px", 
    overflow: "hidden", 
    border: "1px solid #1f2937", 
    position: "relative", 
    display: "flex", 
    flexDirection: "column",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
  },
  badge: { 
    position: "absolute", 
    top: "16px", 
    right: "16px", 
    padding: "6px 12px", 
    borderRadius: "8px", 
    fontSize: "11px", 
    fontWeight: "800", 
    textTransform: "uppercase", 
    zIndex: 5, 
    color: "#fff",
    letterSpacing: "0.5px"
  },
  img: { width: "100%", height: "180px", objectFit: "cover" },
  noImg: { 
    height: "180px", 
    backgroundColor: "#0b0f1a", 
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center", 
    justifyContent: "center", 
    color: "#4b5563" 
  },
  content: { padding: "20px", flex: 1, display: "flex", flexDirection: "column" },
  typeTag: { 
    display: "inline-flex", 
    alignItems: "center", 
    gap: "8px", 
    padding: "6px 14px", 
    borderRadius: "8px", 
    fontSize: "12px", 
    fontWeight: "700", 
    backgroundColor: "rgba(59, 130, 246, 0.1)", 
    color: "#3b82f6", 
    marginBottom: "12px", 
    alignSelf: "flex-start" 
  },
  cardTitle: { fontSize: "18px", fontWeight: "800", margin: "0 0 10px 0", color: "#fff" },
  desc: { fontSize: "14px", color: "#94a3b8", lineHeight: "1.6", marginBottom: "16px", height: "45px", overflow: "hidden" },
  location: { 
    display: "flex", 
    gap: "8px", 
    padding: "12px", 
    backgroundColor: "#0b0f1a", 
    borderRadius: "12px", 
    color: "#cbd5e1", 
    marginBottom: "20px",
    border: "1px solid #1f2937"
  },
  actions: { display: "flex", gap: "10px", marginTop: "auto", flexWrap: "wrap" },
  actionBtn: { 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: "8px", 
    padding: "10px 14px", 
    borderRadius: "12px", 
    border: "1px solid transparent", 
    fontSize: "13px", 
    fontWeight: "700", 
    cursor: "pointer", 
    transition: "all 0.2s", 
    flex: 1 
  },
  empty: { textAlign: "center", padding: "80px 20px", color: "#4b5563" },
};

const style = document.createElement("style");
style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
import { useEffect, useState } from "react";
import React from "react";

const Policereport = () => {
  const [crimes, setCrimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const fetchCrimes = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login first");
          setCrimes([]);
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/report", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          setError("Unauthorized access");
          setCrimes([]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setCrimes(Array.isArray(data.crimes) ? data.crimes : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load reports");
        setCrimes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCrimes();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");

      await fetch(`http://localhost:5000/api/report/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      setCrimes((prev) =>
        prev.map((crime) => (crime._id === id ? { ...crime, status } : crime))
      );
    } catch (error) {
      console.error("Status update failed");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Accepted":
        return "#10b981";
      case "Rejected":
        return "#ef4444";
      case "Pending":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getCrimeTypeIcon = (type) => {
    const icons = {
      Theft: "🔓",
      Assault: "⚠️",
      Vandalism: "🔨",
      Fraud: "💳",
      Burglary: "🏠",
      "Drug-related": "💊",
      Other: "📋",
    };
    return icons[type] || "📋";
  };

  const filteredCrimes =
    filter === "All"
      ? crimes
      : crimes.filter((crime) => crime.status === filter);

  const stats = {
    total: crimes.length,
    pending: crimes.filter((c) => c.status === "Pending").length,
    accepted: crimes.filter((c) => c.status === "Accepted").length,
    rejected: crimes.filter((c) => c.status === "Rejected").length,
  };

  if (loading)
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading reports...</p>
      </div>
    );

  if (error)
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <p style={styles.errorText}>{error}</p>
      </div>
    );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Police Dashboard</h1>
          <p style={styles.subtitle}>Manage and review crime reports</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #3b82f6" }}>
          <div style={styles.statLabel}>Total Reports</div>
          <div style={styles.statValue}>{stats.total}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #f59e0b" }}>
          <div style={styles.statLabel}>Pending</div>
          <div style={styles.statValue}>{stats.pending}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #10b981" }}>
          <div style={styles.statLabel}>Accepted</div>
          <div style={styles.statValue}>{stats.accepted}</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: "4px solid #ef4444" }}>
          <div style={styles.statLabel}>Rejected</div>
          <div style={styles.statValue}>{stats.rejected}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={styles.filterContainer}>
        {["All", "Pending", "Accepted", "Rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              ...styles.filterButton,
              ...(filter === status ? styles.filterButtonActive : {}),
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div style={styles.reportsList}>
        {filteredCrimes.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <p style={styles.emptyText}>No reports found</p>
          </div>
        ) : (
          filteredCrimes.map((crime) => (
            <div key={crime._id} style={styles.reportCard}>
              {/* Status Badge */}
              <div
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(crime.status) + "20",
                  color: getStatusColor(crime.status),
                }}
              >
                {crime.status}
              </div>

              {/* Report Header */}
              <div style={styles.reportHeader}>
                <div style={styles.crimeIcon}>
                  {getCrimeTypeIcon(crime.crimeType)}
                </div>
                <div style={styles.reportTitle}>
                  <h3 style={styles.title3}>{crime.title}</h3>
                  <span style={styles.crimeType}>{crime.crimeType}</span>
                </div>
              </div>

              {/* Description */}
              <p style={styles.description}>{crime.description}</p>

              {/* Details Grid */}
              <div style={styles.detailsGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailIcon}>📍</span>
                  <div>
                    <div style={styles.detailLabel}>Location</div>
                    <div style={styles.detailValue}>
                      {crime.location
                        ? crime.location.address
                        : "Unknown location"}
                    </div>
                    {crime.location && (
                      <div style={styles.coordinates}>
                        {crime.location.lat.toFixed(4)},{" "}
                        {crime.location.lng.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>

                <div style={styles.detailItem}>
                  <span style={styles.detailIcon}>👤</span>
                  <div>
                    <div style={styles.detailLabel}>Reported By</div>
                    <div style={styles.detailValue}>
                      {crime.userId?.email || "Anonymous"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={styles.actionButtons}>
                <button
                  onClick={() => updateStatus(crime._id, "Accepted")}
                  disabled={crime.status === "Accepted"}
                  style={{
                    ...styles.button,
                    ...styles.acceptButton,
                    ...(crime.status === "Accepted"
                      ? styles.buttonDisabled
                      : {}),
                  }}
                >
                  ✓ Accept
                </button>

                <button
                  onClick={() => updateStatus(crime._id, "Pending")}
                  disabled={crime.status === "Pending"}
                  style={{
                    ...styles.button,
                    ...styles.pendingButton,
                    ...(crime.status === "Pending" ? styles.buttonDisabled : {}),
                  }}
                >
                  ⏱ Pending
                </button>

                <button
                  onClick={() => updateStatus(crime._id, "Rejected")}
                  disabled={crime.status === "Rejected"}
                  style={{
                    ...styles.button,
                    ...styles.rejectButton,
                    ...(crime.status === "Rejected"
                      ? styles.buttonDisabled
                      : {}),
                  }}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    padding: "20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#0f172a",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #1e293b",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "20px",
    color: "#94a3b8",
    fontSize: "16px",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    padding: "20px",
  },
  errorIcon: {
    fontSize: "64px",
    marginBottom: "20px",
  },
  errorText: {
    color: "#ef4444",
    fontSize: "18px",
    textAlign: "center",
  },
  header: {
    marginBottom: "30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#ffffff",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "16px",
    color: "#94a3b8",
    margin: 0,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  statCard: {
    backgroundColor: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  },
  statLabel: {
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "8px",
    fontWeight: "500",
  },
  statValue: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#ffffff",
  },
  filterContainer: {
    display: "flex",
    gap: "10px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  filterButton: {
    padding: "10px 20px",
    backgroundColor: "#1e293b",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  filterButtonActive: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    borderColor: "#3b82f6",
  },
  reportsList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  reportCard: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    position: "relative",
    transition: "transform 0.2s, box-shadow 0.2s",
    border: "1px solid #334155",
  },
  statusBadge: {
    position: "absolute",
    top: "20px",
    right: "20px",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  reportHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "16px",
  },
  crimeIcon: {
    fontSize: "32px",
    backgroundColor: "#334155",
    width: "50px",
    height: "50px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  reportTitle: {
    flex: 1,
  },
  title3: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#ffffff",
    margin: "0 0 6px 0",
  },
  crimeType: {
    fontSize: "14px",
    color: "#94a3b8",
    backgroundColor: "#334155",
    padding: "4px 10px",
    borderRadius: "6px",
  },
  description: {
    color: "#cbd5e1",
    fontSize: "15px",
    lineHeight: "1.6",
    marginBottom: "20px",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
    padding: "20px",
    backgroundColor: "#0f172a",
    borderRadius: "8px",
  },
  detailItem: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  detailIcon: {
    fontSize: "20px",
  },
  detailLabel: {
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "4px",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: "14px",
    color: "#e2e8f0",
    fontWeight: "500",
  },
  coordinates: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },
  actionButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  button: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s",
    flex: "1",
    minWidth: "120px",
  },
  acceptButton: {
    backgroundColor: "#10b981",
    color: "#ffffff",
  },
  pendingButton: {
    backgroundColor: "#f59e0b",
    color: "#ffffff",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "#1e293b",
    borderRadius: "12px",
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "20px",
  },
  emptyText: {
    fontSize: "18px",
    color: "#94a3b8",
  },
};

// Add CSS for spinner animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    .reportCard:hover {
      transform: none;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Policereport;
import React, { useEffect, useState } from "react";
import axios from "axios";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // GET ALL USERS
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "https://sanjana-bhattarai-crimetrack-backend.onrender.com/api/auth/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(res.data.users);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // MAKE POLICE
  const makePolice = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `https://sanjana-bhattarai-crimetrack-backend.onrender.com/api/auth/update-role/${id}`,
        { role: "police" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.msg || "Error");
    }
  };

  // REMOVE POLICE (BACK TO USER)
  const removePolice = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `https://sanjana-bhattarai-crimetrack-backend.onrender.com/api/auth/update-role/${id}`,
        { role: "user" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.msg || "Error");
    }
  };

  return (
    <div style={{ padding: "40px", background: "#0b0f1a", minHeight: "calc(100vh - 80px)", color: "#e5e7eb", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#fff", margin: 0 }}>User Management</h1>
            <p style={{ fontSize: "14px", color: "#94a3b8", marginTop: "8px" }}>Configure security roles and permissions for system users.</p>
          </div>
          <div style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", padding: "10px 20px", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.2)", fontSize: "13px", fontWeight: 700 }}>
            {users.length} Active Accounts
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px", color: "#4b5563" }}>
            <span style={{ fontWeight: 600 }}>Syncing user database...</span>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {users.map((user) => (
              <div
                key={user._id}
                style={{
                  background: "rgba(17, 24, 39, 0.7)", backdropFilter: "blur(12px)",
                  borderRadius: "20px", padding: "28px", border: "1px solid #1f2937",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)", transition: "all 0.3s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "14px",
                    display: "grid", placeItems: "center",
                    background: user.role === "police" ? "rgba(34, 197, 94, 0.1)" : "rgba(59, 130, 246, 0.1)",
                    border: "1px solid " + (user.role === "police" ? "rgba(34, 197, 94, 0.2)" : "rgba(59, 130, 246, 0.2)"),
                    fontSize: "20px"
                  }}>
                    {user.role === "police" ? "👮" : "👤"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: "#fff", fontSize: "16px", marginBottom: "2px", wordBreak: "break-all" }}>{user.email.split("@")[0]}</div>
                    <div style={{ fontSize: "12px", color: "#4b5563" }}>{user.email}</div>
                  </div>
                </div>

                <div style={{ 
                  padding: "12px 16px", borderRadius: "12px", background: "rgba(0,0,0,0.2)", 
                  border: "1px solid #1f2937", marginBottom: "24px" 
                }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#4b5563", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Security Role</div>
                  <div style={{ 
                    fontSize: "14px", fontWeight: 700, 
                    color: user.role === "police" ? "#4ade80" : "#60a5fa"
                  }}>
                    {user.role.toUpperCase()}
                  </div>
                </div>

                {/* BUTTON LOGIC */}
                {user.role === "police" ? (
                  <button
                    onClick={() => removePolice(user._id)}
                    style={{
                      width: "100%", padding: "12px", borderRadius: "12px",
                      background: "rgba(239, 68, 68, 0.1)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)",
                      fontSize: "13px", fontWeight: 800, cursor: "pointer", transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.color = "#f87171"; }}
                  >
                    REVOKE POLICE STATUS
                  </button>
                ) : (
                  <button
                    onClick={() => makePolice(user._id)}
                    style={{
                      width: "100%", padding: "12px", borderRadius: "12px",
                      background: "rgba(34, 197, 94, 0.1)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.2)",
                      fontSize: "13px", fontWeight: 800, cursor: "pointer", transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#22c55e"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(34, 197, 94, 0.1)"; e.currentTarget.style.color = "#4ade80"; }}
                  >
                    PROMOTE TO POLICE
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
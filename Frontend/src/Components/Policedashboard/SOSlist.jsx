import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";
const SOSList = () => {
  const [sosData, setSosData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSOS = async () => {
    try {
      const res = await axios.get(
        "https://sanjana-bhattarai-crimetrack-backend.onrender.com/api/emergency/sos"
      );

      setSosData(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSOS();
  }, []);

  if (loading) return <h2>Loading SOS...</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>🚨 SOS Alerts Table</h2>

      {sosData.length === 0 ? (
        <p>No SOS alerts found</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "10px",
            }}
          >
            <thead>
              <tr style={{ background: "#f2f2f2" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Latitude</th>
                <th style={thStyle}>Longitude</th>
                <th style={thStyle}>Accuracy</th>
                <th style={thStyle}>Message</th>
                <th style={thStyle}>Time</th>
              </tr>
            </thead>

            <tbody>
              {sosData.map((item) => (
                <tr key={item._id} style={{ textAlign: "center" }}>
                  <td style={tdStyle}>{item._id}</td>
                  <td style={tdStyle}>{item.latitude ?? "N/A"}</td>
                  <td style={tdStyle}>{item.longitude ?? "N/A"}</td>
                  <td style={tdStyle}>{item.accuracy ?? "N/A"}</td>
                  <td style={tdStyle}>{item.message}</td>
                  <td style={tdStyle}>
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// styles
const thStyle = {
  border: "1px solid #ddd",
  padding: "10px",
  fontWeight: "bold",
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: "10px",
};

export default SOSList;
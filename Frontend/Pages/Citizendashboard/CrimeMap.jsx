import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Map as MapIcon, ShieldAlert, Globe, Crosshair, AlertTriangle, ShieldCheck } from "lucide-react";

const API = `${import.meta.env.VITE_BACKEND_URL}/api/report`;

const SEVERITY_COLOR = {
  Critical: "#ef4444",
  High:     "#f97316",
  Medium:   "#facc15",
  Low:      "#22c55e",
};

export default function CrimeMap() {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const layerGroup  = useRef(null);
  const markersRef  = useRef({});
  const navigate    = useNavigate();

  const [reports, setReports]   = useState([]);
  const [nearby, setNearby]     = useState([]);
  const [filter, setFilter]     = useState("All");
  const [activeTab, setActiveTab] = useState("nearby"); // "nearby" | "global"
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  // ── Init Map ───────────────────────────────────────────────────
  useEffect(() => {
    if (mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      zoomSnap: 0.5,
    }).setView([27.7172, 85.324], 13);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '© OpenStreetMap, © CARTO',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    layerGroup.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    // Get User Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        map.flyTo(coords, 14);
        
        // Add User Marker
        L.circleMarker(coords, {
          radius: 8,
          fillColor: "#3b82f6",
          color: "#fff",
          weight: 3,
          fillOpacity: 1
        }).addTo(map).bindPopup("<b>You are here</b>");

        // Add Safety Pulse
        L.circle(coords, {
          radius: 5000,
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.05,
          weight: 1,
          dashArray: '5, 10'
        }).addTo(map);
      });
    }

    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch Global
      const gRes = await fetch(`${API}/community`, { headers });
      const gJson = await gRes.json();
      if (gJson.success) {
        setReports(gJson.reports);
        plotMarkers(gJson.reports);
      }

      // Fetch Nearby if location available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          const nRes = await fetch(`${API}/nearby?lat=${latitude}&lng=${longitude}&radius=5000`, { headers });
          const nJson = await nRes.json();
          if (nJson.success) setNearby(nJson.reports);
        });
      }
    } catch (err) {
      console.error("Map fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const plotMarkers = (data) => {
    const group = layerGroup.current;
    if (!group) return;
    group.clearLayers();
    
    data.forEach((r) => {
      const lat = r.location?.lat;
      const lng = r.location?.lng;
      if (!lat || !lng) return;

      const color = SEVERITY_COLOR[r.severity] || "#888";
      const marker = L.circleMarker([lat, lng], {
        radius: r.severity === "Critical" ? 12 : 9,
        fillColor: color,
        color: "#fff",
        weight: 2,
        fillOpacity: 0.8
      });

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; padding: 4px;">
          <b style="color:${color}; font-size:14px;">${r.crimeType}</b>
          <p style="font-size:11px; color:#64748b; margin-top:2px;">${r.location.address}</p>
          <div style="margin-top:8px; display:flex; gap:4px;">
            <span style="font-size:10px; background:${color}15; color:${color}; padding:2px 6px; border-radius:4px; font-weight:bold;">${r.severity}</span>
            <span style="font-size:10px; background:#f1f5f9; color:#475569; padding:2px 6px; border-radius:4px;">${r.status}</span>
          </div>
        </div>
      `);
      
      marker.on("click", () => setSelected(r._id));
      group.addLayer(marker);
      markersRef.current[r._id] = marker;
    });
  };

  const focusReport = (r) => {
    setSelected(r._id);
    mapInstance.current.flyTo([r.location.lat, r.location.lng], 16);
    setTimeout(() => markersRef.current[r._id]?.openPopup(), 600);
  };

  const activeReports = activeTab === "nearby" ? nearby : reports;
  const filtered = filter === "All" ? activeReports : activeReports.filter(r => r.severity === filter);

  const calculateSafetyScore = () => {
    if (nearby.length === 0) return 100;
    const score = 100 - (nearby.length * 5);
    return Math.max(score, 20);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50 overflow-hidden font-sans">
      {/* Map Area */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full z-0" />
        
        {/* Float Header */}
        <div className="absolute top-6 left-6 z-10 flex gap-3">
          <div className="bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 flex items-center gap-4">
             <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${calculateSafetyScore() > 70 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <ShieldCheck size={20} />
             </div>
             <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Area Safety Score</div>
                <div className="text-xl font-black text-slate-800">{calculateSafetyScore()}% Safe</div>
             </div>
          </div>
          
          <div className="bg-white p-1 rounded-2xl shadow-2xl border border-slate-100 flex">
             <button 
               onClick={() => setActiveTab("nearby")}
               className={`px-6 py-3 rounded-xl flex items-center gap-2 text-xs font-black uppercase transition-all ${activeTab === 'nearby' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
             >
               <Crosshair size={16} /> Near Me
             </button>
             <button 
               onClick={() => setActiveTab("global")}
               className={`px-6 py-3 rounded-xl flex items-center gap-2 text-xs font-black uppercase transition-all ${activeTab === 'global' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
             >
               <Globe size={16} /> Community
             </button>
          </div>
        </div>
      </div>

      {/* Modern Sidebar */}
      <aside className="w-96 bg-white border-l border-slate-100 flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-slate-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="text-red-500" size={20} />
              {activeTab === 'nearby' ? 'Nearby Alerts' : 'Community Feed'}
            </h2>
            <span className="bg-slate-100 text-slate-500 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black">{filtered.length}</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {["All", "Critical", "High", "Medium"].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${filter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.map((r) => (
            <div 
              key={r._id} 
              onClick={() => focusReport(r)}
              className={`p-5 rounded-[28px] border transition-all cursor-pointer group ${selected === r._id ? 'bg-slate-900 border-slate-900 shadow-xl' : 'bg-white border-slate-100 hover:border-blue-200'}`}
            >
               <div className="flex justify-between items-start mb-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${selected === r._id ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'}`}>
                    {r.crimeType}
                  </span>
                  <div className={`h-2 w-2 rounded-full ${selected === r._id ? 'bg-white' : ''}`} style={{ background: selected === r._id ? '#fff' : SEVERITY_COLOR[r.severity] }} />
               </div>
               <h4 className={`text-sm font-black tracking-tight mb-1 ${selected === r._id ? 'text-white' : 'text-slate-800 group-hover:text-blue-600'}`}>{r.title || "Untitled Incident"}</h4>
               <p className={`text-[10px] font-medium leading-relaxed line-clamp-2 ${selected === r._id ? 'text-slate-400' : 'text-slate-500'}`}>{r.location.address}</p>
               
               <div className="mt-4 flex items-center justify-between">
                  <span className={`text-[9px] font-bold ${selected === r._id ? 'text-slate-500' : 'text-slate-300'}`}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex -space-x-1">
                     <div className="h-5 w-5 rounded-full border-2 border-white bg-blue-100" />
                     <div className="h-5 w-5 rounded-full border-2 border-white bg-slate-100" />
                  </div>
               </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-20 text-center">
               <AlertTriangle className="mx-auto text-slate-100 mb-4" size={48} />
               <p className="text-slate-400 text-xs font-black uppercase tracking-widest underline decoration-slate-100">No Nearby Alerts</p>
               <p className="text-[10px] text-slate-300 mt-1 max-w-[180px] mx-auto">Your area seems quiet. Stay vigilant and report any unusual activity.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
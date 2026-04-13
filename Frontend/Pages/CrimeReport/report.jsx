import { useState } from "react";
import React from "react";

const crimeTypes = [
  "Theft", "Assault", "Burglary", "Fraud", "Vandalism",
  "Drug Offense", "Cybercrime", "Domestic Violence", "Robbery", "Other"
];

const ReportCrime = () => {
  const [form, setForm] = useState({
    title: "", description: "", crimeType: "",
    address: "", lat: "", lng: "", isAnonymous: false,
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState(1);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const onFilesChange = (e) => {
    const selected = Array.from(e.target.files || []).slice(0, 5);
    setFiles(selected);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).slice(0, 5);
    setFiles(dropped);
  };

  const removeFile = (i) => setFiles(f => f.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setError(""); setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please login first.");
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      files.forEach((f) => fd.append("evidence", f));
      const res = await fetch("http://localhost:5000/api/report/report", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.msg || "Request failed");
      setMsg(data.msg || "Reported successfully!");
      setForm({ title: "", description: "", crimeType: "", address: "", lat: "", lng: "", isAnonymous: false });
      setFiles([]);
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fileIcon = (name) => {
    if (name.match(/\.(jpg|jpeg|png)$/i)) return "🖼️";
    if (name.match(/\.(mp4|mov|mkv|webm)$/i)) return "🎥";
    if (name.match(/\.pdf$/i)) return "📄";
    return "📎";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .rc-root * { box-sizing: border-box; margin: 0; padding: 0; }
        .rc-root {
          min-height: 100vh;
          background: #f5f3ef;
          font-family: 'DM Sans', sans-serif;
          display: flex; align-items: flex-start; justify-content: center;
          padding: 40px 16px 60px;
        }

        .rc-wrap {
          width: 100%; max-width: 680px;
          display: flex; flex-direction: column; gap: 20px;
        }

        /* PAGE HEADER */
        .rc-page-header {
          background: #0f1f3d;
          border-radius: 20px;
          padding: 28px 32px;
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: space-between;
        }
        .rc-page-header::before {
          content: '';
          position: absolute; top: -50px; right: -50px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%);
        }
        .rc-page-header::after {
          content: '';
          position: absolute; bottom: -60px; left: 10%;
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(255,100,80,0.08) 0%, transparent 70%);
        }
        .rc-header-left { position: relative; z-index: 1; }
        .rc-header-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.14em;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
          margin-bottom: 6px;
        }
        .rc-header-title {
          font-family: 'Fraunces', serif;
          font-size: 28px; font-weight: 700;
          color: #fff; letter-spacing: -0.02em; line-height: 1.1;
        }
        .rc-header-sub {
          font-size: 13px; color: rgba(255,255,255,0.4);
          margin-top: 6px; line-height: 1.5;
        }
        .rc-header-icon {
          font-size: 52px; opacity: 0.08;
          position: relative; z-index: 1;
        }
        .rc-emergency {
          background: rgba(255,80,60,0.12);
          border: 1px solid rgba(255,80,60,0.25);
          border-radius: 10px;
          padding: 10px 16px;
          font-size: 12px;
          color: rgba(255,180,170,0.9);
          display: flex; align-items: center; gap: 8px;
          margin-top: 14px; position: relative; z-index: 1;
        }

        /* STEP INDICATOR */
        .rc-steps {
          display: flex; align-items: center; gap: 0;
          background: #fff; border: 1px solid #e4ddd0;
          border-radius: 14px; padding: 14px 20px;
        }
        .rc-step {
          flex: 1; display: flex; align-items: center; gap: 10px;
          position: relative;
        }
        .rc-step:not(:last-child)::after {
          content: '';
          position: absolute; right: 0; top: 50%;
          transform: translateY(-50%);
          width: 1px; height: 28px;
          background: #e4ddd0;
        }
        .rc-step-num {
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; flex-shrink: 0;
          transition: all 0.2s;
        }
        .rc-step-num.done { background: #0f1f3d; color: #fff; }
        .rc-step-num.active { background: #c9a84c; color: #0f1f3d; box-shadow: 0 0 0 4px rgba(201,168,76,0.2); }
        .rc-step-num.pending { background: #f0ece3; color: #9aa3b5; }
        .rc-step-info { min-width: 0; }
        .rc-step-label { font-size: 11px; font-weight: 600; color: #9aa3b5; text-transform: uppercase; letter-spacing: 0.06em; }
        .rc-step-label.active { color: #0f1f3d; }
        .rc-step-name { font-size: 13px; font-weight: 500; color: #0f1f3d; }

        /* CARD */
        .rc-card {
          background: #fff;
          border: 1px solid #e4ddd0;
          border-radius: 20px;
          padding: 28px 28px;
          box-shadow: 0 2px 12px rgba(15,31,61,0.05);
        }
        .rc-card-title {
          font-family: 'Fraunces', serif;
          font-size: 17px; font-weight: 600;
          color: #0f1f3d; margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid #f0ece3;
          display: flex; align-items: center; gap: 8px;
        }
        .rc-card-title-icon { font-size: 18px; }

        /* FORM ELEMENTS */
        .rc-field { display: flex; flex-direction: column; gap: 6px; }
        .rc-label {
          font-size: 12px; font-weight: 600;
          color: #5a6a8a; letter-spacing: 0.04em; text-transform: uppercase;
        }
        .rc-label span { color: #e05c40; margin-left: 2px; }
        .rc-input, .rc-textarea, .rc-select {
          width: 100%;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 400;
          color: #0f1f3d;
          background: #faf8f4;
          border: 1.5px solid #e4ddd0;
          border-radius: 11px;
          padding: 11px 14px;
          transition: all 0.2s; outline: none;
          appearance: none;
        }
        .rc-input:focus, .rc-textarea:focus, .rc-select:focus {
          border-color: #0f1f3d;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(15,31,61,0.07);
        }
        .rc-input::placeholder, .rc-textarea::placeholder { color: #c0b8ae; }
        .rc-textarea { resize: vertical; min-height: 110px; line-height: 1.6; }
        .rc-select { cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239aa3b5' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }

        .rc-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .rc-grid-2-sm { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .rc-form-group { display: flex; flex-direction: column; gap: 14px; }

        /* COORD ROW */
        .rc-coord-wrap { position: relative; }
        .rc-coord-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          font-size: 13px; pointer-events: none;
        }
        .rc-coord-input {
          padding-left: 32px !important;
        }

        /* FILE DROP */
        .rc-dropzone {
          border: 2px dashed #d4cfc8;
          border-radius: 14px;
          padding: 28px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #faf8f4;
          position: relative;
        }
        .rc-dropzone.over {
          border-color: #0f1f3d;
          background: rgba(15,31,61,0.03);
        }
        .rc-dropzone-icon { font-size: 30px; margin-bottom: 8px; }
        .rc-dropzone-title { font-size: 14px; font-weight: 600; color: #0f1f3d; margin-bottom: 4px; }
        .rc-dropzone-sub { font-size: 12px; color: #9aa3b5; }
        .rc-dropzone input[type="file"] {
          position: absolute; inset: 0; opacity: 0; cursor: pointer;
        }

        .rc-file-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
        .rc-file-item {
          display: flex; align-items: center; gap: 10px;
          background: #faf8f4; border: 1px solid #e4ddd0;
          border-radius: 10px; padding: 9px 12px;
        }
        .rc-file-icon { font-size: 18px; flex-shrink: 0; }
        .rc-file-name { flex: 1; font-size: 13px; font-weight: 500; color: #0f1f3d; truncate; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .rc-file-size { font-size: 11px; color: #9aa3b5; flex-shrink: 0; }
        .rc-file-remove {
          background: none; border: none; cursor: pointer;
          color: #c0b8ae; font-size: 16px; line-height: 1;
          padding: 0 2px; transition: color 0.15s; flex-shrink: 0;
        }
        .rc-file-remove:hover { color: #e05c40; }

        /* ANONYMOUS TOGGLE */
        .rc-anon-row {
          display: flex; align-items: center; justify-content: space-between;
          background: #faf8f4; border: 1.5px solid #e4ddd0;
          border-radius: 12px; padding: 14px 16px;
          cursor: pointer; transition: all 0.2s;
        }
        .rc-anon-row:hover { border-color: #0f1f3d; }
        .rc-anon-left { display: flex; align-items: center; gap: 12px; }
        .rc-anon-icon { font-size: 22px; }
        .rc-anon-title { font-size: 14px; font-weight: 600; color: #0f1f3d; }
        .rc-anon-sub { font-size: 12px; color: #9aa3b5; margin-top: 1px; }
        .rc-toggle {
          width: 42px; height: 24px; border-radius: 12px;
          position: relative; flex-shrink: 0;
          transition: background 0.2s;
          border: none; cursor: pointer;
        }
        .rc-toggle.on { background: #0f1f3d; }
        .rc-toggle.off { background: #ddd7ce; }
        .rc-toggle-knob {
          position: absolute; top: 3px;
          width: 18px; height: 18px; border-radius: 50%;
          background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          transition: left 0.2s;
        }
        .rc-toggle.on .rc-toggle-knob { left: 21px; }
        .rc-toggle.off .rc-toggle-knob { left: 3px; }

        /* ALERTS */
        .rc-alert {
          border-radius: 12px; padding: 13px 16px;
          font-size: 13px; display: flex; align-items: flex-start; gap: 10px;
          animation: fadeUp 0.3s ease both;
        }
        .rc-alert.success { background: #eaf5f0; border: 1px solid #a8dbc8; color: #1f6b4e; }
        .rc-alert.error { background: #fef2ef; border: 1px solid #f5c0b0; color: #a8341a; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        /* NAV BUTTONS */
        .rc-nav-row {
          display: flex; gap: 10px;
          margin-top: 4px;
        }
        .rc-btn-back {
          flex: 1;
          background: #f0ece3; border: 1.5px solid #e4ddd0;
          color: #5a6a8a; border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 600;
          padding: 13px; cursor: pointer;
          transition: all 0.2s;
        }
        .rc-btn-back:hover { background: #e4ddd0; color: #0f1f3d; }
        .rc-btn-next {
          flex: 2;
          background: #0f1f3d; color: #fff;
          border: none; border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 600;
          padding: 13px; cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(15,31,61,0.2);
        }
        .rc-btn-next:hover:not(:disabled) { background: #1a3260; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(15,31,61,0.25); }
        .rc-btn-next:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .rc-btn-submit {
          flex: 2;
          background: linear-gradient(135deg, #0f1f3d, #1a3260);
          color: #fff; border: none; border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 600;
          padding: 14px; cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(15,31,61,0.25);
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .rc-btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(15,31,61,0.3); }
        .rc-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .rc-spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .rc-grid-2, .rc-grid-2-sm { grid-template-columns: 1fr; }
          .rc-page-header { padding: 22px 20px; }
          .rc-card { padding: 20px 18px; }
        }
      `}</style>

      <div className="rc-root">
        <div className="rc-wrap">

          {/* PAGE HEADER */}
          <div className="rc-page-header">
            <div className="rc-header-left">
              <div className="rc-header-eyebrow">CivicPortal · Crime Unit</div>
              <div className="rc-header-title">Report a Crime</div>
              <div className="rc-header-sub">Help us keep your community safe.<br/>All reports are handled with strict confidentiality.</div>
              <div className="rc-emergency">
                🚨 <span><strong>Emergency?</strong> Call 112 immediately — this form is for non-emergency reports only.</span>
              </div>
            </div>
            <div className="rc-header-icon">🏛</div>
          </div>

          {/* STEP INDICATOR */}
          <div className="rc-steps">
            {[
              { n: 1, label: "Step 1", name: "Incident Details" },
              { n: 2, label: "Step 2", name: "Location & Evidence" },
              { n: 3, label: "Step 3", name: "Review & Submit" },
            ].map((s) => (
              <div className="rc-step" key={s.n}>
                <div className={`rc-step-num ${step > s.n ? "done" : step === s.n ? "active" : "pending"}`}>
                  {step > s.n ? "✓" : s.n}
                </div>
                <div className="rc-step-info">
                  <div className={`rc-step-label ${step === s.n ? "active" : ""}`}>{s.label}</div>
                  <div className="rc-step-name">{s.name}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ALERTS */}
          {msg && <div className="rc-alert success">✅ <span>{msg}</span></div>}
          {error && <div className="rc-alert error">⚠️ <span>{error}</span></div>}

          {/* STEP 1: INCIDENT DETAILS */}
          {step === 1 && (
            <div className="rc-card">
              <div className="rc-card-title"><span className="rc-card-title-icon">📋</span> Incident Details</div>
              <div className="rc-form-group">
                <div className="rc-field">
                  <label className="rc-label">Title <span>*</span></label>
                  <input className="rc-input" name="title" value={form.title} onChange={onChange} placeholder="Brief title of the incident" required />
                </div>
                <div className="rc-field">
                  <label className="rc-label">Crime Type <span>*</span></label>
                  <select className="rc-select" name="crimeType" value={form.crimeType} onChange={onChange} required>
                    <option value="">Select a crime type…</option>
                    {crimeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="rc-field">
                  <label className="rc-label">Description <span>*</span></label>
                  <textarea className="rc-textarea" name="description" value={form.description} onChange={onChange} placeholder="Describe what happened in as much detail as possible…" required />
                </div>
              </div>
              <div className="rc-nav-row">
                <button
                  className="rc-btn-next"
                  onClick={() => setStep(2)}
                  disabled={!form.title || !form.crimeType || !form.description}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION & EVIDENCE */}
          {step === 2 && (
            <div className="rc-card">
              <div className="rc-card-title"><span className="rc-card-title-icon">📍</span> Location & Evidence</div>
              <div className="rc-form-group">
                <div className="rc-field">
                  <label className="rc-label">Address <span>*</span></label>
                  <input className="rc-input" name="address" value={form.address} onChange={onChange} placeholder="Street address, landmark, or area" required />
                </div>
                <div className="rc-grid-2-sm">
                  <div className="rc-field">
                    <label className="rc-label">Latitude</label>
                    <div className="rc-coord-wrap">
                      <span className="rc-coord-icon">🌐</span>
                      <input className="rc-input rc-coord-input" name="lat" value={form.lat} onChange={onChange} placeholder="e.g. 28.6139" />
                    </div>
                  </div>
                  <div className="rc-field">
                    <label className="rc-label">Longitude</label>
                    <div className="rc-coord-wrap">
                      <span className="rc-coord-icon">🌐</span>
                      <input className="rc-input rc-coord-input" name="lng" value={form.lng} onChange={onChange} placeholder="e.g. 77.2090" />
                    </div>
                  </div>
                </div>
                <div className="rc-field">
                  <label className="rc-label">Evidence Files <span style={{color:"#9aa3b5",fontSize:"11px",textTransform:"none",letterSpacing:0}}>— up to 5 files (jpg, png, pdf, mp4, mov)</span></label>
                  <div
                    className={`rc-dropzone ${dragOver ? "over" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                  >
                    <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.mp4,.mov,.mkv,.webm" onChange={onFilesChange} />
                    <div className="rc-dropzone-icon">📁</div>
                    <div className="rc-dropzone-title">Drag & drop files here</div>
                    <div className="rc-dropzone-sub">or click to browse · max 5 files (up to 50MB each)</div>
                  </div>
                  {files.length > 0 && (
                    <div className="rc-file-list">
                      {files.map((f, i) => (
                        <div className="rc-file-item" key={i}>
                          <span className="rc-file-icon">{fileIcon(f.name)}</span>
                          <span className="rc-file-name">{f.name}</span>
                          <span className="rc-file-size">{(f.size / 1024).toFixed(0)} KB</span>
                          <button className="rc-file-remove" onClick={() => removeFile(i)}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="rc-nav-row">
                <button className="rc-btn-back" onClick={() => setStep(1)}>← Back</button>
                <button className="rc-btn-next" onClick={() => setStep(3)} disabled={!form.address}>Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & SUBMIT */}
          {step === 3 && (
            <div className="rc-card">
              <div className="rc-card-title"><span className="rc-card-title-icon">✅</span> Review & Submit</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                {[
                  { label: "Title", val: form.title },
                  { label: "Crime Type", val: form.crimeType },
                  { label: "Description", val: form.description },
                  { label: "Address", val: form.address },
                  { label: "Coordinates", val: form.lat && form.lng ? `${form.lat}, ${form.lng}` : "Not provided" },
                  { label: "Evidence Files", val: files.length > 0 ? `${files.length} file(s) attached` : "None" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", gap: "12px", padding: "12px 14px", background: "#faf8f4", borderRadius: "10px", border: "1px solid #e4ddd0" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#9aa3b5", textTransform: "uppercase", letterSpacing: "0.05em", minWidth: "100px", paddingTop: "1px" }}>{row.label}</div>
                    <div style={{ fontSize: "13px", color: "#0f1f3d", flex: 1, lineHeight: 1.5 }}>{row.val}</div>
                  </div>
                ))}
              </div>

              <div className="rc-anon-row" onClick={() => setForm(p => ({ ...p, isAnonymous: !p.isAnonymous }))}>
                <div className="rc-anon-left">
                  <span className="rc-anon-icon">🕵️</span>
                  <div>
                    <div className="rc-anon-title">Report Anonymously</div>
                    <div className="rc-anon-sub">Your identity will be kept confidential</div>
                  </div>
                </div>
                <button className={`rc-toggle ${form.isAnonymous ? "on" : "off"}`} onClick={e => e.stopPropagation()}>
                  <div className="rc-toggle-knob" />
                </button>
              </div>

              <div className="rc-nav-row" style={{ marginTop: "20px" }}>
                <button className="rc-btn-back" onClick={() => setStep(2)}>← Back</button>
                <button
                  className="rc-btn-submit"
                  onClick={submit}
                  disabled={loading}
                >
                  {loading ? (
                    <><div className="rc-spinner" /> Submitting…</>
                  ) : (
                    <>Submit Report 🚨</>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default ReportCrime;

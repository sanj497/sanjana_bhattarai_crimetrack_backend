import { useState } from "react";
import axios from "axios";
import React from "react";
const API = "http://localhost:5000/api/feedback/auth";

export default function SendFeedback() {
  const [form, setForm] = useState({ message: "", rating: "" });
  const [status, setStatus] = useState("");
  const [caseId] = useState(() => "CASE-" + Math.random().toString(36).slice(2, 8).toUpperCase());

  const token = localStorage.getItem("token");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { setStatus("noauth"); return; }
    setStatus("sending");
    try {
      await axios.post(API, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus("success");
      setForm({ message: "", rating: "" });
    } catch (err) {
      setStatus(err.response?.status === 401 ? "noauth" : "error");
    }
  };

  const threatLabels = ["", "LOW", "MODERATE", "ELEVATED", "HIGH", "CRITICAL"];
  const threatColors = ["", "text-green-400", "text-lime-400", "text-yellow-400", "text-orange-400", "text-red-500"];

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden px-4 py-12">

      {/* scanlines */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.015) 2px,rgba(255,255,255,0.015) 4px)"
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto">

        {/* ── HEADER ── */}
        <div className="text-center mb-6">
          <span className="inline-block bg-red-600 text-white text-xs tracking-widest px-3 py-1 mb-4 font-mono">
            ⚠ CLASSIFIED
          </span>
          <h1 className="font-serif text-6xl font-black text-stone-100 uppercase leading-none tracking-tight">
            WITNESS<br />
            <span className="text-amber-600">REPORT</span>
          </h1>
          <p className="font-mono text-zinc-600 text-xs tracking-widest mt-3">{caseId} · OPEN</p>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-700 to-transparent mt-5" />
        </div>

        {/* ── POLICE TAPE ── */}
        <div className="bg-amber-600 text-zinc-950 font-mono text-xs tracking-widest py-1.5 text-center overflow-hidden whitespace-nowrap">
          ▓▓▓ DO NOT CROSS — EVIDENCE SUBMISSION FORM — DO NOT CROSS ▓▓▓
        </div>

        {/* ── NO TOKEN WARNING ── */}
        {!token && (
          <div className="mt-4 px-4 py-3 border border-red-700 border-l-4 border-l-red-500 bg-red-950/40 font-mono text-red-400 text-xs tracking-widest">
            🔒 NO CREDENTIALS DETECTED — LOGIN REQUIRED TO FILE A REPORT
          </div>
        )}

        {/* ── FORM ── */}
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">

          {/* Statement */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs tracking-widest text-amber-600">
              STATEMENT <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              rows={5}
              placeholder="Describe what you witnessed in full detail..."
              value={form.message}
              onChange={handleChange}
              required
              className="bg-zinc-900 border border-zinc-800 border-l-4 border-l-amber-700
                text-stone-200 placeholder-zinc-700 font-mono text-sm px-4 py-3
                outline-none resize-y focus:border-l-amber-500 focus:border-zinc-600
                transition-colors"
            />
          </div>

          {/* Threat Level */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs tracking-widest text-amber-600">
              THREAT LEVEL
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, rating: r })}
                  className={`text-2xl transition-all duration-150 cursor-pointer border-none bg-transparent
                    ${Number(form.rating) >= r
                      ? "text-amber-500 scale-110"
                      : "text-zinc-800 hover:text-zinc-600"
                    }`}
                >
                  ◆
                </button>
              ))}
              <span className={`font-mono text-xs tracking-widest ml-2 ${threatColors[form.rating] || "text-zinc-600"}`}>
                {threatLabels[form.rating] || "UNRATED"}
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!token || status === "sending"}
            className={`mt-2 py-4 font-mono text-xs font-bold tracking-widest transition-all
              ${!token || status === "sending"
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-amber-600 text-zinc-950 hover:bg-amber-500 cursor-pointer active:scale-95"
              }`}
          >
            {status === "sending" ? "▶ TRANSMITTING..." : "▶ FILE REPORT"}
          </button>

          {/* ── STATUS TOASTS ── */}
          {status === "success" && (
            <div className="border border-amber-700 bg-amber-950/30 text-amber-500
              font-mono text-xs tracking-widest text-center px-4 py-3 animate-pulse">
              ✓ REPORT FILED — {caseId} UNDER REVIEW
            </div>
          )}
          {status === "noauth" && (
            <div className="border border-red-700 bg-red-950/30 text-red-400
              font-mono text-xs tracking-widest text-center px-4 py-3">
              🔒 UNAUTHORIZED — SESSION EXPIRED OR NOT LOGGED IN
            </div>
          )}
          {status === "error" && (
            <div className="border border-red-700 bg-red-950/30 text-red-400
              font-mono text-xs tracking-widest text-center px-4 py-3">
              ✗ TRANSMISSION FAILED — TRY AGAIN
            </div>
          )}
        </form>

        {/* ── FOOTER ── */}
        <div className="mt-12 pt-5 border-t border-zinc-900 font-mono text-xs
          text-zinc-800 text-center tracking-widest">
          CONFIDENTIAL · METROPOLITAN INVESTIGATION BUREAU · ALL REPORTS MONITORED
        </div>

      </div>
    </div>
  );
}
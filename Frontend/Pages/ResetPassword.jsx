import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import React from "react";
import { Mail, Lock, ArrowRight, Shield, Activity, ChevronLeft, Key } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError(false);

    if (newPassword !== confirmPassword) {
      setMessage("Integrity check failed: Passkeys do not match.");
      setError(true);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("https://sanjana-bhattarai-crimetrack-backend.onrender.com/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Passkey reset successfully. Redirecting...");
        setError(false);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setMessage(data.msg || "Passkey reset failed.");
        setError(true);
      }
    } catch (err) {
      console.error(err);
      setMessage("Server connection failed. Please try again.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F7F9FC] font-sans text-[#111827]">
      {/* Left pane - branding */}
      <div className="hidden md:flex flex-col flex-1 bg-[#0B1F3B] p-12 lg:p-24 relative overflow-hidden text-white justify-between">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#1E5EFF] via-[#0B1F3B] to-[#0B1F3B]" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-16">
            <Shield className="h-10 w-10 text-[#00B8D9]" />
            <span className="text-3xl font-bold tracking-tight text-white" style={{ fontFamily: "Poppins, sans-serif" }}>CrimeTrack</span>
          </div>

          <div className="max-w-md mt-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-white/10 text-[#00B8D9] font-medium text-xs mb-6 border border-white/5 backdrop-blur-sm">
              <Key className="h-4 w-4" /> Secure Reset Protocol
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
              Finalize your <br /><span className="text-[#00B8D9]">new credentials.</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed mb-8">
              Verify your signature and inject your new encrypted passkey to regain full dashboard access. 
            </p>
          </div>
        </div>

        <div className="relative z-10 text-sm text-gray-500">
          © {new Date().getFullYear()} Crime Track. All communications are E2E encrypted.
        </div>
      </div>

      {/* Right pane - reset form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-lg bg-white p-8 sm:p-12 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 my-12 md:my-0">
          <div className="md:hidden flex items-center space-x-2 mb-10 justify-center">
             <Shield className="h-8 w-8 text-[#1E5EFF]" />
             <span className="text-2xl font-bold text-[#0B1F3B]" style={{ fontFamily: "Poppins, sans-serif" }}>CrimeTrack</span>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold text-[#0B1F3B] mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>Reset Passkey</h2>
            <p className="text-[#6B7280]">
              Enter the 6-digit signature sent to <span className="font-semibold text-[#0B1F3B]">{email || "your email"}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!location.state?.email && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#0B1F3B]">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="admin@crimetrack.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-[#F7F9FC] border border-gray-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]/50 focus:bg-white transition text-[#111827]"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="w-full py-4 px-6 bg-[#F7F9FC] border border-gray-200 rounded-[12px] text-center text-4xl tracking-[0.5em] font-mono font-bold text-[#0B1F3B] focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]/50 focus:bg-white transition mb-2"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#0B1F3B]">New Passkey</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Lock className="h-5 w-5 text-gray-400" />
                   </div>
                   <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-[#F7F9FC] border border-gray-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]/50 focus:bg-white transition text-[#111827]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#0B1F3B]">Confirm Passkey</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Lock className="h-5 w-5 text-gray-400" />
                   </div>
                   <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3.5 bg-[#F7F9FC] border rounded-[12px] focus:outline-none focus:ring-2 transition text-[#111827] ${
                      confirmPassword && newPassword !== confirmPassword
                        ? "border-red-300 focus:ring-red-400/50"
                        : "border-gray-200 focus:ring-[#1E5EFF]/50 focus:bg-white"
                    }`}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex items-center justify-center gap-2 bg-[#1E5EFF] text-white py-4 rounded-[12px] font-bold hover:bg-blue-600 transition shadow-[0_4px_14px_0_rgba(30,94,255,0.39)] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Re-encrypting..." : "Finalize Reset"} <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-[12px] flex items-start gap-3 border ${error ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"}`}>
              {error ? <Activity className="h-5 w-5 flex-shrink-0 mt-0.5" /> : <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />}
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm font-semibold text-[#6B7280] hover:text-[#0B1F3B] transition inline-flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" /> Cancel and return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

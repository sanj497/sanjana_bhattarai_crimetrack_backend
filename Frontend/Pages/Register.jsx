import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import React from "react";
import { Mail, Lock, ArrowRight, Shield, Activity, ChevronLeft, User, MapPin } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("register"); // "register" | "otp"

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: ""
  });

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // STEP 1: Register → triggers OTP email
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setError(false);

    if (!form.username || !form.email || !form.password || !form.confirmPassword || !form.location) {
      setMessage("Please fill all required fields.");
      setError(true);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      setError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          location: form.location
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Security OTP sent to your email.");
        setError(false);
        setStep("otp");
      } else {
        setMessage(data.msg || "Registration rejected.");
        setError(true);
      }
    } catch (err) {
      setMessage("Server connection failed. Try again.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setError(false);

    if (!otp || otp.length !== 6) {
      setMessage("Please enter a valid 6-digit OTP.");
      setError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Identity verified. Redirecting...");
        setError(false);
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setMessage(data.msg || "OTP verification failed.");
        setError(true);
      }
    } catch (err) {
      setMessage("Server error. Try again.");
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
              <Activity className="h-4 w-4" /> Secure Onboarding
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
              Join the system. <br /><span className="text-[#00B8D9]">Protect society.</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed mb-8">
              Create an encrypted account to report criminal activity reliably and stay connected with real-time alerts in your immediate network.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-sm text-gray-500">
          © {new Date().getFullYear()} Crime Track. All communications are E2E encrypted.
        </div>
      </div>

      {/* Right pane - register form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <Link to="/" className="absolute top-6 left-6 md:top-10 md:right-10 md:left-auto flex items-center gap-2 text-sm font-semibold text-[#6B7280] hover:text-[#0B1F3B] transition z-10">
          <ChevronLeft className="h-4 w-4 md:hidden" /> Back to home
        </Link>
        
        <div className="w-full max-w-lg bg-white p-8 sm:p-12 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 my-12 md:my-0">
          <div className="md:hidden flex items-center space-x-2 mb-10 justify-center">
             <Shield className="h-8 w-8 text-[#1E5EFF]" />
             <span className="text-2xl font-bold text-[#0B1F3B]" style={{ fontFamily: "Poppins, sans-serif" }}>CrimeTrack</span>
          </div>

          {/* ── STEP 1: Register Form ── */}
          {step === "register" && (
            <>
              <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-bold text-[#0B1F3B] mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>Create Identity</h2>
                <p className="text-[#6B7280]">We will require email verification prior to activation.</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#0B1F3B]">Digital Alias / Username</label>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <User className="h-5 w-5 text-gray-400" />
                     </div>
                     <input
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={form.username}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3.5 bg-[#F7F9FC] border border-gray-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]/50 focus:bg-white transition text-[#111827]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#0B1F3B]">Encrypted Email Address</label>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Mail className="h-5 w-5 text-gray-400" />
                     </div>
                     <input
                      type="email"
                      name="email"
                      placeholder="user@crimetrack.com"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3.5 bg-[#F7F9FC] border border-gray-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]/50 focus:bg-white transition text-[#111827]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#0B1F3B]">Primary Hub Location</label>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <MapPin className="h-5 w-5 text-gray-400" />
                     </div>
                     <input
                      type="text"
                      name="location"
                      placeholder="e.g. Kathmandu, Nepal"
                      value={form.location}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3.5 bg-[#F7F9FC] border border-gray-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]/50 focus:bg-white transition text-[#111827]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#0B1F3B]">Passkey</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                         <Lock className="h-5 w-5 text-gray-400" />
                       </div>
                       <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
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
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className={`w-full pl-11 pr-4 py-3.5 bg-[#F7F9FC] border rounded-[12px] focus:outline-none focus:ring-2 transition text-[#111827] ${
                          form.confirmPassword && form.password !== form.confirmPassword
                            ? "border-red-300 focus:ring-red-400/50"
                            : "border-gray-200 focus:ring-[#1E5EFF]/50 focus:bg-white"
                        }`}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-xs text-red-500 font-semibold -mt-2 inline-flex items-center gap-1"><Activity className="h-3 w-3" /> Integrity check failed: Passkeys do not match.</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#1E5EFF] text-white py-4 rounded-[12px] font-bold hover:bg-blue-600 transition shadow-[0_4px_14px_0_rgba(30,94,255,0.39)] mt-6 disabled:opacity-70"
                >
                  {loading ? "Establishing handshake..." : "Initialize Identity"} <ArrowRight className="h-5 w-5" />
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                <p className="text-[#6B7280] text-sm">
                  System already active?{" "}
                  <Link to="/login" className="font-bold text-[#1E5EFF] hover:text-blue-700 transition">
                    Access Dashboard
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === "otp" && (
            <>
              <div className="mb-10 text-center md:text-left">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#1E5EFF]/10 text-[#1E5EFF] mb-6">
                  <Shield className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-bold text-[#0B1F3B] mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>Confirm Transmission</h2>
                <p className="text-[#6B7280]">
                  Enter the 6-digit cryptographic OTP distributed to{" "}
                  <span className="font-semibold text-[#0B1F3B]">{form.email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="w-full py-4 px-6 bg-[#F7F9FC] border border-gray-200 rounded-[12px] text-center text-4xl tracking-[0.5em] font-mono font-bold text-[#0B1F3B] focus:outline-none focus:ring-2 focus:ring-[#1E5EFF]/50 focus:bg-white transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex items-center justify-center gap-2 bg-[#1E5EFF] text-white py-4 rounded-[12px] font-bold hover:bg-blue-600 transition shadow-[0_4px_14px_0_rgba(30,94,255,0.39)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Validating signature..." : "Authorize"} <Lock className="h-5 w-5" />
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep("register");
                    setOtp("");
                    setMessage("");
                  }}
                  className="text-sm font-semibold text-[#6B7280] hover:text-[#0B1F3B] transition inline-flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Incorrect destination?
                </button>
              </div>
            </>
          )}

          {/* ── Message Banner ── */}
          {message && (
            <div className={`mt-6 p-4 rounded-[12px] flex items-start gap-3 border ${error ? "bg-red-50 border-red-100 text-red-600" : "bg-blue-50 border-blue-100 text-[#1E5EFF]"}`}>
              {error ? <Activity className="h-5 w-5 flex-shrink-0 mt-0.5" /> : <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />}
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;
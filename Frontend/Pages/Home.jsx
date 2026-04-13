import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  AlertCircle, Shield, Phone, MapPin, FileText, 
  Users, ChevronRight, Menu, X, LogOut, Lock, Clock, Bell, Activity, LayoutDashboard 
} from "lucide-react";

export default function CrimeReportingHome() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    setIsLoggedIn(!!token);
    try {
      setUser(storedUser ? JSON.parse(storedUser) : null);
    } catch {
      setUser(null);
    }
  };

  const getDashboardLink = () => {
    if (!user) return "/dashboard";
    if (user.role === "admin") return "/dashboard";
    if (user.role === "police") return "/bar";
    if (user.role === "user") return "/citizen";
    return "/dashboard";
  };

  useEffect(() => {
    checkAuth();
    window.addEventListener("authChange", checkAuth);
    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener("authChange", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-sans text-[#111827]">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-[#1E5EFF]" />
              <span className="text-2xl font-bold text-[#0B1F3B] tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>CrimeTrack</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-[#6B7280] hover:text-[#1E5EFF] font-medium transition">Home</a>
              <a href="#features" className="text-[#6B7280] hover:text-[#1E5EFF] font-medium transition">Features</a>
              <a href="#how-it-works" className="text-[#6B7280] hover:text-[#1E5EFF] font-medium transition">How It Works</a>

              {isLoggedIn ? (
                <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
                  {user?.name && (
                    <span className="text-[#111827] text-sm font-medium mr-2">
                      {user.name}
                    </span>
                  )}
                  <Link
                    to={getDashboardLink()}
                    className="flex items-center gap-2 bg-[#1E5EFF] text-white px-5 py-2.5 rounded-[12px] font-semibold hover:bg-blue-600 transition shadow-[0_4px_14px_0_rgba(30,94,255,0.39)]"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/logout"
                    className="flex items-center gap-2 bg-[#F7F9FC] text-[#6B7280] hover:text-[#E63946] hover:bg-red-50 px-4 py-2.5 rounded-[12px] font-medium transition"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
                  <Link
                    to="/login"
                    className="text-[#0B1F3B] font-semibold hover:text-[#1E5EFF] transition px-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[#1E5EFF] text-white px-6 py-2.5 rounded-[12px] font-semibold hover:bg-blue-600 transition shadow-[0_4px_14px_0_rgba(30,94,255,0.39)]"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-[#0B1F3B]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 absolute w-full shadow-lg">
            <div className="flex flex-col space-y-4">
              <a href="#home" className="text-[#111827] font-medium">Home</a>
              <a href="#features" className="text-[#111827] font-medium">Features</a>
              <a href="#how-it-works" className="text-[#111827] font-medium">How It Works</a>
              <hr className="border-gray-100" />
              {isLoggedIn ? (
                <div className="flex flex-col space-y-3">
                  {user?.name && (
                    <span className="text-sm font-semibold text-[#6B7280]">Logged in as {user.name}</span>
                  )}
                  <Link to={getDashboardLink()} className="bg-[#1E5EFF] text-white flex items-center justify-center p-3 rounded-[12px] font-semibold transition">
                    <LayoutDashboard className="h-5 w-5 mr-2" /> Go to Dashboard
                  </Link>
                  <Link to="/logout" className="bg-[#F7F9FC] text-[#E63946] flex items-center justify-center p-3 rounded-[12px] font-semibold transition hover:bg-red-50">
                    <LogOut className="h-5 w-5 mr-2" /> Logout
                  </Link>
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-[#0B1F3B] font-medium">Sign In</Link>
                  <Link to="/register" className="bg-[#1E5EFF] text-white text-center py-3 rounded-[12px] font-semibold">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* 1. Hero Section */}
      <section id="home" className="relative bg-[#0B1F3B] overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F3B] via-[#0B1F3B]/90 to-transparent z-10" />
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#1E5EFF]/50 via-[#0B1F3B] to-[#0B1F3B]" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-48 md:pt-40 md:pb-64 text-center md:text-left flex flex-col items-center md:items-start">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E5EFF]/10 text-[#00B8D9] font-semibold text-sm mb-8 border border-[#1E5EFF]/30 shadow-sm backdrop-blur-sm">
              <Activity className="h-4 w-4" /> Real-time tracking system
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-8 leading-[1.1]" style={{ fontFamily: "Poppins, sans-serif", letterSpacing: "-0.02em" }}>
              Secure. Report. <br/> <span className="text-[#00B8D9]">Stay Safe.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl leading-relaxed mx-auto md:mx-0">
              Our high-end security and emergency response platform connects you directly with local law enforcement. Quick, anonymous, and encrypted.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
              <Link to="/report" className="flex items-center justify-center gap-3 bg-[#E63946] hover:bg-red-700 text-white px-8 py-4 rounded-[12px] font-bold transition-all hover:shadow-[0_8px_25px_0_rgba(230,57,70,0.5)] text-lg hover:-translate-y-1">
                <AlertCircle className="h-6 w-6" /> Report Crime
              </Link>
              <Link to="/register" className="flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-[#0B1F3B] px-8 py-4 rounded-[12px] font-bold transition-all shadow-md text-lg hover:-translate-y-1">
                Get Started <ChevronRight className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-16 md:-mt-24 z-20 mb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-[16px] shadow-[0_12px_40px_rgb(0,0,0,0.06)] border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
            <div className="h-14 w-14 bg-[#1E5EFF]/10 rounded-[12px] flex items-center justify-center mb-8">
              <FileText className="h-7 w-7 text-[#1E5EFF]" />
            </div>
            <h3 className="text-xl font-bold text-[#0B1F3B] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>Report Crime</h3>
            <p className="text-[#6B7280] leading-relaxed">
              Submit digital evidence and descriptions anonymously, directly to the central dashboard.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[16px] shadow-[0_12px_40px_rgb(0,0,0,0.06)] border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
            <div className="h-14 w-14 bg-[#E63946]/10 rounded-[12px] flex items-center justify-center mb-8">
              <Bell className="h-7 w-7 text-[#E63946]" />
            </div>
            <h3 className="text-xl font-bold text-[#0B1F3B] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>SOS Alert</h3>
            <p className="text-[#6B7280] leading-relaxed">
              Trigger a one-tap emergency signal alerting nearby police stations instantly.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[16px] shadow-[0_12px_40px_rgb(0,0,0,0.06)] border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
            <div className="h-14 w-14 bg-[#00B8D9]/10 rounded-[12px] flex items-center justify-center mb-8">
              <MapPin className="h-7 w-7 text-[#00B8D9]" />
            </div>
            <h3 className="text-xl font-bold text-[#0B1F3B] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>Interactive Map</h3>
            <p className="text-[#6B7280] leading-relaxed">
              View real-time hotspots and verified incident reports in your immediate vicinity.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[16px] shadow-[0_12px_40px_rgb(0,0,0,0.06)] border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
            <div className="h-14 w-14 bg-[#0B1F3B]/10 rounded-[12px] flex items-center justify-center mb-8">
              <Users className="h-7 w-7 text-[#0B1F3B]" />
            </div>
            <h3 className="text-xl font-bold text-[#0B1F3B] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>Feedback System</h3>
            <p className="text-[#6B7280] leading-relaxed">
              Help authorities improve safety procedures by rating responses and submitting feedback.
            </p>
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B1F3B] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              How It Works
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto text-lg">
              A streamlined, 3-step timeline built for rapid response and citizen protection.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-[48px] left-[15%] right-[15%] h-0.5 bg-[#F7F9FC] border-t-2 border-dashed border-gray-200 z-0" />
            
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#1E5EFF] text-white flex items-center justify-center shadow-[0_8px_20px_rgb(30,94,255,0.3)] mb-6">
                <FileText className="h-8 w-8" />
              </div>
              <div className="bg-[#F7F9FC] rounded-full inline-block px-4 py-1 text-sm font-bold text-[#1E5EFF] mb-4">Step 1</div>
              <h3 className="text-xl font-bold text-[#0B1F3B] mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>Report Crime</h3>
              <p className="text-[#6B7280]">Provide details, media, and location easily through our platform.</p>
            </div>

            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#0B1F3B] text-white flex items-center justify-center shadow-[0_8px_20px_rgb(11,31,59,0.3)] mb-6">
                <Shield className="h-8 w-8" />
              </div>
              <div className="bg-[#F7F9FC] rounded-full inline-block px-4 py-1 text-sm font-bold text-[#0B1F3B] mb-4">Step 2</div>
              <h3 className="text-xl font-bold text-[#0B1F3B] mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>Police Receive Alert</h3>
              <p className="text-[#6B7280]">Our admin dashboard rapidly verifies and dispatches units.</p>
            </div>

            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#00B8D9] text-white flex items-center justify-center shadow-[0_8px_20px_rgb(0,184,217,0.3)] mb-6">
                <Clock className="h-8 w-8" />
              </div>
              <div className="bg-[#F7F9FC] rounded-full inline-block px-4 py-1 text-sm font-bold text-[#00B8D9] mb-4">Step 3</div>
              <h3 className="text-xl font-bold text-[#0B1F3B] mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>Track Status</h3>
              <p className="text-[#6B7280]">Get live notifications as the situation is reviewed and resolved.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Trust Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0B1F3B] rounded-[24px] overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-2">
            <div className="p-12 md:p-16 flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
                Built for <span className="text-[#00B8D9]">Trust</span> and <span className="text-[#1E5EFF]">Transparency</span>
              </h2>
              <p className="text-gray-300 mb-8 leading-relaxed">
                We believe security starts with the individual. The Crime Track infrastructure is built on military-grade encryption to ensure your data stays confidential.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-2 rounded-lg"><Lock className="h-6 w-6 text-[#00B8D9]" /></div>
                  <div>
                    <h4 className="text-lg font-bold text-white">End-to-End Encrypted</h4>
                    <p className="text-sm text-gray-400">All submissions are tokenized.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-2 rounded-lg"><Activity className="h-6 w-6 text-[#1E5EFF]" /></div>
                  <div>
                    <h4 className="text-lg font-bold text-white">24/7 Availability</h4>
                    <p className="text-sm text-gray-400">System redundancy guarantees 99.9% uptime.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#112445] p-12 md:p-16 flex items-center justify-center relative">
              <div className="w-full max-w-sm rounded-[16px] bg-[#0B1F3B] border border-white/10 p-6 shadow-2xl relative z-10">
                <div className="text-center pb-6 border-b border-white/10">
                  <p className="text-5xl font-bold text-[#00B8D9] mb-2">10k+</p>
                  <p className="text-sm font-semibold tracking-wider text-gray-400 uppercase">Reports Handled</p>
                </div>
                <div className="text-center pt-6">
                  <p className="text-5xl font-bold text-[#1E5EFF] mb-2">2 min</p>
                  <p className="text-sm font-semibold tracking-wider text-gray-400 uppercase">Avg Response Time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Call-To-Action Section */}
      <section className="py-32 bg-[#F7F9FC]">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0B1F3B] mb-8 leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
            Join and help make your community safer
          </h2>
          <p className="text-xl text-[#6B7280] mb-12 max-w-2xl mx-auto leading-relaxed">
            It takes all of us to maintain peace. Register today to access maps, resources, and live updates directly from local authorities. 
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/register" className="bg-[#1E5EFF] text-white px-10 py-4 rounded-[12px] font-bold hover:bg-blue-600 transition-all shadow-[0_8px_20px_0_rgba(30,94,255,0.3)] text-lg hover:-translate-y-1">
              Get Started Now
            </Link>
            <Link to="/contact" className="bg-white border-2 border-gray-200 text-[#0B1F3B] px-10 py-4 rounded-[12px] font-bold hover:border-[#1E5EFF] hover:text-[#1E5EFF] transition-all shadow-sm text-lg hover:-translate-y-1">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="bg-[#0B1F3B] pt-16 pb-8 border-t border-[#112445]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="h-8 w-8 text-[#00B8D9]" />
                <span className="font-bold text-2xl text-white tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>CrimeTrack</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Bridging the gap between citizens and authorities through real-time communication.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>Platform</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-[#00B8D9] transition text-sm">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00B8D9] transition text-sm">How It Works</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00B8D9] transition text-sm">Contact Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-[#00B8D9] transition text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00B8D9] transition text-sm">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00B8D9] transition text-sm">Security Standards</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#E63946] mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>Emergency Numbers</h4>
              <div className="bg-[#112445] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="h-5 w-5 text-[#E63946]" />
                  <span className="text-white font-bold text-lg">911</span>
                </div>
                <p className="text-xs text-gray-400">For immediate life-threatening emergencies only.</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-[#112445] pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 mb-4 md:mb-0">
              © {new Date().getFullYear()} Crime Track System. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-white transition">Twitter</a>
              <a href="#" className="text-gray-500 hover:text-white transition">Facebook</a>
              <a href="#" className="text-gray-500 hover:text-white transition">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
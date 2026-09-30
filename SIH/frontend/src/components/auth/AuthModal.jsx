import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { sendOtpApi, verifyOtpApi, loginUserApi, registerUserApi } from '../../services/api';
import { 
  X, 
  Smartphone, 
  KeyRound, 
  UserPlus,
  User, 
  MapPin, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Sparkles,
  Lock,
  MessageSquareCode,
  Eye,
  EyeOff
} from 'lucide-react';

export const AuthModal = ({ isOpen, onClose }) => {
  const { loginUserSession, setSelectedDistrict, setSelectedBlock } = useApp();

  // Active Main Tab: 'login' | 'register' | 'otp'
  const [activeTab, setActiveTab] = useState('login');

  // Input States
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pincode, setPincode] = useState('754212');
  const [district, setDistrict] = useState('Kendrapara');
  const [block, setBlock] = useState('Rajkanika');
  const [role, setRole] = useState('FARMER');

  // OTP Flow States
  const [otpStep, setOtpStep] = useState(1); // 1: Enter Phone, 2: Enter OTP
  const [otpCode, setOtpCode] = useState('');
  const [generatedDemoOtp, setGeneratedDemoOtp] = useState('');

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Clear messages when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
    setOtpStep(1);
    setOtpCode('');
  };

  // 1. Direct Password Login (No OTP required)
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const loginId = (phoneNumber || name || '').trim();
    const cleanPassword = password.trim();

    if (!loginId || !cleanPassword) {
      setErrorMsg('Please enter your Mobile Number (or Name) and Password');
      return;
    }

    setLoading(true);
    const res = await loginUserApi(loginId, cleanPassword);
    setLoading(false);

    if (res.status === 'success' && res.token) {
      setSuccessMsg('Logged in successfully!');
      loginUserSession(res.user, res.token);
      if (res.user?.district && res.user?.block) {
        setSelectedDistrict(res.user.district);
        setSelectedBlock(res.user.block);
      }
      setTimeout(() => {
        onClose();
      }, 800);
    } else {
      setErrorMsg(res.message || 'Invalid Mobile Number/Name or Password.');
    }
  };

  // 2. Direct Account Creation / Sign Up (No OTP required)
  const handleDirectRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanName = name.trim();
    const cleanPhone = phoneNumber.trim();
    const cleanPassword = password.trim();
    const cleanPin = pincode.trim();

    if (!cleanName || !cleanPhone || !cleanPassword || !cleanPin) {
      setErrorMsg('Please fill in Name, Phone Number, Password, and Pincode.');
      return;
    }

    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrorMsg('Phone Number must be a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    const res = await registerUserApi({
      name: cleanName,
      phoneNumber: cleanPhone,
      password: cleanPassword,
      pincode: cleanPin,
      district,
      block,
      role
    });
    setLoading(false);

    if (res.status === 'success' && res.token) {
      setSuccessMsg('Account created & logged in successfully!');
      loginUserSession(res.user, res.token);
      if (res.user?.district && res.user?.block) {
        setSelectedDistrict(res.user.district);
        setSelectedBlock(res.user.block);
      }
      setTimeout(() => {
        onClose();
      }, 800);
    } else {
      setErrorMsg(res.message || 'Registration failed. Phone number might already be registered.');
    }
  };

  // 3. Send Mobile OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit Mobile Number');
      return;
    }

    setLoading(true);
    const res = await sendOtpApi(cleanPhone);
    setLoading(false);

    if (res.status === 'success') {
      setOtpStep(2);
      setSuccessMsg(`OTP generated for +91 ${cleanPhone}`);
      if (res.demo_otp) {
        setGeneratedDemoOtp(res.demo_otp);
      }
    } else {
      setErrorMsg(res.message || 'Failed to generate OTP.');
    }
  };

  // 4. Verify Mobile OTP & Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!otpCode) {
      setErrorMsg('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    const res = await verifyOtpApi({
      phoneNumber: phoneNumber.trim(),
      otp: otpCode.trim(),
      name: name.trim() || 'Farmer',
      pincode: pincode.trim() || '754212',
      district,
      block
    });
    setLoading(false);

    if (res.status === 'success' && res.token) {
      setSuccessMsg('OTP verified & Logged in successfully!');
      loginUserSession(res.user, res.token);
      if (res.user?.district && res.user?.block) {
        setSelectedDistrict(res.user.district);
        setSelectedBlock(res.user.block);
      }
      setTimeout(() => {
        onClose();
      }, 800);
    } else {
      setErrorMsg(res.message || 'Invalid or expired OTP code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100 font-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-md shadow-sky-500/20 text-white font-bold text-xl">
            🌧️
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              MoES Monsoon Intel
            </h2>
            <p className="text-xs text-slate-400">
              Sign in to access localized advisories & alerts
            </p>
          </div>
        </div>

        {/* 3 Main Action Tabs */}
        <div className="flex rounded-xl bg-slate-950/90 border border-slate-800 p-1 mb-5 text-xs font-bold">
          
          <button
            onClick={() => handleTabChange('login')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => handleTabChange('register')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Create Account</span>
          </button>

          <button
            onClick={() => handleTabChange('otp')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'otp'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>OTP Login</span>
          </button>

        </div>

        {/* Alert Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs font-medium">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs font-medium">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* --- TAB 1: DIRECT PASSWORD SIGN IN --- */}
        {activeTab === 'login' && (
          <form onSubmit={handlePasswordLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Mobile Phone Number or Name / ମୋବାଇଲ ନମ୍ବର କିମ୍ବା ନାମ:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phoneNumber || name}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setName(e.target.value);
                  }}
                  placeholder="e.g. 9876543210 or Ramesh"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Sign In Now</span>}
            </button>

            <p className="text-[11px] text-center text-slate-400 pt-1">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                className="text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </form>
        )}

        {/* --- TAB 2: DIRECT ACCOUNT CREATION / SIGN UP --- */}
        {activeTab === 'register' && (
          <form onSubmit={handleDirectRegister} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Full Name / ପୂରା ନାମ</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Chandra Behera"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="754212"
                  maxLength={6}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create Password (min 6 chars)"
                  className="w-full pl-3.5 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">User Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="FARMER">FARMER 🌾</option>
                  <option value="OFFICER">OFFICER 🛡️</option>
                  <option value="RESEARCHER">RESEARCHER 🔬</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Create Account Now</span>}
            </button>
          </form>
        )}

        {/* --- TAB 3: QUICK MOBILE OTP LOGIN --- */}
        {activeTab === 'otp' && (
          <div>
            {otpStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Enter Mobile Number for Quick OTP:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Generate OTP Code</span> <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                {/* On-screen OTP Badge for Instant Testing */}
                {generatedDemoOtp && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-600/80 text-xs shadow-xl space-y-1">
                    <div className="flex items-center justify-between text-amber-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" /> Generated OTP Code:
                      </span>
                      <span className="font-mono text-base tracking-widest text-white bg-slate-950 px-2 py-0.5 rounded border border-amber-500">
                        {generatedDemoOtp}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpCode(generatedDemoOtp)}
                      className="w-full py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-xs transition-colors cursor-pointer mt-1"
                    >
                      ⚡ Auto-Fill OTP Code ({generatedDemoOtp})
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Enter 6-Digit OTP / ଓଟିପି ଦିଅନ୍ତୁ:
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-sky-500 rounded-xl text-base font-mono font-bold tracking-widest text-center text-amber-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOtpStep(1)}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Verify & Login</span>}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthModal;

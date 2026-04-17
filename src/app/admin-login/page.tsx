'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaShieldAlt, FaEye, FaEyeSlash, FaLock, FaArrowLeft } from 'react-icons/fa';
import { MdAdminPanelSettings } from 'react-icons/md';

export default function AdminLoginPage() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [otp, setOtp]                   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep]                 = useState<'credentials' | 'otp'>('credentials');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [userId, setUserId]             = useState<string | null>(null);
  const router = useRouter();

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) { setStep('otp'); setUserId(data.userId); }
      else        { setError(data.error); }
    } catch { setError('Network error. Please try again.'); }
    finally  { setLoading(false); }
  };

  const handleOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
      });
      const data = await res.json();
      if (res.ok) { router.push('/admin'); }
      else        { setError(data.error); }
    } catch { setError('Network error. Please try again.'); }
    finally  { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
          <FaArrowLeft size={12} /> Back to home
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <MdAdminPanelSettings className="text-blue-400 text-4xl" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Admin Portal</h1>
          <p className="text-gray-400 text-sm">Restricted access · Administrators only</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-blue-500/20 shadow-2xl shadow-blue-900/20">

          {/* Security badge */}
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 mb-6">
            <FaShieldAlt className="text-blue-400" size={14} />
            <span className="text-blue-300 text-xs font-medium">Two-factor authentication required</span>
          </div>

          {step === 'credentials' ? (
            <form onSubmit={handleCredentials}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">Admin Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} required placeholder="Admin password"
                    className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
                  <span className="mt-0.5">⚠</span> {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authenticating...</>
                  : <><FaLock size={14} /> Send Admin OTP</>
                }
              </button>
            </form>

          ) : (
            <form onSubmit={handleOTP}>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaShieldAlt className="text-blue-400 text-xl" />
                </div>
                <h2 className="text-white font-semibold mb-1">OTP Verification</h2>
                <p className="text-gray-400 text-sm">Code sent to <span className="text-blue-300">{email}</span></p>
              </div>

              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">6-Digit OTP</label>
                <input
                  type="text" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-[0.6em] font-mono"
                  placeholder="000000" maxLength={6} required autoFocus
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
                  <span className="mt-0.5">⚠</span> {error}
                </div>
              )}

              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-xl font-semibold transition-all mb-3 flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                  : <><MdAdminPanelSettings size={18} /> Access Admin Panel</>
                }
              </button>
              <button type="button" onClick={() => { setStep('credentials'); setOtp(''); setError(''); }}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white py-2.5 rounded-xl text-sm transition-all">
                ← Back
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          This portal is for system administrators only. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}

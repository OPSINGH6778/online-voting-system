'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';

function ResetPasswordClient() {
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState('');
  const [strength, setStrength]       = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token  = searchParams.get('token') || '';

  useEffect(() => {
    if (!token) setError('Invalid or missing reset token. Please request a new one.');
  }, [token]);

  const checkStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[!@#$%^&*]/.test(pw)) score++;
    if (score <= 1) setStrength('Weak');
    else if (score === 2) setStrength('Fair');
    else if (score === 3) setStrength('Good');
    else setStrength('Strong');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) setDone(true);
      else setError(data.error || 'Reset failed');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  const strengthColor: Record<string, string> = { Weak: 'bg-red-500', Fair: 'bg-yellow-500', Good: 'bg-blue-500', Strong: 'bg-green-500' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-800 to-blue-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <FaLock className="text-green-400 text-5xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-300 text-sm">Enter your new password below</p>
        </div>
        <div className="backdrop-blur-md bg-white/10 rounded-xl p-8 border border-white/20">
          {done ? (
            <div className="text-center py-4">
              <FaCheckCircle className="text-green-400 text-5xl mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Password Reset!</h2>
              <p className="text-gray-300 text-sm mb-6">Your password has been updated successfully.</p>
              <button onClick={() => router.push('/login')}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} required
                    onChange={e => { setPassword(e.target.value); checkStrength(e.target.value); }}
                    placeholder="Min 8 chars, upper, number, symbol"
                    className="w-full px-4 py-3 pr-12 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400" />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white">
                    {showPw ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {['Weak','Fair','Good','Strong'].map((s, i) => (
                        <div key={s} className={`h-1.5 flex-1 rounded-full ${['Weak','Fair','Good','Strong'].indexOf(strength) >= i ? strengthColor[strength] || 'bg-gray-600' : 'bg-gray-600'}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${strength === 'Strong' ? 'text-green-400' : strength === 'Weak' ? 'text-red-400' : 'text-yellow-400'}`}>{strength}</p>
                  </div>
                )}
              </div>
              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-2">Confirm Password</label>
                <input type="password" value={confirm} required onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">{error}</div>}
              <button type="submit" disabled={loading || !token}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white py-3 rounded-lg font-semibold transition-colors">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-gray-500 text-xs mt-4">
          Copyright © 2026 Secure Voting System. All rights reserved to Om Prakash Singh.
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}

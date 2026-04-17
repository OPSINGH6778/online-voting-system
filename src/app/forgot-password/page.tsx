'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { FaShieldAlt, FaEnvelope, FaArrowLeft } from 'react-icons/fa';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) setSent(true);
      else setError(data.error || 'Failed to send reset email');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-800 to-blue-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Link href="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
          <FaArrowLeft size={12} /> Back to login
        </Link>
        <div className="text-center mb-8">
          <FaShieldAlt className="text-green-400 text-5xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password</h1>
          <p className="text-gray-300 text-sm">Enter your email to receive a password reset link</p>
        </div>
        <div className="backdrop-blur-md bg-white/10 rounded-xl p-8 border border-white/20">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaEnvelope className="text-green-400 text-3xl" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Check Your Email</h2>
              <p className="text-gray-300 text-sm mb-4">If an account exists for <strong>{email}</strong>, a reset link has been sent.</p>
              <p className="text-gray-400 text-xs">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
              <Link href="/login" className="mt-6 inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-2">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white py-3 rounded-lg font-semibold transition-colors">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-gray-500 text-xs mt-4">
          Made with ❤️ in India by OPSINGH6778 · Copyright © 2026 Secure Voting System. All rights reserved to Om Prakash Singh.
        </p>
      </div>
    </div>
  );
}

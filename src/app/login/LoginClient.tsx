'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaShieldAlt, FaEye, FaEyeSlash, FaSync, FaLock, FaCheckCircle } from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// CaptchaBox — fully self-contained, no parent callbacks that cause re-renders
// Flow:
//   GET /api/captcha  → { token, question }
//   POST /api/captcha { token, answer } → { valid: true, loginToken }
//   Parent reads loginToken via ref — no state dependency that triggers re-render
// ─────────────────────────────────────────────────────────────────────────────
function CaptchaBox({ loginTokenRef }: { loginTokenRef: React.MutableRefObject<string | null> }) {
  const [question,   setQuestion]   = useState('');
  const [captchaToken, setCaptchaToken] = useState('');   // signed token from GET
  const [answer,     setAnswer]     = useState('');
  const [verified,   setVerified]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const loadingRef = useRef(false);

  // Load a fresh challenge — only called once on mount and on explicit refresh
  const loadChallenge = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setAnswer('');
    setError('');
    setVerified(false);
    loginTokenRef.current = null;

    try {
      const res  = await fetch('/api/captcha', { cache: 'no-store' });
      const data = await res.json();
      if (data.token && data.question) {
        setCaptchaToken(data.token);
        setQuestion(data.question);
      } else {
        setError('Failed to load CAPTCHA');
      }
    } catch {
      setError('Network error loading CAPTCHA. Refresh the page.');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // Load once on mount — no dependency array that re-triggers
  useEffect(() => {
    loadChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async () => {
    const num = parseInt(answer.trim(), 10);
    if (!answer.trim() || isNaN(num)) {
      setError('Enter a number.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res  = await fetch('/api/captcha', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token: captchaToken, answer: num }),
        cache:   'no-store',
      });
      const data = await res.json();

      if (data.valid && data.loginToken) {
        // Store in ref — does NOT cause re-render of parent
        loginTokenRef.current = data.loginToken;
        setVerified(true);
        setError('');
      } else {
        setError(data.error || 'Wrong answer. New challenge loaded.');
        setTimeout(() => loadChallenge(), 1000);
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-5">
      <label className="block text-white text-sm font-medium mb-2">
        Security Verification <span className="text-red-400">*</span>
      </label>

      <div className={`rounded-xl border p-4 transition-all ${
        verified ? 'border-green-500/60 bg-green-500/10' : 'border-white/20 bg-white/5'
      }`}>

        {/* Verified state */}
        {verified && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-green-400 text-sm font-semibold">
              <FaCheckCircle /> CAPTCHA Verified ✓
            </span>
            <button
              type="button"
              onClick={loadChallenge}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Reset
            </button>
          </div>
        )}

        {/* Loading state */}
        {!verified && loading && !question && (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
            <span className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
            Loading challenge...
          </div>
        )}

        {/* Challenge */}
        {!verified && question && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3
                              font-mono text-white text-lg select-none text-center tracking-wider">
                🧮 &nbsp;{question}
              </div>
              <button
                type="button"
                onClick={loadChallenge}
                disabled={loading}
                title="New question"
                className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <FaSync size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleVerify(); } }}
                placeholder="Your answer"
                autoComplete="off"
                className="flex-1 px-3 py-2.5 bg-white/20 border border-white/30 rounded-lg
                           text-white placeholder-gray-400 text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={loading || !answer.trim()}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-500
                           disabled:bg-gray-600 disabled:cursor-not-allowed
                           text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  : 'Verify'
                }
              </button>
            </div>

            {error && <p className="mt-2 text-xs text-red-400">⚠ {error}</p>}

            <p className="mt-2 text-xs text-gray-500">
              Solve the math problem. Press Enter or click Verify.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Login Page
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginClient() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [otp,      setOtp]      = useState('');
  const [step,     setStep]     = useState<'credentials' | 'otp'>('credentials');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [info,     setInfo]     = useState('');
  const [userId,   setUserId]   = useState('');
  const [userRole, setUserRole] = useState('user');

  // Use a ref for the loginToken so CaptchaBox storing it doesn't re-render parent
  const loginTokenRef = useRef<string | null>(null);

  const router       = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('registered') === '1') setInfo('Account created! Please sign in.');
    if (searchParams.get('reset')      === '1') setInfo('Password reset! Please sign in.');
  }, [searchParams]);

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginTokenRef.current) {
      setError('Please complete the CAPTCHA verification first.');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:      email.trim(),
          password,
          loginToken: loginTokenRef.current,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setUserId(data.userId);
        setUserRole(data.role);
        setStep('otp');
      } else {
        setError(data.error || 'Login failed. Please try again.');
        if (data.captchaFailed || data.requiresCaptcha) {
          loginTokenRef.current = null;
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(userRole === 'admin' ? '/admin' : '/user');
      } else {
        setError(data.error || 'Incorrect OTP. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-800 to-blue-900
                    flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/20 border border-green-400/30 rounded-2xl
                          flex items-center justify-center mx-auto mb-4">
            <FaShieldAlt className="text-green-400 text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Secure Voting System</h1>
          <p className="text-gray-300 text-sm">Quantum-safe · ML-protected · End-to-end encrypted</p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20 shadow-2xl">

          {info && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-sm">
              {info}
            </div>
          )}

          {/* ── Credentials step ─────────────────────────────────────────── */}
          {step === 'credentials' && (
            <form onSubmit={submitCredentials} noValidate>
              <h2 className="text-xl font-semibold text-white mb-5 text-center">Voter Sign In</h2>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">Email</label>
                <input
                  type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl
                             text-white placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* Password */}
              <div className="mb-3">
                <label className="block text-white text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full px-4 py-3 pr-12 bg-white/20 border border-white/30 rounded-xl
                               text-white placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
                  >
                    {showPw ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end mb-5">
                <Link href="/forgot-password" className="text-blue-300 hover:text-blue-200 text-xs">
                  Forgot Password?
                </Link>
              </div>

              {/* CAPTCHA — passes loginTokenRef, no re-render on verify */}
              <CaptchaBox loginTokenRef={loginTokenRef} />

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600
                           disabled:bg-gray-600 disabled:cursor-not-allowed
                           text-white py-3 rounded-xl font-semibold mb-4
                           transition-colors flex items-center justify-center gap-2"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <FaLock size={14} />
                }
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              <div className="text-center space-y-2">
                <Link href="/signup" className="text-blue-300 hover:text-blue-200 text-sm block">
                  No account? Create one
                </Link>
                <Link href="/admin-login" className="text-gray-400 hover:text-gray-300 text-xs block">
                  Administrator? Click here
                </Link>
              </div>
            </form>
          )}

          {/* ── OTP step ─────────────────────────────────────────────────── */}
          {step === 'otp' && (
            <form onSubmit={submitOTP}>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-green-500/20 border border-green-400/30 rounded-full
                                flex items-center justify-center mx-auto mb-3">
                  <FaShieldAlt className="text-green-400 text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-1">Enter OTP</h2>
                <p className="text-gray-300 text-sm">
                  6-digit code sent to <strong className="text-white">{email}</strong>
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Check inbox &amp; spam folder. Expires in 10 minutes.
                </p>
              </div>

              <input
                type="text" inputMode="numeric" maxLength={6} required autoFocus
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-5 mb-4 bg-white/20 border border-white/30 rounded-xl
                           text-white text-center text-3xl font-mono tracking-[0.6em]
                           focus:outline-none focus:ring-2 focus:ring-green-400"
              />

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-green-500 hover:bg-green-600
                           disabled:bg-gray-500 disabled:cursor-not-allowed
                           text-white py-3 rounded-xl font-semibold mb-3 transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setOtp('');
                  setError('');
                  loginTokenRef.current = null;
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl text-sm transition-colors"
              >
                ← Back
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 text-center text-xs space-y-1">
          <div className="flex items-center justify-center gap-3 flex-wrap text-gray-500">
            <span>🛡️ AES-256-GCM</span>
            <span>🔗 Hash Chain</span>
            <span>🤖 ML Fraud Detection</span>
            <span>⚛️ Quantum-Safe</span>
          </div>
          <p className="text-yellow-300 font-medium mt-2">
            Demo Mode — OTP printed to server console
          </p>
          <p className="text-gray-500 mt-1">
            Made with ❤️ in India by OPSINGH6778 · Copyright © 2026 Secure Voting System.
            <br />All rights reserved to Om Prakash Singh.
          </p>
        </div>
      </div>
    </div>
  );
}

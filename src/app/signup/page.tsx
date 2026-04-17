'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUserPlus, FaEye, FaEyeSlash, FaIdCard, FaShieldAlt, FaBirthdayCake, FaFileContract } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';

// ── Privacy Policy Modal ───────────────────────────────────────────────────────
function PrivacyModal({ onAccept, onClose }: { onAccept: () => void; onClose: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-white/20 max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center gap-3">
          <FaFileContract className="text-cyan-400 text-xl" />
          <h2 className="text-lg font-bold text-white">Data Privacy Policy</h2>
          <span className="ml-auto text-xs text-gray-500">v1.0 · 2026</span>
        </div>
        <div
          className="flex-1 overflow-y-auto px-6 py-4 text-sm text-gray-300 space-y-4 leading-relaxed"
          onScroll={e => { const el = e.target as HTMLElement; if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) setScrolled(true); }}
        >
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-cyan-200 text-xs">
            Please read this policy carefully before registering. Scroll to the bottom to accept.
          </div>

          <h3 className="text-white font-semibold text-base">1. Introduction</h3>
          <p>The Secure Voting System ("SVS") is operated by Om Prakash Singh (OPSINGH6778). This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you register and use our secure online voting platform.</p>

          <h3 className="text-white font-semibold text-base">2. Information We Collect</h3>
          <p>We collect the following categories of personal data:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Identity Data:</strong> Full name, date of birth, Aadhaar number (optional), government-issued Voter ID card number (optional)</li>
            <li><strong className="text-white">Contact Data:</strong> Email address, phone number</li>
            <li><strong className="text-white">Technical Data:</strong> IP address, device type, browser information, login timestamps</li>
            <li><strong className="text-white">Vote Data:</strong> Anonymous cryptographic vote hash, receipt ID, transaction ID, block height. Your actual vote choice is NOT linked to your identity.</li>
            <li><strong className="text-white">Security Data:</strong> OTP records, login attempts, fraud detection scores</li>
          </ul>

          <h3 className="text-white font-semibold text-base">3. How We Use Your Data</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>To verify your identity and eligibility to vote (18+ age verification)</li>
            <li>To authenticate you securely via OTP-based Two-Factor Authentication</li>
            <li>To detect and prevent fraudulent voting, bot attacks, and security breaches</li>
            <li>To maintain an immutable audit trail for election integrity</li>
            <li>To send you transactional emails (OTP, vote confirmation, account updates)</li>
          </ul>

          <h3 className="text-white font-semibold text-base">4. Vote Anonymity</h3>
          <p>Your vote choice is protected by quantum-safe cryptography. We use SHA-256 hash chains, zero-knowledge commitments, and anonymous receipt IDs. Your vote is permanently decoupled from your personal identity — no one, including administrators, can determine who you voted for.</p>

          <h3 className="text-white font-semibold text-base">5. Data Sharing</h3>
          <p>We do NOT sell your personal data. We do not share your data with third parties except:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>MongoDB Atlas (encrypted database storage)</li>
            <li>Email service providers (only for OTP delivery)</li>
            <li>Legal authorities if required by law</li>
          </ul>

          <h3 className="text-white font-semibold text-base">6. Data Security</h3>
          <p>Your data is protected by AES-256-GCM encryption, bcrypt password hashing (cost factor 12), PBKDF2 key derivation (210,000 iterations), rate limiting, and CAPTCHA protection. All data is transmitted over HTTPS.</p>

          <h3 className="text-white font-semibold text-base">7. Your Rights</h3>
          <p>You have the right to access, correct, or delete your personal data (except immutable vote records). To exercise these rights, contact the system administrator.</p>

          <h3 className="text-white font-semibold text-base">8. Age Restriction</h3>
          <p>This platform is strictly for users aged 18 and above. By registering, you confirm you are at least 18 years of age. Providing false age information is a violation of these terms.</p>

          <h3 className="text-white font-semibold text-base">9. Cookies</h3>
          <p>We use only essential session cookies (httpOnly, SameSite=Lax) for authentication. No tracking or advertising cookies are used.</p>

          <h3 className="text-white font-semibold text-base">10. Contact</h3>
          <p>For privacy concerns: <span className="text-cyan-300">opsingh26122002@gmail.com</span></p>
          <p className="text-gray-500 text-xs">Last updated: January 2026 · Made with ❤️ in India by OPSINGH6778</p>
          <div className="h-4" />
        </div>
        <div className="px-6 py-4 border-t border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl text-sm transition-colors">Decline</button>
          <button onClick={onAccept} disabled={!scrolled}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
            {scrolled ? '✓ I Accept the Privacy Policy' : 'Please read to the end...'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Terms Modal ────────────────────────────────────────────────────────────────
function TermsModal({ onAccept, onClose }: { onAccept: () => void; onClose: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-white/20 max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-gray-700 flex items-center gap-3">
          <FaFileContract className="text-green-400 text-xl" />
          <h2 className="text-lg font-bold text-white">Terms & Conditions of Use</h2>
        </div>
        <div
          className="flex-1 overflow-y-auto px-6 py-4 text-sm text-gray-300 space-y-4 leading-relaxed"
          onScroll={e => { const el = e.target as HTMLElement; if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) setScrolled(true); }}
        >
          <h3 className="text-white font-semibold text-base">1. Acceptance of Terms</h3>
          <p>By registering on the Secure Voting System, you agree to be bound by these Terms & Conditions. If you do not agree, do not register.</p>
          <h3 className="text-white font-semibold text-base">2. Eligibility</h3>
          <p>You must be at least 18 years of age. You must be a legitimate voter. You may only create one account. Creating multiple accounts is strictly prohibited and may result in legal action.</p>
          <h3 className="text-white font-semibold text-base">3. Prohibited Activities</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Attempting to vote more than once in any election</li>
            <li>Using automated bots or scripts to interact with the system</li>
            <li>Providing false identity information including age</li>
            <li>Attempting to compromise the security or integrity of the system</li>
            <li>Sharing your account credentials with others</li>
          </ul>
          <h3 className="text-white font-semibold text-base">4. Vote Finality</h3>
          <p>Once cast, a vote cannot be changed or withdrawn. This is by design to ensure election integrity. Think carefully before confirming your vote.</p>
          <h3 className="text-white font-semibold text-base">5. Account Security</h3>
          <p>You are responsible for maintaining the security of your account. Notify us immediately of any unauthorized access.</p>
          <h3 className="text-white font-semibold text-base">6. Limitation of Liability</h3>
          <p>The system administrators are not liable for technical failures beyond our control. We maintain best-in-class security practices.</p>
          <h3 className="text-white font-semibold text-base">7. Governing Law</h3>
          <p>These terms are governed by the laws of India. Any disputes shall be resolved in Indian courts.</p>
          <p className="text-gray-500 text-xs">Copyright © 2026 Secure Voting System. All rights reserved to Om Prakash Singh (OPSINGH6778).</p>
          <div className="h-4" />
        </div>
        <div className="px-6 py-4 border-t border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl text-sm transition-colors">Decline</button>
          <button onClick={onAccept} disabled={!scrolled}
            className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:text-gray-400 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
            {scrolled ? '✓ I Accept the Terms' : 'Please read to the end...'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Signup Page ───────────────────────────────────────────────────────────
export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', aadhaar_number: '', govt_voter_id: '', date_of_birth: '',
  });
  const [showPw, setShowPw]             = useState(false);
  const [showCPw, setShowCPw]           = useState(false);
  const [step, setStep]                 = useState<'register' | 'otp'>('register');
  const [otp, setOtp]                   = useState('');
  const [userId, setUserId]             = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [pwStrength, setPwStrength]     = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted]     = useState(false);
  const [showPrivacy, setShowPrivacy]   = useState(false);
  const [showTerms, setShowTerms]       = useState(false);
  const [ageError, setAgeError]         = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    if (e.target.name === 'date_of_birth') setAgeError('');
  };

  const checkAge = (dob: string) => {
    if (!dob) return;
    const d = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    if (age < 18) setAgeError(`You must be 18+ to register. You are ${age} years old.`);
    else setAgeError('');
  };

  const checkStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[!@#$%^&*()_+\-]/.test(pw)) s++;
    setPwStrength(s <= 1 ? 'Weak' : s === 2 ? 'Fair' : s === 3 ? 'Good' : 'Strong');
  };

  const strengthBg: Record<string, string> = { Weak:'bg-red-500', Fair:'bg-yellow-500', Good:'bg-blue-500', Strong:'bg-green-500' };
  const strengthText: Record<string, string> = { Weak:'text-red-400', Fair:'text-yellow-400', Good:'text-blue-400', Strong:'text-green-400' };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!formData.date_of_birth) return setError('Date of birth is required');
    if (ageError) return setError(ageError);
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    if (!privacyAccepted) return setError('Please read and accept the Privacy Policy');
    if (!termsAccepted) return setError('Please read and accept the Terms & Conditions');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name, email: formData.email, password: formData.password,
          phone: formData.phone, aadhaar_number: formData.aadhaar_number,
          govt_voter_id: formData.govt_voter_id, date_of_birth: formData.date_of_birth,
          privacy_accepted: privacyAccepted, terms_accepted: termsAccepted,
        }),
      });
      const data = await res.json();
      if (res.ok) { setStep('otp'); setUserId(data.userId); }
      else { setError(data.error || 'Registration failed'); }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleOTP = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/verify-signup-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
      });
      const data = await res.json();
      if (res.ok) router.push('/login?registered=1');
      else setError(data.error || 'OTP verification failed');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-800 to-blue-900 flex items-center justify-center px-4 py-8">
      {showPrivacy && <PrivacyModal onAccept={() => { setPrivacyAccepted(true); setShowPrivacy(false); }} onClose={() => setShowPrivacy(false)} />}
      {showTerms   && <TermsModal  onAccept={() => { setTermsAccepted(true);  setShowTerms(false);   }} onClose={() => setShowTerms(false)} />}

      <div className="max-w-lg w-full">
        <div className="text-center mb-6">
          <FaUserPlus className="text-green-400 text-4xl mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-white mb-1">Create Voter Account</h1>
          <p className="text-gray-300 text-sm">Secure Voting System — India 🇮🇳</p>
        </div>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20 shadow-2xl">
          {step === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-4">

              {/* Personal Info */}
              <div>
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2"><FaUserPlus size={11}/> Personal Information</h3>
                <div className="space-y-3">
                  {[
                    { label:'Full Name *', name:'name', type:'text', placeholder:'As on government ID' },
                    { label:'Email Address *', name:'email', type:'email', placeholder:'your@email.com' },
                    { label:'Phone Number', name:'phone', type:'tel', placeholder:'+91 XXXXX XXXXX' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-white text-xs mb-1.5">{f.label}</label>
                      <input type={f.type} name={f.name} value={(formData as any)[f.name]} onChange={handleChange}
                        required={f.name !== 'phone'} placeholder={f.placeholder}
                        className="w-full px-4 py-2.5 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Age Verification */}
              <div>
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2"><FaBirthdayCake size={11}/> Age Verification <span className="text-red-400">*</span></h3>
                <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-xl p-3 mb-3">
                  <p className="text-yellow-200 text-xs flex items-center gap-1.5">
                    <span className="text-yellow-400 font-bold">⚠</span>
                    You must be <strong>18 years or older</strong> to register as a voter. This is verified using your date of birth.
                  </p>
                </div>
                <div>
                  <label className="block text-white text-xs mb-1.5">Date of Birth *</label>
                  <input type="date" name="date_of_birth" value={formData.date_of_birth}
                    onChange={e => { handleChange(e); checkAge(e.target.value); }} required
                    max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
                  {ageError && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">🚫 {ageError}</p>}
                  {formData.date_of_birth && !ageError && (
                    <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1"><MdVerified size={13}/> Age verified — you are eligible to vote</p>
                  )}
                </div>
              </div>

              {/* Government ID (Optional) */}
              <div>
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2"><FaIdCard size={11}/> Government ID <span className="text-gray-500 font-normal normal-case">(Optional)</span></h3>
                <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-3 mb-3">
                  <p className="text-blue-200 text-xs">🔒 Aadhaar/Voter ID helps with identity verification. Stored encrypted.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label:'Aadhaar Number (12 digits)', name:'aadhaar_number', placeholder:'XXXX XXXX XXXX' },
                    { label:'Voter ID Card (EPIC No.)', name:'govt_voter_id', placeholder:'e.g. ABC1234567' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-white text-xs mb-1.5">{f.label}</label>
                      <input type="text" name={f.name} value={(formData as any)[f.name]} onChange={handleChange}
                        placeholder={f.placeholder}
                        className="w-full px-4 py-2.5 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm font-mono" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div>
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2"><FaShieldAlt size={11}/> Security</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-white text-xs mb-1.5">Password *</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} name="password" value={formData.password} required
                        onChange={e => { handleChange(e); checkStrength(e.target.value); }}
                        placeholder="Min 8 chars · upper · number · symbol"
                        className="w-full px-4 py-2.5 pr-10 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
                      <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white">{showPw ? <FaEyeSlash size={14}/> : <FaEye size={14}/>}</button>
                    </div>
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">{['Weak','Fair','Good','Strong'].map((s,i) => <div key={s} className={`h-1 flex-1 rounded-full ${['Weak','Fair','Good','Strong'].indexOf(pwStrength) >= i ? strengthBg[pwStrength]||'bg-gray-600' : 'bg-gray-700'}`}/>)}</div>
                        <p className={`text-xs ${strengthText[pwStrength]||'text-gray-400'}`}>Strength: {pwStrength}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-white text-xs mb-1.5">Confirm Password *</label>
                    <div className="relative">
                      <input type={showCPw ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} required onChange={handleChange}
                        placeholder="Repeat password"
                        className="w-full px-4 py-2.5 pr-10 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
                      <button type="button" onClick={() => setShowCPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white">{showCPw ? <FaEyeSlash size={14}/> : <FaEye size={14}/>}</button>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Privacy & Terms Consent */}
              <div>
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2"><FaFileContract size={11}/> Consent Required <span className="text-red-400">*</span></h3>
                <div className="space-y-3">
                  <div className={`rounded-xl border p-3 cursor-pointer transition-all ${privacyAccepted ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-white/20 bg-white/5 hover:border-white/30'}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={privacyAccepted} onChange={() => {}} id="privacy"
                        onClick={() => !privacyAccepted ? setShowPrivacy(true) : setPrivacyAccepted(false)}
                        className="w-4 h-4 mt-0.5 accent-cyan-500 cursor-pointer flex-shrink-0" />
                      <label htmlFor="privacy" className="text-sm text-gray-300 cursor-pointer leading-relaxed">
                        I have read and accept the{' '}
                        <button type="button" onClick={() => setShowPrivacy(true)} className="text-cyan-300 hover:text-cyan-200 underline font-medium">
                          Data Privacy Policy
                        </button>
                        {' '}<span className="text-red-400">*</span>
                        {privacyAccepted && <span className="ml-2 text-cyan-400 text-xs">✓ Accepted</span>}
                      </label>
                    </div>
                  </div>
                  <div className={`rounded-xl border p-3 cursor-pointer transition-all ${termsAccepted ? 'border-green-500/50 bg-green-500/10' : 'border-white/20 bg-white/5 hover:border-white/30'}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={termsAccepted} onChange={() => {}} id="terms"
                        onClick={() => !termsAccepted ? setShowTerms(true) : setTermsAccepted(false)}
                        className="w-4 h-4 mt-0.5 accent-green-500 cursor-pointer flex-shrink-0" />
                      <label htmlFor="terms" className="text-sm text-gray-300 cursor-pointer leading-relaxed">
                        I have read and accept the{' '}
                        <button type="button" onClick={() => setShowTerms(true)} className="text-green-300 hover:text-green-200 underline font-medium">
                          Terms & Conditions
                        </button>
                        {' '}<span className="text-red-400">*</span>
                        {termsAccepted && <span className="ml-2 text-green-400 text-xs">✓ Accepted</span>}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {error && <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">{error}</div>}

              <button type="submit" disabled={loading || !!ageError || !privacyAccepted || !termsAccepted}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <FaUserPlus size={14}/>}
                {loading ? 'Creating Account...' : 'Create Voter Account'}
              </button>
              <div className="text-center">
                <Link href="/login" className="text-blue-300 hover:text-blue-200 text-sm">Already have an account? Sign in</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOTP}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 border border-green-400/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaShieldAlt className="text-green-400 text-2xl" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-1">Verify Your Email</h2>
                <p className="text-gray-300 text-sm">A 6-digit code was sent to <strong className="text-white">{formData.email}</strong></p>
                <p className="text-gray-500 text-xs mt-1">Check your inbox and spam folder. Code expires in 10 minutes.</p>
              </div>
              <div className="mb-5">
                <input type="text" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                  className="w-full px-4 py-5 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-400 text-center text-3xl tracking-[0.6em] font-mono"
                  placeholder="000000" maxLength={6} required autoFocus />
                {otp.length > 0 && otp.length < 6 && <p className="text-gray-400 text-xs mt-1 text-center">{6 - otp.length} digits remaining</p>}
              </div>
              {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">{error}</div>}
              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white py-3 rounded-xl font-semibold mb-3 transition-colors flex items-center justify-center gap-2">
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <MdVerified size={16}/>}
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
              <button type="button" onClick={() => { setStep('register'); setOtp(''); setError(''); }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl text-sm transition-colors">← Back</button>
            </form>
          )}
        </div>
        <p className="text-center text-gray-600 text-xs mt-4">
          Made with ❤️ in India by OPSINGH6778 · Copyright © 2026 Secure Voting System. All rights reserved to Om Prakash Singh.
        </p>
      </div>
    </div>
  );
}

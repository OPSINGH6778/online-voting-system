import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-800 to-blue-900 text-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl w-full">
        <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-8">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>

        <h1 className="text-5xl font-bold mb-4 tracking-tight">Secure Voting System</h1>
        <p className="text-lg text-gray-300 mb-8 leading-relaxed">
          Industry-grade voting platform with end-to-end encryption,<br className="hidden sm:block" />
          hash chain integrity, and verifiable audit trails.
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {['OTP 2FA', 'SHA-256 Hash Chain', 'Brute Force Protection', 'Anonymous Receipts', 'Audit Logs', 'MongoDB Atlas', 'Email Notifications'].map(f => (
            <span key={f} className="text-xs px-3 py-1 bg-white/10 border border-white/20 rounded-full text-gray-300">{f}</span>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-sm mx-auto">
          <Link href="/login"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white px-6 py-4 rounded-xl text-base font-semibold transition-all active:scale-95 shadow-lg shadow-green-900/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Login to Vote
          </Link>
          <Link href="/signup"
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-6 py-4 rounded-xl text-base font-semibold transition-all active:scale-95 shadow-lg shadow-blue-900/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Create Account
          </Link>
        </div>

        <div className="flex items-center gap-4 max-w-sm mx-auto mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-gray-500 text-xs uppercase tracking-wider">Administration</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="max-w-sm mx-auto mb-10">
          <Link href="/admin-login"
            className="flex items-center justify-center gap-3 w-full bg-gray-900/70 hover:bg-gray-800/80 border border-blue-500/40 hover:border-blue-400/70 text-blue-300 hover:text-blue-200 px-6 py-4 rounded-xl text-base font-semibold transition-all active:scale-95 group">
            <span className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <span>Admin Panel Access</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>
            </svg>
          </Link>
          <p className="text-xs text-gray-600 text-center mt-2">Restricted to authorized administrators only</p>
        </div>

        <div className="flex items-center justify-center mb-6">
          <a href="https://github.com/OPSINGH6778/online-voting-system" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3-.405c1.02.005 2.045.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
            </svg>
            OPSINGH6778/online-voting-system
          </a>
        </div>

        <p className="text-gray-600 text-xs">
          Made with ❤️ in India, created by OPSINGH6778.<br/>
          Copyright © 2026 Secure Voting System. All rights reserved to Om Prakash Singh.
        </p>
      </div>
    </div>
  );
}

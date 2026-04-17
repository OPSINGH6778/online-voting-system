'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  FaShieldAlt, FaVoteYea, FaSignOutAlt,
  FaCheckCircle, FaHistory, FaClock,
  FaSearch, FaIdCard, FaUser,
} from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';

interface Candidate { _id: string; name: string; party: string; description: string; photo: string; manifesto: string; }
interface Election  { _id: string; title: string; description: string; status: string; candidates: Candidate[]; start_date?: string; end_date?: string; result_published?: boolean; }
interface MyVote    { electionId: string; candidateId: string; voteHash: string; receiptId: string; transactionId: string; votedAt: string; electionTitle: string; blockHeight?: number; }

export default function UserPanel() {
  const [user, setUser]             = useState<any>(null);
  const [elections, setElections]   = useState<Election[]>([]);
  const [votedMap, setVotedMap]     = useState<Record<string, string>>({});
  const [myVotes, setMyVotes]       = useState<MyVote[]>([]);
  const [modal, setModal]           = useState<{ election: Election; candidate: Candidate } | null>(null);
  const [voteResult, setVoteResult] = useState<{ hash: string; receiptId: string; electionTitle: string; candidateName: string; transactionId: string } | null>(null);
  const [loading, setLoading]       = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError]           = useState('');
  const [toast, setToast]           = useState('');
  const [tab, setTab]               = useState<'vote' | 'history' | 'verify'>('vote');
  const [verifyReceipt, setVerifyReceipt] = useState('');
  const [verifyResult, setVerifyResult]   = useState<any>(null);
  const [verifying, setVerifying]         = useState(false);
  const [manifestoModal, setManifestoModal] = useState<Candidate | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const fetchData = useCallback(async () => {
    try {
      const [meRes, electionsRes, votesRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/elections'),
        fetch('/api/votes/my'),
      ]);
      if (!meRes.ok) { window.location.href = '/login'; return; }
      const meData = await meRes.json();
      if (meData.user?.role === 'admin') { window.location.href = '/admin'; return; }
      setUser(meData.user);

      if (electionsRes.ok) {
        const d = await electionsRes.json();
        setElections(d.elections || []);
      }
      if (votesRes.ok) {
        const d = await votesRes.json();
        const votes: MyVote[] = d.votes || [];
        setMyVotes(votes);
        const vMap: Record<string, string> = {};
        votes.forEach(v => { vMap[v.electionId] = v.candidateId; });
        setVotedMap(vMap);
      }
    } catch { window.location.href = '/login'; }
    finally { setPageLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const openVoteModal = (election: Election, candidate: Candidate) => {
    if (votedMap[election._id]) { showToast('You have already voted in this election'); return; }
    setModal({ election, candidate }); setError('');
  };

  const handleConfirmVote = async () => {
    if (!modal) return;
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ electionId: modal.election._id, candidateId: modal.candidate._id }),
      });
      const data = await res.json();
      if (res.ok) {
        setVotedMap(prev => ({ ...prev, [modal.election._id]: modal.candidate._id }));
        const newVote: MyVote = {
          electionId: modal.election._id,
          candidateId: modal.candidate._id,
          voteHash: data.voteHash,
          receiptId: data.receiptId,
          transactionId: data.transactionId,
          votedAt: new Date().toISOString(),
          electionTitle: modal.election.title,
          blockHeight: data.blockHeight,
        };
        setMyVotes(prev => [...prev, newVote]);
        setVoteResult({
          hash: data.voteHash,
          receiptId: data.receiptId,
          electionTitle: modal.election.title,
          candidateName: modal.candidate.name,
          transactionId: data.transactionId,
        });
        setModal(null);
        showToast('Vote cast! Check your email for confirmation.');
      } else {
        setError(data.error || 'Failed to cast vote');
        if (res.status === 409) setVotedMap(prev => ({ ...prev, [modal.election._id]: 'already' }));
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleVerifyReceipt = async () => {
    if (!verifyReceipt.trim()) return;
    setVerifying(true); setVerifyResult(null);
    try {
      const res  = await fetch(`/api/votes/verify?receipt=${encodeURIComponent(verifyReceipt.trim())}`);
      const data = await res.json();
      setVerifyResult(data);
    } catch { setVerifyResult({ found: false, message: 'Network error' }); }
    finally { setVerifying(false); }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => showToast(`${label} copied!`)).catch(() => showToast('Copy failed'));
  };

  if (pageLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-800 to-blue-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-green-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg">Loading voter dashboard...</p>
      </div>
    </div>
  );
  if (!user) return null;

  const activeElections   = elections.filter(e => e.status === 'active');
  const upcomingElections = elections.filter(e => e.status === 'upcoming');
  const closedElections   = elections.filter(e => e.status === 'closed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-800 to-blue-900 text-white">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-gray-300">Voter ID: <span className="font-mono text-green-300">{user.voterId || 'N/A'}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-green-400 text-xs bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">
              <FaShieldAlt size={11} /> 2FA Verified
            </span>
            <button onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg text-sm transition-colors">
              <FaSignOutAlt size={12} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Voter Dashboard</h1>
          <p className="text-gray-300 text-sm">Your vote is encrypted, anonymised, and verifiable.</p>
          <div className="flex justify-center gap-8 mt-4">
            {[
              { label: 'Votes Cast',        value: myVotes.length,           color: 'text-green-400' },
              { label: 'Active Elections',  value: activeElections.length,   color: 'text-blue-400' },
              { label: 'Upcoming',          value: upcomingElections.length, color: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 justify-center flex-wrap">
          {([
            { id: 'vote',    label: '🗳 Cast Vote' },
            { id: 'history', label: '📋 My Votes' },
            { id: 'verify',  label: '🔍 Verify Vote' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── VOTE TAB ── */}
        {tab === 'vote' && (
          <>
            {activeElections.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Active Elections
                  <span className="ml-2 text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/20">{activeElections.length} open</span>
                </h2>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {activeElections.map(el => (
                    <ElectionCard key={el._id} election={el}
                      votedCandidateId={votedMap[el._id]}
                      onVote={openVoteModal}
                      onManifesto={setManifestoModal} />
                  ))}
                </div>
              </section>
            )}

            {upcomingElections.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FaClock className="text-yellow-400" /> Upcoming Elections
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingElections.map(el => (
                    <div key={el._id} className="bg-white/5 rounded-xl p-5 border border-yellow-500/20">
                      <h3 className="font-semibold mb-1">{el.title}</h3>
                      {el.description && <p className="text-gray-400 text-sm mb-2">{el.description}</p>}
                      <p className="text-yellow-400 text-sm font-medium">Not yet open</p>
                      {el.start_date && <p className="text-xs text-gray-500 mt-1">Opens {new Date(el.start_date).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {closedElections.length > 0 && (
              <section className="mb-10">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FaHistory className="text-gray-400" /> Past Elections
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {closedElections.map(el => (
                    <div key={el._id} className="bg-white/5 rounded-xl p-5 border border-white/10 opacity-70">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{el.title}</h3>
                          <p className="text-gray-400 text-sm mt-1">{el.candidates.length} candidates</p>
                        </div>
                        {el.result_published && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/20">Results Out</span>
                        )}
                      </div>
                      {votedMap[el._id] && (
                        <p className="text-green-400 text-xs mt-2 flex items-center gap-1"><MdVerified size={14}/> You voted</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {elections.length === 0 && (
              <div className="text-center py-24 text-gray-400">
                <FaVoteYea className="text-6xl mx-auto mb-4 opacity-20" />
                <p className="text-xl font-medium mb-1">No elections available</p>
                <p className="text-sm">Check back soon or contact your administrator.</p>
              </div>
            )}
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 rounded-xl border border-white/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-semibold">Your Voting History</h2>
                <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/20">
                  {myVotes.length} vote{myVotes.length !== 1 ? 's' : ''} cast
                </span>
              </div>
              {myVotes.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FaVoteYea className="text-4xl mx-auto mb-3 opacity-20" />
                  <p>No votes cast yet.</p>
                  <button onClick={() => setTab('vote')} className="mt-3 text-blue-300 hover:text-blue-200 text-sm underline">
                    Go cast your first vote
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {myVotes.map((v, i) => (
                    <div key={i} className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MdVerified className="text-green-400" size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{v.electionTitle}</p>
                          <p className="text-gray-400 text-xs mt-0.5">Voted {new Date(v.votedAt).toLocaleString()}</p>
                          {v.receiptId && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-gray-500">Receipt:</span>
                              <code className="text-xs text-cyan-300 font-mono">{v.receiptId}</code>
                              <button onClick={() => copyText(v.receiptId, 'Receipt ID')} className="text-xs text-gray-500 hover:text-gray-300">📋</button>
                            </div>
                          )}
                          <details className="mt-2">
                            <summary className="text-xs text-blue-300 hover:text-blue-200 cursor-pointer select-none">Show cryptographic proof</summary>
                            <div className="mt-1.5 space-y-1">
                              <div><span className="text-xs text-gray-500">Hash: </span><code className="text-xs text-gray-400 break-all">{v.voteHash}</code></div>
                              {v.transactionId && <div><span className="text-xs text-gray-500">TX: </span><code className="text-xs text-gray-400 break-all">{v.transactionId}</code></div>}
                              {v.blockHeight && <div><span className="text-xs text-gray-500">Block: </span><code className="text-xs text-gray-400">{v.blockHeight}</code></div>}
                            </div>
                          </details>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-center text-gray-500 text-xs mt-3">Your identity is not linked to your vote choice.</p>
          </div>
        )}

        {/* ── VERIFY TAB ── */}
        {tab === 'verify' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white/10 rounded-xl p-6 border border-white/20 mb-4">
              <h2 className="font-semibold text-lg mb-2 flex items-center gap-2"><FaSearch className="text-cyan-400" /> Verify Your Vote</h2>
              <p className="text-gray-300 text-sm mb-5">
                Enter your anonymous receipt ID to confirm your vote was counted. This does not reveal who you voted for.
              </p>
              <div className="flex gap-2">
                <input type="text" value={verifyReceipt} onChange={e => setVerifyReceipt(e.target.value.toUpperCase())}
                  placeholder="Enter Receipt ID (e.g. A1B2C3D4E5F6G7H8)"
                  className="flex-1 bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm font-mono" />
                <button onClick={handleVerifyReceipt} disabled={verifying || !verifyReceipt.trim()}
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-600 px-5 py-3 rounded-lg font-semibold text-sm transition-colors">
                  {verifying ? '...' : 'Verify'}
                </button>
              </div>
            </div>

            {verifyResult && (
              <div className={`rounded-xl p-5 border ${verifyResult.found ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="flex items-center gap-3 mb-2">
                  {verifyResult.found
                    ? <MdVerified className="text-green-400 text-2xl" />
                    : <span className="text-red-400 text-2xl">✗</span>
                  }
                  <h3 className={`font-semibold ${verifyResult.found ? 'text-green-300' : 'text-red-300'}`}>
                    {verifyResult.found ? 'Vote Confirmed!' : 'Vote Not Found'}
                  </h3>
                </div>
                <p className={`text-sm ${verifyResult.found ? 'text-green-200' : 'text-red-200'}`}>{verifyResult.message}</p>
                {verifyResult.found && (
                  <div className="mt-3 space-y-1 text-xs text-gray-400">
                    {verifyResult.votedAt && <p>Recorded: {new Date(verifyResult.votedAt).toLocaleString()}</p>}
                    {verifyResult.blockHeight && <p>Block: {verifyResult.blockHeight}</p>}
                    {verifyResult.transactionId && <p className="font-mono">TX: {verifyResult.transactionId}</p>}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-200">
              <p className="font-medium mb-1">ℹ️ About vote verification</p>
              <p>Your receipt ID is different from your vote hash. It proves your vote exists without revealing your choice. Receipt IDs are generated using SHA-256 and are computationally impossible to reverse.</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Vote Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-8 border border-white/20 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-1 text-center">Confirm Your Vote</h2>
            <p className="text-gray-400 text-center text-sm mb-6">This action is permanent and cannot be undone.</p>
            <div className="bg-white/5 rounded-xl p-5 mb-6 border border-white/10 space-y-3">
              <div><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Election</p><p className="font-semibold">{modal.election.title}</p></div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center gap-3">
                {modal.candidate.photo && (
                  <img src={modal.candidate.photo} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-600"
                    onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                )}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Your choice</p>
                  <p className="text-xl font-bold text-green-400">{modal.candidate.name}</p>
                  {modal.candidate.party && <p className="text-sm text-gray-400">{modal.candidate.party}</p>}
                </div>
              </div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-5 text-xs text-yellow-200">
              ⚠️ Once you confirm, your vote is permanently recorded on the secure ledger. You cannot change or cancel it.
            </div>
            {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">{error}</div>}
            <div className="flex gap-3">
              <button onClick={handleConfirmVote} disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><FaVoteYea /> Confirm Vote</>}
              </button>
              <button onClick={() => { setModal(null); setError(''); }} disabled={loading}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vote Success Modal */}
      {voteResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-8 border border-white/20 max-w-md w-full shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <MdVerified className="text-green-400 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Vote Confirmed!</h2>
            <p className="text-gray-400 text-sm mb-1">Recorded in the secure hash chain.</p>
            <p className="text-green-300 text-xs mb-5">A confirmation email has been sent to you.</p>
            <div className="bg-white/5 rounded-xl p-5 mb-4 text-left border border-white/10 space-y-3">
              <div><p className="text-xs text-gray-500 mb-1">Election</p><p className="font-medium text-sm">{voteResult.electionTitle}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">Voted for</p><p className="font-bold text-green-400">{voteResult.candidateName}</p></div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Anonymous Receipt ID <span className="text-blue-400">(save this!)</span></p>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-cyan-300 font-mono font-bold flex-1">{voteResult.receiptId}</code>
                  <button onClick={() => copyText(voteResult.receiptId, 'Receipt ID')} className="text-gray-400 hover:text-white text-sm">📋</button>
                </div>
              </div>
              <details>
                <summary className="text-xs text-blue-300 cursor-pointer hover:text-blue-200">Technical proof</summary>
                <div className="mt-1.5 space-y-1">
                  <p className="text-xs text-gray-500">Hash: <code className="text-gray-400 break-all">{voteResult.hash}</code></p>
                  <p className="text-xs text-gray-500">TX: <code className="text-gray-400 break-all">{voteResult.transactionId}</code></p>
                </div>
              </details>
            </div>
            <p className="text-xs text-gray-500 mb-5">Use the Receipt ID in the "Verify Vote" tab to confirm your vote was counted.</p>
            <div className="flex gap-3">
              <button onClick={() => copyText(voteResult.receiptId, 'Receipt ID')} className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl text-sm font-medium transition-colors">Copy Receipt</button>
              <button onClick={() => setVoteResult(null)} className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition-colors">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Manifesto Modal */}
      {manifestoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-8 border border-white/20 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              {manifestoModal.photo && (
                <img src={manifestoModal.photo} alt="" className="w-16 h-16 rounded-full object-cover border border-gray-600"
                  onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              )}
              <div>
                <h2 className="text-xl font-bold">{manifestoModal.name}</h2>
                {manifestoModal.party && <p className="text-gray-400 text-sm">{manifestoModal.party}</p>}
              </div>
            </div>
            {manifestoModal.description && (
              <div className="mb-3"><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">About</p><p className="text-gray-300 text-sm">{manifestoModal.description}</p></div>
            )}
            {manifestoModal.manifesto && (
              <div className="mb-4"><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Manifesto</p><p className="text-gray-300 text-sm leading-relaxed">{manifestoModal.manifesto}</p></div>
            )}
            <button onClick={() => setManifestoModal(null)} className="w-full bg-gray-700 hover:bg-gray-600 py-2.5 rounded-xl text-sm font-medium transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-600 border-t border-white/5 mt-8">
        Made with ❤️ in India, created by OPSINGH6778. Copyright © 2026 Secure Voting System. All rights reserved to Om Prakash Singh.
      </footer>
    </div>
  );
}

function ElectionCard({ election, votedCandidateId, onVote, onManifesto }: {
  election: Election; votedCandidateId?: string;
  onVote: (el: Election, c: Candidate) => void;
  onManifesto: (c: Candidate) => void;
}) {
  const hasVoted = !!votedCandidateId;
  return (
    <div className={`rounded-xl p-5 border transition-all ${hasVoted ? 'bg-green-900/20 border-green-500/30' : 'bg-white/10 border-white/20 hover:border-white/30'}`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-lg leading-tight flex-1 pr-2">{election.title}</h3>
        {hasVoted && <MdVerified className="text-green-400 text-xl flex-shrink-0" />}
      </div>
      {election.description && <p className="text-gray-400 text-sm mb-3">{election.description}</p>}
      {election.end_date && <p className="text-xs text-gray-500 mb-3">Closes {new Date(election.end_date).toLocaleString()}</p>}

      {hasVoted ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
          <p className="text-green-400 text-sm font-semibold flex items-center justify-center gap-1.5"><MdVerified /> Vote successfully cast</p>
        </div>
      ) : (
        <div>
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Choose a candidate</p>
          <div className="space-y-2">
            {election.candidates.map(c => (
              <div key={c._id} className="bg-white/5 border border-white/10 hover:border-green-400/40 rounded-xl p-3 transition-all group">
                <div className="flex items-center gap-3">
                  {c.photo ? (
                    <img src={c.photo} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-600 flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600/40 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{c.name}</p>
                    {c.party && <p className="text-xs text-gray-400">{c.party}</p>}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {(c.manifesto || c.description) && (
                      <button onClick={() => onManifesto(c)}
                        className="text-xs text-blue-300 hover:text-blue-200 bg-blue-500/10 px-2 py-1 rounded-lg transition-colors">
                        View
                      </button>
                    )}
                    <button onClick={() => onVote(election, c)}
                      className="text-xs bg-green-600/80 hover:bg-green-500 text-white px-3 py-1 rounded-lg flex items-center gap-1 transition-colors font-medium">
                      <FaVoteYea size={11} /> Vote
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

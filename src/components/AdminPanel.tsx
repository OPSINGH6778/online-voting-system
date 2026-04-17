'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  FaCog, FaChartBar, FaUsers, FaUserShield, FaShieldAlt,
  FaSignOutAlt, FaPlus, FaTrash, FaEdit, FaVoteYea,
  FaCheckCircle, FaClock, FaUpload, FaFileExport,
  FaLock, FaHistory, FaExclamationTriangle,
  FaIdCard, FaTrophy, FaLink, FaBrain, FaAtom,
  FaExclamationCircle, FaChartLine, FaSearch, FaSlidersH,
  FaToggleOn, FaToggleOff, FaChild, FaServer,
} from 'react-icons/fa';
import { MdAdminPanelSettings } from 'react-icons/md';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line,
} from 'recharts';

const COLORS = ['#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-500/20 text-green-300 border-green-500/30',
  upcoming: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  closed: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  draft: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  archived: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};
const RISK_BADGE: Record<string, string> = {
  safe: 'bg-green-500/20 text-green-300', low: 'bg-blue-500/20 text-blue-300',
  medium: 'bg-yellow-500/20 text-yellow-300', high: 'bg-orange-500/20 text-orange-300',
  critical: 'bg-red-500/20 text-red-300 animate-pulse', blocked: 'bg-red-700/30 text-red-300',
};

const EC = { name: '', party: '', description: '', photo: '', manifesto: '' };
const EF = { title: '', description: '', status: 'draft', start_date: '', end_date: '', candidates: [{ ...EC }, { ...EC }] };

async function aF(url: string, opts?: RequestInit) {
  try {
    const res = await fetch(url, opts);
    // Only redirect on 401 (not authenticated), not 403 (forbidden - might be moderator)
    if (res.status === 401) window.location.href = '/admin-login';
    return res;
  } catch (e) {
    console.error('API error:', url, e);
    // Return a fake response that won't crash the UI
    return new Response(JSON.stringify({ error: 'Network error' }), { status: 500 });
  }
}

export default function AdminPanel() {
  const [tab, setTab] = useState<'setup'|'analytics'|'voters'|'admins'|'votes'|'logs'|'ml'|'quantum'|'fraud'|'settings'>('analytics');
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [elections, setElections] = useState<any[]>([]);
  const [voters, setVoters] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [auditVotes, setAuditVotes] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [mlData, setMlData] = useState<any>(null);
  const [quantumData, setQuantumData] = useState<any>(null);
  const [fraudData, setFraudData] = useState<any>(null);
  const [electionResults, setElectionResults] = useState<Record<string, any>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [form, setForm] = useState<any>(EF);
  const [editId, setEditId] = useState<string | null>(null);
  const [voterForm, setVoterForm] = useState({ name: '', email: '', password: '', phone: '', aadhaar_number: '', govt_voter_id: '', markVerified: true });
  const [voterSearch, setVoterSearch] = useState('');
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  const [canAddAdmin, setCanAddAdmin] = useState(false);
  const [primaryAdmin, setPrimaryAdmin] = useState('');
  const [chainResult, setChainResult] = useState<{id: string; valid: boolean; totalVotes?: number; brokenAt?: string} | null>(null);
  const [selectedElectionResult, setSelectedElectionResult] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    vote_cooldown_enabled: false,
    vote_cooldown_seconds: 0,
    min_voter_age: 18,
    maintenance_mode: false,
    privacy_policy_version: '1.0',
  });

  const t$ = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };

  const load = {
    stats:     useCallback(async () => { const r = await aF('/api/admin/stats'); if (r.ok) setStats(await r.json()); }, []),
    elections: useCallback(async () => { const r = await aF('/api/elections'); if (r.ok) setElections((await r.json()).elections || []); }, []),
    voters:    useCallback(async () => { const r = await aF('/api/admin/voters'); if (r.ok) setVoters((await r.json()).voters || []); }, []),
    admins:    useCallback(async () => { const r = await aF('/api/admin/admins'); if (r.ok) { const d = await r.json(); setAdmins(d.admins||[]); setCanAddAdmin(d.canAddAdmin); setPrimaryAdmin(d.primaryAdmin); } }, []),
    votes:     useCallback(async () => { const r = await aF('/api/admin/votes'); if (r.ok) setAuditVotes((await r.json()).votes || []); }, []),
    logs:      useCallback(async () => { const r = await aF('/api/admin/logs'); if (r.ok) setActivityLogs((await r.json()).logs || []); }, []),
    ml:        useCallback(async () => { const r = await aF('/api/admin/ml-analytics'); if (r.ok) setMlData(await r.json()); }, []),
    quantum:   useCallback(async () => { const r = await aF('/api/admin/quantum'); if (r.ok) setQuantumData(await r.json()); }, []),
    fraud:     useCallback(async () => { const r = await aF('/api/admin/fraud-alerts'); if (r.ok) setFraudData(await r.json()); }, []),
    settings:  useCallback(async () => { const r = await aF('/api/admin/settings'); if (r.ok) { const d = await r.json(); setSettings(d.settings); setSettingsForm({ vote_cooldown_enabled: d.settings.vote_cooldown_enabled || false, vote_cooldown_seconds: d.settings.vote_cooldown_seconds || 0, min_voter_age: d.settings.min_voter_age || 18, maintenance_mode: d.settings.maintenance_mode || false, privacy_policy_version: d.settings.privacy_policy_version || '1.0' }); } }, []),
    results:   useCallback(async (id: string) => {
      if (electionResults[id]) return;
      const r = await aF(`/api/elections/${id}/results`);
      if (r.ok) { const d = await r.json(); setElectionResults(p => ({ ...p, [id]: d })); }
    }, [electionResults]),
  };

  useEffect(() => {
    (async () => {
      try {
        const mr = await fetch('/api/auth/me');
        if (!mr.ok) { window.location.href = '/admin-login'; return; }
        const { user: u } = await mr.json();
        if (!['admin','moderator'].includes(u?.role)) { window.location.href = '/user'; return; }
        setUser(u);
        await Promise.all([load.stats(), load.elections()]);
      } catch { window.location.href = '/admin-login'; }
      finally { setPageLoading(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === 'voters')  load.voters();
    if (tab === 'admins')  load.admins();
    if (tab === 'votes')   load.votes();
    if (tab === 'logs')    load.logs();
    if (tab === 'ml')      load.ml();
    if (tab === 'quantum') load.quantum();
    if (tab === 'fraud')    load.fraud();
    if (tab === 'settings') load.settings();
    if (tab === 'setup')   elections.forEach(el => { if (el.status !== 'draft') load.results(el._id); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/'; };

  // Election CRUD
  const resetForm = () => { setForm(EF); setEditId(null); };
  const startEdit = (el: any) => { setForm({ title: el.title, description: el.description, status: el.status, start_date: el.start_date?.slice(0,16)||'', end_date: el.end_date?.slice(0,16)||'', candidates: el.candidates.map((c: any) => ({ name: c.name, party: c.party||'', description: c.description||'', photo: c.photo||'', manifesto: c.manifesto||'' })) }); setEditId(el._id); setTab('setup'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const addC = () => setForm((f: any) => ({ ...f, candidates: [...f.candidates, { ...EC }] }));
  const remC = (i: number) => setForm((f: any) => ({ ...f, candidates: f.candidates.filter((_: any, j: number) => j !== i) }));
  const updC = (i: number, k: string, v: string) => setForm((f: any) => { const c = [...f.candidates]; c[i] = { ...c[i], [k]: v }; return { ...f, candidates: c }; });

  const submitElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.candidates.some((c: any) => !c.name.trim())) { t$('All candidate names required', false); return; }
    setSaving(true);
    try {
      const r = await aF(editId ? `/api/elections/${editId}` : '/api/elections', { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (r.ok) { t$(editId ? 'Updated!' : 'Created!'); resetForm(); load.elections(); load.stats(); }
      else { const d = await r.json(); t$(d.error || 'Failed', false); }
    } finally { setSaving(false); }
  };

  const changeStatus = async (id: string, status: string) => {
    const r = await aF(`/api/elections/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (r.ok) { t$(`→ ${status}`); load.elections(); load.stats(); }
    else { const d = await r.json(); t$(d.error || 'Failed', false); }
  };

  const deleteElection = async (id: string) => {
    if (!confirm('Delete?')) return;
    const r = await aF(`/api/elections/${id}`, { method: 'DELETE' });
    if (r.ok) { t$('Deleted'); load.elections(); load.stats(); }
    else { const d = await r.json(); t$(d.error || 'Cannot delete', false); }
  };

  const publishResults = async (id: string) => {
    if (!confirm('Publish results? Final action.')) return;
    const r = await aF(`/api/elections/${id}/publish`, { method: 'POST' });
    if (r.ok) { t$('Results published!'); load.elections(); }
    else { const d = await r.json(); t$(d.error||'Failed', false); }
  };

  const verifyChain = async (id: string) => {
    setChainResult(null);
    try {
      const r = await aF(`/api/elections/verify-chain?electionId=${id}`);
      if (r.ok) { const d = await r.json(); setChainResult({ ...d, id }); }
    } catch { /* ignore */ }
  };

  const viewResults = async (el: any) => {
    const r = await aF(`/api/elections/${el._id}/results`);
    if (r.ok) setSelectedElectionResult({ ...(await r.json()), electionTitle: el.title });
  };

  const exportResults = async (el: any) => {
    const r = await aF(`/api/elections/${el._id}/results`);
    if (!r.ok) { t$('Failed', false); return; }
    const { results, totalVotes } = await r.json();
    const lines = [`Secure Voting System — Results`,`Copyright © 2026 Om Prakash Singh`,``,`Election: ${el.title}`,`Total Votes: ${totalVotes}`,``,`Candidate,Party,Votes,Percentage`,...results.map((r: any) => `${r.name},${r.description||''},${r.votes},${r.percentage}%`)];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${el.title.replace(/\s+/g,'_')}_results.csv` });
    a.click(); t$('Exported!');
  };

  const submitVoter = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const r = await aF('/api/admin/voters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(voterForm) });
      if (r.ok) { t$('Voter added!'); setVoterForm({ name:'',email:'',password:'',phone:'',aadhaar_number:'',govt_voter_id:'',markVerified:true }); load.voters(); load.stats(); }
      else { const d = await r.json(); t$(d.error||'Failed', false); }
    } finally { setSaving(false); }
  };

  const deleteVoter = async (id: string) => {
    if (!confirm('Remove voter?')) return;
    const r = await aF(`/api/admin/voters/${id}`, { method: 'DELETE' });
    if (r.ok) { t$('Removed'); load.voters(); load.stats(); }
    else { const d = await r.json(); t$(d.error||'Failed', false); }
  };

  const submitAdmin = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const r = await aF('/api/admin/admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminForm) });
      if (r.ok) { t$('Admin added!'); setAdminForm({ name:'',email:'',password:'' }); load.admins(); load.stats(); }
      else { const d = await r.json(); t$(d.error||'Failed', false); }
    } finally { setSaving(false); }
  };

  if (pageLoading) return <div className="min-h-screen bg-[#0d1117] flex items-center justify-center"><div className="text-center"><div className="w-12 h-12 border-4 border-gray-800 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"/><p className="text-gray-400 text-sm">Loading Election Control...</p></div></div>;
  if (!user) return null;

  const fVoters = voters.filter(v => v.name.toLowerCase().includes(voterSearch.toLowerCase()) || v.email.toLowerCase().includes(voterSearch.toLowerCase()) || v.voterId.toLowerCase().includes(voterSearch.toLowerCase()));

  const navItems = [
    { id: 'setup',     icon: <FaCog size={14}/>,              label: 'Election Setup' },
    { id: 'analytics', icon: <FaChartBar size={14}/>,         label: 'Analytics' },
    { id: 'voters',    icon: <FaUsers size={14}/>,            label: 'Voters' },
    { id: 'admins',    icon: <FaUserShield size={14}/>,       label: 'Admins' },
    { id: 'votes',     icon: <FaVoteYea size={14}/>,          label: 'Votes' },
    { id: 'logs',      icon: <FaHistory size={14}/>,          label: 'Activity Logs' },
    { id: 'ml',        icon: <FaBrain size={14}/>,            label: 'ML Analytics' },
    { id: 'quantum',   icon: <FaAtom size={14}/>,             label: 'Quantum Security' },
    { id: 'fraud',     icon: <FaExclamationTriangle size={14}/>, label: 'Fraud Alerts' },
    { id: 'settings',  icon: <FaSlidersH size={14}/>,          label: 'System Settings' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {toast && <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>{toast.msg}</div>}

      <div className="flex flex-1">
        {/* ── Sidebar ── */}
        <aside className="w-64 bg-[#0d1117] border-r border-gray-800/60 flex flex-col p-5 min-h-screen flex-shrink-0">
          <div className="mb-5">
            <p className="text-[10px] text-cyan-400/60 tracking-[0.25em] uppercase mb-1">Admin Console</p>
            <h1 className="text-xl font-bold text-cyan-300">Election Control</h1>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cyan-700/40 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <MdAdminPanelSettings className="text-cyan-400" size={18}/>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{user.name}</p>
              <p className="text-xs text-gray-400">Administrator session active</p>
            </div>
          </div>
          <nav className="flex-1 space-y-0.5">
            {navItems.map(item => (
              <button type="button" key={item.id} onClick={() => setTab(item.id)}
                className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 text-sm transition-all ${tab === item.id ? 'bg-cyan-500 text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'}`}>
                {item.icon} {item.label}
                {item.id === 'fraud' && fraudData?.criticalCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{fraudData.criticalCount}</span>
                )}
              </button>
            ))}
          </nav>
          {stats && (
            <div className="grid grid-cols-2 gap-2 mt-4 mb-3">
              {[['Voters',stats.totalUsers],['Votes',stats.totalVotes],['Active',stats.activeElections],['Admins',stats.totalAdmins]].map(([l,v]) => (
                <div key={l} className="bg-gray-800/40 rounded-lg p-2 border border-gray-700/30">
                  <p className="text-[10px] text-gray-500">{l}</p>
                  <p className="text-base font-bold">{v ?? '—'}</p>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-sm font-semibold transition-colors">
            <FaSignOutAlt size={13}/> Logout
          </button>
          <div className="mt-3 text-center text-[9px] text-gray-700 leading-relaxed">
            <p>Made with ❤️ in India, created by OPSINGH6778.</p>
            <p>Copyright © 2026 Secure Voting System.</p>
            <p>All rights reserved to Om Prakash Singh.</p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 p-8 overflow-y-auto">

          {/* ══ ELECTION SETUP ══ */}
          {tab === 'setup' && (
            <div>
              <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
                <div><p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Management</p><h1 className="text-3xl font-bold">Election Setup</h1></div>
                {editId && <button type="button" onClick={resetForm} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl text-sm">Cancel Edit</button>}
              </div>
              <div className="bg-[#161b22] rounded-2xl border border-gray-800 p-6 mb-8">
                <h2 className="text-lg font-semibold mb-5">{editId ? '✏️ Edit Election' : '➕ Create Election'}</h2>
                <form onSubmit={submitElection} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[['title','Election Title *','text','e.g. General Election 2026'],['description','Description','text','Optional description']].map(([k,l,t,p]) => (
                      <div key={k} className={k === 'description' ? 'md:col-span-2' : ''}>
                        <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">{l}</label>
                        <input type={t} required={k==='title'} value={(form as any)[k]} onChange={e => setForm((f: any) => ({ ...f, [k]: e.target.value }))} placeholder={p}
                          className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">Status</label>
                      <select value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}
                        className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        {['draft','upcoming','active','closed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                    {['start_date','end_date'].map(k => (
                      <div key={k}>
                        <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">{k === 'start_date' ? 'Start Time' : 'End Time'}</label>
                        <input type="datetime-local" value={(form as any)[k]} onChange={e => setForm((f: any) => ({ ...f, [k]: e.target.value }))}
                          className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-200">Candidates</label>
                      <button type="button" onClick={addC} className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-400/10 px-3 py-1.5 rounded-lg"><FaPlus size={10}/> Add Candidate</button>
                    </div>
                    <div className="space-y-4">
                      {form.candidates.map((c: any, i: number) => (
                        <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-cyan-400">Candidate {i + 1}</span>
                            {form.candidates.length > 2 && <button type="button" onClick={() => remC(i)} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"><FaTrash size={10}/> Remove</button>}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[['name','Name *','text','Candidate name',true],['party','Party','text','Party / Alliance',false]].map(([k,l,t,p,req]) => (
                              <input key={k} type={t as string} required={req as boolean} value={c[k as string]} placeholder={p as string}
                                onChange={e => updC(i, k as string, e.target.value)}
                                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                            ))}
                            <div className="md:col-span-2 flex gap-2">
                              <input type="url" value={c.photo} placeholder="Photo URL (https://...)" onChange={e => updC(i, 'photo', e.target.value)}
                                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                              <label className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-xs cursor-pointer text-gray-300"><FaUpload size={11}/> Upload</label>
                            </div>
                            {c.photo && <img src={c.photo} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-600" onError={e => { (e.target as any).style.display='none'; }}/>}
                            <input type="text" value={c.description} placeholder="Bio / description" onChange={e => updC(i,'description',e.target.value)}
                              className="md:col-span-2 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                            <textarea value={c.manifesto} placeholder="Short manifesto / key promises" onChange={e => updC(i,'manifesto',e.target.value)} rows={2}
                              className="md:col-span-2 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button type="submit" disabled={saving} className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 px-6 py-3 rounded-xl text-sm font-semibold transition-colors">
                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <FaVoteYea size={14}/>}
                    {editId ? 'Update Election' : 'Create Election'}
                  </button>
                </form>
              </div>

              {/* Elections list */}
              <div className="space-y-4">
                {elections.map(el => {
                  const res = electionResults[el._id];
                  return (
                    <div key={el._id} className="bg-[#161b22] rounded-2xl border border-gray-800 p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-lg">{el.title}</h3>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border ${STATUS_BADGE[el.status]||STATUS_BADGE.draft}`}>{el.status}</span>
                            {el.is_locked && <span className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full flex items-center gap-1"><FaLock size={9}/> Locked</span>}
                            {el.result_published && <span className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full flex items-center gap-1"><FaTrophy size={9}/> Published</span>}
                          </div>
                          {el.description && <p className="text-gray-400 text-sm">{el.description}</p>}
                          <p className="text-xs text-gray-600 mt-1">{el.candidates.length} candidates · {res?.totalVotes ?? el.total_votes ?? '—'} votes{el.start_date ? ` · ${new Date(el.start_date).toLocaleDateString()} – ${el.end_date ? new Date(el.end_date).toLocaleDateString() : '∞'}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button type="button" onClick={() => exportResults(el)} className="flex items-center gap-1 text-xs bg-green-700/30 hover:bg-green-700 text-green-300 hover:text-white px-3 py-1.5 rounded-lg border border-green-700/40 transition-colors"><FaFileExport size={11}/> Export</button>
                          <button type="button" onClick={() => viewResults(el)} className="text-xs bg-purple-700/30 hover:bg-purple-600 text-purple-300 hover:text-white px-3 py-1.5 rounded-lg border border-purple-700/40 transition-colors flex items-center gap-1"><FaChartLine size={11}/> Results</button>
                          {!el.result_published && el.status === 'closed' && <button type="button" onClick={() => publishResults(el._id)} className="text-xs bg-yellow-700/30 hover:bg-yellow-600 text-yellow-300 hover:text-white px-3 py-1.5 rounded-lg border border-yellow-700/40 transition-colors flex items-center gap-1"><FaTrophy size={11}/> Publish</button>}
                          <button type="button" onClick={() => verifyChain(el._id)} className="text-xs bg-blue-700/30 hover:bg-blue-600 text-blue-300 hover:text-white px-3 py-1.5 rounded-lg border border-blue-700/40 transition-colors flex items-center gap-1"><FaLink size={11}/> Verify</button>
                          {el.status === 'draft' && <button type="button" onClick={() => changeStatus(el._id,'upcoming')} className="text-xs bg-yellow-700 hover:bg-yellow-600 px-3 py-1.5 rounded-lg">Publish</button>}
                          {el.status === 'upcoming' && <button type="button" onClick={() => changeStatus(el._id,'active')} className="text-xs bg-green-700 hover:bg-green-600 px-3 py-1.5 rounded-lg">Activate</button>}
                          {el.status === 'active' && <button type="button" onClick={() => changeStatus(el._id,'closed')} className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded-lg">Close</button>}
                          {el.status === 'closed' && <button type="button" onClick={() => changeStatus(el._id,'archived')} className="text-xs bg-purple-700 hover:bg-purple-600 px-3 py-1.5 rounded-lg">Archive</button>}
                          <button type="button" onClick={() => startEdit(el)} className="text-xs bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded-lg"><FaEdit size={11}/></button>
                          {el.status === 'draft' && <button type="button" onClick={() => deleteElection(el._id)} className="text-xs bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded-lg"><FaTrash size={11}/></button>}
                        </div>
                      </div>

                      {chainResult && chainResult.id === el._id && <div className={`mb-3 p-3 rounded-lg text-sm ${chainResult.valid ? 'bg-green-500/10 border border-green-500/30 text-green-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>{chainResult.valid ? `✅ Hash chain verified — ${chainResult.totalVotes} votes, integrity intact.` : `❌ Tamper detected at vote ${chainResult.brokenAt}!`}</div>}

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
                        {el.candidates.map((c: any) => {
                          const cRes = res?.results?.find((r: any) => r.id === c._id.toString());
                          return (
                            <div key={c._id} className="bg-gray-800/40 rounded-lg p-2.5 border border-gray-700/30">
                              <div className="flex items-center gap-2 mb-1">
                                {c.photo ? <img src={c.photo} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-600" onError={e => { (e.target as any).style.display='none'; }}/> : <div className="w-8 h-8 rounded-full bg-cyan-700/40 flex items-center justify-center text-xs font-bold text-cyan-300">{c.name.charAt(0)}</div>}
                                <div className="min-w-0"><p className="font-medium text-sm truncate">{c.name}</p>{c.party && <p className="text-xs text-gray-500 truncate">{c.party}</p>}</div>
                              </div>
                              {cRes && (<div><p className="text-xs text-cyan-400 font-semibold">{cRes.votes} votes ({cRes.percentage}%)</p><div className="w-full bg-gray-700 rounded-full h-1 mt-1"><div className="bg-cyan-500 h-1 rounded-full" style={{ width: `${cRes.percentage}%` }}/></div></div>)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {elections.length === 0 && <div className="text-center py-12 text-gray-500"><FaVoteYea className="text-4xl mx-auto mb-2 opacity-20"/><p>No elections yet.</p></div>}
              </div>

              {/* Results Modal */}
              {selectedElectionResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                  <div className="bg-gray-900 rounded-2xl p-6 border border-white/20 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">📊 {selectedElectionResult.electionTitle}</h2>
                      <button type="button" onClick={() => setSelectedElectionResult(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
                    </div>
                    <p className="text-gray-400 text-sm mb-5">Total votes: {selectedElectionResult.totalVotes}</p>
                    {selectedElectionResult.totalVotes === 0 ? <p className="text-gray-500 text-center py-8">No votes cast yet.</p> : (
                      <>
                        {/* Winner highlight */}
                        {selectedElectionResult.results && (() => {
                          const sorted = [...selectedElectionResult.results].sort((a: any, b: any) => b.votes - a.votes);
                          const winner = sorted[0];
                          return winner && selectedElectionResult.election?.status === 'closed' && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-5 flex items-center gap-3">
                              <FaTrophy className="text-yellow-400 text-2xl"/>
                              <div><p className="text-xs text-gray-400">🏆 Winner</p><p className="font-bold text-lg text-yellow-300">{winner.name}</p><p className="text-sm text-gray-400">{winner.description} · {winner.votes} votes ({winner.percentage}%)</p></div>
                            </div>
                          );
                        })()}
                        <div className="space-y-3 mb-6">
                          {[...selectedElectionResult.results].sort((a: any,b: any) => b.votes - a.votes).map((r: any, i: number) => (
                            <div key={r.id}>
                              <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="font-medium flex items-center gap-2">{i===0 && <span className="text-yellow-400">🏆</span>}{r.name}{r.description && <span className="text-gray-500 text-xs">({r.description})</span>}</span>
                                <span className="text-gray-400 text-xs">{r.votes} votes · {r.percentage}%</span>
                              </div>
                              <div className="w-full bg-gray-800 rounded-full h-5 overflow-hidden">
                                <div className="h-5 rounded-full transition-all flex items-center justify-end pr-2" style={{ width: `${r.percentage}%`, backgroundColor: COLORS[i%COLORS.length] }}>
                                  {r.percentage > 10 && <span className="text-white text-xs font-bold">{r.percentage}%</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={selectedElectionResult.results}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={11}/>
                            <YAxis stroke="#6b7280" fontSize={11}/>
                            <Tooltip contentStyle={{ background: '#111827', border: 'none', borderRadius: '8px' }}/>
                            <Bar dataKey="votes" radius={[4,4,0,0]}>{selectedElectionResult.results.map((_: any,i: number) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ ANALYTICS ══ */}
          {tab === 'analytics' && (
            <div>
              <div className="mb-8"><p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Overview</p><h1 className="text-3xl font-bold">Live Analytics</h1></div>
              {stats ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[['Registered Voters',stats.totalUsers,'text-purple-400'],['Total Votes',stats.totalVotes,'text-cyan-400'],['Active Elections',stats.activeElections,'text-green-400'],['Admin Accounts',stats.totalAdmins,'text-orange-400']].map(([l,v,c]) => (
                      <div key={l} className="bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                        <p className="text-sm text-gray-400 mb-1">{l}</p>
                        <p className={`text-4xl font-bold ${c}`}>{v ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
                      <h3 className="text-lg font-bold mb-4">Vote Arrival Timeline</h3>
                      {stats.trend?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={stats.trend}>
                            <defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/><XAxis dataKey="time" stroke="#4b5563" fontSize={11}/><YAxis stroke="#4b5563" fontSize={11}/>
                            <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #374151', borderRadius: '8px' }}/>
                            <Area type="monotone" dataKey="votes" stroke="#22d3ee" fill="url(#vg)" strokeWidth={2}/>
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No votes yet</div>}
                    </div>
                    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
                      <h3 className="text-lg font-bold mb-4">Election Status Breakdown</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={[{name:'Active',value:stats.activeElections||0},{name:'Upcoming',value:stats.upcomingElections||0},{name:'Draft',value:stats.draftElections||0},{name:'Closed',value:stats.closedElections||0}]} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                            {['#10b981','#f59e0b','#3b82f6','#6b7280'].map((c,i) => <Cell key={i} fill={c}/>)}
                          </Pie>
                          <Legend/><Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #374151', borderRadius: '8px' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-[#161b22] border border-green-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <FaShieldAlt className="text-green-400"/><span className="font-medium">Security Status</span>
                      <span className="ml-auto text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full">All Systems Operational</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">AES-256-GCM · SHA-256 Hash Chain · ML Fraud Detection · CAPTCHA · Rate Limiting · Activity Logging · QKD Simulation</p>
                    <p className="text-xs text-gray-600 mt-1">Voter Turnout: <span className="text-cyan-400 font-semibold">{stats.voterTurnout}%</span></p>
                  </div>
                </>
              ) : <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-gray-800 border-t-cyan-400 rounded-full animate-spin"/></div>}
            </div>
          )}

          {/* ══ VOTERS ══ */}
          {tab === 'voters' && (
            <div>
              <div className="mb-6"><p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Directory</p><h1 className="text-3xl font-bold">Voter Management</h1></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1 bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                  <h2 className="font-semibold text-lg mb-4">Add Voter</h2>
                  <form onSubmit={submitVoter} className="space-y-3">
                    {[['Full Name','name','text','Full name',true],['Email','email','email','email@example.com',true],['Password','password','password','Password',true],['Phone','phone','tel','+91 XXXXX',false],['Aadhaar No.','aadhaar_number','text','12-digit',false],['Voter ID Card','govt_voter_id','text','EPIC No.',false]].map(([l,n,t,p,r]) => (
                      <div key={n as string}>
                        <label className="block text-xs text-gray-400 mb-1">{l as string} {!r ? '(Optional)' : '*'}</label>
                        <input type={t as string} required={r as boolean} value={(voterForm as any)[n as string]} onChange={e => setVoterForm(f => ({ ...f, [n as string]: e.target.value }))} placeholder={p as string}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                      </div>
                    ))}
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                      <input type="checkbox" checked={voterForm.markVerified} onChange={e => setVoterForm(f => ({ ...f, markVerified: e.target.checked }))} className="w-4 h-4 accent-cyan-500"/>
                      Mark verified immediately
                    </label>
                    <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                      {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <FaPlus size={12}/>} Add Voter
                    </button>
                  </form>
                </div>
                <div className="lg:col-span-2 bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3 flex-wrap">
                    <input type="text" value={voterSearch} onChange={e => setVoterSearch(e.target.value)} placeholder="Search by name, email, voter ID"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                    <div className="flex gap-3 text-xs flex-wrap">
                      {[['Total',voters.length,'text-gray-400'],['Voted',voters.filter(v=>v.hasVoted).length,'text-green-400'],['Pending',voters.filter(v=>!v.hasVoted).length,'text-yellow-400']].map(([l,v,c]) => <span key={l} className={`${c} font-medium`}>{l}: {v}</span>)}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-2.5">Voter</th><th className="px-4 py-2.5">Email</th><th className="px-4 py-2.5">Voter ID</th><th className="px-4 py-2.5">ID Docs</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5"></th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-800/50">
                        {fVoters.map(v => (
                          <tr key={v.id} className="hover:bg-gray-800/20">
                            <td className="px-4 py-2.5 font-medium">{v.name}</td>
                            <td className="px-4 py-2.5 text-gray-400 text-xs">{v.email}</td>
                            <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{v.voterId}</td>
                            <td className="px-4 py-2.5"><div className="flex gap-1">
                              {v.hasAadhaar && <span className="text-xs bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-0.5"><FaIdCard size={9}/> Aadhaar</span>}
                              {v.hasGovtVoterId && <span className="text-xs bg-green-900/40 text-green-300 px-1.5 py-0.5 rounded flex items-center gap-0.5"><FaIdCard size={9}/> EPIC</span>}
                              {!v.hasAadhaar && !v.hasGovtVoterId && <span className="text-xs text-gray-600">—</span>}
                            </div></td>
                            <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${v.hasVoted ? 'bg-blue-900/40 text-blue-400' : 'bg-yellow-900/40 text-yellow-400'}`}>{v.hasVoted ? 'Voted' : 'Pending'}</span></td>
                            <td className="px-4 py-2.5"><button type="button" onClick={() => deleteVoter(v.id)} className="text-red-400 hover:text-red-300 transition-colors"><FaTrash size={11}/></button></td>
                          </tr>
                        ))}
                        {fVoters.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">No voters found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <p className="px-4 py-2 text-xs text-gray-600 border-t border-gray-800">Vote choices not shown. Voter anonymity maintained.</p>
                </div>
              </div>
            </div>
          )}

          {/* ══ ADMINS ══ */}
          {tab === 'admins' && (
            <div>
              <div className="mb-6"><p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Authority</p><h1 className="text-3xl font-bold">Admin Management</h1></div>
              <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-2xl p-4 mb-6">
                <h3 className="font-semibold text-yellow-300 mb-1 flex items-center gap-2"><FaExclamationTriangle size={14}/> Admin Creation Restriction</h3>
                <p className="text-gray-300 text-sm">Only primary admin <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs text-cyan-300">{primaryAdmin}</code> can add new admins.</p>
              </div>
              {canAddAdmin && (
                <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5 mb-6">
                  <h2 className="font-semibold mb-4">Add New Admin</h2>
                  <form onSubmit={submitAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[['text','Full Name','name'],['email','Email','email'],['password','Password','password']].map(([t,p,k]) => (
                      <input key={k} type={t} required placeholder={p} value={(adminForm as any)[k]} onChange={e => setAdminForm(f => ({ ...f, [k]: e.target.value }))}
                        className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                    ))}
                    <button type="submit" disabled={saving} className="md:col-span-3 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 py-2.5 rounded-xl text-sm font-semibold">
                      {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <FaPlus size={12}/>} Add Admin
                    </button>
                  </form>
                </div>
              )}
              <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                <h2 className="font-semibold text-lg mb-4">Current Admins</h2>
                <div className="space-y-3">
                  {admins.map(a => (
                    <div key={a.id} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{a.name}</p>
                        {a.isPrimary && <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">Primary</span>}
                        {a.isVerified && <span className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full flex items-center gap-1"><FaCheckCircle size={9}/> Verified</span>}
                      </div>
                      <p className="text-gray-400 text-sm">{a.email}</p>
                      <p className="text-gray-600 text-xs mt-1">Created {new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                  {admins.length === 0 && <p className="text-gray-500 text-sm">No admins found.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ══ VOTES ══ */}
          {tab === 'votes' && (
            <div>
              <div className="mb-6"><p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Audit Trail</p><h1 className="text-3xl font-bold">Votes and Hash Records</h1></div>
              <div className="space-y-4">
                {auditVotes.map(v => (
                  <div key={v.id} className="bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                      <div><span className="font-bold text-lg">{v.voterName}</span><span className="ml-2 text-xs text-gray-500 font-mono">{v.voterId}</span></div>
                      <span className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-full px-3 py-1 text-xs font-mono"><span className="text-cyan-400">Block</span><span>{v.blockHeight}</span></span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                      <div><span className="text-gray-500 text-xs">Election:</span><span className="ml-2 font-mono text-xs text-gray-300 break-all">{v.electionId}</span></div>
                      <div><span className="text-gray-500 text-xs">Candidate:</span><span className="ml-2 font-mono text-xs text-gray-300 break-all">{v.candidateId}</span></div>
                      <div className="md:col-span-2"><span className="text-gray-500 text-xs">Transaction:</span><span className="ml-2 font-mono text-xs text-gray-300 break-all">{v.transactionId}</span></div>
                      <div><span className="text-gray-500 text-xs">Time:</span><span className="ml-2 text-xs text-gray-300">{new Date(v.votedAt).toLocaleString()}</span></div>
                      <div><span className="text-gray-500 text-xs">Receipt:</span><span className="ml-2 font-mono text-xs text-cyan-400">{v.receiptId||'—'}</span></div>
                      <div className="md:col-span-2"><span className="text-gray-500 text-xs">Hash:</span><span className="ml-2 font-mono text-xs text-gray-400 break-all">{v.voteHash}</span></div>
                      {v.prevHash && <div className="md:col-span-2"><span className="text-gray-500 text-xs">Prev Hash:</span><span className="ml-2 font-mono text-xs text-gray-600 break-all">{v.prevHash}</span></div>}
                    </div>
                  </div>
                ))}
                {auditVotes.length === 0 && <div className="text-center py-16 text-gray-500"><FaVoteYea className="text-5xl mx-auto mb-3 opacity-20"/><p>No votes recorded yet.</p></div>}
              </div>
            </div>
          )}

          {/* ══ ACTIVITY LOGS ══ */}
          {tab === 'logs' && (
            <div>
              <div className="mb-6"><p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Security</p><h1 className="text-3xl font-bold">Activity Logs</h1></div>
              <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-sm text-gray-400">{activityLogs.length} recent events</span>
                  <button type="button" onClick={load.logs} className="text-xs text-cyan-400 hover:text-cyan-300">↻ Refresh</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-2.5">Time</th><th className="px-4 py-2.5">User</th><th className="px-4 py-2.5">Action</th><th className="px-4 py-2.5">Category</th><th className="px-4 py-2.5">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {activityLogs.map((log: any) => (
                        <tr key={log._id} className="hover:bg-gray-800/20">
                          <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-400">{log.user_email||'—'}</td>
                          <td className="px-4 py-2.5 text-xs font-mono text-gray-300">{log.action}</td>
                          <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${log.category==='auth'?'bg-blue-900/40 text-blue-300':log.category==='vote'?'bg-green-900/40 text-green-300':log.category==='admin'?'bg-purple-900/40 text-purple-300':log.category==='election'?'bg-yellow-900/40 text-yellow-300':'bg-gray-800 text-gray-400'}`}>{log.category}</span></td>
                          <td className="px-4 py-2.5"><span className={`text-xs ${log.status==='success'?'text-green-400':log.status==='failed'?'text-red-400':'text-yellow-400'}`}>{log.status==='success'?'✓':log.status==='failed'?'✗':'⚠'} {log.status}</span></td>
                        </tr>
                      ))}
                      {activityLogs.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">No logs yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ ML ANALYTICS ══ */}
          {tab === 'ml' && (
            <div>
              <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
                <div><p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Machine Learning</p><h1 className="text-3xl font-bold flex items-center gap-3"><FaBrain className="text-purple-400"/> ML Analytics</h1></div>
                <button type="button" onClick={load.ml} className="flex items-center gap-2 bg-purple-600/30 hover:bg-purple-600 border border-purple-500/30 px-4 py-2 rounded-xl text-sm transition-colors">↻ Refresh Analysis</button>
              </div>

              {!mlData ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-gray-800 border-t-purple-400 rounded-full animate-spin"/></div>
              ) : (
                <>
                  {/* Model Info */}
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-3 flex-wrap">
                      <FaBrain className="text-purple-400 text-xl"/>
                      <div>
                        <p className="font-semibold text-purple-300">{mlData.modelInfo?.name}</p>
                        <p className="text-xs text-gray-400">{mlData.modelInfo?.algorithms?.join(' · ')}</p>
                      </div>
                      <span className="ml-auto text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">{mlData.totalAnalysed} votes analysed</span>
                    </div>
                  </div>

                  {/* Key Insights */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Overall Fraud Score', value: `${mlData.insights?.fraudScore || 0}%`, color: mlData.insights?.fraudScore > 50 ? 'text-red-400' : 'text-green-400' },
                      { label: 'Suspicious IPs', value: mlData.insights?.suspiciousIPs?.length || 0, color: 'text-orange-400' },
                      { label: 'Peak Hour', value: `${mlData.insights?.peakHour || 0}:00`, color: 'text-cyan-400' },
                      { label: 'Vote Trend', value: mlData.insights?.trendDirection || 'stable', color: mlData.insights?.trendDirection === 'rising' ? 'text-green-400' : mlData.insights?.trendDirection === 'falling' ? 'text-red-400' : 'text-gray-400' },
                    ].map(c => (
                      <div key={c.label} className="bg-[#161b22] border border-gray-800 rounded-2xl p-4">
                        <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                        <p className={`text-2xl font-bold capitalize ${c.color}`}>{c.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Hourly pattern — actual vs expected */}
                  <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 mb-6">
                    <h3 className="text-lg font-bold mb-1">Hourly Vote Pattern vs Expected Normal</h3>
                    <p className="text-xs text-gray-500 mb-4">Actual votes (cyan) vs statistically expected pattern (purple). Large deviations may indicate fraud.</p>
                    {mlData.hourlyPattern?.some((h: any) => h.votes > 0) ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={mlData.hourlyPattern}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                          <XAxis dataKey="hour" stroke="#4b5563" fontSize={10}/>
                          <YAxis stroke="#4b5563" fontSize={10}/>
                          <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #374151', borderRadius: '8px' }}/>
                          <Legend/>
                          <Line type="monotone" dataKey="votes" stroke="#22d3ee" strokeWidth={2} dot={false} name="Actual"/>
                          <Line type="monotone" dataKey="expected" stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Expected"/>
                        </LineChart>
                      </ResponsiveContainer>
                    ) : <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No vote data for hourly pattern</div>}
                  </div>

                  {/* Per-election fraud + winner */}
                  <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden mb-6">
                    <div className="px-5 py-3 border-b border-gray-800">
                      <h3 className="font-semibold">Election Intelligence — Fraud Score & Winner Analysis</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-2.5">Election</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Votes</th>
                          <th className="px-4 py-2.5">Fraud Score</th><th className="px-4 py-2.5">Suspicious IPs</th><th className="px-4 py-2.5">Trend</th><th className="px-4 py-2.5">Winner</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-800/50">
                          {mlData.electionFraudScores?.map((el: any) => (
                            <tr key={el.electionId} className="hover:bg-gray-800/20">
                              <td className="px-4 py-3 font-medium text-sm">{el.electionTitle}</td>
                              <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_BADGE[el.status]||STATUS_BADGE.draft}`}>{el.status}</span></td>
                              <td className="px-4 py-3 font-mono text-cyan-400">{el.totalVotes}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-700 rounded-full h-2"><div className={`h-2 rounded-full ${el.fraudScore > 50 ? 'bg-red-500' : el.fraudScore > 25 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${el.fraudScore}%` }}/></div>
                                  <span className={`text-xs font-mono ${el.fraudScore > 50 ? 'text-red-400' : el.fraudScore > 25 ? 'text-yellow-400' : 'text-green-400'}`}>{el.fraudScore}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs">{el.suspiciousIPs > 0 ? <span className="text-orange-400">⚠ {el.suspiciousIPs}</span> : <span className="text-green-400">✓ 0</span>}</td>
                              <td className="px-4 py-3 text-xs capitalize">
                                <span className={el.trendDirection === 'rising' ? 'text-green-400' : el.trendDirection === 'falling' ? 'text-red-400' : 'text-gray-400'}>
                                  {el.trendDirection === 'rising' ? '↑' : el.trendDirection === 'falling' ? '↓' : '→'} {el.trendDirection}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs">
                                {el.winner ? (
                                  <div className="flex items-center gap-1.5">
                                    <FaTrophy className="text-yellow-400" size={11}/>
                                    <div><p className="font-medium text-white">{el.winner.name}</p><p className="text-gray-500">{el.winner.votes}v ({el.winner.percentage}%)</p></div>
                                  </div>
                                ) : <span className="text-gray-600">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* IP Clustering */}
                  {mlData.ipClusters?.length > 0 && (
                    <div className="bg-[#161b22] border border-orange-500/20 rounded-2xl p-5 mb-6">
                      <h3 className="font-semibold mb-1 flex items-center gap-2 text-orange-300"><FaExclamationTriangle size={14}/> IP Account Clustering Detected</h3>
                      <p className="text-xs text-gray-400 mb-4">Multiple accounts voting from the same IP address — graph-based anomaly detection.</p>
                      <div className="space-y-2">
                        {mlData.ipClusters.map((cl: any) => (
                          <div key={cl.ip} className="flex items-center gap-3 bg-orange-900/10 border border-orange-500/20 rounded-lg p-3">
                            <span className="font-mono text-xs text-orange-300 flex-shrink-0">{cl.ip}</span>
                            <span className="text-xs text-gray-400">{cl.userCount} accounts:</span>
                            <span className="text-xs text-gray-300">{cl.users.join(', ')}{cl.userCount > 5 ? ` +${cl.userCount - 5} more` : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* QKD Status from ML */}
                  {mlData.qkdSession && (
                    <div className="bg-[#161b22] border border-cyan-500/20 rounded-2xl p-5">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-cyan-300"><FaAtom size={14}/> Live QKD Session Status</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[['Protocol', mlData.qkdSession.bbProtocol],['Basis Match',`${mlData.qkdSession.basisMatch}%`],['QBER Rate',`${mlData.qkdSession.qberRate}%`],['Channel',mlData.qkdSession.secure ? '🔒 Secure' : '⚠ Compromised']].map(([l,v]) => (
                          <div key={l} className="bg-cyan-900/10 border border-cyan-500/20 rounded-lg p-3">
                            <p className="text-xs text-gray-500">{l}</p>
                            <p className="text-sm font-mono text-cyan-300 mt-0.5 break-all">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══ QUANTUM SECURITY ══ */}
          {tab === 'quantum' && (
            <div>
              <div className="mb-6"><p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Post-Quantum Cryptography</p><h1 className="text-3xl font-bold flex items-center gap-3"><FaAtom className="text-cyan-400"/> Quantum Security</h1></div>
              {!quantumData ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-gray-800 border-t-cyan-400 rounded-full animate-spin"/></div>
              ) : (
                <>
                  {/* NIST Compliance */}
                  <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-2xl p-5 mb-6">
                    <div className="flex items-center gap-3 flex-wrap">
                      <FaAtom className="text-cyan-400 text-2xl"/>
                      <div><p className="font-bold text-cyan-300 text-lg">NIST Post-Quantum Compliant</p><p className="text-xs text-gray-400">Security Level 5 — 256-bit quantum security (equivalent to AES-256)</p></div>
                      <span className="ml-auto text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full border border-green-500/30">✓ Quantum-Safe</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Encryption specs */}
                    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                      <h3 className="font-semibold mb-4 text-cyan-300">🔐 Encryption Algorithms</h3>
                      <div className="space-y-3">
                        {Object.entries(quantumData.encryption || {}).map(([k, v]) => (
                          <div key={k} className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"/>
                            <div><p className="text-xs text-gray-400 uppercase tracking-wider">{k.replace(/_/g,' ')}</p><p className="text-sm text-gray-200 font-mono">{String(v)}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lattice params */}
                    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                      <h3 className="font-semibold mb-4 text-purple-300">🔷 Lattice-Based Cryptography</h3>
                      <div className="space-y-3">
                        {Object.entries(quantumData.latticeParams || {}).map(([k, v]) => (
                          <div key={k} className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"/>
                            <div><p className="text-xs text-gray-400 uppercase tracking-wider">{k.replace(/_/g,' ')}</p>
                            <p className={`text-sm font-mono ${v === true ? 'text-green-400' : v === false ? 'text-red-400' : 'text-gray-200'}`}>{v === true ? '✓ Yes' : v === false ? '✗ No' : String(v)}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hash Chain */}
                    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                      <h3 className="font-semibold mb-4 text-yellow-300">⛓ Hash Chain Structure</h3>
                      <div className="space-y-3">
                        {Object.entries(quantumData.hashChain || {}).map(([k, v]) => (
                          <div key={k} className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0"/>
                            <div><p className="text-xs text-gray-400 uppercase tracking-wider">{k.replace(/_/g,' ')}</p><p className="text-sm text-gray-200 font-mono">{String(v)}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* QKD Session */}
                    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                      <h3 className="font-semibold mb-4 text-green-300">⚛️ QKD Live Session (BB84)</h3>
                      {quantumData.qkdSession && (
                        <div className="space-y-3">
                          {[['Session ID', quantumData.qkdSession.sessionId],['Protocol', quantumData.qkdSession.bbProtocol],['Basis Match', `${quantumData.qkdSession.basisMatch}%`],['QBER Rate', `${quantumData.qkdSession.qberRate}% (threshold: <11%)`],['Channel Secure', quantumData.qkdSession.secure ? '✅ Yes — No eavesdropping detected' : '⚠ Potentially compromised']].map(([l,v]) => (
                            <div key={l} className="flex items-start gap-3">
                              <span className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0"/>
                              <div><p className="text-xs text-gray-400 uppercase tracking-wider">{l}</p><p className="text-sm text-gray-200 font-mono break-all">{String(v)}</p></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                    <h3 className="font-semibold mb-3">Sample SHA-256 Double-Round Hash</h3>
                    <code className="text-xs text-cyan-300 font-mono break-all">{quantumData.testHashSample}</code>
                    <p className="text-xs text-gray-500 mt-2">Key ID: {quantumData.keyId} · Security Level: {quantumData.securityLevel}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ FRAUD ALERTS ══ */}
          {tab === 'fraud' && (
            <div>
              <div className="mb-6"><p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Security Intelligence</p><h1 className="text-3xl font-bold flex items-center gap-3"><FaExclamationTriangle className="text-red-400"/> Fraud Alerts</h1></div>
              {!fraudData ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-gray-800 border-t-red-400 rounded-full animate-spin"/></div>
              ) : (
                <>
                  {/* Overview */}
                  <div className={`rounded-2xl p-5 mb-6 border ${fraudData.overallRisk === 'critical' ? 'bg-red-900/20 border-red-500/40' : fraudData.overallRisk === 'high' ? 'bg-orange-900/20 border-orange-500/40' : fraudData.overallRisk === 'medium' ? 'bg-yellow-900/20 border-yellow-500/40' : 'bg-green-900/20 border-green-500/40'}`}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <FaShieldAlt className={`text-2xl ${fraudData.overallRisk === 'critical' ? 'text-red-400' : fraudData.overallRisk === 'high' ? 'text-orange-400' : fraudData.overallRisk === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}/>
                      <div>
                        <p className="font-bold capitalize text-lg">{fraudData.overallRisk} Risk Level</p>
                        <p className="text-xs text-gray-400">{fraudData.totalAlerts} total alerts · {fraudData.criticalCount} critical</p>
                      </div>
                      <button type="button" onClick={load.fraud} className="ml-auto text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg">↻ Refresh</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    {[['Same-IP Voting', fraudData.sameIpVoting?.length || 0, 'text-red-400', 'Multiple votes from same IP'],['Brute Force', fraudData.bruteForceAlerts?.length || 0, 'text-orange-400', 'IPs with 5+ failed logins'],['Fresh Accounts', fraudData.freshAccountVotes?.length || 0, 'text-yellow-400', 'New accounts voting immediately']].map(([l,v,c,desc]) => (
                      <div key={l} className="bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                        <p className="text-xs text-gray-500 mb-1">{desc}</p>
                        <p className={`text-4xl font-bold ${c}`}>{v}</p>
                        <p className="text-sm text-gray-300 mt-1 font-medium">{l}</p>
                      </div>
                    ))}
                  </div>

                  {/* Same IP voting detail */}
                  {fraudData.sameIpVoting?.length > 0 && (
                    <div className="bg-[#161b22] border border-red-500/20 rounded-2xl overflow-hidden mb-4">
                      <div className="px-5 py-3 border-b border-gray-800 bg-red-900/20"><h3 className="font-semibold text-red-300">🚨 Same-IP Multiple Votes</h3></div>
                      <div className="divide-y divide-gray-800/50">
                        {fraudData.sameIpVoting.map((alert: any, i: number) => (
                          <div key={i} className="px-5 py-3 flex items-center gap-4">
                            <code className="font-mono text-sm text-red-300">{alert.ip}</code>
                            <span className="text-xs text-gray-400">{alert.voteCount} votes from this IP</span>
                            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${RISK_BADGE[alert.severity]||RISK_BADGE.medium}`}>{alert.severity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Brute force */}
                  {fraudData.bruteForceAlerts?.length > 0 && (
                    <div className="bg-[#161b22] border border-orange-500/20 rounded-2xl overflow-hidden mb-4">
                      <div className="px-5 py-3 border-b border-gray-800 bg-orange-900/20"><h3 className="font-semibold text-orange-300">⚡ Brute Force Attempts</h3></div>
                      <div className="divide-y divide-gray-800/50">
                        {fraudData.bruteForceAlerts.map((alert: any, i: number) => (
                          <div key={i} className="px-5 py-3 flex items-center gap-4">
                            <code className="font-mono text-sm text-orange-300">{alert.ip}</code>
                            <span className="text-xs text-gray-400">{alert.count} failed login attempts</span>
                            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${RISK_BADGE[alert.severity]||RISK_BADGE.medium}`}>{alert.severity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fresh accounts */}
                  {fraudData.freshAccountVotes?.length > 0 && (
                    <div className="bg-[#161b22] border border-yellow-500/20 rounded-2xl overflow-hidden mb-4">
                      <div className="px-5 py-3 border-b border-gray-800 bg-yellow-900/20"><h3 className="font-semibold text-yellow-300">⚠ Fresh Account Votes</h3></div>
                      <div className="divide-y divide-gray-800/50">
                        {fraudData.freshAccountVotes.map((alert: any, i: number) => (
                          <div key={i} className="px-5 py-3 flex items-center gap-4">
                            <span className="text-sm font-medium">{alert.voterName || 'Unknown'}</span>
                            <span className="text-xs text-gray-400">Voted within 1 hour of account creation</span>
                            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${RISK_BADGE.medium}`}>medium</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {fraudData.totalAlerts === 0 && (
                    <div className="text-center py-16 text-green-400">
                      <FaCheckCircle className="text-5xl mx-auto mb-3"/>
                      <p className="text-xl font-bold">No Fraud Detected</p>
                      <p className="text-gray-400 text-sm mt-2">All voting patterns are within normal parameters.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}


          {/* ══ SYSTEM SETTINGS ══ */}
          {tab === 'settings' && (
            <div>
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Configuration</p>
                <h1 className="text-3xl font-bold flex items-center gap-3"><FaSlidersH className="text-cyan-400"/> System Settings</h1>
              </div>

              {settings === null ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-gray-800 border-t-cyan-400 rounded-full animate-spin"/></div>
              ) : (
                <div className="space-y-6">

                  {/* Vote Timer / Cooldown */}
                  <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2"><FaClock size={16} className="text-yellow-400"/> Vote Cooldown Timer</h2>
                        <p className="text-gray-400 text-sm mt-0.5">Enforce a waiting period between votes for each user</p>
                      </div>
                      <button
                        onClick={() => setSettingsForm(f => ({ ...f, vote_cooldown_enabled: !f.vote_cooldown_enabled }))}
                        className={`text-3xl transition-colors ${settingsForm.vote_cooldown_enabled ? 'text-green-400' : 'text-gray-600'}`}>
                        {settingsForm.vote_cooldown_enabled ? <FaToggleOn/> : <FaToggleOff/>}
                      </button>
                    </div>
                    <div className={settingsForm.vote_cooldown_enabled ? '' : 'opacity-40 pointer-events-none'}>
                      <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Cooldown Duration (seconds)</label>
                      <div className="flex items-center gap-4">
                        <input type="range" min="0" max="3600" step="30" value={settingsForm.vote_cooldown_seconds}
                          onChange={e => setSettingsForm(f => ({ ...f, vote_cooldown_seconds: parseInt(e.target.value) }))}
                          className="flex-1 h-2 accent-yellow-500"/>
                        <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 min-w-[100px] text-center">
                          <span className="text-yellow-300 font-mono text-lg">{settingsForm.vote_cooldown_seconds}s</span>
                          <p className="text-gray-500 text-xs">{settingsForm.vote_cooldown_seconds >= 60 ? `(${Math.floor(settingsForm.vote_cooldown_seconds/60)}m ${settingsForm.vote_cooldown_seconds%60}s)` : ''}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {[[0,'Off'],[30,'30s'],[60,'1m'],[300,'5m'],[600,'10m'],[1800,'30m']].map(([v,l]) => (
                          <button type="button" key={v} onClick={() => setSettingsForm(f => ({ ...f, vote_cooldown_seconds: v as number }))}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${settingsForm.vote_cooldown_seconds === v ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Per-election cooldown can also be set individually on each election (overrides global).
                      </p>
                    </div>
                  </div>

                  {/* Age Restriction */}
                  <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-1"><FaChild size={16} className="text-blue-400"/> Age Restriction</h2>
                    <p className="text-gray-400 text-sm mb-4">Minimum age required to register and vote</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input type="range" min="16" max="25" step="1" value={settingsForm.min_voter_age}
                          onChange={e => setSettingsForm(f => ({ ...f, min_voter_age: parseInt(e.target.value) }))}
                          className="w-full h-2 accent-blue-500"/>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>16</span><span>18 (default)</span><span>21</span><span>25</span>
                        </div>
                      </div>
                      <div className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 text-center">
                        <span className="text-blue-300 font-bold text-3xl">{settingsForm.min_voter_age}</span>
                        <p className="text-gray-500 text-xs mt-0.5">years</p>
                      </div>
                    </div>
                    <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-200">
                      ℹ️ Changing this affects new registrations. Existing verified users are not affected.
                    </div>
                  </div>

                  {/* Maintenance Mode */}
                  <div className="bg-[#161b22] border border-orange-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2"><FaServer size={16} className="text-orange-400"/> Maintenance Mode</h2>
                        <p className="text-gray-400 text-sm mt-0.5">Prevent voter logins while performing maintenance</p>
                      </div>
                      <button
                        onClick={() => setSettingsForm(f => ({ ...f, maintenance_mode: !f.maintenance_mode }))}
                        className={`text-3xl transition-colors ${settingsForm.maintenance_mode ? 'text-orange-400' : 'text-gray-600'}`}>
                        {settingsForm.maintenance_mode ? <FaToggleOn/> : <FaToggleOff/>}
                      </button>
                    </div>
                    {settingsForm.maintenance_mode && (
                      <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 text-orange-300 text-xs">
                        ⚠️ Maintenance mode is ON — voters cannot log in. Only admins can access the system.
                      </div>
                    )}
                  </div>

                  {/* Privacy Policy Version */}
                  <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-1"><FaFileExport size={16} className="text-purple-400"/> Privacy Policy Version</h2>
                    <p className="text-gray-400 text-sm mb-3">Increment this to require existing users to re-accept on next login</p>
                    <input type="text" value={settingsForm.privacy_policy_version}
                      onChange={e => setSettingsForm(f => ({ ...f, privacy_policy_version: e.target.value }))}
                      placeholder="e.g. 1.0, 2.0, 2.1"
                      className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-48"/>
                  </div>

                  {/* Current Settings Summary */}
                  <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Current Active Settings</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        ['Min Age', `${settings.min_voter_age || 18}+`, 'text-blue-400'],
                        ['Vote Cooldown', settings.vote_cooldown_enabled ? `${settings.vote_cooldown_seconds}s` : 'Off', settings.vote_cooldown_enabled ? 'text-yellow-400' : 'text-gray-400'],
                        ['Maintenance', settings.maintenance_mode ? 'ON' : 'Off', settings.maintenance_mode ? 'text-orange-400' : 'text-green-400'],
                        ['Privacy v', settings.privacy_policy_version || '1.0', 'text-purple-400'],
                      ].map(([l, v, c]) => (
                        <div key={l} className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                          <p className="text-xs text-gray-500">{l}</p>
                          <p className={`font-bold text-lg ${c}`}>{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    disabled={settingsSaving}
                    onClick={async () => {
                      setSettingsSaving(true);
                      try {
                        const r = await aF('/api/admin/settings', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(settingsForm),
                        });
                        if (r.ok) { t$('Settings saved!'); load.settings(); }
                        else { const d = await r.json(); t$(d.error || 'Failed', false); }
                      } finally { setSettingsSaving(false); }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 py-3.5 rounded-2xl text-base font-semibold transition-colors">
                    {settingsSaving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <FaSlidersH/>}
                    {settingsSaving ? 'Saving...' : 'Save All Settings'}
                  </button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

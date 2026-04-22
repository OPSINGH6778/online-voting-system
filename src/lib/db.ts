import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Safe URI: if Vercel env has <db_password> placeholder, fall back to hardcoded
const _RAW = process.env.MONGODB_URI || '';
const MONGODB_URI = (_RAW === '' || _RAW.includes('<db_password>') || _RAW.includes('<password>'))
  ? 'mongodb+srv://opsingh26122002_db_user:Admin%4012233344@cluster0.badygua.mongodb.net/?appName=Cluster0'
  : _RAW;

declare global {
  var _mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}
if (!global._mongooseCache) global._mongooseCache = { conn: null, promise: null };
const cached = global._mongooseCache;

async function connectToDatabase() {
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5,
      minPoolSize: 0,
    }).then(m => {
      console.log('✅ MongoDB connected');
      return m;
    }).catch(err => {
      cached.promise = null;
      throw new Error(`Database connection failed: ${err.message}`);
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

// ── Schemas ────────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  name:                    { type: String, required: true, trim: true },
  email:                   { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash:           { type: String, required: true },
  role:                    { type: String, required: true, enum: ['user', 'admin', 'moderator'], default: 'user' },
  voter_id:                { type: String, unique: true, sparse: true },
  // Age verification
  date_of_birth:           { type: Date, default: null },
  age_verified:            { type: Boolean, default: false },
  // Identity
  aadhaar_number:          { type: String, default: '' },
  govt_voter_id:           { type: String, default: '' },
  phone:                   { type: String, default: '' },
  // Privacy & consent
  privacy_accepted:        { type: Boolean, default: false },
  privacy_accepted_at:     { type: Date, default: null },
  privacy_version:         { type: String, default: '' },
  terms_accepted:          { type: Boolean, default: false },
  // Status flags
  is_verified:             { type: Boolean, default: false },
  is_active:               { type: Boolean, default: true },
  email_verified:          { type: Boolean, default: false },
  // Security
  failed_logins:           { type: Number, default: 0 },
  locked_until:            { type: Date, default: null },
  last_login:              { type: Date, default: null },
  last_login_ip:           { type: String, default: '' },
  last_vote_at:            { type: Date, default: null },  // for vote cooldown
  // Password reset
  password_reset_token:    { type: String, default: '' },
  password_reset_expires:  { type: Date, default: null },
  // Timestamps
  created_at:              { type: Date, default: Date.now },
  updated_at:              { type: Date, default: Date.now },
});

const OTPSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  otp:        { type: String, required: true },
  type:       { type: String, enum: ['login', 'signup', 'reset', 'email_verify'], default: 'login' },
  expires_at: { type: Date, required: true },
  used:       { type: Boolean, default: false },
  ip_address: { type: String, default: '' },
  attempts:   { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});
OTPSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // auto-delete expired

const ActivityLogSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user_email: { type: String, default: '' },
  action:     { type: String, required: true },
  category:   { type: String, enum: ['auth', 'vote', 'election', 'admin', 'system', 'security'], default: 'system' },
  details:    { type: String, default: '' },
  ip_address: { type: String, default: '' },
  user_agent: { type: String, default: '' },
  status:     { type: String, enum: ['success', 'failed', 'warning', 'blocked'], default: 'success' },
  created_at: { type: Date, default: Date.now },
});
ActivityLogSchema.index({ created_at: -1 });
ActivityLogSchema.index({ user_id: 1 });

// System settings (singleton document)
const SystemSettingsSchema = new mongoose.Schema({
  key:        { type: String, required: true, unique: true },
  value:      { type: mongoose.Schema.Types.Mixed, required: true },
  updated_by: { type: String, default: '' },
  updated_at: { type: Date, default: Date.now },
});

const CandidateSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  party:       { type: String, default: '' },
  description: { type: String, default: '' },
  photo:       { type: String, default: '' },
  manifesto:   { type: String, default: '' },
  symbol:      { type: String, default: '' },
  age:         { type: Number, default: 0 },
});

const ElectionSchema = new mongoose.Schema({
  title:             { type: String, required: true, trim: true },
  description:       { type: String, default: '' },
  candidates:        [CandidateSchema],
  status:            { type: String, enum: ['draft', 'upcoming', 'active', 'closed', 'archived'], default: 'draft' },
  start_date:        { type: Date },
  end_date:          { type: Date },
  is_locked:         { type: Boolean, default: false },
  result_published:  { type: Boolean, default: false },
  winner_id:         { type: String, default: '' },
  total_votes:       { type: Number, default: 0 },
  // Vote timer (seconds between votes, 0 = disabled)
  vote_cooldown:     { type: Number, default: 0 },
  cooldown_enabled:  { type: Boolean, default: false },
  // Age restriction
  min_age:           { type: Number, default: 18 },
  // Area / region (for area-wise stats)
  region:            { type: String, default: 'National' },
  created_by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at:        { type: Date, default: Date.now },
  updated_at:        { type: Date, default: Date.now },
});

const VoteSchema = new mongoose.Schema({
  user_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  election_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  candidate_id:   { type: String, required: true },
  vote_hash:      { type: String, required: true, unique: true },
  prev_hash:      { type: String, default: '0'.repeat(64) },
  transaction_id: { type: String, default: '' },
  block_height:   { type: Number, default: 0 },
  receipt_id:     { type: String, default: '' },
  ip_address:     { type: String, default: '' },
  user_agent:     { type: String, default: '' },
  fraud_score:    { type: Number, default: 0 },
  created_at:     { type: Date, default: Date.now },
});
VoteSchema.index({ user_id: 1, election_id: 1 }, { unique: true });
VoteSchema.index({ receipt_id: 1 });
VoteSchema.index({ election_id: 1, created_at: 1 });

// ── Models ────────────────────────────────────────────────────────────────────
export const User           = mongoose.models.User           || mongoose.model('User', UserSchema);
export const OTP            = mongoose.models.OTP            || mongoose.model('OTP', OTPSchema);
export const Election       = mongoose.models.Election       || mongoose.model('Election', ElectionSchema);
export const Vote           = mongoose.models.Vote           || mongoose.model('Vote', VoteSchema);
export const ActivityLog    = mongoose.models.ActivityLog    || mongoose.model('ActivityLog', ActivityLogSchema);
export const SystemSettings = mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);

// ── DB Operations ─────────────────────────────────────────────────────────────
export const dbOperations = {
  // ── Users ──────────────────────────────────────────────────────────────────
  getUserByEmail: async (email: string) => {
    await connectToDatabase();
    return User.findOne({ email: email.toLowerCase().trim() });
  },
  getUserById: async (id: string) => {
    await connectToDatabase();
    return User.findById(id);
  },
  createUser: async (data: any) => {
    await connectToDatabase();
    return User.create(data);
  },
  updateUser: async (id: string, data: any) => {
    await connectToDatabase();
    data.updated_at = new Date();
    return User.findByIdAndUpdate(id, data, { new: true });
  },
  getAllUsers: async () => {
    await connectToDatabase();
    return User.find({ role: 'user' })
      .select('-password_hash -password_reset_token')
      .sort({ created_at: -1 });
  },
  getAllAdmins: async () => {
    await connectToDatabase();
    return User.find({ role: { $in: ['admin', 'moderator'] } })
      .select('-password_hash -password_reset_token')
      .sort({ created_at: 1 });
  },
  deleteUser: async (id: string) => {
    await connectToDatabase();
    const PRIMARY = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const user = await User.findById(id);
    if (user?.email?.toLowerCase() === PRIMARY) throw new Error('Cannot delete primary admin');
    return User.findByIdAndDelete(id);
  },
  getUserCount:  async () => { await connectToDatabase(); return User.countDocuments({ role: 'user' }); },
  getAdminCount: async () => { await connectToDatabase(); return User.countDocuments({ role: { $in: ['admin','moderator'] } }); },
  getUserByResetToken: async (token: string) => {
    await connectToDatabase();
    return User.findOne({ password_reset_token: token, password_reset_expires: { $gt: new Date() } });
  },

  // ── OTP ────────────────────────────────────────────────────────────────────
  createOTP: async (userId: string, otp: string, expiresAt: Date, type = 'login', ip = '') => {
    await connectToDatabase();
    // Invalidate old OTPs of same type for this user
    await OTP.updateMany({ user_id: userId, type, used: false }, { $set: { used: true } });
    return OTP.create({ user_id: userId, otp, expires_at: expiresAt, type, ip_address: ip });
  },
  getOTP: async (userId: string, otp: string, type = 'login') => {
    await connectToDatabase();
    return OTP.findOne({
      user_id: userId, otp, type, used: false,
      expires_at: { $gt: new Date() },
    });
  },
  markOTPUsed: async (otpId: string) => {
    await connectToDatabase();
    return OTP.findByIdAndUpdate(otpId, { used: true });
  },

  // ── Activity Log ───────────────────────────────────────────────────────────
  logActivity: async (data: {
    user_id?: string; user_email?: string; action: string;
    category?: string; details?: string; ip_address?: string;
    user_agent?: string; status?: string;
  }) => {
    await connectToDatabase();
    try { return ActivityLog.create(data); } catch { /* non-blocking */ }
  },
  getActivityLogs: async (limit = 200) => {
    await connectToDatabase();
    return ActivityLog.find({}).sort({ created_at: -1 }).limit(limit).lean();
  },

  // ── System Settings ────────────────────────────────────────────────────────
  getSetting: async (key: string) => {
    await connectToDatabase();
    const doc = await SystemSettings.findOne({ key });
    return doc?.value;
  },
  setSetting: async (key: string, value: any, updatedBy = '') => {
    await connectToDatabase();
    return SystemSettings.findOneAndUpdate(
      { key },
      { value, updated_by: updatedBy, updated_at: new Date() },
      { upsert: true, new: true }
    );
  },
  getAllSettings: async () => {
    await connectToDatabase();
    const docs = await SystemSettings.find({});
    const map: Record<string, any> = {};
    docs.forEach((d: any) => { map[d.key] = d.value; });
    return map;
  },

  // ── Elections ──────────────────────────────────────────────────────────────
  createElection: async (data: any) => {
    await connectToDatabase();
    return Election.create(data);
  },
  getAllElections: async () => {
    await connectToDatabase();
    return Election.find({}).sort({ created_at: -1 }).lean();
  },
  getElectionById: async (id: string) => {
    await connectToDatabase();
    return Election.findById(id);
  },
  updateElection: async (id: string, data: any) => {
    await connectToDatabase();
    const el = await Election.findById(id);
    if (el?.is_locked && !data.status && !data.result_published && !data.cooldown_enabled && data.vote_cooldown === undefined) {
      throw new Error('Election is locked and cannot be edited');
    }
    data.updated_at = new Date();
    return Election.findByIdAndUpdate(id, data, { new: true });
  },
  deleteElection: async (id: string) => {
    await connectToDatabase();
    const el = await Election.findById(id);
    if (!el) throw new Error('Election not found');
    if (el.status === 'active') throw new Error('Cannot delete an active election');
    const voteCount = await Vote.countDocuments({ election_id: id });
    if (voteCount > 0) throw new Error(`Cannot delete: ${voteCount} votes already cast`);
    return Election.findByIdAndDelete(id);
  },
  getActiveElections: async () => {
    await connectToDatabase();
    const now = new Date();
    // Auto-activate
    await Election.updateMany(
      { status: 'upcoming', start_date: { $lte: now } },
      { $set: { status: 'active', is_locked: true } }
    );
    // Auto-close
    await Election.updateMany(
      { status: 'active', end_date: { $lte: now, $ne: null } },
      { $set: { status: 'closed' } }
    );
    return Election.find({ status: 'active' }).sort({ created_at: -1 }).lean();
  },
  publishResult: async (id: string) => {
    await connectToDatabase();
    return Election.findByIdAndUpdate(
      id,
      { result_published: true, status: 'closed', updated_at: new Date() },
      { new: true }
    );
  },

  // ── Votes ──────────────────────────────────────────────────────────────────
  castVote: async (data: any) => {
    await connectToDatabase();
    const vote = await Vote.create(data);
    await Election.findByIdAndUpdate(data.election_id, { $inc: { total_votes: 1 } });
    // Update last_vote_at for cooldown
    await User.findByIdAndUpdate(data.user_id, { last_vote_at: new Date() });
    return vote;
  },
  hasUserVoted: async (userId: string, electionId: string) => {
    await connectToDatabase();
    return Vote.findOne({ user_id: userId, election_id: electionId });
  },
  getLastVoteHash: async (electionId: string) => {
    await connectToDatabase();
    const last = await Vote.findOne({ election_id: electionId }).sort({ created_at: -1 });
    return last?.vote_hash || '0'.repeat(64);
  },
  getAllVotes: async () => {
    await connectToDatabase();
    return Vote.find({}).sort({ created_at: -1 }).lean();
  },
  getVotesWithDetails: async () => {
    await connectToDatabase();
    return Vote.find({})
      .populate('user_id', 'name voter_id email')
      .populate('election_id', 'title candidates')
      .sort({ created_at: -1 })
      .lean();
  },
  getVotesByUser: async (userId: string) => {
    await connectToDatabase();
    return Vote.find({ user_id: userId })
      .populate('election_id', 'title status result_published')
      .sort({ created_at: -1 })
      .lean();
  },
  getVoteByReceipt: async (receiptId: string) => {
    await connectToDatabase();
    return Vote.findOne({ receipt_id: receiptId }).lean();
  },
  getTotalVoteCount: async () => { await connectToDatabase(); return Vote.countDocuments(); },
  getElectionResults: async (electionId: string) => {
    await connectToDatabase();
    return Vote.aggregate([
      { $match: { election_id: new mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: '$candidate_id', count: { $sum: 1 } } },
    ]);
  },
  getVoteTrend: async () => {
    await connectToDatabase();
    return Vote.aggregate([
      { $group: { _id: { $dateToString: { format: '%H:00', date: '$created_at' } }, votes: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { time: '$_id', votes: 1, _id: 0 } },
    ]);
  },
  verifyHashChain: async (electionId: string) => {
    await connectToDatabase();
    const votes = await Vote.find({ election_id: electionId }).sort({ created_at: 1 });
    let prevHash = '0'.repeat(64);
    for (const v of votes) {
      if (v.prev_hash !== prevHash) return { valid: false, brokenAt: v._id.toString(), totalVotes: votes.length };
      prevHash = v.vote_hash;
    }
    return { valid: true, totalVotes: votes.length };
  },
};

// ── Seed ──────────────────────────────────────────────────────────────────────
export async function initDatabase() {
  await connectToDatabase();

  const adminEmail    = process.env.ADMIN_EMAIL    || 'opsingh26122002@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12233344';

  if (!(await User.findOne({ email: adminEmail }))) {
    await User.create({
      name: 'Om Prakash Singh',
      email: adminEmail,
      password_hash: await bcrypt.hash(adminPassword, 12),
      role: 'admin',
      is_verified: true,
      email_verified: true,
      age_verified: true,
      privacy_accepted: true,
      privacy_accepted_at: new Date(),
      privacy_version: '1.0',
    });
    console.log('✅ Primary admin seeded:', adminEmail);
  }

  if ((await Election.countDocuments()) === 0) {
    await Election.create({
      title: 'Presidential Election 2026',
      description: 'Cast your vote for the next President of India.',
      status: 'active',
      is_locked: true,
      min_age: 18,
      region: 'National',
      candidates: [
        { name: 'Candidate A', party: 'Progressive Alliance', description: 'Experienced leader.', manifesto: 'Education, Healthcare, Digital India 2.0.' },
        { name: 'Candidate B', party: 'National Conservative', description: 'Economic growth advocate.', manifesto: 'Economy, Security, Infrastructure.' },
        { name: 'Candidate C', party: 'Independent', description: 'People first.', manifesto: 'Transparency, Equality, Justice.' },
      ],
    });
    console.log('✅ Sample election seeded');
  }

  // Default settings
  const defaults = [
    { key: 'vote_cooldown_enabled', value: false },
    { key: 'vote_cooldown_seconds', value: 0 },
    { key: 'privacy_policy_version', value: '1.0' },
    { key: 'min_voter_age', value: 18 },
    { key: 'maintenance_mode', value: false },
  ];
  for (const s of defaults) {
    const existing = await SystemSettings.findOne({ key: s.key });
    if (!existing) await SystemSettings.create(s);
  }
}

export default connectToDatabase;
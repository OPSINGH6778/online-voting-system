const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password_hash: String,
  role: { type: String, enum: ['user', 'admin', 'moderator'] },
  voter_id: String,
  date_of_birth: Date, age_verified: Boolean,
  aadhaar_number: String, govt_voter_id: String, phone: String,
  privacy_accepted: Boolean, privacy_accepted_at: Date, privacy_version: String,
  terms_accepted: Boolean,
  is_verified: Boolean, email_verified: Boolean,
  failed_logins: Number, locked_until: Date,
  last_login: Date, last_vote_at: Date,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const ElectionSchema = new mongoose.Schema({
  title: String, description: String,
  candidates: [{ name: String, party: String, description: String, photo: String, manifesto: String }],
  status: { type: String, enum: ['draft','upcoming','active','closed','archived'], default: 'draft' },
  is_locked: Boolean, result_published: Boolean,
  vote_cooldown: { type: Number, default: 0 },
  cooldown_enabled: { type: Boolean, default: false },
  min_age: { type: Number, default: 18 },
  region: { type: String, default: 'National' },
  total_votes: { type: Number, default: 0 },
  start_date: Date, end_date: Date,
  created_at: { type: Date, default: Date.now },
});

const SystemSettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: mongoose.Schema.Types.Mixed,
  updated_at: { type: Date, default: Date.now },
});

const User           = mongoose.models.User           || mongoose.model('User', UserSchema);
const Election       = mongoose.models.Election       || mongoose.model('Election', ElectionSchema);
const SystemSettings = mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);

async function init() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('❌ MONGODB_URI not set in .env.local'); process.exit(1); }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ Connected to MongoDB');

  const adminEmail    = process.env.ADMIN_EMAIL    || 'opsingh26122002@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12233344';

  if (!(await User.findOne({ email: adminEmail }))) {
    await User.create({
      name: 'Om Prakash Singh', email: adminEmail,
      password_hash: await bcrypt.hash(adminPassword, 12),
      role: 'admin', is_verified: true, email_verified: true,
      age_verified: true, privacy_accepted: true, terms_accepted: true,
      privacy_accepted_at: new Date(), privacy_version: '1.0',
    });
    console.log('✅ Primary admin created:', adminEmail);
  } else {
    console.log('ℹ️  Admin already exists:', adminEmail);
  }

  // Sample voters
  const voters = [
    { name: 'Chandrika Seelam',  email: 'voter1@securevote.com', voter_id: 'VOT-100001', dob: '1995-03-15' },
    { name: 'Venkat Kumar',      email: 'voter2@securevote.com', voter_id: 'VOT-100002', dob: '1990-07-22' },
    { name: 'Maniraj Singh',     email: 'voter3@securevote.com', voter_id: 'VOT-100003', dob: '1988-11-05' },
    { name: 'Shabran Ali',       email: 'voter4@securevote.com', voter_id: 'VOT-100004', dob: '1993-01-30' },
  ];
  for (const v of voters) {
    if (!(await User.findOne({ email: v.email }))) {
      await User.create({
        name: v.name, email: v.email,
        password_hash: await bcrypt.hash('VoteSecure2024!', 12),
        role: 'user', voter_id: v.voter_id, is_verified: true, email_verified: true,
        date_of_birth: new Date(v.dob), age_verified: true,
        privacy_accepted: true, terms_accepted: true,
        privacy_accepted_at: new Date(), privacy_version: '1.0',
      });
      console.log('✅ Voter created:', v.email);
    }
  }

  // Elections
  if ((await Election.countDocuments()) === 0) {
    await Election.create({
      title: 'Presidential Election 2026',
      description: 'Cast your vote for the next President of India.',
      status: 'active', is_locked: true, min_age: 18, region: 'National',
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
    if (!(await SystemSettings.findOne({ key: s.key }))) {
      await SystemSettings.create(s);
      console.log('✅ Setting:', s.key, '=', s.value);
    }
  }

  console.log('\n🎉 Initialization complete!\n');
  console.log('Admin:', adminEmail, '/', adminPassword);
  console.log('Demo voter: voter1@securevote.com / VoteSecure2024!');
  await mongoose.disconnect();
}

init().catch(e => { console.error('❌ Init failed:', e.message); process.exit(1); });

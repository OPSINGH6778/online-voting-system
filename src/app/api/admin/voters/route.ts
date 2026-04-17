import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

async function requireAdmin(request: NextRequest) {
  const cookie = request.cookies.get('session');
  if (!cookie) return null;
  const userId = verifySessionToken(cookie.value);
  if (!userId) return null;
  const user = await dbOperations.getUserById(userId);
  if (!user || !['admin', 'moderator'].includes(user.role)) return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const [users, votes] = await Promise.all([
      dbOperations.getAllUsers(),
      dbOperations.getAllVotes(),
    ]);
    const votedIds = new Set(votes.map((v: any) => v.user_id.toString()));
    const voters = users.map((u: any) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      voterId: u.voter_id || 'N/A',
      hasAadhaar: !!u.aadhaar_number,
      hasGovtVoterId: !!u.govt_voter_id,
      hasVoted: votedIds.has(u._id.toString()),
      isVerified: u.is_verified,
      emailVerified: u.email_verified,
      lastLogin: u.last_login,
      joinedAt: u.created_at,
    }));
    return NextResponse.json({ voters });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { name, email, password, markVerified, phone, aadhaar_number, govt_voter_id } = await request.json();
    if (!name || !email || !password) return NextResponse.json({ error: 'Name, email, password required' }, { status: 400 });

    const exists = await dbOperations.getUserByEmail(email);
    if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 400 });

    const voterNum = Math.floor(Math.random() * 900000) + 100000;
    const voter = await dbOperations.createUser({
      name, email,
      password_hash: await bcrypt.hash(password, 12),
      role: 'user',
      voter_id: `VOT-${voterNum}`,
      phone: phone || '',
      aadhaar_number: aadhaar_number || '',
      govt_voter_id: govt_voter_id || '',
      is_verified: markVerified === true,
      email_verified: markVerified === true,
    });

    await dbOperations.logActivity({
      user_id: admin._id.toString(), user_email: admin.email,
      action: `VOTER_ADDED: ${email}`, category: 'admin', status: 'success',
    });

    return NextResponse.json({
      message: 'Voter added',
      voter: { id: voter._id.toString(), name: voter.name, email: voter.email, voterId: voter.voter_id },
    }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

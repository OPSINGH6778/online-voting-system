import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

async function requireAdmin(request: NextRequest) {
  const c = request.cookies.get('session');
  if (!c) return null;
  const id = verifySessionToken(c.value);
  if (!id) return null;
  const u = await dbOperations.getUserById(id);
  if (!u || !['admin','moderator'].includes(u.role)) return null;
  return u;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const el = await dbOperations.getElectionById(params.id);
    if (!el) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ election: el });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const data = await request.json();
    // Validate cooldown
    if (data.vote_cooldown !== undefined) {
      data.vote_cooldown = Math.max(0, Math.min(86400, parseInt(String(data.vote_cooldown)) || 0));
    }
    const election = await dbOperations.updateElection(params.id, data);
    if (!election) return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    await dbOperations.logActivity({
      user_id: admin._id.toString(), user_email: admin.email,
      action: `ELECTION_UPDATED: ${election.title} [${Object.keys(data).join(',')}]`,
      category: 'election', status: 'success',
    });
    return NextResponse.json({ election });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    await dbOperations.deleteElection(params.id);
    await dbOperations.logActivity({
      user_id: admin._id.toString(), user_email: admin.email,
      action: `ELECTION_DELETED: ${params.id}`, category: 'election', status: 'success',
    });
    return NextResponse.json({ message: 'Election deleted' });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

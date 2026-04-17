import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

async function requireAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) return null;
  const userId = verifySessionToken(sessionCookie.value);
  if (!userId) return null;
  const user = await dbOperations.getUserById(userId.toString());
  if (!user || user.role !== 'admin') return null;
  return user;
}

// GET /api/elections — public list (voters see active, admin sees all)
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    const userId = sessionCookie ? verifySessionToken(sessionCookie.value) : null;
    let isAdmin = false;
    if (userId) {
      const user = await dbOperations.getUserById(userId.toString());
      isAdmin = user?.role === 'admin';
    }
    const elections = isAdmin
      ? await dbOperations.getAllElections()
      : await dbOperations.getActiveElections();
    return NextResponse.json({ elections });
  } catch (error) {
    console.error('Get elections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/elections — admin creates election
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { title, description, candidates, status, start_date, end_date } = await request.json();
    if (!title || !candidates || candidates.length < 2) {
      return NextResponse.json({ error: 'Title and at least 2 candidates required' }, { status: 400 });
    }
    const election = await dbOperations.createElection({
      title,
      description: description || '',
      candidates,
      status: status || 'upcoming',
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      created_by: admin._id,
    });
    return NextResponse.json({ election }, { status: 201 });
  } catch (error) {
    console.error('Create election error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

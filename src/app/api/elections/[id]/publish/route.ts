import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookie = request.cookies.get('session');
    if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = verifySessionToken(cookie.value);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await dbOperations.getUserById(userId);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const election = await dbOperations.publishResult(params.id);
    await dbOperations.logActivity({
      user_id: userId, user_email: user.email,
      action: `ELECTION_RESULT_PUBLISHED: ${election?.title}`,
      category: 'election', status: 'success',
    });
    return NextResponse.json({ message: 'Results published', election });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

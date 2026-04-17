import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await dbOperations.getUserById(userId);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const electionId = searchParams.get('electionId');
    if (!electionId) return NextResponse.json({ error: 'electionId required' }, { status: 400 });

    const result = await dbOperations.verifyHashChain(electionId);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get('session');
    if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = verifySessionToken(cookie.value);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await dbOperations.getUserById(userId);
    if (!user || !['admin', 'moderator'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const logs = await dbOperations.getActivityLogs(200);
    return NextResponse.json({ logs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

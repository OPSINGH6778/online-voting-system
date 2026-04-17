import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookie = request.cookies.get('session');
    if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = verifySessionToken(cookie.value);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = await dbOperations.getUserById(userId);
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    await dbOperations.deleteUser(params.id);
    return NextResponse.json({ message: 'Voter removed' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

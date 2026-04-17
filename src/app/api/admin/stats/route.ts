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

    const [allUsers, allAdmins, allElections, totalVotes, trend] = await Promise.all([
      dbOperations.getAllUsers(),
      dbOperations.getAllAdmins(),
      dbOperations.getAllElections(),
      dbOperations.getTotalVoteCount(),
      dbOperations.getVoteTrend(),
    ]);

    const turnoutPct = allUsers.length > 0 ? Math.round((totalVotes / allUsers.length) * 100) : 0;

    return NextResponse.json({
      totalUsers: allUsers.length,
      totalAdmins: allAdmins.length,
      totalElections: allElections.length,
      activeElections: allElections.filter((e: any) => e.status === 'active').length,
      closedElections: allElections.filter((e: any) => e.status === 'closed').length,
      upcomingElections: allElections.filter((e: any) => e.status === 'upcoming').length,
      draftElections: allElections.filter((e: any) => e.status === 'draft').length,
      totalVotes,
      voterTurnout: turnoutPct,
      trend,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

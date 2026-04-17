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
    if (!user || !['admin','moderator'].includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const votes = await dbOperations.getAllVotes();
    const users = await dbOperations.getAllUsers();
    const logs  = await dbOperations.getActivityLogs(500);

    // Same IP voting
    const ipVoteMap: Record<string, string[]> = {};
    votes.forEach((v: any) => {
      const ip = v.ip_address;
      if (!ip || ip === 'unknown') return;
      if (!ipVoteMap[ip]) ipVoteMap[ip] = [];
      ipVoteMap[ip].push(v.user_id?.toString() || '');
    });
    const sameIpVoting = Object.entries(ipVoteMap)
      .filter(([, uids]) => uids.length >= 2)
      .map(([ip, uids]) => ({ ip, voteCount: uids.length, alert: 'SAME_IP_MULTIPLE_VOTES', severity: uids.length >= 5 ? 'critical' : 'high' }));

    // Failed login clusters
    const failedLogs = logs.filter((l: any) => l.status === 'failed' && l.category === 'auth');
    const ipFailedMap: Record<string, number> = {};
    failedLogs.forEach((l: any) => { if (l.ip_address) ipFailedMap[l.ip_address] = (ipFailedMap[l.ip_address] || 0) + 1; });
    const bruteForceAlerts = Object.entries(ipFailedMap)
      .filter(([, count]) => count >= 5)
      .map(([ip, count]) => ({ ip, count, alert: 'BRUTE_FORCE_ATTEMPT', severity: count >= 10 ? 'critical' : 'high' }));

    // New accounts that voted < 1 hour after creation
    const freshAccountVotes = votes.filter((v: any) => {
      const voter = users.find((u: any) => u._id.toString() === v.user_id?.toString());
      if (!voter) return false;
      const ageMs = new Date(v.created_at).getTime() - new Date(voter.created_at).getTime();
      return ageMs < 60 * 60 * 1000; // < 1 hour
    }).map((v: any) => {
      const voter = users.find((u: any) => u._id.toString() === v.user_id?.toString());
      return { userId: v.user_id?.toString(), voterName: voter?.name, alert: 'FRESH_ACCOUNT_VOTE', severity: 'medium' };
    });

    const totalAlerts = sameIpVoting.length + bruteForceAlerts.length + freshAccountVotes.length;
    const criticalCount = [...sameIpVoting, ...bruteForceAlerts].filter(a => a.severity === 'critical').length;

    return NextResponse.json({
      totalAlerts,
      criticalCount,
      sameIpVoting,
      bruteForceAlerts,
      freshAccountVotes,
      overallRisk: criticalCount > 0 ? 'critical' : totalAlerts > 5 ? 'high' : totalAlerts > 0 ? 'medium' : 'safe',
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

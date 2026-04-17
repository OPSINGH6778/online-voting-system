import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';
import { computeSmartAnalytics, getIpStats } from '@/lib/ml-fraud-detection';
import { simulateQKD } from '@/lib/quantum-crypto';

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

    const insights = computeSmartAnalytics(votes as any[]);

    // Per-election fraud scores
    const elections = await dbOperations.getAllElections();
    const electionFraudScores = await Promise.all(elections.map(async (el: any) => {
      const elVotes = votes.filter((v: any) => v.election_id?.toString() === el._id.toString());
      const elInsights = computeSmartAnalytics(elVotes as any[]);
      const results = await dbOperations.getElectionResults(el._id.toString());
      const total = results.reduce((s: number, r: any) => s + r.count, 0);
      const winner = results.sort((a: any, b: any) => b.count - a.count)[0];
      const winnerCandidate = el.candidates.find((c: any) => c._id.toString() === winner?._id);
      return {
        electionId: el._id.toString(),
        electionTitle: el.title,
        status: el.status,
        totalVotes: total,
        fraudScore: elInsights.fraudScore,
        suspiciousIPs: elInsights.suspiciousIPs.length,
        peakHour: elInsights.peakHour,
        trendDirection: elInsights.trendDirection,
        winner: winnerCandidate ? { name: winnerCandidate.name, party: winnerCandidate.party, votes: winner?.count || 0, percentage: total > 0 ? Math.round((winner?.count || 0) / total * 100) : 0 } : null,
      };
    }));

    // IP clustering: group IPs with multiple accounts
    const allUsers = await dbOperations.getAllUsers();
    const ipUserMap: Record<string, string[]> = {};
    votes.forEach((v: any) => {
      const ip = v.ip_address;
      if (!ip || ip === 'unknown') return;
      const voter = allUsers.find((u: any) => u._id.toString() === v.user_id?.toString());
      if (!voter) return;
      if (!ipUserMap[ip]) ipUserMap[ip] = [];
      if (!ipUserMap[ip].includes(voter.name)) ipUserMap[ip].push(voter.name);
    });
    const ipClusters = Object.entries(ipUserMap)
      .filter(([, users]) => users.length >= 2)
      .map(([ip, users]) => ({ ip, userCount: users.length, users: users.slice(0, 5) }))
      .sort((a, b) => b.userCount - a.userCount)
      .slice(0, 10);

    // QKD session status
    const qkdSession = simulateQKD();

    // Hourly vote pattern for ML chart
    const hourlyPattern = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}:00`,
      votes: votes.filter((v: any) => new Date(v.created_at).getHours() === h).length,
      expected: Math.round(8 + Math.sin((h - 14) * Math.PI / 12) * 6),  // expected normal curve
    }));

    return NextResponse.json({
      insights,
      electionFraudScores,
      ipClusters,
      qkdSession,
      hourlyPattern,
      totalAnalysed: votes.length,
      modelInfo: {
        name: 'SVS-ML-v2.0',
        algorithms: ['Isolation Forest', 'Bayesian Risk Scorer', 'IP Velocity Analysis', 'Graph Clustering', 'Temporal Pattern Analysis'],
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error('ML analytics error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const election = await dbOperations.getElectionById(params.id);
    if (!election) return NextResponse.json({ error: 'Election not found' }, { status: 404 });

    const results = await dbOperations.getElectionResults(params.id);
    const totalVotes = results.reduce((sum: number, r: any) => sum + r.count, 0);

    const enriched = election.candidates.map((c: any) => {
      const result = results.find((r: any) => r._id === c._id.toString());
      return {
        id: c._id.toString(),
        name: c.name,
        description: c.description,
        photo: c.photo,
        votes: result?.count || 0,
        percentage: totalVotes > 0 ? Math.round(((result?.count || 0) / totalVotes) * 100) : 0,
      };
    });

    return NextResponse.json({ election, results: enriched, totalVotes });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

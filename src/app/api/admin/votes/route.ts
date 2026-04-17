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

    const votes = await dbOperations.getVotesWithDetails();
    const auditTrail = votes.map((v: any) => {
      const election  = v.election_id;
      const candidate = election?.candidates?.find((c: any) => c._id.toString() === v.candidate_id);
      return {
        id: v._id.toString(),
        voterName: v.user_id?.name || 'Unknown',
        voterId: v.user_id?.voter_id || 'N/A',
        electionId: election?._id?.toString() || '',
        electionTitle: election?.title || 'Unknown',
        candidateId: v.candidate_id,
        candidateName: candidate?.name || 'Unknown',
        candidateParty: candidate?.party || '',
        voteHash: v.vote_hash,
        prevHash: v.prev_hash || '',
        receiptId: v.receipt_id || '',
        transactionId: v.transaction_id || `tx-${v._id.toString().slice(-8)}`,
        blockHeight: v.block_height || 0,
        votedAt: v.created_at,
      };
    });
    return NextResponse.json({ votes: auditTrail });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

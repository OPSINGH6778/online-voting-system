import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get('session');
    if (!cookie?.value) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const userId = verifySessionToken(cookie.value);
    if (!userId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const votes = await dbOperations.getVotesByUser(userId);
    const result = votes.map((v: any) => ({
      electionId:    v.election_id?._id?.toString() || v.election_id?.toString(),
      electionTitle: v.election_id?.title || 'Unknown Election',
      candidateId:   v.candidate_id,
      voteHash:      v.vote_hash,
      receiptId:     v.receipt_id || '',
      transactionId: v.transaction_id || '',
      blockHeight:   v.block_height || 0,
      votedAt:       v.created_at,
    }));

    return NextResponse.json({ votes: result });
  } catch (error) {
    console.error('My votes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

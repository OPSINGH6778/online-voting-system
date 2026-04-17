import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const receiptId = searchParams.get('receipt');
    if (!receiptId) return NextResponse.json({ error: 'Receipt ID required' }, { status: 400 });

    const result = await dbOperations.getVoteByReceipt(receiptId);
    if (!result) return NextResponse.json({ found: false, message: 'No vote found with this receipt ID.' });

    const vote = (Array.isArray(result) ? result[0] : result) as any;
    if (!vote) return NextResponse.json({ found: false, message: 'No vote found with this receipt ID.' });

    return NextResponse.json({
      found:         true,
      message:       'Your vote has been counted.',
      electionId:    vote.election_id?.toString() ?? '',
      votedAt:       vote.created_at,
      blockHeight:   vote.block_height,
      transactionId: vote.transaction_id,
    });
  } catch (e) {
    console.error('[votes/verify]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

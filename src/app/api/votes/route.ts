import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbOperations } from '@/lib/db';
import { verifySessionToken, sendVoteConfirmationEmail } from '@/lib/auth';
import { analyseVoteFraud, recordIpActivity } from '@/lib/ml-fraud-detection';
import { sha3Double, createHashChainBlock } from '@/lib/quantum-crypto';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get('session');
    if (!cookie) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const userId = verifySessionToken(cookie.value);
    if (!userId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const user = await dbOperations.getUserById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!user.is_verified || !user.email_verified) {
      return NextResponse.json({ error: 'Please verify your email before voting' }, { status: 403 });
    }
    if (!user.privacy_accepted) {
      return NextResponse.json({ error: 'You must accept the Privacy Policy before voting' }, { status: 403 });
    }

    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const ua = request.headers.get('user-agent') || '';

    const { electionId, candidateId, loginTimestamp } = await request.json();
    if (!electionId || !candidateId) {
      return NextResponse.json({ error: 'electionId and candidateId are required' }, { status: 400 });
    }

    const election = await dbOperations.getElectionById(electionId);
    if (!election) return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    if (election.status !== 'active') return NextResponse.json({ error: 'Election is not currently active' }, { status: 400 });

    // Age check per election
    if (election.min_age && user.date_of_birth) {
      const today = new Date();
      const dob   = new Date(user.date_of_birth);
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      if (age < election.min_age) {
        return NextResponse.json({
          error: `You must be at least ${election.min_age} years old to vote in this election`,
          ageError: true,
        }, { status: 403 });
      }
    }

    // Vote cooldown check (per-election or global)
    const settings = await dbOperations.getAllSettings();
    const globalCooldownEnabled = settings.vote_cooldown_enabled;
    const globalCooldownSecs   = settings.vote_cooldown_seconds || 0;
    const electionCooldownEnabled = election.cooldown_enabled;
    const electionCooldownSecs    = election.vote_cooldown || 0;

    const cooldownEnabled = electionCooldownEnabled || globalCooldownEnabled;
    const cooldownSecs    = electionCooldownSecs > 0 ? electionCooldownSecs : globalCooldownSecs;

    if (cooldownEnabled && cooldownSecs > 0 && user.last_vote_at) {
      const elapsed = (Date.now() - new Date(user.last_vote_at).getTime()) / 1000;
      if (elapsed < cooldownSecs) {
        const remaining = Math.ceil(cooldownSecs - elapsed);
        return NextResponse.json({
          error: `Please wait ${remaining} seconds before voting again`,
          cooldownError: true,
          remainingSeconds: remaining,
          cooldownSeconds: cooldownSecs,
        }, { status: 429 });
      }
    }

    // Candidate validation
    const candidateExists = election.candidates.some((c: any) => c._id.toString() === candidateId);
    if (!candidateExists) return NextResponse.json({ error: 'Candidate not found in this election' }, { status: 400 });

    // Double vote check
    const existing = await dbOperations.hasUserVoted(userId, electionId);
    if (existing) return NextResponse.json({ error: 'You have already voted in this election' }, { status: 409 });

    // ML fraud analysis
    const allVotes = await dbOperations.getAllVotes();
    const ipVotes  = (allVotes as any[]).filter(v => v.ip_address === ip);
    const fraudAnalysis = analyseVoteFraud({
      ip, userId, electionId,
      timeSinceLogin: loginTimestamp ? Date.now() - loginTimestamp : 120000,
      userAgent: ua,
      accountAgeDays: Math.floor((Date.now() - new Date((user as any).created_at).getTime()) / 86400000),
      hasAadhaar: !!(user as any).aadhaar_number,
      hasGovtId: !!(user as any).govt_voter_id,
      totalVotesFromIp: ipVotes.length,
      totalAccountsFromIp: new Set(ipVotes.map((v: any) => v.user_id?.toString())).size,
    });

    if (fraudAnalysis.action === 'block') {
      await dbOperations.logActivity({
        user_id: userId, user_email: (user as any).email,
        action: `VOTE_BLOCKED: ${fraudAnalysis.signals[0]?.signal}`,
        category: 'security', status: 'blocked', ip_address: ip,
        details: `Fraud score: ${fraudAnalysis.riskScore}`,
      });
      return NextResponse.json({
        error: 'Vote blocked by fraud detection. Contact admin if this is an error.',
        fraudScore: fraudAnalysis.riskScore,
      }, { status: 403 });
    }

    // Build hash chain
    const prevHash  = await dbOperations.getLastVoteHash(electionId);
    const blockId   = (allVotes as any[]).filter(v => v.election_id?.toString() === electionId).length + 1;
    const voteData  = `${userId}-${electionId}-${candidateId}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`;
    const voteHash  = sha3Double(voteData + prevHash);
    const block     = createHashChainBlock(blockId, prevHash, voteHash);

    // Receipt ID (anonymous, public)
    const receiptId = crypto.createHash('sha256')
      .update(`receipt-${voteHash}-${crypto.randomBytes(8).toString('hex')}`)
      .digest('hex').slice(0, 16).toUpperCase();

    const transactionId = crypto.randomUUID();

    const vote = await dbOperations.castVote({
      user_id: userId,
      election_id: electionId,
      candidate_id: candidateId,
      vote_hash: voteHash,
      prev_hash: prevHash,
      transaction_id: transactionId,
      block_height: block.blockId,
      receipt_id: receiptId,
      ip_address: ip,
      user_agent: ua,
      fraud_score: fraudAnalysis.riskScore,
    });

    recordIpActivity(ip, (user as any).email, 'vote');

    await dbOperations.logActivity({
      user_id: userId, user_email: (user as any).email,
      action: `VOTE_CAST: ${election.title}`,
      category: 'vote',
      status: fraudAnalysis.riskLevel !== 'safe' ? 'warning' : 'success',
      ip_address: ip,
      details: `block:${block.blockId} risk:${fraudAnalysis.riskScore}`,
    });

    sendVoteConfirmationEmail((user as any).email, (user as any).name, election.title, receiptId).catch(() => {});

    return NextResponse.json({
      message: 'Vote cast successfully',
      voteHash:      vote.vote_hash,
      receiptId:     vote.receipt_id,
      transactionId,
      blockHeight:   block.blockId,
      merkleRoot:    block.merkleRoot,
      fraudScore:    fraudAnalysis.riskScore,
    });
  } catch (error: any) {
    if (error.code === 11000) return NextResponse.json({ error: 'You have already voted in this election' }, { status: 409 });
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

async function requireAdmin(request: NextRequest) {
  const c = request.cookies.get('session');
  if (!c) return null;
  const id = verifySessionToken(c.value);
  if (!id) return null;
  const u = await dbOperations.getUserById(id);
  if (!u || !['admin','moderator'].includes(u.role)) return null;
  return u;
}

// GET /api/elections/[id]/results - Get election results
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params as Promise (Next.js 16 requirement)
    const { id } = await params;
    
    const election = await dbOperations.getElectionById(id);
    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }
    
    // Get results
    const results = await dbOperations.getElectionResults(id);
    const totalVotes = results.reduce((sum: number, r: any) => sum + r.count, 0);
    
    // Get candidate details
    const candidatesWithVotes = election.candidates.map((candidate: any) => {
      const voteCount = results.find((r: any) => r._id === candidate.name)?.count || 0;
      return {
        ...candidate.toObject(),
        votes: voteCount,
        percentage: totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(2) : '0',
      };
    });
    
    return NextResponse.json({ 
      success: true,
      election: {
        id: election._id,
        title: election.title,
        description: election.description,
        status: election.status,
        totalVotes,
        result_published: election.result_published,
      },
      results: candidatesWithVotes,
    });
  } catch (error: any) {
    console.error('GET /api/elections/[id]/results error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

// PATCH /api/elections/[id]/results - Publish results (admin only)
export async function PATCH(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const { id } = await params;
    const { publish } = await request.json();
    
    if (publish) {
      const election = await dbOperations.publishResult(id);
      await dbOperations.logActivity({
        user_id: admin._id.toString(),
        user_email: admin.email,
        action: `RESULTS_PUBLISHED: ${election.title}`,
        category: 'election',
        status: 'success',
      });
      return NextResponse.json({ 
        success: true, 
        message: 'Results published successfully',
        election 
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('PATCH /api/elections/[id]/results error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}
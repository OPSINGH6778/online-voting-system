import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';
import { z } from 'zod';

export const runtime = 'nodejs';

async function requireAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  if (!sessionCookie) return null;
  const userId = verifySessionToken(sessionCookie.value);
  if (!userId) return null;
  const user = await dbOperations.getUserById(userId.toString());
  if (!user || user.role !== 'admin') return null;
  return user;
}

// GET /api/elections — public list (voters see active, admin sees all)
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    const userId = sessionCookie ? verifySessionToken(sessionCookie.value) : null;
    let isAdmin = false;
    if (userId) {
      const user = await dbOperations.getUserById(userId.toString());
      isAdmin = user?.role === 'admin';
    }
    const elections = isAdmin
      ? await dbOperations.getAllElections()
      : await dbOperations.getActiveElections();
    return NextResponse.json({ success: true, elections });
  } catch (error) {
    console.error('Get elections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/elections/[id] - Get single election
export async function GET_ID(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    const election = await dbOperations.getElectionById(id);
    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, election });
  } catch (error: any) {
    console.error('Get election by ID error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/elections — admin creates election
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, candidates, status, start_date, end_date, min_age, region } = body;
    
    if (!title || !candidates || candidates.length < 2) {
      return NextResponse.json({ 
        error: 'Title and at least 2 candidates required' 
      }, { status: 400 });
    }
    
    const election = await dbOperations.createElection({
      title,
      description: description || '',
      candidates,
      status: status || 'upcoming',
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      min_age: min_age || 18,
      region: region || 'National',
      created_by: admin._id,
      created_at: new Date(),
      updated_at: new Date(),
    });
    
    await dbOperations.logActivity({
      user_id: admin._id.toString(),
      user_email: admin.email,
      action: `ELECTION_CREATED: ${title}`,
      category: 'election',
      status: 'success',
    });
    
    return NextResponse.json({ 
      success: true, 
      election,
      message: 'Election created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create election error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

// PUT /api/elections/[id] - Update election (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const { id } = await params;
    const data = await request.json();
    
    // Validate cooldown
    if (data.vote_cooldown !== undefined) {
      data.vote_cooldown = Math.max(0, Math.min(86400, parseInt(String(data.vote_cooldown)) || 0));
    }
    
    const election = await dbOperations.updateElection(id, data);
    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }
    
    await dbOperations.logActivity({
      user_id: admin._id.toString(),
      user_email: admin.email,
      action: `ELECTION_UPDATED: ${election.title}`,
      category: 'election',
      status: 'success',
    });
    
    return NextResponse.json({ 
      success: true, 
      election,
      message: 'Election updated successfully'
    });
  } catch (error: any) {
    console.error('Update election error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE /api/elections/[id] - Delete election (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const { id } = await params;
    const election = await dbOperations.getElectionById(id);
    
    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }
    
    await dbOperations.deleteElection(id);
    
    await dbOperations.logActivity({
      user_id: admin._id.toString(),
      user_email: admin.email,
      action: `ELECTION_DELETED: ${election.title}`,
      category: 'election',
      status: 'success',
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Election deleted successfully' 
    });
  } catch (error: any) {
    console.error('Delete election error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

// Note: Next.js doesn't support multiple GET handlers in same file
// The GET handler above is for /api/elections (list)
// For single election, you need a separate file or use route parameters
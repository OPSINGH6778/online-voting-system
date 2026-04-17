import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

async function getAdmin(request: NextRequest) {
  const c = request.cookies.get('session');
  if (!c) return null;
  const id = verifySessionToken(c.value);
  if (!id) return null;
  const u = await dbOperations.getUserById(id);
  if (!u || !['admin','moderator'].includes(u.role)) return null;
  return u;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const settings = await dbOperations.getAllSettings();
    return NextResponse.json({ settings });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const body = await request.json();

    // Validate specific settings
    if (body.vote_cooldown_seconds !== undefined) {
      const secs = parseInt(String(body.vote_cooldown_seconds));
      if (isNaN(secs) || secs < 0 || secs > 86400) {
        return NextResponse.json({ error: 'vote_cooldown_seconds must be 0-86400' }, { status: 400 });
      }
      await dbOperations.setSetting('vote_cooldown_seconds', secs, admin.email);
    }
    if (body.vote_cooldown_enabled !== undefined) {
      await dbOperations.setSetting('vote_cooldown_enabled', Boolean(body.vote_cooldown_enabled), admin.email);
    }
    if (body.min_voter_age !== undefined) {
      const age = parseInt(String(body.min_voter_age));
      if (isNaN(age) || age < 16 || age > 100) {
        return NextResponse.json({ error: 'min_voter_age must be 16-100' }, { status: 400 });
      }
      await dbOperations.setSetting('min_voter_age', age, admin.email);
    }
    if (body.maintenance_mode !== undefined) {
      await dbOperations.setSetting('maintenance_mode', Boolean(body.maintenance_mode), admin.email);
    }
    if (body.privacy_policy_version !== undefined) {
      await dbOperations.setSetting('privacy_policy_version', String(body.privacy_policy_version), admin.email);
    }

    await dbOperations.logActivity({
      user_id: admin._id.toString(), user_email: admin.email,
      action: `SETTINGS_UPDATED: ${Object.keys(body).join(', ')}`,
      category: 'admin', status: 'success',
    });

    const settings = await dbOperations.getAllSettings();
    return NextResponse.json({ message: 'Settings updated', settings });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

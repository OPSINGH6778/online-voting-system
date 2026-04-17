import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { sendPasswordResetEmail, generateResetToken } from '@/lib/auth';
import { resetRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = resetRateLimiter.check(`reset_${ip}_${email}`);
    if (rl.limited) return NextResponse.json({ error: `Too many requests. Try again in ${rl.resetIn} min.` }, { status: 429 });

    const user = await dbOperations.getUserByEmail(email);
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If this email exists, a reset link has been sent.' });
    }

    const token = generateResetToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await dbOperations.updateUser(user._id.toString(), {
      password_reset_token: token,
      password_reset_expires: expires,
    });

    await sendPasswordResetEmail(email, token);
    await dbOperations.logActivity({
      user_id: user._id.toString(), user_email: email,
      action: 'PASSWORD_RESET_REQUESTED', category: 'auth', ip_address: ip,
    });

    return NextResponse.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

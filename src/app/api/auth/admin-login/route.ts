import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { otpRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';

    if (otpRateLimiter.isRateLimited(`admin_${ip}`)) {
      return NextResponse.json({ error: 'Too many attempts. Wait 15 minutes.' }, { status: 429 });
    }

    const user = await dbOperations.getUserByEmail(email.trim());
    if (!user || !['admin', 'moderator'].includes(user.role)) {
      return NextResponse.json({ error: 'Invalid credentials or insufficient permissions' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials or insufficient permissions' }, { status: 401 });
    }

    if (!user.is_verified) {
      return NextResponse.json({ error: 'Admin account not verified. Contact system support.' }, { status: 403 });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await dbOperations.createOTP(user._id.toString(), otp, expiresAt, 'login', ip);

    // Try to send email — if SMTP not configured, OTP goes to logs (demo mode)
    try {
      const { sendOTP } = await import('@/lib/auth');
      await sendOTP(email, otp, 'login');
    } catch {
      // Non-fatal — OTP printed to console/logs below
    }

    // Always log OTP so admin can find it in Vercel logs
    console.log(`[ADMIN OTP] ${email} → ${otp}`);

    await dbOperations.logActivity({
      user_id: user._id.toString(), user_email: email,
      action: 'ADMIN_LOGIN_OTP_SENT', category: 'auth', ip_address: ip,
    });

    return NextResponse.json({
      message: 'OTP sent. Check email or Vercel logs.',
      userId: user._id.toString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[admin-login] Error:', msg);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbOperations } from '@/lib/db';
import { verifyPassword, generateOTP } from '@/lib/auth';
import { loginRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

const SECRET = process.env.NEXTAUTH_SECRET || 'svs-quantum-safe-secret-2026-opsingh6778';

function verifyCaptchaToken(token: string): boolean {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return false;
    const encoded = token.slice(0, dot);
    const sig     = token.slice(dot + 1);
    const payload = Buffer.from(encoded, 'base64').toString('utf8');
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    if (sig.length !== expected.length) return false;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    if (!payload.startsWith('captcha_ok:')) return false;
    return Date.now() <= parseInt(payload.split(':')[1], 10);
  } catch { return false; }
}

export async function POST(request: NextRequest) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const ua = request.headers.get('user-agent') || '';
    const body = await request.json();
    const { email, password, loginToken } = body;

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const rl = loginRateLimiter.check(`login_${ip}`);
    if (rl.limited) {
      return NextResponse.json({ error: `Too many attempts. Try again in ${rl.resetIn} min.` }, { status: 429 });
    }

    if (!loginToken) {
      return NextResponse.json({ error: 'Please complete the CAPTCHA first', requiresCaptcha: true }, { status: 400 });
    }
    if (!verifyCaptchaToken(loginToken)) {
      return NextResponse.json({ error: 'CAPTCHA expired. Please solve it again.', captchaFailed: true }, { status: 400 });
    }

    const user = await dbOperations.getUserByEmail(email.trim());

    if (user?.locked_until && new Date() < new Date(user.locked_until)) {
      const mins = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      return NextResponse.json({ error: `Account locked. Try again in ${mins} minute(s).` }, { status: 423 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      const failCount = (user.failed_logins || 0) + 1;
      const update: any = { failed_logins: failCount };
      if (failCount >= 5) update.locked_until = new Date(Date.now() + 15 * 60 * 1000);
      await dbOperations.updateUser(user._id.toString(), update);
      const rem = Math.max(0, 5 - failCount);
      return NextResponse.json({
        error: `Invalid email or password. ${rem > 0 ? `${rem} attempt(s) left.` : 'Account locked for 15 min.'}`,
      }, { status: 401 });
    }

    await dbOperations.updateUser(user._id.toString(), {
      failed_logins: 0, locked_until: null, last_login: new Date(), last_login_ip: ip,
    });

    const otp = generateOTP();
    await dbOperations.createOTP(user._id.toString(), otp, new Date(Date.now() + 10 * 60 * 1000), 'login', ip);

    try {
      const { sendOTP } = await import('@/lib/auth');
      await sendOTP(email, otp, 'login');
    } catch { /* non-fatal */ }

    console.log(`[LOGIN OTP] ${email} → ${otp}`);

    await dbOperations.logActivity({
      user_id: user._id.toString(), user_email: email,
      action: 'LOGIN_OTP_SENT', category: 'auth', ip_address: ip,
    });

    return NextResponse.json({
      message: 'OTP sent to your email',
      requiresOTP: true,
      userId: user._id.toString(),
      role: user.role,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[login] Error:', msg);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}

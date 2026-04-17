import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { createSessionToken } from '@/lib/auth';
import { otpRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { userId, otp } = await request.json();
    if (!userId || !otp) return NextResponse.json({ error: 'User ID and OTP required' }, { status: 400 });

    const rl = otpRateLimiter.check(`otp_verify_${userId}`);
    if (rl.limited) return NextResponse.json({ error: `Too many attempts. Try again in ${rl.resetIn} min.` }, { status: 429 });

    const otpRecord = await dbOperations.getOTP(userId, otp, 'login');
    if (!otpRecord) {
      await dbOperations.logActivity({ user_id: userId, action: 'OTP_FAILED', category: 'auth', status: 'failed', ip_address: ip });
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    await dbOperations.markOTPUsed(otpRecord._id.toString());
    const user = await dbOperations.getUserById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const token = createSessionToken(user._id.toString());
    await dbOperations.logActivity({ user_id: userId, user_email: user.email, action: 'LOGIN_SUCCESS', category: 'auth', status: 'success', ip_address: ip });

    const response = NextResponse.json({ message: 'Login successful', user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role, voterId: user.voter_id } });
    response.cookies.set('session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24, path: '/' });
    return response;
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

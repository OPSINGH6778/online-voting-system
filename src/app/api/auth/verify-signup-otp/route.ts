import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { createSession, sendWelcomeEmail } from '@/lib/auth';
import { otpRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { userId, otp } = await request.json();
    if (!userId || !otp) return NextResponse.json({ error: 'User ID and OTP required' }, { status: 400 });

    const rl = otpRateLimiter.check(`otp_signup_${userId}`);
    if (rl.limited) return NextResponse.json({ error: `Too many attempts. Try again in ${rl.resetIn} min.` }, { status: 429 });

    const otpRecord = await dbOperations.getOTP(userId, otp, 'signup');
    if (!otpRecord) return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });

    await dbOperations.markOTPUsed(otpRecord._id.toString());
    const user = await dbOperations.updateUser(userId, { is_verified: true, email_verified: true });

    // Send welcome email
    if (user) sendWelcomeEmail(user.email, user.name, user.voter_id || '').catch(() => {});

    await dbOperations.logActivity({
      user_id: userId, user_email: user?.email,
      action: 'EMAIL_VERIFIED', category: 'auth', status: 'success',
    });

    const sessionToken = createSession(userId);
    const response = NextResponse.json({ message: 'Account verified successfully' });
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Verify signup OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

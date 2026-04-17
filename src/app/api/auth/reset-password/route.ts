import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/db';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) return NextResponse.json({ error: 'Token and password required' }, { status: 400 });

    const strength = validatePasswordStrength(password);
    if (!strength.valid) return NextResponse.json({ error: strength.message }, { status: 400 });

    const user = await dbOperations.getUserByResetToken(token);
    if (!user) return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });

    const hashedPassword = await hashPassword(password);
    await dbOperations.updateUser(user._id.toString(), {
      password_hash: hashedPassword,
      password_reset_token: '',
      password_reset_expires: null,
    });

    await dbOperations.logActivity({
      user_id: user._id.toString(), user_email: user.email,
      action: 'PASSWORD_RESET_SUCCESS', category: 'auth', status: 'success',
    });

    return NextResponse.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

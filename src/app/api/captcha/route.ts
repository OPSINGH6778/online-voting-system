import { NextRequest, NextResponse } from 'next/server';
import { generateCaptcha, verifyCaptchaToken } from '@/lib/ml-fraud-detection';

export const runtime = 'nodejs';

// GET /api/captcha — generate a new challenge
// Returns: { token, question, expiresAt }
// The token is HMAC-signed and contains the answer — no server-side store needed
export async function GET() {
  try {
    const captcha = generateCaptcha();
    return NextResponse.json({
      token:     captcha.token,
      question:  captcha.question,
      expiresAt: captcha.expiresAt,
    });
  } catch (e) {
    console.error('CAPTCHA generate error:', e);
    return NextResponse.json({ error: 'Failed to generate CAPTCHA' }, { status: 500 });
  }
}

// POST /api/captcha — verify the user's answer
// Body: { token: string, answer: number }
// Returns: { valid: true, loginToken: string } on success
// The loginToken is what the client sends to /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, answer } = body;

    if (!token || answer === undefined || answer === null) {
      return NextResponse.json({ valid: false, error: 'Missing token or answer' }, { status: 400 });
    }

    const userAnswer = parseInt(String(answer), 10);
    if (isNaN(userAnswer)) {
      return NextResponse.json({ valid: false, error: 'Answer must be a number' }, { status: 400 });
    }

    const valid = verifyCaptchaToken(token, userAnswer);
    if (!valid) {
      return NextResponse.json({ valid: false, error: 'Wrong answer or CAPTCHA expired. Try a new one.' }, { status: 400 });
    }

    // Issue a separate short-lived login token (so the captcha token can't be reused)
    // We re-use the same HMAC approach: loginToken = base64("captcha_ok:<expiry>").<sig>
    const secret  = process.env.NEXTAUTH_SECRET || 'svs-captcha-hmac-2026';
    const crypto  = require('crypto');
    const payload = `captcha_ok:${Date.now() + 5 * 60 * 1000}`; // 5 min to submit login
    const sig     = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const loginToken = Buffer.from(payload).toString('base64') + '.' + sig;

    return NextResponse.json({ valid: true, loginToken });
  } catch (e) {
    console.error('CAPTCHA verify error:', e);
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 });
  }
}

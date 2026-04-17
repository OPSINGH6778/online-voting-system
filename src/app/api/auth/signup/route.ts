import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbOperations } from '@/lib/db';
import { generateOTP, sendOTP, validatePasswordStrength } from '@/lib/auth';
import { signupRateLimiter } from '@/lib/rate-limiter';

export const runtime = 'nodejs';

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export async function POST(request: NextRequest) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const ua = request.headers.get('user-agent') || '';

    const rl = signupRateLimiter.check(`signup_${ip}`);
    if (rl.limited) return NextResponse.json({ error: 'Too many signup attempts. Try again later.' }, { status: 429 });

    const body = await request.json();
    const { name, email, password, phone, aadhaar_number, govt_voter_id,
            date_of_birth, privacy_accepted, terms_accepted } = body;

    // Required fields
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    // Privacy & terms consent required
    if (!privacy_accepted) {
      return NextResponse.json({ error: 'You must accept the Privacy Policy to register' }, { status: 400 });
    }
    if (!terms_accepted) {
      return NextResponse.json({ error: 'You must accept the Terms & Conditions to register' }, { status: 400 });
    }

    // Date of birth & age verification (18+)
    if (!date_of_birth) {
      return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 });
    }
    const dob = new Date(date_of_birth);
    if (isNaN(dob.getTime())) {
      return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 });
    }
    const minAge = parseInt(String(process.env.MIN_VOTER_AGE || '18'));
    const age = calculateAge(dob);
    if (age < minAge) {
      return NextResponse.json({
        error: `You must be at least ${minAge} years old to register as a voter. You are ${age} years old.`,
        ageError: true,
        requiredAge: minAge,
        currentAge: age,
      }, { status: 400 });
    }

    // Password strength
    const strength = validatePasswordStrength(password);
    if (!strength.valid) return NextResponse.json({ error: strength.message }, { status: 400 });

    // Email uniqueness
    const existing = await dbOperations.getUserByEmail(email);
    if (existing) return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });

    // Aadhaar format validation
    if (aadhaar_number && !/^\d{12}$/.test(aadhaar_number.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Aadhaar number must be exactly 12 digits' }, { status: 400 });
    }

    // Create voter ID
    const voterIdNum = Math.floor(Math.random() * 900000) + 100000;
    const voterId    = `VOT-${voterIdNum}`;

    // Get privacy version from settings
    const privacyVersion = (await dbOperations.getSetting('privacy_policy_version')) || '1.0';

    const user = await dbOperations.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: await bcrypt.hash(password, 12),
      role: 'user',
      voter_id: voterId,
      phone: phone?.trim() || '',
      aadhaar_number: aadhaar_number ? aadhaar_number.replace(/\s/g, '') : '',
      govt_voter_id: govt_voter_id?.trim() || '',
      date_of_birth: dob,
      age_verified: true,
      privacy_accepted: true,
      privacy_accepted_at: new Date(),
      privacy_version: privacyVersion,
      terms_accepted: true,
      is_verified: false,
      email_verified: false,
    });

    // Send OTP for email verification
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await dbOperations.createOTP(user._id.toString(), otp, expiresAt, 'signup', ip);
    const emailSent = await sendOTP(email, otp, 'signup');

    await dbOperations.logActivity({
      user_id: user._id.toString(), user_email: email,
      action: `SIGNUP_INITIATED (age:${age}, emailSent:${emailSent})`,
      category: 'auth', ip_address: ip, user_agent: ua,
    });

    return NextResponse.json({
      message: 'Account created. Please verify your email with the OTP sent.',
      userId: user._id.toString(),
      emailSent,
      // In demo mode show OTP (only when SMTP not configured)
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

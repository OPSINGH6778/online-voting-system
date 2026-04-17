import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

const PRIMARY_ADMIN = (process.env.ADMIN_EMAIL || 'opsingh26122002@gmail.com').toLowerCase();

async function requireAdmin(request: NextRequest) {
  const cookie = request.cookies.get('session');
  if (!cookie) return null;
  const userId = verifySessionToken(cookie.value);
  if (!userId) return null;
  const user = await dbOperations.getUserById(userId);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const admins = await dbOperations.getAllAdmins();
    return NextResponse.json({
      admins: admins.map((a: any) => ({
        id: a._id.toString(),
        name: a.name,
        email: a.email,
        isVerified: a.is_verified,
        isPrimary: a.email.toLowerCase() === PRIMARY_ADMIN,
        createdAt: a.created_at,
      })),
      primaryAdmin: PRIMARY_ADMIN,
      canAddAdmin: admin.email.toLowerCase() === PRIMARY_ADMIN,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    // Only primary admin can add other admins
    if (admin.email.toLowerCase() !== PRIMARY_ADMIN) {
      return NextResponse.json({
        error: `Only the primary administrator (${PRIMARY_ADMIN}) can add new admins.`,
      }, { status: 403 });
    }

    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 });
    }
    const exists = await dbOperations.getUserByEmail(email);
    if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 400 });

    const newAdmin = await dbOperations.createUser({
      name, email,
      password_hash: await bcrypt.hash(password, 10),
      role: 'admin',
      is_verified: true,
    });
    return NextResponse.json({
      message: 'Admin added successfully',
      admin: { id: newAdmin._id.toString(), name: newAdmin.name, email: newAdmin.email },
    }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

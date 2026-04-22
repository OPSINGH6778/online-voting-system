import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbOperations } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';
import { z } from 'zod';

export const runtime = 'nodejs';

const PRIMARY_ADMIN = (process.env.ADMIN_EMAIL || 'opsingh26122002@gmail.com').toLowerCase();

// Validation schema
const createAdminSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

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

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const admins = await dbOperations.getAllAdmins();

    return NextResponse.json({
      success: true,
      admins: admins.map((a: any) => ({
        id: a._id.toString(),
        name: a.name,
        email: a.email,
        isVerified: a.is_verified,
        isPrimary: a.email.toLowerCase() === PRIMARY_ADMIN,
        role: a.role,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })),
      primaryAdmin: PRIMARY_ADMIN,
      canAddAdmin: admin.email.toLowerCase() === PRIMARY_ADMIN,
    });
  } catch (error: any) {
    console.error('GET /api/admin/admins error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch admins',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only primary admin can add other admins
    if (admin.email.toLowerCase() !== PRIMARY_ADMIN) {
      return NextResponse.json(
        {
          error: `Only the primary administrator (${PRIMARY_ADMIN}) can add new admins.`,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createAdminSchema.safeParse(body);

    // ✅ FIXED VALIDATION ERROR HANDLING
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // ✅ SAFE ACCESS AFTER SUCCESS
    const { name, email, password } = validation.data;

    // Check if user already exists
    const exists = await dbOperations.getUserByEmail(email);

    if (exists) {
      return NextResponse.json(
        {
          error: 'Email already registered',
        },
        { status: 400 }
      );
    }

    // Create new admin
    const newAdmin = await dbOperations.createUser({
      name,
      email: email.toLowerCase(),
      password_hash: await bcrypt.hash(password, 10),
      role: 'admin',
      is_verified: true,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Admin added successfully',
        admin: {
          id: newAdmin._id.toString(),
          name: newAdmin.name,
          email: newAdmin.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/admin/admins error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create admin',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
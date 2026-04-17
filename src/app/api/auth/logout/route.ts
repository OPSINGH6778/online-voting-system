import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  response.cookies.set('session', '', { maxAge: 0, path: '/' });
  return response;
}

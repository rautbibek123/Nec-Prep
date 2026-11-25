import { NextResponse } from 'next/server';
import { getSessionUserFromCookies, isGoogleAuthConfigured } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUserFromCookies();
  return NextResponse.json({
    googleConfigured: isGoogleAuthConfigured(),
    user,
  });
}

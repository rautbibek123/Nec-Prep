import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  getPublicOrigin,
  isGoogleAuthConfigured,
  OAUTH_STATE_COOKIE_NAME,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const origin = getPublicOrigin(request.url);
  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(`${origin}/?authError=google_not_configured`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
  const redirectUri = `${origin}/api/auth/google/callback`;
  const state = crypto.randomBytes(24).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state,
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );

  res.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: origin.startsWith('https://'),
    path: '/',
    maxAge: 60 * 10,
  });

  return res;
}

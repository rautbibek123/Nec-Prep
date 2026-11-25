import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  createSignedSessionToken,
  getPublicOrigin,
  isGoogleAuthConfigured,
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';
import type { AppUser } from '@/types/mcq';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const origin = getPublicOrigin(request.url);
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${origin}/?authError=${encodeURIComponent(error)}`);
  }

  if (!isGoogleAuthConfigured() || !code || !state) {
    return NextResponse.redirect(`${origin}/?authError=invalid_oauth_callback`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${origin}/?authError=state_mismatch`);
  }

  const redirectUri = `${origin}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
        client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${origin}/?authError=token_exchange_failed`);
    }

    const tokenJson = (await tokenRes.json()) as { access_token?: string };
    if (!tokenJson.access_token) {
      return NextResponse.redirect(`${origin}/?authError=missing_access_token`);
    }

    const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (!profileRes.ok) {
      return NextResponse.redirect(`${origin}/?authError=userinfo_failed`);
    }

    const profile = (await profileRes.json()) as {
      sub?: string;
      name?: string;
      email?: string;
      picture?: string;
    };

    if (!profile.sub) {
      return NextResponse.redirect(`${origin}/?authError=missing_sub`);
    }

    const user: AppUser = {
      id: `google:${profile.sub}`,
      name: profile.name || profile.email || 'Google User',
      email: profile.email,
      image: profile.picture,
      provider: 'google',
    };

    const sessionToken = createSignedSessionToken(user);
    const res = NextResponse.redirect(`${origin}/`);
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: origin.startsWith('https://'),
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch {
    return NextResponse.redirect(`${origin}/?authError=oauth_exception`);
  }
}

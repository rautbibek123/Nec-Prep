import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import type { AppUser } from '@/types/mcq';

export const SESSION_COOKIE_NAME = 'nec_session';
export const OAUTH_STATE_COOKIE_NAME = 'nec_oauth_state';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getAuthSecret(): string {
  const envSecret = process.env.AUTH_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }
  if (process.env.NODE_ENV === 'production') {
    // Ephemeral per-process fallback so builds & unconfigured containers never crash
    return crypto
      .createHash('sha256')
      .update(process.env.GOOGLE_CLIENT_SECRET || 'nec-asoe-ephemeral-secret')
      .digest('hex');
  }
  return 'nec-asoe-local-dev-secret-change-me';
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

interface TokenPayload {
  user: AppUser;
  exp: number;
}

export function createSignedSessionToken(user: AppUser): string {
  const payload: TokenPayload = {
    user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySignedSessionToken(token: string | undefined): AppUser | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as TokenPayload;
    if (!parsed?.user?.id || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed.user;
  } catch {
    return null;
  }
}

export async function getSessionUserFromCookies(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySignedSessionToken(token);
}

export function getPublicOrigin(requestUrl: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  const u = new URL(requestUrl);
  return u.origin;
}

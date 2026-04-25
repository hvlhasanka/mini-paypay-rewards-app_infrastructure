import { decode } from 'base-64';

interface JwtPayload {
  exp?: number;
  sub?: string;
  email?: string;
}

function base64UrlToBase64(input: string): string {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  return padded.replace(/-/g, '+').replace(/_/g, '/');
}

export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = decode(base64UrlToBase64(parts[1]!));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSec;
}

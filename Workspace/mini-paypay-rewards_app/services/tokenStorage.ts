import { decodeJwt } from './jwt';
import { secureStorage } from './secureStorage';

const KEY = 'auth.token';

export interface StoredToken {
  token: string;
  expiresAt: number;
}

export const tokenStorage = {
  async get(): Promise<StoredToken | null> {
    const raw = await secureStorage.getItem(KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as StoredToken;
      if (typeof parsed.token !== 'string' || typeof parsed.expiresAt !== 'number') return null;
      return parsed;
    } catch {
      return null;
    }
  },
  async set(token: string): Promise<StoredToken> {
    const payload = decodeJwt(token);
    const expiresAt = payload?.exp ? payload.exp * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000;
    const stored: StoredToken = { token, expiresAt };
    await secureStorage.setItem(KEY, JSON.stringify(stored));
    return stored;
  },
  async clear(): Promise<void> {
    await secureStorage.removeItem(KEY);
  },
  isExpired(stored: StoredToken, skewMs = 0): boolean {
    return stored.expiresAt <= Date.now() + skewMs;
  },
};

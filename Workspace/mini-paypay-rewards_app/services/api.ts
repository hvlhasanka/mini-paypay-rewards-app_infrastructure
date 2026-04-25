import axios from 'axios';
import Constants from 'expo-constants';
import { tokenStorage } from './tokenStorage';

const REFRESH_SKEW_MS = 2 * 60 * 1000;

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;

  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:4000`;

  return 'http://localhost:4000';
}

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 10000,
});

let refreshing: Promise<string | null> | null = null;

async function refreshToken(currentToken: string): Promise<string | null> {
  try {
    const { data } = await axios.post<{ token: string }>(
      `${api.defaults.baseURL}/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${currentToken}` }, timeout: 10000 },
    );
    const stored = await tokenStorage.set(data.token);
    return stored.token;
  } catch {
    await tokenStorage.clear();
    return null;
  }
}

async function getFreshToken(): Promise<string | null> {
  const stored = await tokenStorage.get();
  if (!stored) return null;

  if (!tokenStorage.isExpired(stored, REFRESH_SKEW_MS)) {
    return stored.token;
  }

  if (tokenStorage.isExpired(stored)) {
    await tokenStorage.clear();
    return null;
  }

  if (!refreshing) {
    refreshing = refreshToken(stored.token).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

api.interceptors.request.use(async (config) => {
  const skipAuth = (config as { skipAuth?: boolean }).skipAuth;
  if (skipAuth) return config;

  const token = await getFreshToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

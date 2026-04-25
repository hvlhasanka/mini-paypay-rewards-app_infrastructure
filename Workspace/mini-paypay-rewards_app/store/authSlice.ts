import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { api } from '@/services/api';
import { tokenStorage } from '@/services/tokenStorage';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  pushToken: string | null;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  balance: number;
  status: 'idle' | 'loading';
  bootstrapped: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  balance: 0,
  status: 'idle',
  bootstrapped: false,
  error: null,
};

function extractError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return 'Network error — check your connection and try again.';
    }
    const data = err.response.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }
  return fallback;
}

async function fetchMe() {
  const { data } = await api.get<{ user: AuthUser; balance: number }>('/users/me');
  return data;
}

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const stored = await tokenStorage.get();
  if (!stored) return { token: null, user: null, balance: 0 };

  if (tokenStorage.isExpired(stored)) {
    await tokenStorage.clear();
    return { token: null, user: null, balance: 0 };
  }

  try {
    const me = await fetchMe();
    return { token: stored.token, user: me.user, balance: me.balance };
  } catch {
    await tokenStorage.clear();
    return { token: null, user: null, balance: 0 };
  }
});

export const loginUser = createAsyncThunk<
  { token: string; user: AuthUser; balance: number },
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data: loginData } = await api.post<{ token: string }>('/auth/login', {
      email,
      password,
    });
    await tokenStorage.set(loginData.token);
    const me = await fetchMe();
    return { token: loginData.token, user: me.user, balance: me.balance };
  } catch (err) {
    return rejectWithValue(extractError(err, 'Login failed'));
  }
});

export const refreshMe = createAsyncThunk('auth/refreshMe', async () => fetchMe());

export const logout = createAsyncThunk('auth/logout', async () => {
  await tokenStorage.clear();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setBalance(state, action: { payload: number }) {
      state.balance = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.balance = action.payload.balance;
        state.bootstrapped = true;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.bootstrapped = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.balance = 0;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'idle';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.balance = action.payload.balance;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? action.error.message ?? 'Something went wrong';
      })
      .addCase(refreshMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.balance = action.payload.balance;
      });
  },
});

export const { clearError, setBalance } = authSlice.actions;
export default authSlice.reducer;

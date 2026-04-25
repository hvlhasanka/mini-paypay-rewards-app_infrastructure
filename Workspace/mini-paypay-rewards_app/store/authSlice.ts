import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { api } from '@/services/api';
import { tokenStorage } from '@/services/tokenStorage';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: 'idle' | 'loading';
  bootstrapped: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
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

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const stored = await tokenStorage.get();
  if (!stored) return { token: null, user: null };

  if (tokenStorage.isExpired(stored)) {
    await tokenStorage.clear();
    return { token: null, user: null };
  }

  try {
    const { data } = await api.get<{ user: AuthUser }>('/auth/me');
    return { token: stored.token, user: data.user };
  } catch {
    await tokenStorage.clear();
    return { token: null, user: null };
  }
});

export const loginUser = createAsyncThunk<
  { token: string; user: AuthUser },
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/login', {
      email,
      password,
    });
    await tokenStorage.set(data.token);
    return data;
  } catch (err) {
    return rejectWithValue(extractError(err, 'Login failed'));
  }
});

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
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.bootstrapped = true;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.bootstrapped = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'idle';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? action.error.message ?? 'Something went wrong';
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

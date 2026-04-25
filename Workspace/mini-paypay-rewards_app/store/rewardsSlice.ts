import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { api } from '@/services/api';

export interface Reward {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  pointsCost: number;
  stockRemaining: number;
  isActive: boolean;
  category: string;
}

export type RewardCategory = 'all' | 'lifestyle' | 'travel';

interface RewardsState {
  items: Reward[];
  balance: number;
  category: RewardCategory;
  status: 'idle' | 'loading';
  error: string | null;
}

const initialState: RewardsState = {
  items: [],
  balance: 0,
  category: 'all',
  status: 'idle',
  error: null,
};

function extractError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Network error — check your connection and try again.';
    const data = err.response.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }
  return fallback;
}

export const fetchRewards = createAsyncThunk<
  { rewards: Reward[]; balance: number },
  RewardCategory,
  { rejectValue: string }
>('rewards/fetch', async (category, { rejectWithValue }) => {
  try {
    const [rewardsRes, balanceRes] = await Promise.all([
      api.get<{ rewards: Reward[] }>('/rewards', {
        params: category === 'all' ? {} : { category },
      }),
      api.get<{ balance: number }>('/auth/balance'),
    ]);
    return { rewards: rewardsRes.data.rewards, balance: balanceRes.data.balance };
  } catch (err) {
    return rejectWithValue(extractError(err, 'Failed to load rewards'));
  }
});

const rewardsSlice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {
    setCategory(state, action: { payload: RewardCategory }) {
      state.category = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRewards.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRewards.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload.rewards;
        state.balance = action.payload.balance;
      })
      .addCase(fetchRewards.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? action.error.message ?? 'Failed to load rewards';
      });
  },
});

export const { setCategory } = rewardsSlice.actions;
export default rewardsSlice.reducer;

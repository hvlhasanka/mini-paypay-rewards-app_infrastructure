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
  category: RewardCategory;
  status: 'idle' | 'loading';
  error: string | null;
}

const initialState: RewardsState = {
  items: [],
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
  { rewards: Reward[] },
  RewardCategory,
  { rejectValue: string }
>('rewards/fetch', async (category, { rejectWithValue }) => {
  try {
    const { data } = await api.get<{ rewards: Reward[] }>('/rewards', {
      params: category === 'all' ? {} : { category },
    });
    return { rewards: data.rewards };
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
      })
      .addCase(fetchRewards.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? action.error.message ?? 'Failed to load rewards';
      });
  },
});

export const { setCategory } = rewardsSlice.actions;
export default rewardsSlice.reducer;

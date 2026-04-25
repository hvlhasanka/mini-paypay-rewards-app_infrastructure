import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { api } from '@/services/api';

export interface LedgerEntry {
  id: string;
  delta: number;
  reason: string;
  category: string;
  source: string | null;
  createdAt: string;
}

interface LedgerState {
  items: LedgerEntry[];
  page: number;
  hasMore: boolean;
  status: 'idle' | 'loading' | 'loadingMore' | 'refreshing';
  error: string | null;
}

const initialState: LedgerState = {
  items: [],
  page: 0,
  hasMore: false,
  status: 'idle',
  error: null,
};

const PAGE_SIZE = 20;

function extractError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Network error — check your connection and try again.';
    const data = err.response.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }
  return fallback;
}

interface TransactionsResponse {
  transactions: LedgerEntry[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export const fetchLedger = createAsyncThunk<
  TransactionsResponse,
  void,
  { rejectValue: string }
>('ledger/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get<TransactionsResponse>('/users/me/transactions', {
      params: { page: 1, limit: PAGE_SIZE },
    });
    return data;
  } catch (err) {
    return rejectWithValue(extractError(err, 'Failed to load history'));
  }
});

export const fetchMoreLedger = createAsyncThunk<
  TransactionsResponse,
  number,
  { rejectValue: string }
>('ledger/fetchMore', async (nextPage, { rejectWithValue }) => {
  try {
    const { data } = await api.get<TransactionsResponse>('/users/me/transactions', {
      params: { page: nextPage, limit: PAGE_SIZE },
    });
    return data;
  } catch (err) {
    return rejectWithValue(extractError(err, 'Failed to load more history'));
  }
});

const ledgerSlice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLedger.pending, (state) => {
        state.status = state.items.length === 0 ? 'loading' : 'refreshing';
        state.error = null;
      })
      .addCase(fetchLedger.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload.transactions;
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchLedger.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Failed to load history';
      })
      .addCase(fetchMoreLedger.pending, (state) => {
        state.status = 'loadingMore';
      })
      .addCase(fetchMoreLedger.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = [...state.items, ...action.payload.transactions];
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchMoreLedger.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Failed to load more history';
      });
  },
});

export default ledgerSlice.reducer;

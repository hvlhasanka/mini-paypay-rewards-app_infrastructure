import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import ledgerReducer from './ledgerSlice';
import rewardsReducer from './rewardsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ledger: ledgerReducer,
    rewards: rewardsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

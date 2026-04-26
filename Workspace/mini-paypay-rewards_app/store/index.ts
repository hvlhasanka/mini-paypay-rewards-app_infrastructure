import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import ledgerReducer from './ledgerSlice';
import rewardsReducer from './rewardsSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ledger: ledgerReducer,
    rewards: rewardsReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

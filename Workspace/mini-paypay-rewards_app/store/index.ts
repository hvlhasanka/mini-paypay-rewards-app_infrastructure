import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import rewardsReducer from './rewardsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rewards: rewardsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

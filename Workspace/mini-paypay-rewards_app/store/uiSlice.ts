import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AlertKind } from '@/components/alert-modal';

interface AlertPayload {
  kind: AlertKind;
  title: string;
  message?: string;
  actionLabel?: string;
}

interface UiState {
  alert: (AlertPayload & { visible: true }) | null;
}

const initialState: UiState = { alert: null };

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showAlert(state, action: PayloadAction<AlertPayload>) {
      state.alert = { ...action.payload, visible: true };
    },
    hideAlert(state) {
      state.alert = null;
    },
  },
});

export const { showAlert, hideAlert } = uiSlice.actions;
export default uiSlice.reducer;

import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import patientSlice from './slices/patientSlice';
import appointmentSlice from './slices/appointmentSlice';
import medicalRecordSlice from './slices/medicalRecordSlice';
import prescriptionSlice from './slices/prescriptionSlice';
import medicineSlice from './slices/medicineSlice';
import dashboardSlice from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    patients: patientSlice,
    appointments: appointmentSlice,
    medicalRecords: medicalRecordSlice,
    prescriptions: prescriptionSlice,
    medicines: medicineSlice,
    dashboard: dashboardSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

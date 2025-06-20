import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchPrescriptions = createAsyncThunk(
  'prescriptions/fetchPrescriptions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/prescriptions', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi lấy danh sách đơn thuốc');
    }
  }
);

export const createPrescription = createAsyncThunk(
  'prescriptions/createPrescription',
  async (prescriptionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/prescriptions', prescriptionData);
      return response.data.data.prescription;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tạo đơn thuốc');
    }
  }
);

export const updatePrescription = createAsyncThunk(
  'prescriptions/updatePrescription',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/prescriptions/${id}`, data);
      return response.data.data.prescription;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật đơn thuốc');
    }
  }
);

export const updatePrescriptionStatus = createAsyncThunk(
  'prescriptions/updatePrescriptionStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/prescriptions/${id}/status`, { status });
      return response.data.data.prescription;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật trạng thái');
    }
  }
);

export const deletePrescription = createAsyncThunk(
  'prescriptions/deletePrescription',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/prescriptions/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi xóa đơn thuốc');
    }
  }
);

const initialState = {
  prescriptions: [],
  currentPrescription: null,
  pagination: { current: 1, total: 1, count: 0, totalRecords: 0 },
  loading: false,
  error: null,
};

const prescriptionSlice = createSlice({
  name: 'prescriptions',
  initialState,
  reducers: {
    clearCurrentPrescription: (state) => {
      state.currentPrescription = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrescriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrescriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.prescriptions = action.payload.prescriptions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPrescriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPrescription.fulfilled, (state, action) => {
        state.prescriptions.unshift(action.payload);
      })
      .addCase(updatePrescription.fulfilled, (state, action) => {
        const index = state.prescriptions.findIndex((prescription) => prescription.id === action.payload.id);
        if (index !== -1) {
          state.prescriptions[index] = action.payload;
        }
      })
      .addCase(updatePrescriptionStatus.fulfilled, (state, action) => {
        const index = state.prescriptions.findIndex((prescription) => prescription.id === action.payload.id);
        if (index !== -1) {
          state.prescriptions[index] = action.payload;
        }
      })
      .addCase(deletePrescription.fulfilled, (state, action) => {
        state.prescriptions = state.prescriptions.filter((prescription) => prescription.id !== action.payload);
      });
  },
});

export const { clearCurrentPrescription, clearError } = prescriptionSlice.actions;
export default prescriptionSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMedicalRecords = createAsyncThunk(
  'medicalRecords/fetchMedicalRecords',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/medical-records', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi lấy danh sách hồ sơ');
    }
  }
);

export const createMedicalRecord = createAsyncThunk(
  'medicalRecords/createMedicalRecord',
  async (recordData, { rejectWithValue }) => {
    try {
      const response = await api.post('/medical-records', recordData);
      return response.data.data.record;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tạo hồ sơ y tế');
    }
  }
);

export const updateMedicalRecord = createAsyncThunk(
  'medicalRecords/updateMedicalRecord',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/medical-records/${id}`, data);
      return response.data.data.record;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật hồ sơ');
    }
  }
);

export const deleteMedicalRecord = createAsyncThunk(
  'medicalRecords/deleteMedicalRecord',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/medical-records/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi xóa hồ sơ');
    }
  }
);

const initialState = {
  records: [],
  currentRecord: null,
  pagination: { current: 1, total: 1, count: 0, totalRecords: 0 },
  loading: false,
  error: null,
};

const medicalRecordSlice = createSlice({
  name: 'medicalRecords',
  initialState,
  reducers: {
    clearCurrentRecord: (state) => {
      state.currentRecord = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedicalRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMedicalRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload.records || action.payload || [];
        state.pagination = action.payload.pagination || { current: 1, total: 1, count: 0, totalRecords: 0 };
      })
      .addCase(fetchMedicalRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createMedicalRecord.fulfilled, (state, action) => {
        state.records.unshift(action.payload);
      })
      .addCase(updateMedicalRecord.fulfilled, (state, action) => {
        const index = state.records.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.records[index] = action.payload;
        }
      })
      .addCase(deleteMedicalRecord.fulfilled, (state, action) => {
        state.records = state.records.filter(r => r._id !== action.payload);
      });
  },
});

export const { clearCurrentRecord, clearError } = medicalRecordSlice.actions;
export default medicalRecordSlice.reducer;

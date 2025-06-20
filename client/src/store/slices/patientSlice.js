import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchPatients = createAsyncThunk(
  'patients/fetchPatients',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/patients', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi lấy danh sách bệnh nhân');
    }
  }
);

export const fetchPatientById = createAsyncThunk(
  'patients/fetchPatientById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/patients/${id}`);
      return response.data.data.patient;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi lấy thông tin bệnh nhân');
    }
  }
);

export const createPatient = createAsyncThunk(
  'patients/createPatient',
  async (patientData, { rejectWithValue }) => {
    try {
      const response = await api.post('/patients', patientData);
      return response.data.data.patient;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tạo bệnh nhân');
    }
  }
);

export const updatePatient = createAsyncThunk(
  'patients/updatePatient',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/patients/${id}`, data);
      return response.data.data.patient;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật bệnh nhân');
    }
  }
);

export const deletePatient = createAsyncThunk(
  'patients/deletePatient',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/patients/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi xóa bệnh nhân');
    }
  }
);

export const searchPatients = createAsyncThunk(
  'patients/searchPatients',
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get('/patients/search/quick', { params: query });
      return response.data.data.patient;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tìm kiếm bệnh nhân');
    }
  }
);

const initialState = {
  patients: [],
  currentPatient: null,
  searchResult: null,
  pagination: {
    current: 1,
    total: 1,
    count: 0,
    totalRecords: 0,
  },
  loading: false,
  error: null,
  filters: {
    search: '',
    gender: '',
    ageMin: '',
    ageMax: '',
    bloodType: '',
  },
};

const patientSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    clearCurrentPatient: (state) => {
      state.currentPatient = null;
    },
    clearSearchResult: (state) => {
      state.searchResult = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        gender: '',
        ageMin: '',
        ageMax: '',
        bloodType: '',
      };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch patients
      .addCase(fetchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.patients = action.payload.patients;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch patient by ID
      .addCase(fetchPatientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPatient = action.payload;
        state.error = null;
      })
      .addCase(fetchPatientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create patient
      .addCase(createPatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPatient.fulfilled, (state, action) => {
        state.loading = false;
        state.patients.unshift(action.payload);
        state.error = null;
      })
      .addCase(createPatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update patient
      .addCase(updatePatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePatient.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.patients.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.patients[index] = action.payload;
        }
        state.currentPatient = action.payload;
        state.error = null;
      })
      .addCase(updatePatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete patient
      .addCase(deletePatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePatient.fulfilled, (state, action) => {
        state.loading = false;
        state.patients = state.patients.filter(p => p._id !== action.payload);
        state.error = null;
      })
      .addCase(deletePatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Search patients
      .addCase(searchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResult = action.payload;
        state.error = null;
      })
      .addCase(searchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearCurrentPatient,
  clearSearchResult,
  setFilters,
  clearFilters,
  clearError,
} = patientSlice.actions;

export default patientSlice.reducer;

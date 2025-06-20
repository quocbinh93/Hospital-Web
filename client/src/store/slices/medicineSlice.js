import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMedicines = createAsyncThunk(
  'medicines/fetchMedicines',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/medicines', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi lấy danh sách thuốc');
    }
  }
);

export const searchMedicines = createAsyncThunk(
  'medicines/searchMedicines',
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get('/medicines/search/quick', { params: { q: query } });
      return response.data.data.medicines;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tìm kiếm thuốc');
    }
  }
);

export const createMedicine = createAsyncThunk(
  'medicines/createMedicine',
  async (medicineData, { rejectWithValue }) => {
    try {
      const response = await api.post('/medicines', medicineData);
      return response.data.data.medicine;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tạo thuốc');
    }
  }
);

export const updateMedicine = createAsyncThunk(
  'medicines/updateMedicine',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/medicines/${id}`, data);
      return response.data.data.medicine;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật thuốc');
    }
  }
);

export const deleteMedicine = createAsyncThunk(
  'medicines/deleteMedicine',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/medicines/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi xóa thuốc');
    }
  }
);

export const updateStock = createAsyncThunk(
  'medicines/updateStock',
  async ({ id, type, quantity, reason }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/medicines/${id}/stock`, { type, quantity, reason });
      return response.data.data.medicine;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật kho');
    }
  }
);

const initialState = {
  medicines: [],
  searchResults: [],
  currentMedicine: null,
  pagination: { current: 1, total: 1, count: 0, totalRecords: 0 },
  filters: {},
  loading: false,
  error: null,
};

const medicineSlice = createSlice({
  name: 'medicines',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedicines.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMedicines.fulfilled, (state, action) => {
        state.loading = false;
        state.medicines = action.payload.medicines;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMedicines.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(searchMedicines.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      })
      .addCase(createMedicine.fulfilled, (state, action) => {
        state.medicines.unshift(action.payload);
      })
      .addCase(updateMedicine.fulfilled, (state, action) => {
        const index = state.medicines.findIndex(m => m._id === action.payload._id);
        if (index !== -1) {
          state.medicines[index] = action.payload;
        }
      })
      .addCase(deleteMedicine.fulfilled, (state, action) => {
        state.medicines = state.medicines.filter(m => m._id !== action.payload);
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        const index = state.medicines.findIndex(m => m._id === action.payload._id);
        if (index !== -1) {
          state.medicines[index] = action.payload;
        }
      });
  },
});

export const { clearSearchResults, clearError, setFilters, clearFilters } = medicineSlice.actions;
export default medicineSlice.reducer;

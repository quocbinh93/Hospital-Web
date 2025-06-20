import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  MenuItem,
  Pagination,
  Fab,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  People,
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Phone,
  Email,
  LocationOn,
  Person,
  FilterList,
  Clear,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import {
  fetchPatients,
  createPatient,
  updatePatient,
  deletePatient,
  setFilters,
  clearFilters,
} from '../store/slices/patientSlice';

const PatientsPage = () => {
  const dispatch = useDispatch();
  const { patients, pagination, loading, error, filters } = useSelector(
    (state) => state.patients
  );
  const { user } = useSelector((state) => state.auth);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  useEffect(() => {
    dispatch(fetchPatients({ page: 1, ...filters }));
  }, [dispatch, filters]);

  const handleCreatePatient = () => {
    setDialogMode('create');
    setSelectedPatient(null);
    reset();
    setOpenDialog(true);
  };

  const handleEditPatient = (patient) => {
    setDialogMode('edit');
    setSelectedPatient(patient);
    // Xử lý allergies từ array thành string để hiển thị trong form
    const formData = {
      ...patient,
      allergies: patient.allergies ? patient.allergies.join(', ') : ''
    };
    reset(formData);
    setOpenDialog(true);
  };

  const handleViewPatient = (patient) => {
    setDialogMode('view');
    setSelectedPatient(patient);
    // Xử lý allergies từ array thành string để hiển thị trong form
    const formData = {
      ...patient,
      allergies: patient.allergies ? patient.allergies.join(', ') : ''
    };
    reset(formData);
    setOpenDialog(true);
  };

  const handleDeletePatient = async (patientId) => {
    if (window.confirm('Bạn có chắc muốn xóa bệnh nhân này?')) {
      try {
        await dispatch(deletePatient(patientId)).unwrap();
        toast.success('Xóa bệnh nhân thành công!');
      } catch (error) {
        toast.error(error);
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      // Xử lý allergies từ string thành array
      const processedData = {
        ...data,
        allergies: data.allergies 
          ? data.allergies.split(',').map(item => item.trim()).filter(item => item !== '')
          : []
      };

      // Loại bỏ các trường không cần thiết khi gửi lên backend
      const { _id, __v, createdAt, updatedAt, age, createdBy, patientId, totalVisits, isActive, lastVisit, ...cleanData } = processedData;

      if (dialogMode === 'create') {
        await dispatch(createPatient(cleanData)).unwrap();
        toast.success('Thêm bệnh nhân thành công!');
      } else if (dialogMode === 'edit') {
        await dispatch(updatePatient({ id: selectedPatient._id, data: cleanData })).unwrap();
        toast.success('Cập nhật bệnh nhân thành công!');
      }
      setOpenDialog(false);
      reset();
    } catch (error) {
      toast.error(error);
    }
  };

  const handlePageChange = (event, page) => {
    dispatch(fetchPatients({ page, ...filters }));
  };

  const handleSearch = (searchTerm) => {
    dispatch(setFilters({ search: searchTerm }));
  };

  const handleFilterChange = (filterData) => {
    dispatch(setFilters(filterData));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const getGenderText = (gender) => {
    return gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác';
  };

  const getAgeFromDate = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <People />
          <Typography variant="h4" fontWeight="bold">
            Quản lý Bệnh nhân
          </Typography>
        </Box>
        {user?.role !== 'doctor' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreatePatient}
          >
            Thêm Bệnh nhân
          </Button>
        )}
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1}>
              <Button
                variant={showFilters ? 'contained' : 'outlined'}
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Bộ lọc
              </Button>
              {(filters.gender || filters.ageMin || filters.ageMax || filters.bloodType) && (
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
                >
                  Xóa lọc
                </Button>
              )}
            </Box>
          </Grid>

          {/* Advanced Filters */}
          {showFilters && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Giới tính"
                  value={filters.gender || ''}
                  onChange={(e) => handleFilterChange({ gender: e.target.value })}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="male">Nam</MenuItem>
                  <MenuItem value="female">Nữ</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Tuổi từ"
                  type="number"
                  value={filters.ageMin || ''}
                  onChange={(e) => handleFilterChange({ ageMin: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Tuổi đến"
                  type="number"
                  value={filters.ageMax || ''}
                  onChange={(e) => handleFilterChange({ ageMax: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Nhóm máu"
                  value={filters.bloodType || ''}
                  onChange={(e) => handleFilterChange({ bloodType: e.target.value })}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="A+">A+</MenuItem>
                  <MenuItem value="A-">A-</MenuItem>
                  <MenuItem value="B+">B+</MenuItem>
                  <MenuItem value="B-">B-</MenuItem>
                  <MenuItem value="AB+">AB+</MenuItem>
                  <MenuItem value="AB-">AB-</MenuItem>
                  <MenuItem value="O+">O+</MenuItem>
                  <MenuItem value="O-">O-</MenuItem>
                </TextField>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Patients Grid */}
      <Grid container spacing={3}>
        {patients.map((patient) => (
          <Grid item xs={12} sm={6} md={4} key={patient._id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {patient.fullName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {patient.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getAgeFromDate(patient.dateOfBirth)} tuổi • {getGenderText(patient.gender)}
                    </Typography>
                  </Box>
                  <Chip
                    label={patient.bloodType || 'N/A'}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">{patient.phone}</Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">{patient.email}</Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" noWrap>
                    {patient.address}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Tooltip title="Xem chi tiết">
                    <IconButton
                      size="small"
                      onClick={() => handleViewPatient(patient)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  
                  {user?.role !== 'doctor' && (
                    <>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          size="small"
                          onClick={() => handleEditPatient(patient)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Xóa">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePatient(patient._id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {pagination && pagination.total > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={pagination.total}
            page={pagination.current}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Add Patient FAB for mobile */}
      {user?.role !== 'doctor' && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', md: 'none' },
          }}
          onClick={handleCreatePatient}
        >
          <Add />
        </Fab>
      )}

      {/* Patient Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Thêm Bệnh nhân Mới'}
          {dialogMode === 'edit' && 'Chỉnh sửa Bệnh nhân'}
          {dialogMode === 'view' && 'Thông tin Bệnh nhân'}
        </DialogTitle>
        
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Họ và tên"
                  disabled={dialogMode === 'view'}
                  {...register('fullName', {
                    required: 'Họ và tên là bắt buộc',
                  })}
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ngày sinh"
                  type="date"
                  disabled={dialogMode === 'view'}
                  {...register('dateOfBirth', {
                    required: 'Ngày sinh là bắt buộc',
                  })}
                  error={!!errors.dateOfBirth}
                  helperText={errors.dateOfBirth?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Giới tính"
                  disabled={dialogMode === 'view'}
                  {...register('gender', {
                    required: 'Giới tính là bắt buộc',
                  })}
                  error={!!errors.gender}
                  helperText={errors.gender?.message}
                >
                  <MenuItem value="male">Nam</MenuItem>
                  <MenuItem value="female">Nữ</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  disabled={dialogMode === 'view'}
                  {...register('phone', {
                    required: 'Số điện thoại là bắt buộc',
                    pattern: {
                      value: /^[0-9]{10,11}$/,
                      message: 'Số điện thoại không hợp lệ',
                    },
                  })}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  disabled={dialogMode === 'view'}
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email không hợp lệ',
                    },
                  })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CMND/CCCD"
                  disabled={dialogMode === 'view'}
                  {...register('identityCard', {
                    required: 'CMND/CCCD là bắt buộc',
                  })}
                  error={!!errors.identityCard}
                  helperText={errors.identityCard?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Địa chỉ"
                  multiline
                  rows={2}
                  disabled={dialogMode === 'view'}
                  {...register('address')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Nhóm máu"
                  disabled={dialogMode === 'view'}
                  {...register('bloodType')}
                >
                  <MenuItem value="">Chọn nhóm máu</MenuItem>
                  <MenuItem value="A+">A+</MenuItem>
                  <MenuItem value="A-">A-</MenuItem>
                  <MenuItem value="B+">B+</MenuItem>
                  <MenuItem value="B-">B-</MenuItem>
                  <MenuItem value="AB+">AB+</MenuItem>
                  <MenuItem value="AB-">AB-</MenuItem>
                  <MenuItem value="O+">O+</MenuItem>
                  <MenuItem value="O-">O-</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Allergies (cách nhau bởi dấu phẩy)"
                  disabled={dialogMode === 'view'}
                  {...register('allergies')}
                  placeholder="Ví dụ: Penicillin, Aspirin"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tiền sử bệnh"
                  multiline
                  rows={3}
                  disabled={dialogMode === 'view'}
                  {...register('medicalHistory')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Người liên hệ khẩn cấp"
                  disabled={dialogMode === 'view'}
                  {...register('emergencyContact.name')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="SĐT người liên hệ khẩn cấp"
                  disabled={dialogMode === 'view'}
                  {...register('emergencyContact.phone')}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          {dialogMode !== 'view' && (
            <Button
              onClick={handleSubmit(onSubmit)}
              variant="contained"
              disabled={loading}
            >
              {dialogMode === 'create' ? 'Thêm' : 'Cập nhật'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientsPage;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  InputAdornment,
  LinearProgress,
  Fab,
  Badge,
} from '@mui/material';
import {
  Medication,
  Add,
  Edit,
  Delete,
  Visibility,
  Warning,
  CheckCircle,
  Search,
  FilterList,
  Clear,
  Inventory,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import {
  fetchMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock,
  setFilters,
  clearFilters,
} from '../store/slices/medicineSlice';

const MedicinesPage = () => {
  const dispatch = useDispatch();
  const { medicines, loading, error, filters } = useSelector((state) => state.medicines);
  const { user } = useSelector((state) => state.auth);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [stockDialog, setStockDialog] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  const {
    register: registerStock,
    handleSubmit: handleSubmitStock,
    formState: { errors: stockErrors },
    reset: resetStock,
  } = useForm();

  useEffect(() => {
    dispatch(fetchMedicines({ ...filters }));
  }, [dispatch, filters]);

  const handleCreateMedicine = () => {
    setDialogMode('create');
    setSelectedMedicine(null);
    reset({
      category: 'tablet',
      dosageForm: 'tablet',
      stock: {
        quantity: 0,
        minQuantity: 10,
        unit: 'viên',
      },
    });
    setOpenDialog(true);
  };

  const handleEditMedicine = (medicine) => {
    setDialogMode('edit');
    setSelectedMedicine(medicine);
    reset({
      ...medicine,
      expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : '',
    });
    setOpenDialog(true);
  };

  const handleViewMedicine = (medicine) => {
    setDialogMode('view');
    setSelectedMedicine(medicine);
    reset(medicine);
    setOpenDialog(true);
  };

  const handleDeleteMedicine = async (medicineId) => {
    if (window.confirm('Bạn có chắc muốn xóa thuốc này?')) {
      try {
        await dispatch(deleteMedicine(medicineId)).unwrap();
        toast.success('Xóa thuốc thành công!');
      } catch (error) {
        toast.error(error);
      }
    }
  };

  const handleUpdateStock = (medicine) => {
    setSelectedMedicine(medicine);
    resetStock({
      type: 'in',
      quantity: '',
      reason: '',
    });
    setStockDialog(true);
  };

  const onSubmit = async (data) => {
    try {
      const medicineData = {
        ...data,
        price: parseFloat(data.price),
        costPrice: parseFloat(data.costPrice || 0),
        stock: {
          ...data.stock,
          quantity: parseInt(data.stock.quantity),
          minQuantity: parseInt(data.stock.minQuantity),
        },
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(t => t) : [],
      };

      if (dialogMode === 'create') {
        await dispatch(createMedicine(medicineData)).unwrap();
        toast.success('Thêm thuốc thành công!');
      } else if (dialogMode === 'edit') {
        await dispatch(updateMedicine({ id: selectedMedicine._id, data: medicineData })).unwrap();
        toast.success('Cập nhật thuốc thành công!');
      }
      setOpenDialog(false);
      reset();
    } catch (error) {
      toast.error(error);
    }
  };

  const onStockSubmit = async (data) => {
    try {
      await dispatch(updateStock({
        id: selectedMedicine._id,
        type: data.type,
        quantity: parseInt(data.quantity),
        reason: data.reason,
      })).unwrap();
      toast.success(`${data.type === 'in' ? 'Nhập' : 'Xuất'} kho thành công!`);
      setStockDialog(false);
      resetStock();
    } catch (error) {
      toast.error(error);
    }
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

  const getCategoryText = (category) => {
    const categories = {
      tablet: 'Viên nén',
      capsule: 'Viên nang',
      liquid: 'Dạng lỏng',
      injection: 'Tiêm',
      topical: 'Bôi ngoài',
      other: 'Khác',
    };
    return categories[category] || category;
  };

  const getStockStatus = (medicine) => {
    const { quantity, minQuantity } = medicine.stock;
    if (quantity === 0) return { status: 'out', color: 'error', text: 'Hết hàng' };
    if (quantity <= minQuantity) return { status: 'low', color: 'warning', text: 'Sắp hết' };
    return { status: 'good', color: 'success', text: 'Còn hàng' };
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const lowStockCount = medicines.filter(med => getStockStatus(med).status === 'low').length;
  const expiredCount = medicines.filter(med => isExpired(med.expiryDate)).length;
  const expiringSoonCount = medicines.filter(med => isExpiringSoon(med.expiryDate)).length;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Medication />
          <Typography variant="h4" fontWeight="bold">
            Quản lý Thuốc
          </Typography>
        </Box>
        {(user?.role === 'admin' || user?.role === 'pharmacist') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateMedicine}
          >
            Thêm Thuốc
          </Button>
        )}
      </Box>

      {/* Alerts */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {expiredCount > 0 && (
          <Grid item xs={12} md={4}>
            <Alert severity="error" icon={<Warning />}>
              <Typography variant="body2">
                <strong>{expiredCount}</strong> thuốc đã hết hạn
              </Typography>
            </Alert>
          </Grid>
        )}
        {expiringSoonCount > 0 && (
          <Grid item xs={12} md={4}>
            <Alert severity="warning" icon={<Warning />}>
              <Typography variant="body2">
                <strong>{expiringSoonCount}</strong> thuốc sắp hết hạn
              </Typography>
            </Alert>
          </Grid>
        )}
        {lowStockCount > 0 && (
          <Grid item xs={12} md={4}>
            <Alert severity="warning" icon={<Inventory />}>
              <Typography variant="body2">
                <strong>{lowStockCount}</strong> thuốc sắp hết
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo tên thuốc, thành phần..."
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
              {(filters.category || filters.stockStatus || filters.expiryStatus) && (
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
                  label="Phân loại"
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange({ category: e.target.value })}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="tablet">Viên nén</MenuItem>
                  <MenuItem value="capsule">Viên nang</MenuItem>
                  <MenuItem value="liquid">Dạng lỏng</MenuItem>
                  <MenuItem value="injection">Tiêm</MenuItem>
                  <MenuItem value="topical">Bôi ngoài</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Tình trạng kho"
                  value={filters.stockStatus || ''}
                  onChange={(e) => handleFilterChange({ stockStatus: e.target.value })}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="good">Còn hàng</MenuItem>
                  <MenuItem value="low">Sắp hết</MenuItem>
                  <MenuItem value="out">Hết hàng</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Tình trạng hạn dùng"
                  value={filters.expiryStatus || ''}
                  onChange={(e) => handleFilterChange({ expiryStatus: e.target.value })}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="valid">Còn hạn</MenuItem>
                  <MenuItem value="expiring">Sắp hết hạn</MenuItem>
                  <MenuItem value="expired">Đã hết hạn</MenuItem>
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

      {/* Medicines Grid */}
      <Grid container spacing={3}>
        {medicines.map((medicine) => {
          const stockStatus = getStockStatus(medicine);
          const expired = isExpired(medicine.expiryDate);
          const expiringSoon = isExpiringSoon(medicine.expiryDate);

          return (
            <Grid item xs={12} sm={6} md={4} key={medicine._id}>
              <Card sx={{ position: 'relative' }}>
                {(expired || expiringSoon || stockStatus.status !== 'good') && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 1,
                    }}
                  >
                    {expired && (
                      <Chip
                        label="Hết hạn"
                        color="error"
                        size="small"
                        sx={{ mb: 0.5 }}
                      />
                    )}
                    {!expired && expiringSoon && (
                      <Chip
                        label="Sắp hết hạn"
                        color="warning"
                        size="small"
                        sx={{ mb: 0.5 }}
                      />
                    )}
                  </Box>
                )}

                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {medicine.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {medicine.genericName && `${medicine.genericName} • `}
                    {medicine.strength}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {getCategoryText(medicine.category)} • {medicine.dosageForm}
                  </Typography>

                  {medicine.brand && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Thương hiệu: {medicine.brand}
                    </Typography>
                  )}

                  {/* Stock Info */}
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="bold">
                        Tồn kho
                      </Typography>
                      <Chip
                        label={stockStatus.text}
                        color={stockStatus.color}
                        size="small"
                      />
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="body2">
                        {medicine.stock.quantity} {medicine.stock.unit}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        (Tối thiểu: {medicine.stock.minQuantity})
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={Math.min((medicine.stock.quantity / (medicine.stock.minQuantity * 2)) * 100, 100)}
                      color={stockStatus.color}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  {/* Price */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Giá bán:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {medicine.price?.toLocaleString('vi-VN')} VNĐ
                    </Typography>
                  </Box>

                  {/* Expiry Date */}
                  {medicine.expiryDate && (
                    <Typography
                      variant="body2"
                      color={expired ? 'error' : expiringSoon ? 'warning.main' : 'text.secondary'}
                      gutterBottom
                    >
                      HSD: {new Date(medicine.expiryDate).toLocaleDateString('vi-VN')}
                    </Typography>
                  )}

                  {/* Actions */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          size="small"
                          onClick={() => handleViewMedicine(medicine)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      
                      {(user?.role === 'admin' || user?.role === 'pharmacist') && (
                        <>
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              onClick={() => handleEditMedicine(medicine)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Cập nhật kho">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleUpdateStock(medicine)}
                            >
                              <Inventory />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Xóa">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteMedicine(medicine._id)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {medicines.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Medication sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Không có thuốc nào
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Chưa có thuốc nào được thêm vào hệ thống
          </Typography>
        </Paper>
      )}

      {/* Add Medicine FAB for mobile */}
      {(user?.role === 'admin' || user?.role === 'pharmacist') && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', md: 'none' },
          }}
          onClick={handleCreateMedicine}
        >
          <Badge badgeContent={lowStockCount + expiredCount} color="error">
            <Add />
          </Badge>
        </Fab>
      )}

      {/* Medicine Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Thêm Thuốc Mới'}
          {dialogMode === 'edit' && 'Chỉnh sửa Thuốc'}
          {dialogMode === 'view' && 'Thông tin Thuốc'}
        </DialogTitle>
        
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tên thuốc"
                  disabled={dialogMode === 'view'}
                  {...register('name', {
                    required: 'Tên thuốc là bắt buộc',
                  })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tên khoa học"
                  disabled={dialogMode === 'view'}
                  {...register('genericName')}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Thương hiệu"
                  disabled={dialogMode === 'view'}
                  {...register('brand')}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Hàm lượng"
                  disabled={dialogMode === 'view'}
                  {...register('strength', {
                    required: 'Hàm lượng là bắt buộc',
                  })}
                  error={!!errors.strength}
                  helperText={errors.strength?.message}
                  placeholder="500mg"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Dạng bào chế"
                  disabled={dialogMode === 'view'}
                  {...register('dosageForm', {
                    required: 'Dạng bào chế là bắt buộc',
                  })}
                  error={!!errors.dosageForm}
                  helperText={errors.dosageForm?.message}
                >
                  <MenuItem value="tablet">Viên nén</MenuItem>
                  <MenuItem value="capsule">Viên nang</MenuItem>
                  <MenuItem value="liquid">Dạng lỏng</MenuItem>
                  <MenuItem value="injection">Tiêm</MenuItem>
                  <MenuItem value="topical">Bôi ngoài</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Phân loại"
                  disabled={dialogMode === 'view'}
                  {...register('category', {
                    required: 'Phân loại là bắt buộc',
                  })}
                  error={!!errors.category}
                  helperText={errors.category?.message}
                >
                  <MenuItem value="tablet">Viên nén</MenuItem>
                  <MenuItem value="capsule">Viên nang</MenuItem>
                  <MenuItem value="liquid">Dạng lỏng</MenuItem>
                  <MenuItem value="injection">Tiêm</MenuItem>
                  <MenuItem value="topical">Bôi ngoài</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mô tả"
                  multiline
                  rows={2}
                  disabled={dialogMode === 'view'}
                  {...register('description')}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Giá bán"
                  type="number"
                  disabled={dialogMode === 'view'}
                  {...register('price', {
                    required: 'Giá bán là bắt buộc',
                    min: { value: 0, message: 'Giá phải lớn hơn 0' }
                  })}
                  error={!!errors.price}
                  helperText={errors.price?.message}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Giá nhập"
                  type="number"
                  disabled={dialogMode === 'view'}
                  {...register('costPrice')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Hạn sử dụng"
                  type="date"
                  disabled={dialogMode === 'view'}
                  {...register('expiryDate')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Stock Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Thông tin kho
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Số lượng hiện tại"
                  type="number"
                  disabled={dialogMode === 'view'}
                  {...register('stock.quantity', {
                    required: 'Số lượng là bắt buộc',
                    min: { value: 0, message: 'Số lượng không được âm' }
                  })}
                  error={!!errors.stock?.quantity}
                  helperText={errors.stock?.quantity?.message}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Số lượng tối thiểu"
                  type="number"
                  disabled={dialogMode === 'view'}
                  {...register('stock.minQuantity', {
                    required: 'Số lượng tối thiểu là bắt buộc',
                    min: { value: 1, message: 'Số lượng tối thiểu phải lớn hơn 0' }
                  })}
                  error={!!errors.stock?.minQuantity}
                  helperText={errors.stock?.minQuantity?.message}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Đơn vị tính"
                  disabled={dialogMode === 'view'}
                  {...register('stock.unit', {
                    required: 'Đơn vị tính là bắt buộc',
                  })}
                  error={!!errors.stock?.unit}
                  helperText={errors.stock?.unit?.message}
                  placeholder="viên, chai, hộp..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nhà sản xuất"
                  disabled={dialogMode === 'view'}
                  {...register('manufacturer')}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tags (phân cách bằng dấu phẩy)"
                  disabled={dialogMode === 'view'}
                  {...register('tags')}
                  placeholder="giảm đau, hạ sốt, kháng sinh..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            {dialogMode === 'view' ? 'Đóng' : 'Hủy'}
          </Button>
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

      {/* Stock Update Dialog */}
      <Dialog
        open={stockDialog}
        onClose={() => setStockDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cập nhật Tồn kho</DialogTitle>
        
        <DialogContent>
          <Box component="form" onSubmit={handleSubmitStock(onStockSubmit)} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  <strong>{selectedMedicine?.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tồn kho hiện tại: {selectedMedicine?.stock?.quantity} {selectedMedicine?.stock?.unit}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Loại giao dịch"
                  {...registerStock('type', {
                    required: 'Vui lòng chọn loại giao dịch',
                  })}
                  error={!!stockErrors.type}
                  helperText={stockErrors.type?.message}
                >
                  <MenuItem value="in">Nhập kho</MenuItem>
                  <MenuItem value="out">Xuất kho</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Số lượng"
                  type="number"
                  {...registerStock('quantity', {
                    required: 'Số lượng là bắt buộc',
                    min: { value: 1, message: 'Số lượng phải lớn hơn 0' }
                  })}
                  error={!!stockErrors.quantity}
                  helperText={stockErrors.quantity?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Lý do"
                  multiline
                  rows={2}
                  {...registerStock('reason')}
                  placeholder="Nhập lý do xuất/nhập kho..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setStockDialog(false)}>Hủy</Button>
          <Button
            onClick={handleSubmitStock(onStockSubmit)}
            variant="contained"
            disabled={loading}
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicinesPage;

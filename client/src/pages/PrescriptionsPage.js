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
  Avatar,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  InputAdornment,
  Fab,
} from '@mui/material';
import {
  LocalPharmacy,
  Add,
  Edit,
  Delete,
  Visibility,
  Print,
  CheckCircle,
  Cancel,
  Person,
  CalendarToday,
  Medication,
  Search,
  Remove,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';

import {
  fetchPrescriptions,
  createPrescription,
  updatePrescription,
  updatePrescriptionStatus,
  deletePrescription,
} from '../store/slices/prescriptionSlice';
import { fetchPatients } from '../store/slices/patientSlice';
import { fetchMedicines } from '../store/slices/medicineSlice';
import PrintPrescription from '../components/Prescriptions/PrintPrescription';

const PrescriptionsPage = () => {
  const dispatch = useDispatch();
  const { prescriptions, loading, error } = useSelector((state) => state.prescriptions);
  const { patients } = useSelector((state) => state.patients);
  const { medicines } = useSelector((state) => state.medicines);
  const { user } = useSelector((state) => state.auth);

  const [openDialog, setOpenDialog] = useState(false);
  const [openPrintDialog, setOpenPrintDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      patientId: '', // Set default value
      prescriptionDate: new Date().toISOString().split('T')[0],
      diagnosis: '',
      notes: '',
      status: 'active',
      medications: [{ medicineId: '', quantity: '', dosage: '', instructions: '', duration: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medications'
  });

  useEffect(() => {
    dispatch(fetchPrescriptions());
    dispatch(fetchPatients({ limit: 1000 }));
    dispatch(fetchMedicines({ limit: 1000 }));
  }, [dispatch]);

  const handleCreatePrescription = () => {
    setDialogMode('create');
    setSelectedPrescription(null);
    reset({
      prescriptionDate: new Date().toISOString().split('T')[0],
      medications: [{ medicineId: '', quantity: '', dosage: '', instructions: '' }],
      status: 'active',
    });
    setOpenDialog(true);
  };

  const handleEditPrescription = (prescription) => {
    setDialogMode('edit');
    setSelectedPrescription(prescription);
    reset({
      ...prescription,
      patientId: prescription.patient?._id,
      prescriptionDate: new Date(prescription.prescriptionDate).toISOString().split('T')[0],
    });
    setOpenDialog(true);
  };

  const handleViewPrescription = (prescription) => {
    setDialogMode('view');
    setSelectedPrescription(prescription);
    
    // Format data for form display
    const formData = {
      patientId: prescription.patient?._id,
      prescriptionDate: prescription.prescriptionDate ? 
        new Date(prescription.prescriptionDate).toISOString().split('T')[0] : '',
      diagnosis: prescription.diagnosis || '',
      notes: prescription.notes || '',
      status: prescription.status || 'active',
      medications: prescription.medications?.map(med => ({
        medicineId: med.medicine?._id,
        quantity: med.quantity,
        dosage: med.dosage,
        duration: med.duration,
        instructions: med.instructions
      })) || []
    };
    
    reset(formData);
    setOpenDialog(true);
  };

  const handlePrintPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setOpenPrintDialog(true);
  };

  const handleStatusUpdate = async (prescriptionId, status) => {
    try {
      await dispatch(updatePrescriptionStatus({ id: prescriptionId, status })).unwrap();
      toast.success(`Đã ${getStatusText(status).toLowerCase()} đơn thuốc`);
    } catch (error) {
      toast.error(error);
    }
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (window.confirm('Bạn có chắc muốn xóa đơn thuốc này?')) {
      try {
        await dispatch(deletePrescription(prescriptionId)).unwrap();
        toast.success('Xóa đơn thuốc thành công!');
      } catch (error) {
        toast.error(error);
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      const prescriptionData = {
        ...data,
        patient: data.patientId, // Map patientId to patient
        prescriptionDate: new Date(data.prescriptionDate),
        medications: data.medications.filter(med => med.medicineId && med.quantity).map(med => ({
          medicine: med.medicineId, // Map medicineId to medicine
          quantity: parseInt(med.quantity),
          dosage: med.dosage || '1 viên',
          frequency: med.instructions || 'Ngày 2 lần', // Map instructions to frequency
          duration: med.duration || '7 ngày', // Use form duration or default
          instructions: med.instructions || ''
        })),
      };

      // Remove patientId as it's mapped to patient
      delete prescriptionData.patientId;

      if (dialogMode === 'create') {
        const result = await dispatch(createPrescription(prescriptionData)).unwrap();
        toast.success('Tạo đơn thuốc thành công!');
      } else if (dialogMode === 'edit') {
        await dispatch(
          updatePrescription({ id: selectedPrescription._id, data: prescriptionData })
        ).unwrap();
        toast.success('Cập nhật đơn thuốc thành công!');
      }
      setOpenDialog(false);
      reset();
    } catch (error) {
      toast.error(error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'dispensed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'expired':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Đang hiệu lực';
      case 'dispensed':
        return 'Đã cấp phát';
      case 'cancelled':
        return 'Đã hủy';
      case 'expired':
        return 'Đã hết hạn';
      default:
        return status;
    }
  };

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch = searchTerm === '' || 
      prescription.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || prescription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const calculateTotalCost = (medications) => {
    return medications.reduce((total, med) => {
      const medicine = medicines.find(m => m._id === med.medicine?._id);
      return total + (medicine?.price || 0) * (med.quantity || 0);
    }, 0);
  };

  const getMedicineName = (medicineId) => {
    const medicine = medicines.find(m => m._id === medicineId);
    return medicine ? `${medicine.name} (${medicine.strength})` : '';
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <LocalPharmacy />
          <Typography variant="h4" fontWeight="bold">
            Quản lý Đơn thuốc
          </Typography>
        </Box>
        {user?.role === 'doctor' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreatePrescription}
          >
            Kê Đơn thuốc
          </Button>
        )}
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo tên bệnh nhân, chẩn đoán..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            <TextField
              fullWidth
              select
              label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">Tất cả trạng thái</MenuItem>
              <MenuItem value="active">Đang hiệu lực</MenuItem>
              <MenuItem value="dispensed">Đã cấp phát</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
              <MenuItem value="expired">Đã hết hạn</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Prescriptions Grid */}
      <Grid container spacing={3}>
        {filteredPrescriptions.map((prescription) => (
          <Grid item xs={12} md={6} lg={4} key={prescription._id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {prescription.patient?.fullName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {prescription.patient?.fullName || 'Bệnh nhân không xác định'}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CalendarToday sx={{ fontSize: 14 }} />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(prescription.prescriptionDate).toLocaleDateString('vi-VN')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Chip
                    label={getStatusText(prescription.status)}
                    color={getStatusColor(prescription.status)}
                    size="small"
                  />
                </Box>

                {/* Doctor Info */}
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    BS: {prescription.doctor?.fullName || 'Chưa xác định'}
                  </Typography>
                </Box>

                {/* Diagnosis */}
                {prescription.diagnosis && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    <strong>Chẩn đoán:</strong> {prescription.diagnosis}
                  </Typography>
                )}

                {/* Medications Count */}
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Medication sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {prescription.medications?.length || 0} loại thuốc
                  </Typography>
                </Box>

                {/* Total Cost */}
                <Typography variant="body2" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
                  Tổng tiền: {calculateTotalCost(prescription.medications || []).toLocaleString('vi-VN')} VNĐ
                </Typography>

                {/* Action Buttons */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" gap={1}>
                    {prescription.status === 'active' && user?.role !== 'doctor' && (
                      <Tooltip title="Cấp phát">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleStatusUpdate(prescription._id, 'dispensed')}
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {prescription.status === 'active' && (
                      <Tooltip title="Hủy đơn">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleStatusUpdate(prescription._id, 'cancelled')}
                        >
                          <Cancel />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <Box display="flex" gap={1}>
                    <Tooltip title="Xem chi tiết">
                      <IconButton
                        size="small"
                        onClick={() => handleViewPrescription(prescription)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    
                    {user?.role === 'doctor' && prescription.status === 'active' && (
                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          size="small"
                          onClick={() => handleEditPrescription(prescription)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="In đơn thuốc">
                      <IconButton 
                        size="small"
                        onClick={() => handlePrintPrescription(prescription)}
                      >
                        <Print />
                      </IconButton>
                    </Tooltip>
                    
                    {user?.role === 'doctor' && (
                      <Tooltip title="Xóa">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePrescription(prescription._id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredPrescriptions.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <LocalPharmacy sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Không có đơn thuốc nào
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || statusFilter ? 'Không tìm thấy đơn thuốc phù hợp với bộ lọc' : 'Chưa có đơn thuốc nào được kê'}
          </Typography>
        </Paper>
      )}

      {/* Add Prescription FAB for mobile */}
      {user?.role === 'doctor' && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', md: 'none' },
          }}
          onClick={handleCreatePrescription}
        >
          <Add />
        </Fab>
      )}

      {/* Prescription Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Kê Đơn thuốc Mới'}
          {dialogMode === 'edit' && 'Chỉnh sửa Đơn thuốc'}
          {dialogMode === 'view' && 'Chi tiết Đơn thuốc'}
        </DialogTitle>
        
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              {/* Basic Info */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="patientId"
                  control={control}
                  rules={{ required: 'Vui lòng chọn bệnh nhân' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Bệnh nhân"
                      disabled={dialogMode === 'view'}
                      error={!!errors.patientId}
                      helperText={errors.patientId?.message}
                    >
                      {patients.map((patient) => (
                        <MenuItem key={patient._id} value={patient._id}>
                          {patient.fullName} - {patient.phone}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ngày kê đơn"
                  type="date"
                  disabled={dialogMode === 'view'}
                  {...register('prescriptionDate', {
                    required: 'Ngày kê đơn là bắt buộc',
                  })}
                  error={!!errors.prescriptionDate}
                  helperText={errors.prescriptionDate?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Chẩn đoán"
                  multiline
                  rows={2}
                  disabled={dialogMode === 'view'}
                  {...register('diagnosis', {
                    required: 'Chẩn đoán là bắt buộc',
                  })}
                  error={!!errors.diagnosis}
                  helperText={errors.diagnosis?.message}
                />
              </Grid>

              {/* Medications */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Thuốc điều trị</Typography>
                  {dialogMode !== 'view' && (
                    <Button
                      startIcon={<Add />}
                      onClick={() => append({ medicineId: '', quantity: '', dosage: '', instructions: '', duration: '' })}
                    >
                      Thêm thuốc
                    </Button>
                  )}
                </Box>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tên thuốc</TableCell>
                        <TableCell>Số lượng</TableCell>
                        <TableCell>Liều dùng</TableCell>
                        <TableCell>Thời gian dùng</TableCell>
                        <TableCell>Hướng dẫn</TableCell>
                        {dialogMode !== 'view' && <TableCell>Thao tác</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            {dialogMode === 'view' ? (
                              <Typography variant="body2">
                                {selectedPrescription?.medications?.[index]?.medicine?.name || 
                                 selectedPrescription?.medications?.[index]?.medicineName || 
                                 'N/A'}
                              </Typography>
                            ) : (
                              <Controller
                                name={`medications.${index}.medicineId`}
                                control={control}
                                rules={{ required: 'Vui lòng chọn thuốc' }}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    select
                                    size="small"
                                    error={!!errors.medications?.[index]?.medicineId}
                                    sx={{ minWidth: 200 }}
                                  >
                                    {medicines.map((medicine) => (
                                      <MenuItem key={medicine._id} value={medicine._id}>
                                        {medicine.name} ({medicine.strength})
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                )}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {dialogMode === 'view' ? (
                              <Typography variant="body2">
                                {selectedPrescription?.medications?.[index]?.quantity || 'N/A'}
                              </Typography>
                            ) : (
                              <TextField
                                size="small"
                                type="number"
                                {...register(`medications.${index}.quantity`, {
                                  required: 'Số lượng là bắt buộc',
                                  min: { value: 1, message: 'Số lượng phải lớn hơn 0' }
                                })}
                                error={!!errors.medications?.[index]?.quantity}
                                sx={{ width: 80 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {dialogMode === 'view' ? (
                              <Typography variant="body2">
                                {selectedPrescription?.medications?.[index]?.dosage || 'N/A'}
                              </Typography>
                            ) : (
                              <TextField
                                size="small"
                                {...register(`medications.${index}.dosage`)}
                                placeholder="2 viên/lần"
                                sx={{ width: 120 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {dialogMode === 'view' ? (
                              <Typography variant="body2">
                                {selectedPrescription?.medications?.[index]?.duration || 'N/A'}
                              </Typography>
                            ) : (
                              <TextField
                                size="small"
                                {...register(`medications.${index}.duration`)}
                                placeholder="7 ngày"
                                sx={{ width: 100 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {dialogMode === 'view' ? (
                              <Typography variant="body2">
                                {selectedPrescription?.medications?.[index]?.instructions || 'N/A'}
                              </Typography>
                            ) : (
                              <TextField
                                size="small"
                                {...register(`medications.${index}.instructions`)}
                                placeholder="Sau ăn"
                                sx={{ width: 150 }}
                              />
                            )}
                          </TableCell>
                          {dialogMode !== 'view' && (
                            <TableCell>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                              >
                                <Remove />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ghi chú"
                  multiline
                  rows={3}
                  disabled={dialogMode === 'view'}
                  {...register('notes')}
                />
              </Grid>

              {dialogMode !== 'create' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Trạng thái"
                    disabled={dialogMode === 'view'}
                    {...register('status')}
                  >
                    <MenuItem value="active">Đang hiệu lực</MenuItem>
                    <MenuItem value="dispensed">Đã cấp phát</MenuItem>
                    <MenuItem value="cancelled">Đã hủy</MenuItem>
                    <MenuItem value="expired">Đã hết hạn</MenuItem>
                  </TextField>
                </Grid>
              )}
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
              {dialogMode === 'create' ? 'Kê đơn' : 'Cập nhật'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Print Dialog */}
      <Dialog
        open={openPrintDialog}
        onClose={() => setOpenPrintDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">In đơn thuốc</Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<Print />}
                onClick={() => window.print()}
                sx={{ mr: 1 }}
              >
                In
              </Button>
              <Button onClick={() => setOpenPrintDialog(false)}>
                Đóng
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <PrintPrescription prescription={selectedPrescription} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PrescriptionsPage;

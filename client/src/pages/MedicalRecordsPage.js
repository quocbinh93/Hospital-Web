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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Assignment,
  Add,
  Edit,
  Delete,
  Visibility,
  ExpandMore,
  Person,
  CalendarToday,
  LocalHospital,
  Medication,
  Assessment,
  Search,
  Print,
  FileDownload,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import {
  fetchMedicalRecords,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} from '../store/slices/medicalRecordSlice';
import { fetchPatients } from '../store/slices/patientSlice';

const MedicalRecordsPage = () => {
  const dispatch = useDispatch();
  const { records: medicalRecords, loading, error } = useSelector((state) => state.medicalRecords);
  const { patients } = useSelector((state) => state.patients);
  const { user } = useSelector((state) => state.auth);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      patientId: '',
      visitDate: new Date().toISOString().split('T')[0],
      visitType: 'consultation',
      chiefComplaint: '',
      presentIllness: '',
      symptoms: '',
      temperature: '',
      bloodPressure: '',
      heartRate: '',
      respiratoryRate: '',
      weight: '',
      height: '',
      oxygenSaturation: '',
      physicalExamination: '',
      investigations: '',
      diagnosis: '',
      secondaryDiagnosis: '',
      treatmentPlan: '',
      medications: '',
      allergies: '',
      notes: ''
    }
  });

  useEffect(() => {
    dispatch(fetchMedicalRecords());
    dispatch(fetchPatients({ limit: 1000 }));
  }, [dispatch]);

  const handleCreateRecord = () => {
    setDialogMode('create');
    setSelectedRecord(null);
    reset(); // Use default values from useForm
    setOpenDialog(true);
  };

  const handleEditRecord = (record) => {
    setDialogMode('edit');
    setSelectedRecord(record);
    reset({
      patientId: record.patient?._id,
      visitDate: new Date(record.visitDate).toISOString().split('T')[0],
      visitType: record.visitType || 'consultation',
      chiefComplaint: record.chiefComplaint || '',
      presentIllness: record.presentIllness || '',
      symptoms: record.symptoms?.join(', ') || '',
      temperature: record.vitalSigns?.temperature || '',
      bloodPressure: record.vitalSigns?.bloodPressure?.systolic && record.vitalSigns?.bloodPressure?.diastolic 
        ? `${record.vitalSigns.bloodPressure.systolic}/${record.vitalSigns.bloodPressure.diastolic}` 
        : '',
      heartRate: record.vitalSigns?.heartRate || '',
      respiratoryRate: record.vitalSigns?.respiratoryRate || '',
      weight: record.vitalSigns?.weight || '',
      height: record.vitalSigns?.height || '',
      oxygenSaturation: record.vitalSigns?.oxygenSaturation || '',
      physicalExamination: record.physicalExamination || '',
      investigations: record.investigations?.join('\n') || '',
      diagnosis: record.diagnosis?.primary || '',
      secondaryDiagnosis: record.diagnosis?.secondary?.join(', ') || '',
      treatmentPlan: record.treatmentPlan || '',
      medications: record.medications?.join('\n') || '',
      allergies: record.allergies?.join(', ') || '',
      notes: record.notes || ''
    });
    setOpenDialog(true);
  };

  const handleViewRecord = (record) => {
    setDialogMode('view');
    setSelectedRecord(record);
    reset(record);
    setOpenDialog(true);
  };

  const handleDeleteRecord = async (recordId) => {
    if (window.confirm('Bạn có chắc muốn xóa hồ sơ y tế này?')) {
      try {
        await dispatch(deleteMedicalRecord(recordId)).unwrap();
        toast.success('Xóa hồ sơ y tế thành công!');
      } catch (error) {
        toast.error(error);
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      // Parse blood pressure
      let bloodPressure = undefined;
      if (data.bloodPressure && data.bloodPressure.includes('/')) {
        const [systolic, diastolic] = data.bloodPressure.split('/').map(v => parseInt(v.trim()));
        if (!isNaN(systolic) && !isNaN(diastolic)) {
          bloodPressure = { systolic, diastolic };
        }
      }

      const recordData = {
        patient: data.patientId, // Map patientId to patient
        visitDate: new Date(data.visitDate),
        visitType: data.visitType || 'consultation',
        chiefComplaint: data.chiefComplaint,
        presentIllness: data.presentIllness,
        symptoms: data.symptoms ? data.symptoms.split(',').map(s => s.trim()).filter(s => s) : [],
        vitalSigns: {
          temperature: data.temperature ? parseFloat(data.temperature) : undefined,
          bloodPressure: bloodPressure,
          heartRate: data.heartRate ? parseInt(data.heartRate) : undefined,
          respiratoryRate: data.respiratoryRate ? parseInt(data.respiratoryRate) : undefined,
          weight: data.weight ? parseFloat(data.weight) : undefined,
          height: data.height ? parseFloat(data.height) : undefined,
          oxygenSaturation: data.oxygenSaturation ? parseFloat(data.oxygenSaturation) : undefined,
        },
        physicalExamination: data.physicalExamination,
        investigations: data.investigations ? data.investigations.split('\n').filter(inv => inv.trim()) : [],
        diagnosis: {
          primary: data.diagnosis || data.chiefComplaint, // use 'diagnosis' field
          secondary: data.secondaryDiagnosis ? data.secondaryDiagnosis.split(',').map(d => d.trim()).filter(d => d) : []
        },
        treatmentPlan: data.treatmentPlan,
        notes: data.notes
      };

      // Validate required fields
      if (!recordData.patient) {
        toast.error('Vui lòng chọn bệnh nhân');
        return;
      }
      if (!recordData.chiefComplaint) {
        toast.error('Vui lòng nhập lý do khám');
        return;
      }
      if (!recordData.diagnosis.primary) {
        toast.error('Vui lòng nhập chẩn đoán chính');
        return;
      }

      // Clean object - remove undefined values
      Object.keys(recordData).forEach(key => {
        if (recordData[key] === undefined || recordData[key] === '') {
          delete recordData[key];
        }
      });

      if (dialogMode === 'create') {
        await dispatch(createMedicalRecord(recordData)).unwrap();
        toast.success('Tạo hồ sơ y tế thành công!');
      } else if (dialogMode === 'edit') {
        await dispatch(
          updateMedicalRecord({ id: selectedRecord._id, data: recordData })
        ).unwrap();
        toast.success('Cập nhật hồ sơ y tế thành công!');
      }
      setOpenDialog(false);
      reset();
    } catch (error) {
      toast.error(error);
    }
  };

  const filteredRecords = (medicalRecords || []).filter((record) => {
    const matchesSearch = searchTerm === '' || 
      record.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(record.symptoms) ? record.symptoms.join(' ') : record.symptoms || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis?.primary?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPatient = selectedPatient === '' || record.patient?._id === selectedPatient;
    
    return matchesSearch && matchesPatient;
  });

  const getRecordStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatVitalSigns = (vitalSigns) => {
    if (!vitalSigns) return 'Chưa có dữ liệu';
    
    const parts = [];
    if (vitalSigns.bloodPressure) parts.push(`Huyết áp: ${vitalSigns.bloodPressure}`);
    if (vitalSigns.heartRate) parts.push(`Nhịp tim: ${vitalSigns.heartRate} bpm`);
    if (vitalSigns.temperature) parts.push(`Nhiệt độ: ${vitalSigns.temperature}°C`);
    if (vitalSigns.weight) parts.push(`Cân nặng: ${vitalSigns.weight} kg`);
    if (vitalSigns.height) parts.push(`Chiều cao: ${vitalSigns.height} cm`);
    
    return parts.length > 0 ? parts.join(' • ') : 'Chưa có dữ liệu';
  };

  return (
    <Box>
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography>Đang tải...</Typography>
        </Box>
      )}
      
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Assignment />
          <Typography variant="h4" fontWeight="bold">
            Hồ sơ Y tế
          </Typography>
        </Box>
        {user?.role === 'doctor' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateRecord}
          >
            Tạo Hồ sơ
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm theo tên bệnh nhân, triệu chứng, chẩn đoán..."
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
              label="Lọc theo bệnh nhân"
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
            >
              <MenuItem value="">Tất cả bệnh nhân</MenuItem>
              {(patients || []).map((patient) => (
                <MenuItem key={patient._id} value={patient._id}>
                  {patient.fullName}
                </MenuItem>
              ))}
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

      {/* Medical Records List */}
      <Grid container spacing={3}>
        {filteredRecords.map((record) => (
          <Grid item xs={12} key={record._id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {record.patient?.fullName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {record.patient?.fullName || 'Bệnh nhân không xác định'}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <CalendarToday sx={{ fontSize: 14 }} />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(record.visitDate).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <LocalHospital sx={{ fontSize: 14 }} />
                          <Typography variant="body2" color="text.secondary">
                            Bác sĩ: {record.doctor?.fullName || 'Chưa xác định'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={record.status === 'active' ? 'Đang điều trị' : 
                            record.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                      color={getRecordStatusColor(record.status)}
                      size="small"
                    />
                    
                    <Tooltip title="Xem chi tiết">
                      <IconButton
                        size="small"
                        onClick={() => handleViewRecord(record)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    
                    {user?.role === 'doctor' && (
                      <>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRecord(record)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Xóa">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteRecord(record._id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    
                    <Tooltip title="In">
                      <IconButton size="small">
                        <Print />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Quick Info */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Triệu chứng:</strong> {Array.isArray(record.symptoms) ? record.symptoms.join(', ') : record.symptoms || 'Không có'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Chẩn đoán:</strong> {record.diagnosis?.primary || 'Chưa có'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Expandable Details */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="body2" fontWeight="bold">
                      Chi tiết khám bệnh
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Chỉ số:</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatVitalSigns(record.vitalSigns)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Xét nghiệm:</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {record.labResults || 'Chưa có kết quả'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Thuốc điều trị:</strong>
                        </Typography>
                        {record.medications && Array.isArray(record.medications) && record.medications.length > 0 ? (
                          <List dense>
                            {record.medications.map((medication, index) => (
                              <ListItem key={index} sx={{ py: 0 }}>
                                <ListItemText
                                  primary={medication}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Chưa có thuốc
                          </Typography>
                        )}
                      </Grid>
                      
                      {record.notes && (
                        <Grid item xs={12}>
                          <Typography variant="body2" gutterBottom>
                            <strong>Ghi chú:</strong>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {record.notes}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredRecords.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Không có hồ sơ y tế nào
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || selectedPatient ? 'Không tìm thấy hồ sơ phù hợp với bộ lọc' : 'Chưa có hồ sơ y tế nào được tạo'}
          </Typography>
        </Paper>
      )}

      {/* Medical Record Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Tạo Hồ sơ Y tế Mới'}
          {dialogMode === 'edit' && 'Chỉnh sửa Hồ sơ Y tế'}
          {dialogMode === 'view' && 'Chi tiết Hồ sơ Y tế'}
        </DialogTitle>
        
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              {/* Patient Selection */}
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
                      {(patients || []).map((patient) => (
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
                  label="Ngày khám"
                  type="date"
                  disabled={dialogMode === 'view'}
                  {...register('visitDate', {
                    required: 'Ngày khám là bắt buộc',
                  })}
                  error={!!errors.visitDate}
                  helperText={errors.visitDate?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Vital Signs */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Chỉ Số
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Huyết áp"
                  disabled={dialogMode === 'view'}
                  {...register('vitalSigns.bloodPressure')}
                  placeholder="120/80"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Nhịp tim (bpm)"
                  type="number"
                  disabled={dialogMode === 'view'}
                  {...register('vitalSigns.heartRate')}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Nhiệt độ (°C)"
                  type="number"
                  step="0.1"
                  disabled={dialogMode === 'view'}
                  {...register('vitalSigns.temperature')}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Cân nặng (kg)"
                  type="number"
                  step="0.1"
                  disabled={dialogMode === 'view'}
                  {...register('vitalSigns.weight')}
                />
              </Grid>

              {/* Symptoms and Diagnosis */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Thông tin khám bệnh
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Lý do khám chính"
                  multiline
                  rows={2}
                  disabled={dialogMode === 'view'}
                  {...register('chiefComplaint', {
                    required: 'Lý do khám chính là bắt buộc',
                  })}
                  error={!!errors.chiefComplaint}
                  helperText={errors.chiefComplaint?.message}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Triệu chứng"
                  multiline
                  rows={3}
                  disabled={dialogMode === 'view'}
                  {...register('symptoms', {
                    required: 'Triệu chứng là bắt buộc',
                  })}
                  error={!!errors.symptoms}
                  helperText={errors.symptoms?.message}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Chẩn đoán"
                  multiline
                  rows={3}
                  disabled={dialogMode === 'view'}
                  {...register('diagnosis', {
                    required: 'Chẩn đoán là bắt buộc',
                  })}
                  error={!!errors.diagnosis}
                  helperText={errors.diagnosis?.message}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Kết quả xét nghiệm"
                  multiline
                  rows={3}
                  disabled={dialogMode === 'view'}
                  {...register('labResults')}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Thuốc điều trị (mỗi dòng một loại)"
                  multiline
                  rows={3}
                  disabled={dialogMode === 'view'}
                  {...register('medications')}
                  placeholder="Paracetamol 500mg - 3 lần/ngày&#10;Amoxicillin 250mg - 2 lần/ngày"
                />
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
                    <MenuItem value="active">Đang điều trị</MenuItem>
                    <MenuItem value="completed">Hoàn thành</MenuItem>
                    <MenuItem value="cancelled">Đã hủy</MenuItem>
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
              {dialogMode === 'create' ? 'Tạo' : 'Cập nhật'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicalRecordsPage;

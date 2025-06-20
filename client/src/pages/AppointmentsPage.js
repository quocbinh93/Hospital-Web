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
  Tab,
  Tabs,
  Alert,
  Badge,
} from '@mui/material';
import {
  Event,
  Add,
  Edit,
  Delete,
  Check,
  Close,
  Schedule,
  Person,
  Phone,
  AccessTime,
  CalendarToday,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import {
  fetchAppointments,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from '../store/slices/appointmentSlice';
import { fetchPatients } from '../store/slices/patientSlice';

const AppointmentsPage = () => {
  const dispatch = useDispatch();
  const { appointments, loading, error } = useSelector((state) => state.appointments);
  const { patients } = useSelector((state) => state.patients);
  const { user } = useSelector((state) => state.auth);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  const selectedDate = watch('appointmentDate');

  useEffect(() => {
    dispatch(fetchAppointments());
    dispatch(fetchPatients({ limit: 1000 })); // Load all patients for selection
  }, [dispatch]);

  const handleCreateAppointment = () => {
    setDialogMode('create');
    setSelectedAppointment(null);
    reset({
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '09:00',
      status: 'scheduled',
    });
    setOpenDialog(true);
  };

  const handleEditAppointment = (appointment) => {
    setDialogMode('edit');
    setSelectedAppointment(appointment);
    reset({
      ...appointment,
      patientId: appointment.patient?._id,
      appointmentDate: new Date(appointment.appointmentDate).toISOString().split('T')[0],
    });
    setOpenDialog(true);
  };

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      await dispatch(updateAppointmentStatus({ id: appointmentId, status })).unwrap();
      toast.success(`Đã ${getStatusText(status).toLowerCase()} lịch hẹn`);
    } catch (error) {
      toast.error(error);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm('Bạn có chắc muốn xóa lịch hẹn này?')) {
      try {
        await dispatch(deleteAppointment(appointmentId)).unwrap();
        toast.success('Xóa lịch hẹn thành công!');
      } catch (error) {
        toast.error(error);
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      const appointmentData = {
        ...data,
        appointmentDate: new Date(`${data.appointmentDate}T${data.appointmentTime}`),
      };

      if (dialogMode === 'create') {
        await dispatch(createAppointment(appointmentData)).unwrap();
        toast.success('Tạo lịch hẹn thành công!');
      } else {
        await dispatch(
          updateAppointment({ id: selectedAppointment._id, data: appointmentData })
        ).unwrap();
        toast.success('Cập nhật lịch hẹn thành công!');
      }
      setOpenDialog(false);
      reset();
    } catch (error) {
      toast.error(error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'confirmed':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'no-show':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Đã lên lịch';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      case 'no-show':
        return 'Không đến';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const filterAppointmentsByTab = (appointments, tab) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (tab) {
      case 0: // Hôm nay
        return appointments.filter((apt) => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= today && aptDate < tomorrow;
        });
      case 1: // Sắp tới
        return appointments.filter((apt) => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= tomorrow;
        });
      case 2: // Hoàn thành
        return appointments.filter((apt) => apt.status === 'completed');
      case 3: // Đã hủy
        return appointments.filter((apt) => apt.status === 'cancelled' || apt.status === 'no-show');
      default:
        return appointments;
    }
  };

  const filteredAppointments = filterAppointmentsByTab(appointments, currentTab);

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Event />
          <Typography variant="h4" fontWeight="bold">
            Quản lý Lịch hẹn
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateAppointment}
        >
          Đặt Lịch hẹn
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
        >
          <Tab 
            label={
              <Badge badgeContent={filterAppointmentsByTab(appointments, 0).length} color="primary">
                Hôm nay
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={filterAppointmentsByTab(appointments, 1).length} color="secondary">
                Sắp tới
              </Badge>
            } 
          />
          <Tab label="Hoàn thành" />
          <Tab label="Đã hủy" />
        </Tabs>
      </Paper>

      {/* Appointments Grid */}
      <Grid container spacing={3}>
        {filteredAppointments.map((appointment) => (
          <Grid item xs={12} md={6} lg={4} key={appointment._id}>
            <Card>
              <CardContent>
                {/* Header with status and priority */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Chip
                    label={getStatusText(appointment.status)}
                    color={getStatusColor(appointment.status)}
                    size="small"
                  />
                  {appointment.priority && appointment.priority !== 'normal' && (
                    <Chip
                      label={appointment.priority === 'urgent' ? 'Khẩn cấp' : 
                            appointment.priority === 'high' ? 'Cao' : 'Thấp'}
                      color={getPriorityColor(appointment.priority)}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Patient Info */}
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {appointment.patient?.fullName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {appointment.patient?.fullName || 'Bệnh nhân không xác định'}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Phone sx={{ fontSize: 14 }} />
                      <Typography variant="body2" color="text.secondary">
                        {appointment.patient?.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Appointment Details */}
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {new Date(appointment.appointmentDate).toLocaleDateString('vi-VN')}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {new Date(appointment.appointmentDate).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Box>

                {appointment.appointmentType && (
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Loại: {appointment.appointmentType}
                    </Typography>
                  </Box>
                )}

                {appointment.reason && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Lý do: {appointment.reason}
                  </Typography>
                )}

                {/* Action Buttons */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" gap={1}>
                    {appointment.status === 'scheduled' && (
                      <Tooltip title="Xác nhận">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                        >
                          <Check />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {(appointment.status === 'confirmed' || appointment.status === 'scheduled') && (
                      <Tooltip title="Hoàn thành">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                        >
                          <Schedule />
                        </IconButton>
                      </Tooltip>
                    )}

                    {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                      <Tooltip title="Hủy">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                        >
                          <Close />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <Box display="flex" gap={1}>
                    <Tooltip title="Chỉnh sửa">
                      <IconButton
                        size="small"
                        onClick={() => handleEditAppointment(appointment)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Xóa">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteAppointment(appointment._id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredAppointments.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Không có lịch hẹn nào
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentTab === 0 && 'Không có lịch hẹn nào hôm nay'}
            {currentTab === 1 && 'Không có lịch hẹn sắp tới'}
            {currentTab === 2 && 'Chưa có lịch hẹn nào hoàn thành'}
            {currentTab === 3 && 'Không có lịch hẹn nào bị hủy'}
          </Typography>
        </Paper>
      )}

      {/* Appointment Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Đặt Lịch hẹn Mới' : 'Chỉnh sửa Lịch hẹn'}
        </DialogTitle>
        
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
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

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ngày hẹn"
                  type="date"
                  {...register('appointmentDate', {
                    required: 'Ngày hẹn là bắt buộc',
                  })}
                  error={!!errors.appointmentDate}
                  helperText={errors.appointmentDate?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Giờ hẹn"
                  {...register('appointmentTime', {
                    required: 'Giờ hẹn là bắt buộc',
                  })}
                  error={!!errors.appointmentTime}
                  helperText={errors.appointmentTime?.message}
                >
                  {getTimeSlots().map((time) => (
                    <MenuItem key={time} value={time}>
                      {time}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Loại khám"
                  {...register('appointmentType')}
                >
                  <MenuItem value="consultation">Tư vấn</MenuItem>
                  <MenuItem value="checkup">Khám định kỳ</MenuItem>
                  <MenuItem value="follow-up">Tái khám</MenuItem>
                  <MenuItem value="emergency">Khẩn cấp</MenuItem>
                  <MenuItem value="procedure">Thủ thuật</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Độ ưu tiên"
                  {...register('priority')}
                >
                  <MenuItem value="low">Thấp</MenuItem>
                  <MenuItem value="normal">Bình thường</MenuItem>
                  <MenuItem value="high">Cao</MenuItem>
                  <MenuItem value="urgent">Khẩn cấp</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Lý do khám"
                  multiline
                  rows={3}
                  {...register('reason')}
                  placeholder="Mô tả lý do khám bệnh..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ghi chú"
                  multiline
                  rows={2}
                  {...register('notes')}
                  placeholder="Ghi chú thêm..."
                />
              </Grid>

              {dialogMode === 'edit' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Trạng thái"
                    {...register('status')}
                  >
                    <MenuItem value="scheduled">Đã lên lịch</MenuItem>
                    <MenuItem value="confirmed">Đã xác nhận</MenuItem>
                    <MenuItem value="completed">Hoàn thành</MenuItem>
                    <MenuItem value="cancelled">Đã hủy</MenuItem>
                    <MenuItem value="no-show">Không đến</MenuItem>
                  </TextField>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={loading}
          >
            {dialogMode === 'create' ? 'Đặt lịch' : 'Cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentsPage;

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  Email,
  Phone,
  LocationOn,
  Work,
  Lock,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { updateProfile, changePassword } from '../store/slices/authSlice';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const [editMode, setEditMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      specialization: user?.specialization || '',
      licenseNumber: user?.licenseNumber || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch,
  } = useForm();

  const newPassword = watch('newPassword');

  const handleUpdateProfile = async (data) => {
    try {
      await dispatch(updateProfile(data)).unwrap();
      toast.success('Cập nhật hồ sơ thành công!');
      setEditMode(false);
    } catch (error) {
      toast.error(error);
    }
  };

  const handleChangePassword = async (data) => {
    try {
      await dispatch(changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })).unwrap();
      toast.success('Đổi mật khẩu thành công!');
      setShowChangePassword(false);
      resetPassword();
    } catch (error) {
      toast.error(error);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    resetProfile({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      specialization: user?.specialization || '',
      licenseNumber: user?.licenseNumber || '',
    });
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Quản trị viên',
      doctor: 'Bác sĩ',
      receptionist: 'Lễ tân',
    };
    return roleNames[role] || role;
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Person />
        <Typography variant="h4" fontWeight="bold">
          Hồ sơ Cá nhân
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                Thông tin Cá nhân
              </Typography>
              {!editMode ? (
                <Button
                  startIcon={<Edit />}
                  onClick={() => setEditMode(true)}
                  variant="outlined"
                >
                  Chỉnh sửa
                </Button>
              ) : (
                <Box display="flex" gap={1}>
                  <Button
                    startIcon={<Save />}
                    onClick={handleSubmitProfile(handleUpdateProfile)}
                    variant="contained"
                    disabled={loading}
                  >
                    Lưu
                  </Button>
                  <Button
                    startIcon={<Cancel />}
                    onClick={handleCancelEdit}
                    variant="outlined"
                  >
                    Hủy
                  </Button>
                </Box>
              )}
            </Box>

            <Box component="form" onSubmit={handleSubmitProfile(handleUpdateProfile)}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Họ và tên"
                    disabled={!editMode}
                    {...registerProfile('fullName', {
                      required: 'Họ và tên là bắt buộc',
                    })}
                    error={!!profileErrors.fullName}
                    helperText={profileErrors.fullName?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    disabled={!editMode}
                    {...registerProfile('email', {
                      required: 'Email là bắt buộc',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email không hợp lệ',
                      },
                    })}
                    error={!!profileErrors.email}
                    helperText={profileErrors.email?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Số điện thoại"
                    disabled={!editMode}
                    {...registerProfile('phone', {
                      required: 'Số điện thoại là bắt buộc',
                      pattern: {
                        value: /^[0-9]{10,11}$/,
                        message: 'Số điện thoại không hợp lệ',
                      },
                    })}
                    error={!!profileErrors.phone}
                    helperText={profileErrors.phone?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Địa chỉ"
                    disabled={!editMode}
                    {...registerProfile('address')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {user?.role === 'doctor' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Chuyên khoa"
                        disabled={!editMode}
                        {...registerProfile('specialization')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Work />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Số giấy phép hành nghề"
                        disabled={!editMode}
                        {...registerProfile('licenseNumber')}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* User Summary & Actions */}
        <Grid item xs={12} md={4}>
          {/* User Avatar & Info */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                }}
              >
                {user?.fullName?.charAt(0)?.toUpperCase()}
              </Avatar>
              
              <Typography variant="h6" fontWeight="bold">
                {user?.fullName}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {getRoleDisplayName(user?.role)}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Tham gia: {new Date(user?.createdAt).toLocaleDateString('vi-VN')}
              </Typography>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Bảo mật
              </Typography>
              
              {!showChangePassword ? (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Lock />}
                  onClick={() => setShowChangePassword(true)}
                >
                  Đổi mật khẩu
                </Button>
              ) : (
                <Box component="form" onSubmit={handleSubmitPassword(handleChangePassword)}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Mật khẩu hiện tại"
                    type={showPasswords.current ? 'text' : 'password'}
                    {...registerPassword('currentPassword', {
                      required: 'Mật khẩu hiện tại là bắt buộc',
                    })}
                    error={!!passwordErrors.currentPassword}
                    helperText={passwordErrors.currentPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('current')}
                            edge="end"
                          >
                            {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    margin="normal"
                    label="Mật khẩu mới"
                    type={showPasswords.new ? 'text' : 'password'}
                    {...registerPassword('newPassword', {
                      required: 'Mật khẩu mới là bắt buộc',
                      minLength: {
                        value: 6,
                        message: 'Mật khẩu phải có ít nhất 6 ký tự',
                      },
                    })}
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('new')}
                            edge="end"
                          >
                            {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    margin="normal"
                    label="Xác nhận mật khẩu mới"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    {...registerPassword('confirmPassword', {
                      required: 'Xác nhận mật khẩu là bắt buộc',
                      validate: (value) =>
                        value === newPassword || 'Mật khẩu xác nhận không khớp',
                    })}
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('confirm')}
                            edge="end"
                          >
                            {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box display="flex" gap={1} mt={2}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      disabled={loading}
                    >
                      Cập nhật
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => {
                        setShowChangePassword(false);
                        resetPassword();
                      }}
                    >
                      Hủy
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;

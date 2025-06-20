import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  People,
  Event,
  Assignment,
  LocalPharmacy,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { fetchDashboardData, fetchRecentActivities } from '../store/slices/dashboardSlice';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { stats, alerts, recentActivities, loading, error } = useSelector(
    (state) => state.dashboard
  );
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchDashboardData());
    dispatch(fetchRecentActivities());
  }, [dispatch]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const StatCard = ({ title, value, icon, color = 'primary', subtitle, trend }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography color="textSecondary" variant="body2">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              color: `${color}.contrastText`,
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
        {trend && (
          <Box display="flex" alignItems="center" mt={1}>
            {trend > 0 ? (
              <TrendingUp color="success" />
            ) : (
              <TrendingDown color="error" />
            )}
            <Typography
              variant="body2"
              color={trend > 0 ? 'success.main' : 'error.main'}
              sx={{ ml: 0.5 }}
            >
              {Math.abs(trend)}% so với tháng trước
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'appointment':
        return <Event />;
      case 'medical_record':
        return <Assignment />;
      case 'prescription':
        return <LocalPharmacy />;
      default:
        return <CheckCircle />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {getGreeting()}, {user?.fullName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Đây là tổng quan hoạt động của hệ thống phòng khám.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        {/* Appointments */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Lịch hẹn hôm nay"
            value={stats?.appointments?.today || 0}
            subtitle={`${stats?.appointments?.pending || 0} chờ xác nhận`}
            icon={<Event />}
            color="primary"
          />
        </Grid>

        {/* Patients */}
        {user?.role !== 'doctor' && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Tổng bệnh nhân"
              value={stats?.patients?.total || 0}
              icon={<People />}
              color="success"
            />
          </Grid>
        )}

        {/* Medical Records */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Hồ sơ tháng này"
            value={stats?.medicalRecords?.thisMonth || 0}
            subtitle={`${stats?.medicalRecords?.today || 0} hôm nay`}
            icon={<Assignment />}
            color="info"
          />
        </Grid>

        {/* Revenue */}
        {user?.role !== 'receptionist' && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Doanh thu hôm nay"
              value={formatCurrency(stats?.revenue?.today || 0)}
              subtitle={`Tháng: ${formatCurrency(stats?.revenue?.thisMonth || 0)}`}
              icon={<LocalPharmacy />}
              color="warning"
            />
          </Grid>
        )}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Hoạt động gần đây
            </Typography>
            
            {recentActivities.length > 0 ? (
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {recentActivities.map((activity, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      {getActivityIcon(activity.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {activity.description}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <Chip
                              label={activity.status}
                              size="small"
                              color={getStatusColor(activity.status)}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(activity.timestamp).toLocaleString('vi-VN')}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="200px"
              >
                <Typography color="text.secondary">
                  Chưa có hoạt động nào
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Cảnh báo
            </Typography>
            
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {alerts?.lowStockMedicines > 0 && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    {alerts.lowStockMedicines} thuốc sắp hết tồn kho
                  </Typography>
                </Alert>
              )}
              
              {alerts?.expiredMedicines > 0 && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    {alerts.expiredMedicines} thuốc đã hết hạn
                  </Typography>
                </Alert>
              )}
              
              {(!alerts || (alerts.lowStockMedicines === 0 && alerts.expiredMedicines === 0)) && (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="200px"
                >
                  <Box textAlign="center">
                    <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
                    <Typography color="text.secondary">
                      Không có cảnh báo nào
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;

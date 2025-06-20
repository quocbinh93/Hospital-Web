import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';

import { getCurrentUser, setAuthFromToken } from './store/slices/authSlice';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import MedicinesPage from './pages/MedicinesPage';
import ProfilePage from './pages/ProfilePage';
import LoadingScreen from './components/common/LoadingScreen';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Kiểm tra token trong localStorage khi app khởi động
    const savedToken = localStorage.getItem('token');
    if (savedToken && !user) {
      // Set token trước
      if (!token) {
        dispatch(setAuthFromToken(savedToken));
      }
      // Gọi getCurrentUser để lấy thông tin user
      dispatch(getCurrentUser());
    }
  }, [dispatch, token, user]);

  // Show loading khi đang authenticate hoặc khi có token nhưng chưa có user
  if (loading || (isAuthenticated && !user)) {
    return <LoadingScreen />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/patients/*" element={<PatientsPage />} />
                  <Route path="/appointments/*" element={<AppointmentsPage />} />
                  <Route path="/medical-records/*" element={<MedicalRecordsPage />} />
                  <Route path="/prescriptions/*" element={<PrescriptionsPage />} />
                  <Route path="/medicines/*" element={<MedicinesPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Box>
  );
}

export default App;

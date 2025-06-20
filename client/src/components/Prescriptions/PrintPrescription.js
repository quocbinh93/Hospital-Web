import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Grid,
} from '@mui/material';
import { LocalPharmacy, Print } from '@mui/icons-material';

const PrintPrescription = ({ prescription, onPrint }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Box 
      sx={{ 
        p: 4, 
        maxWidth: '210mm', 
        minHeight: '297mm', 
        mx: 'auto',
        backgroundColor: 'white',
        '@media print': {
          p: 2,
          boxShadow: 'none',
          backgroundColor: 'white',
        }
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <LocalPharmacy sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" component="h1" color="primary.main" fontWeight="bold">
            PHÒNG KHÁM ĐA KHOA
          </Typography>
        </Box>
        <Typography variant="h6" color="text.secondary">
          Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Điện thoại: (028) 1234-5678 | Email: info@phongkham.com
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h4" component="h2" color="primary.main" fontWeight="bold">
          ĐơN THUỐC
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Số: {prescription?.prescriptionId || 'N/A'}
        </Typography>
      </Box>

      {/* Patient Info */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Bệnh nhân:</strong> {prescription?.patient?.fullName || 'N/A'}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Tuổi:</strong> {prescription?.patient?.age || 'N/A'}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Giới tính:</strong> {
              prescription?.patient?.gender === 'male' ? 'Nam' : 
              prescription?.patient?.gender === 'female' ? 'Nữ' : 'N/A'
            }
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Điện thoại:</strong> {prescription?.patient?.phone || 'N/A'}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Ngày kê đơn:</strong> {
              prescription?.prescriptionDate ? 
              new Date(prescription.prescriptionDate).toLocaleDateString('vi-VN') : 'N/A'
            }
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Bác sĩ:</strong> {prescription?.doctor?.fullName || 'N/A'}
          </Typography>
        </Grid>
      </Grid>

      {/* Diagnosis */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
          Chẩn đoán:
        </Typography>
        <Typography variant="body1" sx={{ pl: 2 }}>
          {prescription?.diagnosis || 'Không có thông tin'}
        </Typography>
      </Box>

      {/* Medications Table */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Đơn thuốc:
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell><strong>STT</strong></TableCell>
                <TableCell><strong>Tên thuốc</strong></TableCell>
                <TableCell align="center"><strong>Liều dùng</strong></TableCell>
                <TableCell align="center"><strong>Tần suất</strong></TableCell>
                <TableCell align="center"><strong>Thời gian</strong></TableCell>
                <TableCell align="center"><strong>Số lượng</strong></TableCell>
                <TableCell><strong>Hướng dẫn</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prescription?.medications?.map((med, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {med.medicine?.name || med.medicineName || 'N/A'}
                  </TableCell>
                  <TableCell align="center">{med.dosage || 'N/A'}</TableCell>
                  <TableCell align="center">{med.frequency || 'N/A'}</TableCell>
                  <TableCell align="center">{med.duration || 'N/A'}</TableCell>
                  <TableCell align="center">{med.quantity || 'N/A'}</TableCell>
                  <TableCell>{med.instructions || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Notes */}
      {prescription?.notes && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            Ghi chú:
          </Typography>
          <Typography variant="body1" sx={{ pl: 2 }}>
            {prescription.notes}
          </Typography>
        </Box>
      )}

      {/* Footer */}
      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" fontWeight="bold">
              Người bệnh
            </Typography>
            <Typography variant="body2" sx={{ mt: 6 }}>
              (Ký, ghi rõ họ tên)
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
            </Typography>
            <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
              Bác sĩ điều trị
            </Typography>
            <Typography variant="body2" sx={{ mt: 6 }}>
              {prescription?.doctor?.fullName || 'N/A'}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Print Instructions */}
      <Box sx={{ 
        mt: 4, 
        p: 2, 
        backgroundColor: 'grey.50', 
        borderRadius: 1,
        '@media print': {
          display: 'none'
        }
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <strong>Hướng dẫn in:</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Sử dụng khổ giấy A4
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Chọn "Print backgrounds" để in màu nền
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Margin: Tối thiểu (hoặc None)
        </Typography>
      </Box>
    </Box>
  );
};

export default PrintPrescription;

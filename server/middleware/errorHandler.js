const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'ID không hợp lệ';
    error = { message, statusCode: 400 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Dữ liệu đã tồn tại';
    
    // Xử lý các trường cụ thể
    if (err.message.includes('email')) {
      message = 'Email đã được sử dụng';
    } else if (err.message.includes('phone')) {
      message = 'Số điện thoại đã được sử dụng';
    } else if (err.message.includes('patientId')) {
      message = 'Mã bệnh nhân đã tồn tại';
    } else if (err.message.includes('appointmentId')) {
      message = 'Mã lịch hẹn đã tồn tại';
    }
    
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token không hợp lệ';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token đã hết hạn';
    error = { message, statusCode: 401 };
  }

  // Handle specific application errors
  if (err.message && err.message.includes('Bác sĩ đã có lịch hẹn')) {
    error = { message: err.message, statusCode: 409 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Lỗi máy chủ nội bộ',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

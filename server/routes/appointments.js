const express = require('express');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { validate, validateAppointment } = require('../middleware/validation');

const router = express.Router();

// Lấy danh sách lịch hẹn
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      doctor, 
      patient,
      date,
      startDate,
      endDate,
      priority,
      type
    } = req.query;
    
    const query = {};
    
    // Filter theo trạng thái
    if (status) {
      query.status = status;
    }
    
    // Filter theo bác sĩ
    if (doctor) {
      query.doctor = doctor;
    }
    
    // Filter theo bệnh nhân
    if (patient) {
      query.patient = patient;
    }
    
    // Filter theo ngày cụ thể
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.appointmentDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    // Filter theo khoảng thời gian
    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Filter theo độ ưu tiên
    if (priority) {
      query.priority = priority;
    }
    
    // Filter theo loại
    if (type) {
      query.type = type;
    }

    // Nếu là bác sĩ, chỉ xem lịch hẹn của mình
    if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'patientId fullName phone gender age')
      .populate('doctor', 'fullName specialization')
      .populate('createdBy', 'fullName')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: appointments.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách lịch hẹn',
      error: error.message
    });
  }
});

// Lấy thông tin lịch hẹn theo ID
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'patientId fullName phone gender age dateOfBirth address')
      .populate('doctor', 'fullName specialization licenseNumber')
      .populate('createdBy', 'fullName')
      .populate('updatedBy', 'fullName')
      .populate('cancelledBy', 'fullName');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    // Kiểm tra quyền truy cập
    if (req.user.role === 'doctor' && appointment.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập lịch hẹn này'
      });
    }

    res.json({
      success: true,
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin lịch hẹn',
      error: error.message
    });
  }
});

// Tạo lịch hẹn mới
router.post('/', auth, validate(validateAppointment), async (req, res) => {
  try {
    // Kiểm tra bệnh nhân tồn tại
    const patient = await Patient.findById(req.body.patient);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh nhân'
      });
    }

    // Kiểm tra bác sĩ tồn tại
    const doctor = await User.findOne({ _id: req.body.doctor, role: 'doctor', isActive: true });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ hoặc bác sĩ không khả dụng'
      });
    }

    // Kiểm tra ngày hẹn không được trong quá khứ
    const appointmentDateTime = new Date(`${req.body.appointmentDate}T${req.body.appointmentTime}`);
    if (appointmentDateTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Không thể đặt lịch hẹn trong quá khứ'
      });
    }

    const appointmentData = {
      ...req.body,
      createdBy: req.user._id
    };

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    await appointment.populate([
      { path: 'patient', select: 'patientId fullName phone gender age' },
      { path: 'doctor', select: 'fullName specialization' },
      { path: 'createdBy', select: 'fullName' }
    ]);

    // Cập nhật số lần khám của bệnh nhân
    await Patient.findByIdAndUpdate(req.body.patient, {
      $inc: { totalVisits: 1 },
      lastVisit: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Tạo lịch hẹn thành công',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo lịch hẹn',
      error: error.message
    });
  }
});

// Cập nhật lịch hẹn
router.put('/:id', auth, validate(validateAppointment), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    // Kiểm tra quyền sửa
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền sửa lịch hẹn này'
      });
    }

    // Không cho phép sửa lịch hẹn đã hoàn thành hoặc đã hủy
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể sửa lịch hẹn đã hoàn thành hoặc đã hủy'
      });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'patientId fullName phone gender age' },
      { path: 'doctor', select: 'fullName specialization' },
      { path: 'createdBy', select: 'fullName' },
      { path: 'updatedBy', select: 'fullName' }
    ]);

    res.json({
      success: true,
      message: 'Cập nhật lịch hẹn thành công',
      data: {
        appointment: updatedAppointment
      }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật lịch hẹn',
      error: error.message
    });
  }
});

// Cập nhật trạng thái lịch hẹn
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, cancelReason } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn'
      });
    }

    // Kiểm tra quyền cập nhật
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật lịch hẹn này'
      });
    }

    const updateData = {
      status,
      updatedBy: req.user._id
    };

    // Nếu hủy lịch hẹn
    if (status === 'cancelled') {
      if (!cancelReason) {
        return res.status(400).json({
          success: false,
          message: 'Lý do hủy là bắt buộc'
        });
      }
      updateData.cancelReason = cancelReason;
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = req.user._id;
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'patient', select: 'patientId fullName phone' },
      { path: 'doctor', select: 'fullName specialization' }
    ]);

    res.json({
      success: true,
      message: `${status === 'cancelled' ? 'Hủy' : 'Cập nhật'} lịch hẹn thành công`,
      data: {
        appointment: updatedAppointment
      }
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật trạng thái lịch hẹn',
      error: error.message
    });
  }
});

// Lấy lịch hẹn theo ngày (calendar view)
router.get('/calendar/view', auth, async (req, res) => {
  try {
    const { date, doctor } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Ngày là bắt buộc'
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
    };

    // Filter theo bác sĩ nếu có
    if (doctor) {
      query.doctor = doctor;
    }

    // Nếu là bác sĩ, chỉ xem lịch của mình
    if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'patientId fullName phone')
      .populate('doctor', 'fullName specialization')
      .sort({ appointmentTime: 1 });

    res.json({
      success: true,
      data: {
        appointments,
        date: date
      }
    });
  } catch (error) {
    console.error('Get calendar appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy lịch hẹn theo ngày',
      error: error.message
    });
  }
});

// Kiểm tra slot thời gian có sẵn
router.get('/check-availability', auth, async (req, res) => {
  try {
    const { doctor, date, time, duration = 30, excludeId } = req.query;
    
    if (!doctor || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Bác sĩ, ngày và giờ là bắt buộc'
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      doctor: doctor,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
    };

    // Loại trừ appointment hiện tại (khi update)
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const conflictingAppointments = await Appointment.find(query);
    
    const requestedStart = new Date(`${date}T${time}:00.000Z`);
    const requestedEnd = new Date(requestedStart.getTime() + parseInt(duration) * 60000);
    
    const isAvailable = !conflictingAppointments.some(appointment => {
      const appointmentStart = new Date(`${appointment.appointmentDate.toISOString().split('T')[0]}T${appointment.appointmentTime}:00.000Z`);
      const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);
      
      return (requestedStart < appointmentEnd && requestedEnd > appointmentStart);
    });

    res.json({
      success: true,
      data: {
        isAvailable,
        conflictingAppointments: isAvailable ? [] : conflictingAppointments.map(apt => ({
          id: apt._id,
          time: apt.appointmentTime,
          duration: apt.duration,
          patient: apt.patient
        }))
      }
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra thời gian khả dụng',
      error: error.message
    });
  }
});

// Thống kê lịch hẹn
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = req.user.role === 'doctor' ? { doctor: req.user._id } : {};

    const [
      totalToday,
      totalThisWeek,
      totalThisMonth,
      statusStats,
      typeStats
    ] = await Promise.all([
      // Lịch hẹn hôm nay
      Appointment.countDocuments({
        ...query,
        appointmentDate: {
          $gte: today,
          $lt: tomorrow
        }
      }),
      
      // Lịch hẹn tuần này
      Appointment.countDocuments({
        ...query,
        appointmentDate: {
          $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()),
          $lt: tomorrow
        }
      }),
      
      // Lịch hẹn tháng này
      Appointment.countDocuments({
        ...query,
        appointmentDate: {
          $gte: new Date(today.getFullYear(), today.getMonth(), 1),
          $lt: tomorrow
        }
      }),
      
      // Thống kê theo trạng thái
      Appointment.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Thống kê theo loại
      Appointment.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        today: totalToday,
        thisWeek: totalThisWeek,
        thisMonth: totalThisMonth,
        byStatus: statusStats,
        byType: typeStats
      }
    });
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê lịch hẹn',
      error: error.message
    });
  }
});

module.exports = router;

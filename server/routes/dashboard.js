const express = require('express');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Dashboard tổng quan
router.get('/overview', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Query cơ bản theo role
    const appointmentQuery = req.user.role === 'doctor' ? { doctor: req.user._id } : {};
    const recordQuery = req.user.role === 'doctor' ? { doctor: req.user._id } : {};
    const prescriptionQuery = req.user.role === 'doctor' ? { doctor: req.user._id } : {};

    const [
      // Thống kê cơ bản
      totalPatients,
      totalDoctors,
      
      // Lịch hẹn
      appointmentsToday,
      appointmentsThisMonth,
      pendingAppointments,
      
      // Khám bệnh
      medicalRecordsToday,
      medicalRecordsThisMonth,
      
      // Đơn thuốc
      prescriptionsToday,
      prescriptionsThisMonth,
      
      // Cảnh báo
      lowStockMedicines,
      expiredMedicines,
      
      // Doanh thu
      revenueToday,
      revenueThisMonth
    ] = await Promise.all([
      // Thống kê cơ bản
      req.user.role === 'admin' ? Patient.countDocuments({ isActive: true }) : null,
      req.user.role === 'admin' ? User.countDocuments({ role: 'doctor', isActive: true }) : null,
      
      // Lịch hẹn hôm nay
      Appointment.countDocuments({
        ...appointmentQuery,
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
      }),
      
      // Lịch hẹn tháng này
      Appointment.countDocuments({
        ...appointmentQuery,
        appointmentDate: { $gte: thisMonth, $lt: nextMonth }
      }),
      
      // Lịch hẹn chờ xác nhận
      Appointment.countDocuments({
        ...appointmentQuery,
        status: 'scheduled'
      }),
      
      // Hồ sơ y tế hôm nay
      MedicalRecord.countDocuments({
        ...recordQuery,
        visitDate: { $gte: today, $lt: tomorrow },
        isActive: true
      }),
      
      // Hồ sơ y tế tháng này
      MedicalRecord.countDocuments({
        ...recordQuery,
        visitDate: { $gte: thisMonth, $lt: nextMonth },
        isActive: true
      }),
      
      // Đơn thuốc hôm nay
      Prescription.countDocuments({
        ...prescriptionQuery,
        prescriptionDate: { $gte: today, $lt: tomorrow },
        isActive: true
      }),
      
      // Đơn thuốc tháng này
      Prescription.countDocuments({
        ...prescriptionQuery,
        prescriptionDate: { $gte: thisMonth, $lt: nextMonth },
        isActive: true
      }),
      
      // Thuốc sắp hết
      req.user.role !== 'receptionist' ? Medicine.countDocuments({
        isActive: true,
        $expr: { $lte: ['$stock.quantity', '$stock.minQuantity'] }
      }) : null,
      
      // Thuốc hết hạn
      req.user.role !== 'receptionist' ? Medicine.countDocuments({
        isActive: true,
        expiryDate: { $lt: today }
      }) : null,
      
      // Doanh thu hôm nay
      req.user.role !== 'receptionist' ? Prescription.aggregate([
        {
          $match: {
            ...prescriptionQuery,
            prescriptionDate: { $gte: today, $lt: tomorrow },
            status: { $ne: 'cancelled' },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]) : null,
      
      // Doanh thu tháng này
      req.user.role !== 'receptionist' ? Prescription.aggregate([
        {
          $match: {
            ...prescriptionQuery,
            prescriptionDate: { $gte: thisMonth, $lt: nextMonth },
            status: { $ne: 'cancelled' },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]) : null
    ]);

    const dashboardData = {
      stats: {
        patients: {
          total: totalPatients,
          label: 'Tổng bệnh nhân'
        },
        doctors: {
          total: totalDoctors,
          label: 'Bác sĩ hoạt động'
        },
        appointments: {
          today: appointmentsToday,
          thisMonth: appointmentsThisMonth,
          pending: pendingAppointments,
          label: 'Lịch hẹn'
        },
        medicalRecords: {
          today: medicalRecordsToday,
          thisMonth: medicalRecordsThisMonth,
          label: 'Hồ sơ y tế'
        },
        prescriptions: {
          today: prescriptionsToday,
          thisMonth: prescriptionsThisMonth,
          label: 'Đơn thuốc'
        },
        revenue: {
          today: revenueToday?.[0]?.total || 0,
          thisMonth: revenueThisMonth?.[0]?.total || 0,
          label: 'Doanh thu (VNĐ)'
        }
      },
      alerts: {
        lowStockMedicines,
        expiredMedicines
      }
    };

    // Chỉ trả về data phù hợp với role
    if (req.user.role === 'receptionist') {
      delete dashboardData.stats.revenue;
      delete dashboardData.alerts;
    }

    if (req.user.role === 'doctor') {
      delete dashboardData.stats.patients;
      delete dashboardData.stats.doctors;
    }

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê dashboard',
      error: error.message
    });
  }
});

// Thống kê lịch hẹn theo ngày
router.get('/appointments/daily', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    const appointmentQuery = req.user.role === 'doctor' ? { doctor: req.user._id } : {};

    const dailyStats = await Appointment.aggregate([
      {
        $match: {
          ...appointmentQuery,
          appointmentDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          stats: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        dailyStats,
        period: { start: startDate, end: endDate }
      }
    });
  } catch (error) {
    console.error('Daily appointments stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê lịch hẹn hàng ngày',
      error: error.message
    });
  }
});

// Thống kê doanh thu theo tháng
router.get('/revenue/monthly', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - parseInt(months));

    const prescriptionQuery = req.user.role === 'doctor' ? { doctor: req.user._id } : {};

    const monthlyRevenue = await Prescription.aggregate([
      {
        $match: {
          ...prescriptionQuery,
          prescriptionDate: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$prescriptionDate' },
            month: { $month: '$prescriptionDate' }
          },
          totalRevenue: { $sum: '$totalAmount' },
          totalPrescriptions: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: '$_id.month' }
            ]
          },
          revenue: '$totalRevenue',
          prescriptions: '$totalPrescriptions'
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        monthlyRevenue,
        period: { start: startDate, end: endDate }
      }
    });
  } catch (error) {
    console.error('Monthly revenue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê doanh thu hàng tháng',
      error: error.message
    });
  }
});

// Thống kê bệnh nhân theo độ tuổi và giới tính
router.get('/patients/demographics', auth, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const [genderStats, ageGroupStats] = await Promise.all([
      // Thống kê theo giới tính
      Patient.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$gender',
            count: { $sum: 1 }
          }
        }
      ]),

      // Thống kê theo nhóm tuổi
      Patient.aggregate([
        { $match: { isActive: true } },
        {
          $project: {
            ageGroup: {
              $switch: {
                branches: [
                  { case: { $lt: [{ $subtract: [new Date(), '$dateOfBirth'] }, 567993600000] }, then: '0-17' }, // < 18 years
                  { case: { $lt: [{ $subtract: [new Date(), '$dateOfBirth'] }, 1893456000000] }, then: '18-59' }, // 18-59 years
                ],
                default: '60+'
              }
            }
          }
        },
        {
          $group: {
            _id: '$ageGroup',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        gender: genderStats,
        ageGroups: ageGroupStats
      }
    });
  } catch (error) {
    console.error('Patient demographics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê nhân khẩu học bệnh nhân',
      error: error.message
    });
  }
});

// Top bệnh thường gặp
router.get('/diagnoses/common', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recordQuery = req.user.role === 'doctor' ? { doctor: req.user._id } : {};

    const commonDiagnoses = await MedicalRecord.aggregate([
      {
        $match: {
          ...recordQuery,
          isActive: true,
          'diagnosis.primary': { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$diagnosis.primary',
          count: { $sum: 1 },
          recentCases: {
            $push: {
              patientId: '$patient',
              visitDate: '$visitDate'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          diagnosis: '$_id',
          count: 1,
          recentCases: { $slice: ['$recentCases', -5] }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: {
        commonDiagnoses
      }
    });
  } catch (error) {
    console.error('Common diagnoses error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê bệnh thường gặp',
      error: error.message
    });
  }
});

// Hoạt động gần đây
router.get('/activities/recent', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const query = req.user.role === 'doctor' ? { doctor: req.user._id } : {};

    const activities = [];

    // Lấy lịch hẹn gần đây
    const recentAppointments = await Appointment.find(query)
      .populate('patient', 'patientId fullName')
      .populate('doctor', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('appointmentId patient doctor appointmentDate status createdAt');

    recentAppointments.forEach(apt => {
      activities.push({
        type: 'appointment',
        title: `Lịch hẹn ${apt.appointmentId}`,
        description: `Bệnh nhân: ${apt.patient.fullName} - Bác sĩ: ${apt.doctor.fullName}`,
        timestamp: apt.createdAt,
        status: apt.status
      });
    });

    // Lấy hồ sơ y tế gần đây
    const recentRecords = await MedicalRecord.find({
      ...query,
      isActive: true
    })
      .populate('patient', 'patientId fullName')
      .populate('doctor', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('recordId patient doctor diagnosis.primary createdAt status');

    recentRecords.forEach(record => {
      activities.push({
        type: 'medical_record',
        title: `Hồ sơ ${record.recordId}`,
        description: `Bệnh nhân: ${record.patient.fullName} - Chẩn đoán: ${record.diagnosis.primary}`,
        timestamp: record.createdAt,
        status: record.status
      });
    });

    // Sắp xếp theo thời gian và giới hạn
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        activities: limitedActivities
      }
    });
  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy hoạt động gần đây',
      error: error.message
    });
  }
});

// Lịch hẹn sắp tới
router.get('/appointments/upcoming', auth, async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const query = {
      appointmentDate: { $gte: today, $lte: nextWeek },
      status: { $in: ['scheduled', 'confirmed'] }
    };

    // Nếu là bác sĩ, chỉ xem lịch của mình
    if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }

    const upcomingAppointments = await Appointment.find(query)
      .populate('patient', 'patientId fullName phone')
      .populate('doctor', 'fullName specialization')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        appointments: upcomingAppointments
      }
    });
  } catch (error) {
    console.error('Upcoming appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy lịch hẹn sắp tới',
      error: error.message
    });
  }
});

module.exports = router;

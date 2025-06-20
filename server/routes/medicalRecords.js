const express = require('express');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách hồ sơ y tế
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      patient, 
      doctor,
      startDate,
      endDate,
      status,
      diagnosis
    } = req.query;
    
    const query = { isActive: true };
    
    // Filter theo bệnh nhân
    if (patient) {
      query.patient = patient;
    }
    
    // Filter theo bác sĩ
    if (doctor) {
      query.doctor = doctor;
    }
    
    // Filter theo khoảng thời gian
    if (startDate && endDate) {
      query.visitDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Filter theo trạng thái
    if (status) {
      query.status = status;
    }
    
    // Search theo chẩn đoán
    if (diagnosis) {
      query.$or = [
        { 'diagnosis.primary': { $regex: diagnosis, $options: 'i' } },
        { 'diagnosis.secondary': { $in: [new RegExp(diagnosis, 'i')] } }
      ];
    }

    // Nếu là bác sĩ, chỉ xem hồ sơ do mình tạo
    if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }

    const records = await MedicalRecord.find(query)
      .populate('patient', 'patientId fullName phone gender age')
      .populate('doctor', 'fullName specialization')
      .populate('appointment', 'appointmentDate appointmentTime')
      .populate('createdBy', 'fullName')
      .sort({ visitDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MedicalRecord.countDocuments(query);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: records.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách hồ sơ y tế',
      error: error.message
    });
  }
});

// Lấy thông tin hồ sơ y tế theo ID
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patient', 'patientId fullName phone gender age dateOfBirth address bloodType medicalHistory')
      .populate('doctor', 'fullName specialization licenseNumber')
      .populate('appointment', 'appointmentDate appointmentTime reason')
      .populate('treatment.medications.medicine', 'name genericName strength dosageForm')
      .populate('createdBy', 'fullName')
      .populate('reviewedBy', 'fullName');
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ y tế'
      });
    }

    // Kiểm tra quyền truy cập
    if (req.user.role === 'doctor' && record.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập hồ sơ này'
      });
    }

    res.json({
      success: true,
      data: {
        record
      }
    });
  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin hồ sơ y tế',
      error: error.message
    });
  }
});

// Tạo hồ sơ y tế mới
router.post('/', auth, authorize('doctor'), async (req, res) => {
  try {
    // Kiểm tra bệnh nhân tồn tại
    const patient = await Patient.findById(req.body.patient);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh nhân'
      });
    }

    const recordData = {
      ...req.body,
      doctor: req.user._id,
      createdBy: req.user._id
    };

    const record = new MedicalRecord(recordData);
    await record.save();

    await record.populate([
      { path: 'patient', select: 'patientId fullName phone gender age' },
      { path: 'doctor', select: 'fullName specialization' },
      { path: 'appointment', select: 'appointmentDate appointmentTime' },
      { path: 'createdBy', select: 'fullName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo hồ sơ y tế thành công',
      data: {
        record
      }
    });
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo hồ sơ y tế',
      error: error.message
    });
  }
});

// Cập nhật hồ sơ y tế
router.put('/:id', auth, authorize('doctor'), async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ y tế'
      });
    }

    // Kiểm tra quyền sửa (chỉ bác sĩ tạo hồ sơ mới được sửa)
    if (record.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền sửa hồ sơ này'
      });
    }

    // Không cho phép sửa hồ sơ đã được duyệt
    if (record.status === 'reviewed') {
      return res.status(400).json({
        success: false,
        message: 'Không thể sửa hồ sơ đã được duyệt'
      });
    }

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'patientId fullName phone gender age' },
      { path: 'doctor', select: 'fullName specialization' },
      { path: 'appointment', select: 'appointmentDate appointmentTime' },
      { path: 'treatment.medications.medicine', select: 'name genericName strength dosageForm' }
    ]);

    res.json({
      success: true,
      message: 'Cập nhật hồ sơ y tế thành công',
      data: {
        record: updatedRecord
      }
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật hồ sơ y tế',
      error: error.message
    });
  }
});

// Cập nhật trạng thái hồ sơ
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['draft', 'completed', 'reviewed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const record = await MedicalRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ y tế'
      });
    }

    // Kiểm tra quyền
    if (status === 'reviewed' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể duyệt hồ sơ'
      });
    }

    if (['draft', 'completed'].includes(status) && record.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật hồ sơ này'
      });
    }

    const updateData = { status };
    if (status === 'reviewed') {
      updateData.reviewedBy = req.user._id;
      updateData.reviewedAt = new Date();
    }

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'patient', select: 'patientId fullName' },
      { path: 'doctor', select: 'fullName' }
    ]);

    res.json({
      success: true,
      message: `${status === 'reviewed' ? 'Duyệt' : 'Cập nhật'} hồ sơ thành công`,
      data: {
        record: updatedRecord
      }
    });
  } catch (error) {
    console.error('Update record status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật trạng thái hồ sơ',
      error: error.message
    });
  }
});

// Thêm kết quả xét nghiệm
router.post('/:id/investigations', auth, authorize('doctor'), async (req, res) => {
  try {
    const { type, name, result, date, notes, attachments } = req.body;
    
    const record = await MedicalRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ y tế'
      });
    }

    // Kiểm tra quyền
    if (record.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật hồ sơ này'
      });
    }

    const investigation = {
      type,
      name,
      result,
      date: date || new Date(),
      notes,
      attachments: attachments || []
    };

    record.investigations.push(investigation);
    await record.save();

    res.json({
      success: true,
      message: 'Thêm kết quả xét nghiệm thành công',
      data: {
        investigation: record.investigations[record.investigations.length - 1]
      }
    });
  } catch (error) {
    console.error('Add investigation error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi thêm kết quả xét nghiệm',
      error: error.message
    });
  }
});

// Lấy lịch sử khám bệnh của bệnh nhân
router.get('/patient/:patientId/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const records = await MedicalRecord.find({ 
      patient: req.params.patientId,
      isActive: true 
    })
    .populate('doctor', 'fullName specialization')
    .populate('appointment', 'appointmentDate appointmentTime')
    .select('recordId visitDate diagnosis.primary vitalSigns status')
    .sort({ visitDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await MedicalRecord.countDocuments({ 
      patient: req.params.patientId,
      isActive: true 
    });

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: records.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy lịch sử khám bệnh',
      error: error.message
    });
  }
});

// Thống kê hồ sơ y tế
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const query = req.user.role === 'doctor' ? { doctor: req.user._id } : {};

    const [
      totalRecords,
      recordsByStatus,
      recentRecords,
      commonDiagnoses
    ] = await Promise.all([
      MedicalRecord.countDocuments({ ...query, isActive: true }),
      
      MedicalRecord.aggregate([
        { $match: { ...query, isActive: true } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      MedicalRecord.countDocuments({
        ...query,
        isActive: true,
        visitDate: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      }),
      
      MedicalRecord.aggregate([
        { $match: { ...query, isActive: true } },
        {
          $group: {
            _id: '$diagnosis.primary',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total: totalRecords,
        recentMonth: recentRecords,
        byStatus: recordsByStatus,
        commonDiagnoses
      }
    });
  } catch (error) {
    console.error('Get medical record stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê hồ sơ y tế',
      error: error.message
    });
  }
});

// Xóa hồ sơ y tế
router.delete('/:id', auth, authorize('doctor'), async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ y tế'
      });
    }

    // Kiểm tra quyền xóa
    if (record.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa hồ sơ này'
      });
    }

    // Soft delete
    record.isActive = false;
    await record.save();

    res.json({
      success: true,
      message: 'Xóa hồ sơ y tế thành công'
    });
  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa hồ sơ y tế',
      error: error.message
    });
  }
});

module.exports = router;

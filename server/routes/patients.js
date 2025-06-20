const express = require('express');
const Patient = require('../models/Patient');
const { auth, authorize } = require('../middleware/auth');
const { validate, validatePatient } = require('../middleware/validation');

const router = express.Router();

// Lấy danh sách bệnh nhân
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      gender, 
      ageMin, 
      ageMax,
      bloodType,
      isActive = true 
    } = req.query;
    
    const query = { isActive };
    
    // Search theo tên, số điện thoại, mã bệnh nhân
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { identityCard: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter theo giới tính
    if (gender) {
      query.gender = gender;
    }
    
    // Filter theo nhóm máu
    if (bloodType) {
      query.bloodType = bloodType;
    }

    let patients = await Patient.find(query)
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter theo tuổi (sau khi query vì age là virtual field)
    if (ageMin || ageMax) {
      patients = patients.filter(patient => {
        const age = patient.age;
        if (ageMin && age < parseInt(ageMin)) return false;
        if (ageMax && age > parseInt(ageMax)) return false;
        return true;
      });
    }

    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: patients.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách bệnh nhân',
      error: error.message
    });
  }
});

// Lấy thông tin bệnh nhân theo ID
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('createdBy', 'fullName role');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh nhân'
      });
    }

    res.json({
      success: true,
      data: {
        patient
      }
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin bệnh nhân',
      error: error.message
    });
  }
});

// Tạo bệnh nhân mới
router.post('/', auth, validate(validatePatient), async (req, res) => {
  try {
    const patientData = {
      ...req.body,
      createdBy: req.user._id
    };

    const patient = new Patient(patientData);
    await patient.save();

    await patient.populate('createdBy', 'fullName role');

    res.status(201).json({
      success: true,
      message: 'Tạo bệnh nhân mới thành công',
      data: {
        patient
      }
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo bệnh nhân mới',
      error: error.message
    });
  }
});

// Cập nhật thông tin bệnh nhân
router.put('/:id', auth, validate(validatePatient), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullName role');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh nhân'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật bệnh nhân thành công',
      data: {
        patient
      }
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật bệnh nhân',
      error: error.message
    });
  }
});

// Xóa mềm bệnh nhân
router.delete('/:id', auth, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh nhân'
      });
    }

    res.json({
      success: true,
      message: 'Xóa bệnh nhân thành công'
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa bệnh nhân',
      error: error.message
    });
  }
});

// Khôi phục bệnh nhân
router.patch('/:id/restore', auth, authorize('admin'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh nhân'
      });
    }

    res.json({
      success: true,
      message: 'Khôi phục bệnh nhân thành công',
      data: {
        patient
      }
    });
  } catch (error) {
    console.error('Restore patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khôi phục bệnh nhân',
      error: error.message
    });
  }
});

// Tìm kiếm bệnh nhân theo số điện thoại hoặc CMND
router.get('/search/quick', auth, async (req, res) => {
  try {
    const { phone, identityCard } = req.query;
    
    if (!phone && !identityCard) {
      return res.status(400).json({
        success: false,
        message: 'Cần cung cấp số điện thoại hoặc CMND/CCCD'
      });
    }

    const query = { isActive: true };
    if (phone) query.phone = phone;
    if (identityCard) query.identityCard = identityCard;

    const patient = await Patient.findOne(query);

    res.json({
      success: true,
      data: {
        patient
      }
    });
  } catch (error) {
    console.error('Quick search patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tìm kiếm bệnh nhân',
      error: error.message
    });
  }
});

// Lấy lịch sử khám bệnh của bệnh nhân
router.get('/:id/medical-history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const MedicalRecord = require('../models/MedicalRecord');
    
    const records = await MedicalRecord.find({ 
      patient: req.params.id,
      isActive: true 
    })
    .populate('doctor', 'fullName specialization')
    .populate('appointment', 'appointmentDate appointmentTime')
    .sort({ visitDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await MedicalRecord.countDocuments({ 
      patient: req.params.id,
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
    console.error('Get patient medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy lịch sử khám bệnh',
      error: error.message
    });
  }
});

// Thống kê bệnh nhân
router.get('/stats/overview', auth, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const total = await Patient.countDocuments({ isActive: true });
    
    const genderStats = await Patient.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    const ageGroups = await Patient.aggregate([
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
    ]);

    const newPatientsThisMonth = await Patient.countDocuments({
      isActive: true,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    res.json({
      success: true,
      data: {
        total,
        newThisMonth: newPatientsThisMonth,
        byGender: genderStats,
        byAgeGroup: ageGroups
      }
    });
  } catch (error) {
    console.error('Get patient stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê bệnh nhân',
      error: error.message
    });
  }
});

module.exports = router;

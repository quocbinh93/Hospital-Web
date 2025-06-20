const express = require('express');
const Prescription = require('../models/Prescription');
const MedicalRecord = require('../models/MedicalRecord');
const Medicine = require('../models/Medicine');
const Patient = require('../models/Patient');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách đơn thuốc
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      patient, 
      doctor,
      status,
      startDate,
      endDate,
      search
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
    
    // Filter theo trạng thái
    if (status) {
      query.status = status;
    }
    
    // Filter theo khoảng thời gian
    if (startDate && endDate) {
      query.prescriptionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Search theo mã đơn thuốc hoặc chẩn đoán
    if (search) {
      query.$or = [
        { prescriptionId: { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } }
      ];
    }

    // Nếu là bác sĩ, chỉ xem đơn thuốc do mình kê
    if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'patientId fullName phone gender age')
      .populate('doctor', 'fullName specialization')
      .populate('medications.medicine', 'name genericName strength dosageForm')
      .populate('createdBy', 'fullName')
      .sort({ prescriptionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments(query);

    res.json({
      success: true,
      data: {
        prescriptions,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: prescriptions.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách đơn thuốc',
      error: error.message
    });
  }
});

// Lấy thông tin đơn thuốc theo ID
router.get('/:id', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'patientId fullName phone gender age dateOfBirth address')
      .populate('doctor', 'fullName specialization licenseNumber')
      .populate('medicalRecord', 'recordId visitDate')
      .populate('medications.medicine', 'name genericName strength dosageForm unit price')
      .populate('createdBy', 'fullName')
      .populate('issuedBy', 'fullName')
      .populate('medications.dispensedBy', 'fullName');
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn thuốc'
      });
    }

    // Kiểm tra quyền truy cập
    if (req.user.role === 'doctor' && prescription.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập đơn thuốc này'
      });
    }

    res.json({
      success: true,
      data: {
        prescription
      }
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin đơn thuốc',
      error: error.message
    });
  }
});

// Tạo đơn thuốc mới
router.post('/', auth, authorize('doctor'), async (req, res) => {
  try {
    console.log('POST /prescriptions - Request body:', JSON.stringify(req.body, null, 2));
    console.log('POST /prescriptions - User:', req.user._id, req.user.role);
    
    const { patient, medicalRecord, medications, diagnosis, symptoms, generalInstructions, followUpDate, followUpInstructions } = req.body;

    // Kiểm tra bệnh nhân tồn tại
    console.log('Checking patient:', patient);
    const patientDoc = await Patient.findById(patient);
    if (!patientDoc) {
      console.log('Patient not found:', patient);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh nhân'
      });
    }
    console.log('Patient found:', patientDoc.fullName);

    // Kiểm tra và tính toán thông tin thuốc
    console.log('Processing medications:', medications);
    const processedMedications = [];
    for (const med of medications) {
      const medicine = await Medicine.findById(med.medicine);
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy thuốc với ID: ${med.medicine}`
        });
      }

      // Kiểm tra tồn kho
      if (medicine.stock.quantity < med.quantity) {
        return res.status(400).json({
          success: false,
          message: `Thuốc ${medicine.name} không đủ tồn kho. Có sẵn: ${medicine.stock.quantity}, Yêu cầu: ${med.quantity}`
        });
      }

      processedMedications.push({
        medicine: med.medicine,
        medicineName: medicine.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        quantity: med.quantity,
        unitPrice: med.unitPrice || medicine.price,
        totalPrice: med.quantity * (med.unitPrice || medicine.price),
        instructions: med.instructions,
        beforeMeal: med.beforeMeal || false,
        afterMeal: med.afterMeal !== undefined ? med.afterMeal : true,
        warnings: med.warnings || ''
      });
    }

    // Generate prescriptionId
    const lastPrescription = await Prescription.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextNumber = 1;
    
    if (lastPrescription && lastPrescription.prescriptionId) {
      const lastNumber = parseInt(lastPrescription.prescriptionId.replace('RX', '')) || 0;
      nextNumber = lastNumber + 1;
    }
    
    const prescriptionId = `RX${nextNumber.toString().padStart(6, '0')}`;
    console.log('Generated prescriptionId:', prescriptionId);

    const prescriptionData = {
      prescriptionId,
      patient,
      doctor: req.user._id,
      medicalRecord,
      medications: processedMedications,
      diagnosis,
      symptoms,
      generalInstructions,
      followUpDate,
      followUpInstructions,
      createdBy: req.user._id
    };

    const prescription = new Prescription(prescriptionData);
    await prescription.save();

    await prescription.populate([
      { path: 'patient', select: 'patientId fullName phone gender age' },
      { path: 'doctor', select: 'fullName specialization' },
      { path: 'medications.medicine', select: 'name genericName strength dosageForm' },
      { path: 'createdBy', select: 'fullName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo đơn thuốc thành công',
      data: {
        prescription
      }
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo đơn thuốc',
      error: error.message
    });
  }
});

// Cập nhật đơn thuốc
router.put('/:id', auth, authorize('doctor'), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn thuốc'
      });
    }

    // Kiểm tra quyền sửa
    if (prescription.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền sửa đơn thuốc này'
      });
    }

    // Không cho phép sửa đơn thuốc đã được cấp phát hoặc đã hủy
    if (['fully-dispensed', 'cancelled'].includes(prescription.status)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể sửa đơn thuốc đã được cấp phát hoặc đã hủy'
      });
    }

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'patientId fullName phone gender age' },
      { path: 'doctor', select: 'fullName specialization' },
      { path: 'medications.medicine', select: 'name genericName strength dosageForm' }
    ]);

    res.json({
      success: true,
      message: 'Cập nhật đơn thuốc thành công',
      data: {
        prescription: updatedPrescription
      }
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật đơn thuốc',
      error: error.message
    });
  }
});

// Cập nhật trạng thái đơn thuốc
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, cancelReason } = req.body;
    
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn thuốc'
      });
    }

    const updateData = { status };

    // Xử lý theo trạng thái
    switch (status) {
      case 'issued':
        updateData.issuedBy = req.user._id;
        updateData.issuedAt = new Date();
        break;
        
      case 'cancelled':
        if (!cancelReason) {
          return res.status(400).json({
            success: false,
            message: 'Lý do hủy là bắt buộc'
          });
        }
        updateData.cancelReason = cancelReason;
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = req.user._id;
        break;
    }

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'patient', select: 'patientId fullName' },
      { path: 'doctor', select: 'fullName' }
    ]);

    res.json({
      success: true,
      message: `${status === 'cancelled' ? 'Hủy' : 'Cập nhật'} đơn thuốc thành công`,
      data: {
        prescription: updatedPrescription
      }
    });
  } catch (error) {
    console.error('Update prescription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật trạng thái đơn thuốc',
      error: error.message
    });
  }
});

// Cấp phát thuốc
router.patch('/:id/dispense', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { medicationIds, pharmacyNotes } = req.body;
    
    const prescription = await Prescription.findById(req.params.id)
      .populate('medications.medicine');
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn thuốc'
      });
    }

    if (prescription.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Không thể cấp phát đơn thuốc đã bị hủy'
      });
    }

    // Cập nhật trạng thái cấp phát cho từng thuốc
    for (const medId of medicationIds) {
      const medication = prescription.medications.id(medId);
      if (medication && !medication.dispensed) {
        // Kiểm tra tồn kho
        const medicine = await Medicine.findById(medication.medicine._id);
        if (medicine.stock.quantity < medication.quantity) {
          return res.status(400).json({
            success: false,
            message: `Thuốc ${medicine.name} không đủ tồn kho`
          });
        }

        // Cập nhật trạng thái cấp phát
        medication.dispensed = true;
        medication.dispensedDate = new Date();
        medication.dispensedBy = req.user._id;

        // Trừ tồn kho
        medicine.stock.quantity -= medication.quantity;
        await medicine.save();
      }
    }

    // Cập nhật trạng thái đơn thuốc
    const totalMedications = prescription.medications.length;
    const dispensedCount = prescription.medications.filter(med => med.dispensed).length;
    
    if (dispensedCount === totalMedications) {
      prescription.status = 'fully-dispensed';
    } else if (dispensedCount > 0) {
      prescription.status = 'partially-dispensed';
    }

    if (pharmacyNotes) {
      prescription.pharmacyNotes = pharmacyNotes;
    }

    await prescription.save();

    await prescription.populate([
      { path: 'patient', select: 'patientId fullName' },
      { path: 'medications.medicine', select: 'name' },
      { path: 'medications.dispensedBy', select: 'fullName' }
    ]);

    res.json({
      success: true,
      message: 'Cấp phát thuốc thành công',
      data: {
        prescription
      }
    });
  } catch (error) {
    console.error('Dispense prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cấp phát thuốc',
      error: error.message
    });
  }
});

// Lấy đơn thuốc theo bệnh nhân
router.get('/patient/:patientId/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const prescriptions = await Prescription.find({ 
      patient: req.params.patientId,
      isActive: true 
    })
    .populate('doctor', 'fullName specialization')
    .populate('medications.medicine', 'name strength dosageForm')
    .select('prescriptionId prescriptionDate diagnosis status totalAmount')
    .sort({ prescriptionDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Prescription.countDocuments({ 
      patient: req.params.patientId,
      isActive: true 
    });

    res.json({
      success: true,
      data: {
        prescriptions,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: prescriptions.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy lịch sử đơn thuốc',
      error: error.message
    });
  }
});

// Thống kê đơn thuốc
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const query = req.user.role === 'doctor' ? { doctor: req.user._id } : {};

    const [
      totalPrescriptions,
      prescriptionsByStatus,
      recentPrescriptions,
      totalRevenue,
      commonMedicines
    ] = await Promise.all([
      Prescription.countDocuments({ ...query, isActive: true }),
      
      Prescription.aggregate([
        { $match: { ...query, isActive: true } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      Prescription.countDocuments({
        ...query,
        isActive: true,
        prescriptionDate: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      }),
      
      Prescription.aggregate([
        { $match: { ...query, isActive: true, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]),
      
      Prescription.aggregate([
        { $match: { ...query, isActive: true } },
        { $unwind: '$medications' },
        {
          $group: {
            _id: '$medications.medicineName',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$medications.quantity' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total: totalPrescriptions,
        recentMonth: recentPrescriptions,
        byStatus: prescriptionsByStatus,
        totalRevenue: totalRevenue[0]?.total || 0,
        commonMedicines
      }
    });
  } catch (error) {
    console.error('Get prescription stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê đơn thuốc',
      error: error.message
    });
  }
});

// Xóa đơn thuốc
router.delete('/:id', auth, authorize('doctor'), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn thuốc'
      });
    }

    // Kiểm tra quyền xóa
    if (prescription.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa đơn thuốc này'
      });
    }

    // Không cho phép xóa đơn thuốc đã được cấp phát
    if (['fully-dispensed', 'partially-dispensed'].includes(prescription.status)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa đơn thuốc đã được cấp phát'
      });
    }

    // Soft delete
    prescription.isActive = false;
    await prescription.save();

    res.json({
      success: true,
      message: 'Xóa đơn thuốc thành công'
    });
  } catch (error) {
    console.error('Delete prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa đơn thuốc',
      error: error.message
    });
  }
});

module.exports = router;

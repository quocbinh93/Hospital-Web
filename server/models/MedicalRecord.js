const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    unique: true,
    required: false // Auto-generated
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Bệnh nhân là bắt buộc']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Bác sĩ là bắt buộc']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  visitDate: {
    type: Date,
    required: [true, 'Ngày khám là bắt buộc'],
    default: Date.now
  },
  visitType: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'checkup', 'surgery'],
    default: 'consultation'
  },
  chiefComplaint: {
    type: String,
    required: [true, 'Lý do khám chính là bắt buộc'],
    maxlength: [500, 'Lý do khám không được vượt quá 500 ký tự']
  },
  presentIllness: {
    type: String,
    maxlength: [2000, 'Bệnh sử hiện tại không được vượt quá 2000 ký tự']
  },
  symptoms: [String],
  vitalSigns: {
    temperature: Number, // °C
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number, // bpm
    respiratoryRate: Number, // breaths/min
    weight: Number, // kg
    height: Number, // cm
    bmi: Number,
    oxygenSaturation: Number // %
  },
  physicalExamination: {
    general: String,
    head: String,
    neck: String,
    chest: String,
    abdomen: String,
    extremities: String,
    neurological: String,
    skin: String,
    other: String
  },
  investigations: [{
    type: {
      type: String,
      enum: ['blood-test', 'urine-test', 'x-ray', 'ct-scan', 'mri', 'ultrasound', 'ecg', 'echo', 'other']
    },
    name: String,
    result: String,
    date: Date,
    notes: String,
    attachments: [String] // URLs to files
  }],
  diagnosis: {
    primary: {
      type: String,
      required: [true, 'Chẩn đoán chính là bắt buộc'],
      maxlength: [200, 'Chẩn đoán không được vượt quá 200 ký tự']
    },
    secondary: [String],
    icd10Code: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'critical'],
      default: 'mild'
    }
  },
  treatment: {
    plan: String,
    medications: [{
      medicine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine'
      },
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String,
      quantity: Number
    }],
    procedures: [{
      name: String,
      description: String,
      date: Date,
      doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    referrals: [{
      specialist: String,
      department: String,
      reason: String,
      priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
      }
    }]
  },
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    date: Date,
    instructions: String,
    interval: String // e.g., "1 week", "2 weeks", "1 month"
  },
  billing: {
    consultationFee: {
      type: Number,
      default: 0,
      min: [0, 'Phí khám không được âm']
    },
    procedureFees: [{
      name: String,
      fee: Number
    }],
    medicationFees: [{
      medicine: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number
    }],
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Tổng tiền không được âm']
    }
  },
  status: {
    type: String,
    enum: ['draft', 'completed', 'reviewed'],
    default: 'draft'
  },
  notes: String,
  attachments: [String], // URLs to files (images, documents)
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
}, {
  timestamps: true
});

// Tạo mã hồ sơ tự động
medicalRecordSchema.pre('save', async function(next) {
  if (!this.recordId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('MedicalRecord').countDocuments({
      createdAt: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    });
    this.recordId = `HS${dateStr}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Tính BMI tự động
medicalRecordSchema.pre('save', function(next) {
  if (this.vitalSigns && this.vitalSigns.weight && this.vitalSigns.height) {
    const heightInMeters = this.vitalSigns.height / 100;
    this.vitalSigns.bmi = Math.round((this.vitalSigns.weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }
  next();
});

// Tính tổng tiền tự động
medicalRecordSchema.pre('save', function(next) {
  if (this.billing) {
    let total = this.billing.consultationFee || 0;
    
    if (this.billing.procedureFees) {
      total += this.billing.procedureFees.reduce((sum, fee) => sum + (fee.fee || 0), 0);
    }
    
    if (this.billing.medicationFees) {
      total += this.billing.medicationFees.reduce((sum, med) => sum + (med.totalPrice || 0), 0);
    }
    
    this.billing.totalAmount = total;
  }
  next();
});

// Pre-save middleware để auto-generate recordId
medicalRecordSchema.pre('save', async function(next) {
  if (!this.recordId) {
    const lastRecord = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextNumber = 1;
    
    if (lastRecord && lastRecord.recordId) {
      const lastNumber = parseInt(lastRecord.recordId.replace('MR', '')) || 0;
      nextNumber = lastNumber + 1;
    }
    
    this.recordId = `MR${nextNumber.toString().padStart(6, '0')}`;
  }
  next();
});

// Index cho tìm kiếm và hiệu năng
medicalRecordSchema.index({ recordId: 1 });
medicalRecordSchema.index({ patient: 1 });
medicalRecordSchema.index({ doctor: 1 });
medicalRecordSchema.index({ visitDate: -1 });
medicalRecordSchema.index({ status: 1 });
medicalRecordSchema.index({ patient: 1, visitDate: -1 });
medicalRecordSchema.index({ 'diagnosis.primary': 'text', 'diagnosis.secondary': 'text' });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);

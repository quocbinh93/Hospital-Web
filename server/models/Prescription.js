const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    unique: true,
    required: false // Để middleware tự generate
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
  medicalRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
  },
  prescriptionDate: {
    type: Date,
    required: [true, 'Ngày kê đơn là bắt buộc'],
    default: Date.now
  },
  medications: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: [true, 'Thuốc là bắt buộc']
    },
    medicineName: String, // Lưu tên thuốc để backup
    dosage: {
      type: String,
      required: [true, 'Liều lượng là bắt buộc'],
      maxlength: [100, 'Liều lượng không được vượt quá 100 ký tự']
    },
    frequency: {
      type: String,
      required: [true, 'Tần suất dùng là bắt buộc'],
      maxlength: [100, 'Tần suất không được vượt quá 100 ký tự']
    },
    duration: {
      type: String,
      required: [true, 'Thời gian dùng là bắt buộc'],
      maxlength: [50, 'Thời gian dùng không được vượt quá 50 ký tự']
    },
    quantity: {
      type: Number,
      required: [true, 'Số lượng là bắt buộc'],
      min: [1, 'Số lượng phải lớn hơn 0']
    },
    unitPrice: {
      type: Number,
      required: [true, 'Đơn giá là bắt buộc'],
      min: [0, 'Đơn giá không được âm']
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Thành tiền không được âm']
    },
    instructions: {
      type: String,
      maxlength: [500, 'Hướng dẫn sử dụng không được vượt quá 500 ký tự']
    },
    beforeMeal: {
      type: Boolean,
      default: false
    },
    afterMeal: {
      type: Boolean,
      default: true
    },
    warnings: String, // Cảnh báo đặc biệt
    substituted: {
      type: Boolean,
      default: false // Có thay thế thuốc khác không
    },
    dispensed: {
      type: Boolean,
      default: false // Đã cấp phát chưa
    },
    dispensedDate: Date,
    dispensedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  diagnosis: {
    type: String,
    required: [true, 'Chẩn đoán là bắt buộc'],
    maxlength: [200, 'Chẩn đoán không được vượt quá 200 ký tự']
  },
  symptoms: String,
  generalInstructions: {
    type: String,
    maxlength: [1000, 'Hướng dẫn chung không được vượt quá 1000 ký tự']
  },
  followUpDate: Date,
  followUpInstructions: String,
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tổng tiền không được âm']
  },
  status: {
    type: String,
    enum: ['draft', 'issued', 'partially-dispensed', 'fully-dispensed', 'cancelled'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent'],
    default: 'normal'
  },
  validUntil: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ngày
    }
  },
  notes: String,
  pharmacyNotes: String, // Ghi chú từ dược sĩ
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  issuedAt: Date,
  cancelReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Tạo mã đơn thuốc tự động
prescriptionSchema.pre('save', async function(next) {
  if (!this.prescriptionId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Prescription').countDocuments({
      createdAt: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    });
    this.prescriptionId = `DT${dateStr}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Tính tổng tiền tự động
prescriptionSchema.pre('save', function(next) {
  if (this.medications && this.medications.length > 0) {
    this.totalAmount = this.medications.reduce((total, med) => {
      med.totalPrice = med.quantity * med.unitPrice;
      return total + med.totalPrice;
    }, 0);
  }
  next();
});

// Index cho tìm kiếm và hiệu năng
prescriptionSchema.index({ prescriptionId: 1 });
prescriptionSchema.index({ patient: 1 });
prescriptionSchema.index({ doctor: 1 });
prescriptionSchema.index({ prescriptionDate: -1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ validUntil: 1 });
prescriptionSchema.index({ patient: 1, prescriptionDate: -1 });

// Virtual để kiểm tra đơn thuốc có hết hạn không
prescriptionSchema.virtual('isExpired').get(function() {
  return this.validUntil < new Date();
});

// Virtual để kiểm tra có thuốc nào chưa cấp phát
prescriptionSchema.virtual('hasUndispensedMedications').get(function() {
  return this.medications.some(med => !med.dispensed);
});

// Virtual để tính tỷ lệ cấp phát
prescriptionSchema.virtual('dispensedPercentage').get(function() {
  if (!this.medications || this.medications.length === 0) return 0;
  const dispensedCount = this.medications.filter(med => med.dispensed).length;
  return Math.round((dispensedCount / this.medications.length) * 100);
});

// Pre-save middleware để auto-generate prescriptionId
prescriptionSchema.pre('save', async function(next) {
  if (!this.prescriptionId) {
    const lastPrescription = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextNumber = 1;
    
    if (lastPrescription && lastPrescription.prescriptionId) {
      const lastNumber = parseInt(lastPrescription.prescriptionId.replace('RX', '')) || 0;
      nextNumber = lastNumber + 1;
    }
    
    this.prescriptionId = `RX${nextNumber.toString().padStart(6, '0')}`;
  }
  next();
});

// Đảm bảo virtual fields được include khi convert sang JSON
prescriptionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);

const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    unique: true,
    required: true
  },
  fullName: {
    type: String,
    required: [true, 'Họ tên bệnh nhân là bắt buộc'],
    trim: true,
    maxlength: [100, 'Họ tên không được vượt quá 100 ký tự']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Ngày sinh là bắt buộc']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Giới tính là bắt buộc']
  },
  phone: {
    type: String,
    required: [true, 'Số điện thoại là bắt buộc'],
    match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
  },
  email: {
    type: String,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Địa chỉ không được vượt quá 500 ký tự']
  },
  identityCard: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[0-9]{9,12}$/, 'CMND/CCCD không hợp lệ']
  },
  insuranceNumber: {
    type: String,
    sparse: true
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  medicalHistory: {
    type: String,
    maxlength: [1000, 'Tiền sử bệnh không được vượt quá 1000 ký tự']
  },
  allergies: [String],
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  height: Number, // cm
  weight: Number, // kg
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastVisit: Date,
  totalVisits: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index cho tìm kiếm
patientSchema.index({ patientId: 1 });
patientSchema.index({ phone: 1 });
patientSchema.index({ identityCard: 1 });
patientSchema.index({ fullName: 'text' });
patientSchema.index({ createdBy: 1 });

// Auto-generate patientId if not provided
patientSchema.pre('save', async function(next) {
  if (!this.patientId) {
    const count = await this.constructor.countDocuments();
    this.patientId = `PT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual để tính tuổi
patientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Đảm bảo virtual fields được include khi convert sang JSON
patientSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Patient', patientSchema);

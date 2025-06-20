const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Họ tên là bắt buộc'],
    trim: true,
    maxlength: [100, 'Họ tên không được vượt quá 100 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Mật khẩu là bắt buộc'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'receptionist'],
    default: 'receptionist'
  },
  phone: {
    type: String,
    match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
  },
  address: {
    type: String,
    maxlength: [200, 'Địa chỉ không được vượt quá 200 ký tự']
  },
  specialization: {
    type: String, // Chỉ áp dụng cho bác sĩ
    maxlength: [100, 'Chuyên khoa không được vượt quá 100 ký tự']
  },
  licenseNumber: {
    type: String, // Số chứng chỉ hành nghề (cho bác sĩ)
    sparse: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String // URL của ảnh đại diện
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Index cho tìm kiếm
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ fullName: 'text' });

// Hash password trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// So sánh mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Loại bỏ password khi trả về JSON
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);

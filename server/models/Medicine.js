const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên thuốc là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tên thuốc không được vượt quá 200 ký tự']
  },
  genericName: {
    type: String,
    trim: true,
    maxlength: [200, 'Tên hoạt chất không được vượt quá 200 ký tự']
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [100, 'Thương hiệu không được vượt quá 100 ký tự']
  },
  category: {
    type: String,
    required: [true, 'Phân loại thuốc là bắt buộc'],
    enum: [
      'antibiotic', 'painkiller', 'vitamin', 'antacid', 'antihistamine',
      'antihypertensive', 'diabetes', 'cardiovascular', 'respiratory',
      'dermatology', 'neurology', 'psychiatry', 'other'
    ]
  },
  dosageForm: {
    type: String,
    required: [true, 'Dạng bào chế là bắt buộc'],
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'spray', 'patch', 'other']
  },
  strength: {
    type: String,
    required: [true, 'Nồng độ/Hàm lượng là bắt buộc'],
    maxlength: [50, 'Nồng độ không được vượt quá 50 ký tự']
  },
  unit: {
    type: String,
    required: [true, 'Đơn vị tính là bắt buộc'],
    enum: ['viên', 'vỉ', 'hộp', 'chai', 'tuýp', 'gói', 'ống', 'lọ']
  },
  manufacturer: {
    type: String,
    maxlength: [100, 'Nhà sản xuất không được vượt quá 100 ký tự']
  },
  batchNumber: {
    type: String,
    maxlength: [50, 'Số lô không được vượt quá 50 ký tự']
  },
  manufacturingDate: Date,
  expiryDate: {
    type: Date,
    required: [true, 'Ngày hết hạn là bắt buộc']
  },
  price: {
    type: Number,
    required: [true, 'Giá thuốc là bắt buộc'],
    min: [0, 'Giá thuốc không được âm']
  },
  costPrice: {
    type: Number,
    min: [0, 'Giá vốn không được âm']
  },
  stock: {
    quantity: {
      type: Number,
      required: [true, 'Số lượng tồn kho là bắt buộc'],
      min: [0, 'Số lượng không được âm'],
      default: 0
    },
    minQuantity: {
      type: Number,
      default: 10,
      min: [0, 'Số lượng tối thiểu không được âm']
    },
    maxQuantity: {
      type: Number,
      min: [0, 'Số lượng tối đa không được âm']
    }
  },
  usage: {
    indications: [String], // Chỉ định
    contraindications: [String], // Chống chỉ định
    sideEffects: [String], // Tác dụng phụ
    interactions: [String], // Tương tác thuốc
    dosageInstructions: String, // Hướng dẫn liều dùng
    precautions: String // Thận trọng khi dùng
  },
  storage: {
    type: String,
    default: 'Bảo quản nơi khô ráo, thoáng mát, tránh ánh sáng trực tiếp'
  },
  prescription: {
    required: {
      type: Boolean,
      default: false // true: cần kê đơn, false: không cần kê đơn
    },
    controlled: {
      type: Boolean,
      default: false // thuốc kiểm soát đặc biệt
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String], // Từ khóa tìm kiếm
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index cho tìm kiếm
medicineSchema.index({ name: 'text', genericName: 'text', tags: 'text' });
medicineSchema.index({ category: 1 });
medicineSchema.index({ dosageForm: 1 });
medicineSchema.index({ 'stock.quantity': 1 });
medicineSchema.index({ expiryDate: 1 });
medicineSchema.index({ isActive: 1 });

// Virtual để kiểm tra thuốc sắp hết hạn
medicineSchema.virtual('isExpiringSoon').get(function() {
  const daysUntilExpiry = Math.ceil((this.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
});

// Virtual để kiểm tra thuốc đã hết hạn
medicineSchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date();
});

// Virtual để kiểm tra thuốc sắp hết
medicineSchema.virtual('isLowStock').get(function() {
  return this.stock.quantity <= this.stock.minQuantity;
});

// Middleware để cập nhật updatedBy
medicineSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Đảm bảo virtual fields được include khi convert sang JSON
medicineSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Medicine', medicineSchema);

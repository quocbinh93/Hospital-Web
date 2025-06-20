const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    unique: true,
    required: true
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
  appointmentDate: {
    type: Date,
    required: [true, 'Ngày hẹn là bắt buộc']
  },
  appointmentTime: {
    type: String,
    required: [true, 'Giờ hẹn là bắt buộc'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ hẹn không hợp lệ (HH:MM)']
  },
  duration: {
    type: Number,
    default: 30, // phút
    min: [15, 'Thời gian khám tối thiểu 15 phút'],
    max: [180, 'Thời gian khám tối đa 180 phút']
  },
  reason: {
    type: String,
    required: [true, 'Lý do khám là bắt buộc'],
    maxlength: [500, 'Lý do khám không được vượt quá 500 ký tự']
  },
  symptoms: {
    type: String,
    maxlength: [1000, 'Triệu chứng không được vượt quá 1000 ký tự']
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'checkup'],
    default: 'consultation'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Ghi chú không được vượt quá 1000 ký tự']
  },
  fee: {
    type: Number,
    min: [0, 'Phí khám không được âm'],
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'refunded'],
    default: 'pending'
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Tạo mã lịch hẹn tự động
appointmentSchema.pre('save', async function(next) {
  if (!this.appointmentId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Appointment').countDocuments({
      createdAt: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    });
    this.appointmentId = `LH${dateStr}${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Index cho tìm kiếm và hiệu năng
appointmentSchema.index({ appointmentId: 1 });
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ doctor: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1, doctor: 1 });
appointmentSchema.index({ appointmentDate: 1, status: 1 });

// Validation: Không được đặt lịch trùng giờ cho cùng bác sĩ
appointmentSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('appointmentDate') || this.isModified('appointmentTime') || this.isModified('doctor')) {
    const startTime = new Date(`${this.appointmentDate.toISOString().split('T')[0]}T${this.appointmentTime}:00.000Z`);
    const endTime = new Date(startTime.getTime() + this.duration * 60000);
    
    const conflictingAppointment = await mongoose.model('Appointment').findOne({
      _id: { $ne: this._id },
      doctor: this.doctor,
      appointmentDate: {
        $gte: new Date(this.appointmentDate.setHours(0, 0, 0, 0)),
        $lt: new Date(this.appointmentDate.setHours(23, 59, 59, 999))
      },
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] },
      $or: [
        {
          $expr: {
            $and: [
              { $lt: [{ $dateFromString: { dateString: { $concat: [{ $dateToString: { date: '$appointmentDate', format: '%Y-%m-%d' } }, 'T', '$appointmentTime', ':00.000Z'] } } }, endTime] },
              { $gt: [{ $add: [{ $dateFromString: { dateString: { $concat: [{ $dateToString: { date: '$appointmentDate', format: '%Y-%m-%d' } }, 'T', '$appointmentTime', ':00.000Z'] } } }, { $multiply: ['$duration', 60000] }] }, startTime] }
            ]
          }
        }
      ]
    });
    
    if (conflictingAppointment) {
      const error = new Error('Bác sĩ đã có lịch hẹn trong thời gian này');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);

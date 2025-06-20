const Joi = require('joi');

// Validation cho đăng ký user
const validateRegister = (data) => {
  const schema = Joi.object({
    fullName: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'Họ tên là bắt buộc',
      'string.min': 'Họ tên phải có ít nhất 2 ký tự',
      'string.max': 'Họ tên không được vượt quá 100 ký tự'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Email không hợp lệ',
      'string.empty': 'Email là bắt buộc'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
      'string.empty': 'Mật khẩu là bắt buộc'
    }),
    role: Joi.string().valid('admin', 'doctor', 'receptionist').default('receptionist'),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ'
    }),
    address: Joi.string().max(200),
    specialization: Joi.string().max(100),
    licenseNumber: Joi.string().max(50)
  });

  return schema.validate(data);
};

// Validation cho đăng nhập
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email không hợp lệ',
      'string.empty': 'Email là bắt buộc'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Mật khẩu là bắt buộc'
    })
  });

  return schema.validate(data);
};

// Validation cho bệnh nhân
const validatePatient = (data) => {
  const schema = Joi.object({
    fullName: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'Họ tên bệnh nhân là bắt buộc',
      'string.min': 'Họ tên phải có ít nhất 2 ký tự'
    }),
    dateOfBirth: Joi.date().required().messages({
      'date.base': 'Ngày sinh không hợp lệ',
      'any.required': 'Ngày sinh là bắt buộc'
    }),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).required().messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ'
    }),
    email: Joi.string().email().allow(''),
    address: Joi.string().max(500).allow('').messages({
      'string.max': 'Địa chỉ không được vượt quá 500 ký tự'
    }),
    identityCard: Joi.string().pattern(/^[0-9]{9,12}$/).allow(''),
    insuranceNumber: Joi.string().allow(''),
    emergencyContact: Joi.object({
      name: Joi.string().allow(''),
      relationship: Joi.string().allow(''),
      phone: Joi.string().pattern(/^[0-9]{10,11}$/).allow('')
    }),
    bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').allow(''),
    height: Joi.number().min(0).max(300),
    weight: Joi.number().min(0).max(500),
    medicalHistory: Joi.string().max(1000).allow('').messages({
      'string.max': 'Tiền sử bệnh không được vượt quá 1000 ký tự'
    }),
    allergies: Joi.array().items(Joi.string()),
    notes: Joi.string().allow('')
  }).unknown(true); // Cho phép các trường không được định nghĩa

  return schema.validate(data);
};

// Validation cho lịch hẹn
const validateAppointment = (data) => {
  const schema = Joi.object({
    patient: Joi.string().required().messages({
      'string.empty': 'Bệnh nhân là bắt buộc'
    }),
    doctor: Joi.string().required().messages({
      'string.empty': 'Bác sĩ là bắt buộc'
    }),
    appointmentDate: Joi.date().required().messages({
      'date.base': 'Ngày hẹn không hợp lệ',
      'any.required': 'Ngày hẹn là bắt buộc'
    }),
    appointmentTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
      'string.pattern.base': 'Giờ hẹn không hợp lệ (HH:MM)'
    }),
    duration: Joi.number().min(15).max(180).default(30),
    reason: Joi.string().min(5).max(500).required().messages({
      'string.min': 'Lý do khám phải có ít nhất 5 ký tự',
      'string.empty': 'Lý do khám là bắt buộc'
    }),
    symptoms: Joi.string().max(1000).allow(''),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
    type: Joi.string().valid('consultation', 'follow-up', 'emergency', 'checkup').default('consultation'),
    notes: Joi.string().max(1000).allow(''),
    fee: Joi.number().min(0).default(0)
  });

  return schema.validate(data);
};

// Validation cho thuốc
const validateMedicine = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(200).required().messages({
      'string.empty': 'Tên thuốc là bắt buộc'
    }),
    genericName: Joi.string().max(200).allow(''),
    brand: Joi.string().max(100).allow(''),
    category: Joi.string().valid(
      'antibiotic', 'painkiller', 'vitamin', 'antacid', 'antihistamine',
      'antihypertensive', 'diabetes', 'cardiovascular', 'respiratory',
      'dermatology', 'neurology', 'psychiatry', 'other'
    ).required(),
    dosageForm: Joi.string().valid(
      'tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'spray', 'patch', 'other'
    ).required(),
    strength: Joi.string().max(50).required(),
    unit: Joi.string().valid('viên', 'vỉ', 'hộp', 'chai', 'tuýp', 'gói', 'ống', 'lọ').required(),
    manufacturer: Joi.string().max(100).allow(''),
    expiryDate: Joi.date().required(),
    price: Joi.number().min(0).required(),
    costPrice: Joi.number().min(0),
    stock: Joi.object({
      quantity: Joi.number().min(0).required(),
      minQuantity: Joi.number().min(0).default(10),
      maxQuantity: Joi.number().min(0)
    }),
    usage: Joi.object({
      indications: Joi.array().items(Joi.string()),
      contraindications: Joi.array().items(Joi.string()),
      sideEffects: Joi.array().items(Joi.string()),
      interactions: Joi.array().items(Joi.string()),
      dosageInstructions: Joi.string().allow(''),
      precautions: Joi.string().allow('')
    }),
    prescription: Joi.object({
      required: Joi.boolean().default(false),
      controlled: Joi.boolean().default(false)
    }),
    tags: Joi.array().items(Joi.string()),
    notes: Joi.string().allow('')
  });

  return schema.validate(data);
};

// Middleware validation
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

module.exports = {
  validateRegister,
  validateLogin,
  validatePatient,
  validateAppointment,
  validateMedicine,
  validate
};

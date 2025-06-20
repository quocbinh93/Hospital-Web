const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Patient = require('../models/Patient');
const Medicine = require('../models/Medicine');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Xóa users cũ
    await User.deleteMany({});

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);

    const users = [
      {
        fullName: 'Quản trị viên Hệ thống',
        email: 'admin@clinic.com',
        password: hashedPassword,
        role: 'admin',
        phone: '0123456789',
        address: 'Hà Nội, Việt Nam',
        isActive: true,
      },
      {
        fullName: 'Bác sĩ Nguyễn Văn A',
        email: 'doctor@clinic.com',
        password: hashedPassword,
        role: 'doctor',
        phone: '0987654321',
        address: 'TP.HCM, Việt Nam',
        specialization: 'Nội khoa',
        licenseNumber: 'BS001',
        isActive: true,
      },
      {
        fullName: 'Lễ tân Trần Thị B',
        email: 'receptionist@clinic.com',
        password: hashedPassword,
        role: 'receptionist',
        phone: '0234567890',
        address: 'Đà Nẵng, Việt Nam',
        isActive: true,
      },
    ];

    await User.insertMany(users);
    console.log('✅ Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

const seedPatients = async () => {
  try {
    // Xóa patients cũ
    await Patient.deleteMany({});

    const admin = await User.findOne({ role: 'admin' });

    const patients = [
      {
        patientId: 'PT000001',
        fullName: 'Lê Văn C',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'male',
        phone: '0345678901',
        email: 'levancl@email.com',
        address: 'Số 123, Đường ABC, Quận 1, TP.HCM',
        identityCard: '123456789',
        bloodType: 'O+',
        allergies: ['Penicillin'],
        medicalHistory: 'Không có tiền sử bệnh đặc biệt',
        createdBy: admin._id,
      },
      {
        patientId: 'PT000002',
        fullName: 'Phạm Thị D',
        dateOfBirth: new Date('1985-12-20'),
        gender: 'female',
        phone: '0456789012',
        email: 'phamthid@email.com',
        address: 'Số 456, Đường XYZ, Quận 3, TP.HCM',
        identityCard: '987654321',
        bloodType: 'A+',
        allergies: [],
        medicalHistory: 'Tiểu đường type 2',
        createdBy: admin._id,
      },
    ];

    await Patient.insertMany(patients);
    console.log('✅ Patients seeded successfully');
  } catch (error) {
    console.error('Error seeding patients:', error);
  }
};

const seedMedicines = async () => {
  try {
    // Xóa medicines cũ
    await Medicine.deleteMany({});

    const admin = await User.findOne({ role: 'admin' });

    const medicines = [
      {
        name: 'Paracetamol 500mg',
        genericName: 'Paracetamol',
        brand: 'Tylenol',
        strength: '500mg',
        dosageForm: 'tablet',
        category: 'painkiller',
        unit: 'viên',
        description: 'Thuốc giảm đau, hạ sốt',
        price: 2000,
        costPrice: 1500,
        stock: {
          quantity: 1000,
          minQuantity: 100,
          unit: 'viên',
        },
        expiryDate: new Date('2025-12-31'),
        manufacturer: 'Công ty dược phẩm ABC',
        tags: ['giảm đau', 'hạ sốt'],
        createdBy: admin._id,
      },
      {
        name: 'Amoxicillin 250mg',
        genericName: 'Amoxicillin',
        brand: 'Amoxil',
        strength: '250mg',
        dosageForm: 'capsule',
        category: 'antibiotic',
        unit: 'viên',
        description: 'Kháng sinh beta-lactam',
        price: 5000,
        costPrice: 3500,
        stock: {
          quantity: 500,
          minQuantity: 50,
          unit: 'viên',
        },
        expiryDate: new Date('2025-08-30'),
        manufacturer: 'Công ty dược phẩm XYZ',
        tags: ['kháng sinh', 'nhiễm khuẩn'],
        createdBy: admin._id,
      },
    ];

    await Medicine.insertMany(medicines);
    console.log('✅ Medicines seeded successfully');
  } catch (error) {
    console.error('Error seeding medicines:', error);
  }
};

const main = async () => {
  console.log('🌱 Bắt đầu khởi tạo dữ liệu mẫu...');
  
  await connectDB();
  
  await seedUsers();
  await seedPatients();
  await seedMedicines();
  
  console.log('🎉 Khởi tạo dữ liệu mẫu hoàn tất!');
  console.log('');
  console.log('Tài khoản đăng nhập:');
  console.log('Admin: admin@clinic.com / password123');
  console.log('Bác sĩ: doctor@clinic.com / password123');
  console.log('Lễ tân: receptionist@clinic.com / password123');
  
  process.exit(0);
};

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

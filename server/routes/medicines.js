const express = require('express');
const Medicine = require('../models/Medicine');
const { auth, authorize } = require('../middleware/auth');
const { validate, validateMedicine } = require('../middleware/validation');

const router = express.Router();

// Lấy danh sách thuốc
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      dosageForm,
      lowStock,
      expired,
      expiringSoon,
      isActive = true 
    } = req.query;
    
    const query = { isActive };
    
    // Search theo tên, tên hoạt chất, thương hiệu
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Filter theo phân loại
    if (category) {
      query.category = category;
    }
    
    // Filter theo dạng bào chế
    if (dosageForm) {
      query.dosageForm = dosageForm;
    }
    
    // Filter thuốc sắp hết
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock.quantity', '$stock.minQuantity'] };
    }
    
    // Filter thuốc hết hạn
    if (expired === 'true') {
      query.expiryDate = { $lt: new Date() };
    }
    
    // Filter thuốc sắp hết hạn (30 ngày)
    if (expiringSoon === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      query.expiryDate = { 
        $gte: new Date(),
        $lte: thirtyDaysFromNow 
      };
    }

    const medicines = await Medicine.find(query)
      .populate('createdBy', 'fullName')
      .populate('updatedBy', 'fullName')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Medicine.countDocuments(query);

    res.json({
      success: true,
      data: {
        medicines,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: medicines.length,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách thuốc',
      error: error.message
    });
  }
});

// Lấy thông tin thuốc theo ID
router.get('/:id', auth, async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id)
      .populate('createdBy', 'fullName role')
      .populate('updatedBy', 'fullName role');
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuốc'
      });
    }

    res.json({
      success: true,
      data: {
        medicine
      }
    });
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin thuốc',
      error: error.message
    });
  }
});

// Tạo thuốc mới
router.post('/', auth, authorize('admin', 'doctor'), validate(validateMedicine), async (req, res) => {
  try {
    const medicineData = {
      ...req.body,
      createdBy: req.user._id
    };

    const medicine = new Medicine(medicineData);
    await medicine.save();

    await medicine.populate('createdBy', 'fullName role');

    res.status(201).json({
      success: true,
      message: 'Tạo thuốc mới thành công',
      data: {
        medicine
      }
    });
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo thuốc mới',
      error: error.message
    });
  }
});

// Cập nhật thông tin thuốc
router.put('/:id', auth, authorize('admin', 'doctor'), validate(validateMedicine), async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'createdBy', select: 'fullName role' },
      { path: 'updatedBy', select: 'fullName role' }
    ]);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuốc'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật thuốc thành công',
      data: {
        medicine
      }
    });
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật thuốc',
      error: error.message
    });
  }
});

// Cập nhật số lượng tồn kho
router.patch('/:id/stock', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { quantity, type } = req.body; // type: 'add' | 'subtract' | 'set'
    
    if (!quantity || !type) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng và loại cập nhật là bắt buộc'
      });
    }

    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuốc'
      });
    }

    let newQuantity = medicine.stock.quantity;
    
    switch (type) {
      case 'add':
        newQuantity += parseInt(quantity);
        break;
      case 'subtract':
        newQuantity -= parseInt(quantity);
        break;
      case 'set':
        newQuantity = parseInt(quantity);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Loại cập nhật không hợp lệ'
        });
    }

    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng tồn kho không thể âm'
      });
    }

    medicine.stock.quantity = newQuantity;
    medicine.updatedBy = req.user._id;
    await medicine.save();

    res.json({
      success: true,
      message: 'Cập nhật tồn kho thành công',
      data: {
        medicine
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật tồn kho',
      error: error.message
    });
  }
});

// Vô hiệu hóa thuốc
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuốc'
      });
    }

    res.json({
      success: true,
      message: 'Vô hiệu hóa thuốc thành công'
    });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi vô hiệu hóa thuốc',
      error: error.message
    });
  }
});

// Khôi phục thuốc
router.patch('/:id/restore', auth, authorize('admin'), async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: true,
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thuốc'
      });
    }

    res.json({
      success: true,
      message: 'Khôi phục thuốc thành công',
      data: {
        medicine
      }
    });
  } catch (error) {
    console.error('Restore medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khôi phục thuốc',
      error: error.message
    });
  }
});

// Lấy danh sách thuốc cho dropdown/autocomplete
router.get('/search/quick', auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: {
          medicines: []
        }
      });
    }

    const medicines = await Medicine.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { genericName: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    })
    .select('name genericName strength dosageForm price stock.quantity unit')
    .limit(20)
    .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        medicines
      }
    });
  } catch (error) {
    console.error('Quick search medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tìm kiếm thuốc',
      error: error.message
    });
  }
});

// Lấy danh sách thuốc cảnh báo (hết hạn, sắp hết, tồn kho thấp)
router.get('/alerts/overview', auth, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const [
      expiredMedicines,
      expiringSoonMedicines,
      lowStockMedicines
    ] = await Promise.all([
      // Thuốc hết hạn
      Medicine.find({
        isActive: true,
        expiryDate: { $lt: now }
      })
      .select('name expiryDate stock.quantity')
      .sort({ expiryDate: 1 }),

      // Thuốc sắp hết hạn (30 ngày)
      Medicine.find({
        isActive: true,
        expiryDate: { 
          $gte: now,
          $lte: thirtyDaysFromNow 
        }
      })
      .select('name expiryDate stock.quantity')
      .sort({ expiryDate: 1 }),

      // Thuốc tồn kho thấp
      Medicine.find({
        isActive: true,
        $expr: { $lte: ['$stock.quantity', '$stock.minQuantity'] }
      })
      .select('name stock')
      .sort({ 'stock.quantity': 1 })
    ]);

    res.json({
      success: true,
      data: {
        expired: expiredMedicines,
        expiringSoon: expiringSoonMedicines,
        lowStock: lowStockMedicines
      }
    });
  } catch (error) {
    console.error('Get medicine alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy cảnh báo thuốc',
      error: error.message
    });
  }
});

// Thống kê thuốc
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const [
      totalMedicines,
      activeMedicines,
      categoryStats,
      stockValue,
      lowStockCount,
      expiredCount
    ] = await Promise.all([
      Medicine.countDocuments(),
      Medicine.countDocuments({ isActive: true }),
      
      Medicine.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]),
      
      Medicine.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalValue: {
              $sum: { $multiply: ['$stock.quantity', '$costPrice'] }
            }
          }
        }
      ]),
      
      Medicine.countDocuments({
        isActive: true,
        $expr: { $lte: ['$stock.quantity', '$stock.minQuantity'] }
      }),
      
      Medicine.countDocuments({
        isActive: true,
        expiryDate: { $lt: new Date() }
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalMedicines,
        active: activeMedicines,
        inactive: totalMedicines - activeMedicines,
        byCategory: categoryStats,
        stockValue: stockValue[0]?.totalValue || 0,
        lowStock: lowStockCount,
        expired: expiredCount
      }
    });
  } catch (error) {
    console.error('Get medicine stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê thuốc',
      error: error.message
    });
  }
});

module.exports = router;

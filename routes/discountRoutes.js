const express = require('express');
const {
    getAllDiscounts,
    getDiscountById,
    addDiscount,
    updateDiscount,
    deleteDiscount
} = require('../controllers/discountController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Lấy tất cả giảm giá
router.get('/', getAllDiscounts);
// Thêm giảm giá mới (chỉ admin)
router.post('/add', protect, admin, addDiscount);

// Lấy chi tiết giảm giá theo ID
router.get('/:id', getDiscountById);



// Cập nhật giảm giá (chỉ admin)
router.put('/:id', protect, admin, updateDiscount);

// Xóa giảm giá (chỉ admin)
router.delete('/:id', protect, admin, deleteDiscount);

module.exports = router;

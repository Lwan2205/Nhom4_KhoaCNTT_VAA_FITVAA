const express = require('express');
const {
    getAllCategories,
    getCategoryById,
    addCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Lấy tất cả danh mục
router.get('/', getAllCategories);

// Lấy chi tiết danh mục theo ID
router.get('/:id', getCategoryById);

// Thêm danh mục mới (chỉ admin)
router.post('/add', protect, admin, addCategory);

// Cập nhật danh mục (chỉ admin)
router.put('/:id', protect, admin, updateCategory);

// Xóa danh mục (chỉ admin)
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;

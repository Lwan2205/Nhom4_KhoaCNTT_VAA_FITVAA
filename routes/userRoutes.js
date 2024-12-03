const express = require('express');
const {
    getUserProfile,
    updateUserProfile,
    changePassword,
    getAllUsers,
    deleteUser,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Lấy thông tin hồ sơ cá nhân
router.get('/profile', protect, getUserProfile);

// Cập nhật hồ sơ cá nhân
router.put('/profile', protect, updateUserProfile);

// Thay đổi mật khẩu
router.put('/change-password', protect, changePassword);

// Lấy danh sách tất cả người dùng (Admin)
router.get('/admin/users', protect, admin, getAllUsers);

// Xóa người dùng (Admin)
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;

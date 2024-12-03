const express = require('express');
const {
    getAllManufacturers,
    getManufacturerById,
    addManufacturer,
    updateManufacturer,
    deleteManufacturer,
    getFavoriteManufacturersBySales
} = require('../controllers/manufacturerController');
const { protect, admin } = require('../middleware/authMiddleware');
const cloudinaryFileUploader = require('../middleware/FileUploader'); // Import Cloudinary FileUploader

const router = express.Router();

// Các route cho nhà sản xuất

// Lấy tất cả nhà sản xuất
router.get('/', getAllManufacturers);

// Lấy nhà sản xuất yêu thích
router.get('/favourite-brand', getFavoriteManufacturersBySales);

// Lấy chi tiết nhà sản xuất theo ID
router.get('/:id', getManufacturerById);

// Thêm nhà sản xuất mới (chỉ admin) và hỗ trợ upload ảnh
router.post('/add', protect, admin, cloudinaryFileUploader.single('image'), addManufacturer);

// Cập nhật nhà sản xuất (chỉ admin) và hỗ trợ upload ảnh
router.put('/:id', protect, admin, cloudinaryFileUploader.single('image'), updateManufacturer);

// Xóa nhà sản xuất (chỉ admin)
router.delete('/:id', protect, admin, deleteManufacturer);

module.exports = router;

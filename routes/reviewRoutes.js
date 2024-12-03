const express = require('express');
const {
    addReview,
    getProductReviews,
    updateReview,
    deleteReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Thêm đánh giá mới
router.post('/add', addReview);

// Lấy tất cả đánh giá của một sản phẩm
router.get('/:productId', getProductReviews);

// Cập nhật đánh giá
router.put('/:id', protect, updateReview);

// Xóa đánh giá
router.delete('/:id', protect, deleteReview);

module.exports = router;

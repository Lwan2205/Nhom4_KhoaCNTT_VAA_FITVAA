const express = require('express');
const {
    getUserCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart,
    countAddToCartProduct
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Lấy giỏ hàng của người dùng
router.get('/', protect, getUserCart);

// Thêm sản phẩm vào giỏ hàng
router.post('/add', protect, addToCart);

//dem so luong san pham
router.get('/count', protect, countAddToCartProduct)

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/update', protect, updateCart);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/remove/:productId/:size', protect, removeFromCart);

// Xóa toàn bộ giỏ hàng
router.delete('/clear', protect, clearCart);

module.exports = router;

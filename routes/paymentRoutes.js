const express = require('express');
const { payment, paymentReturn } = require('../controllers/payment')
const {
    createPayment,
    getPaymentByOrderId,
    updatePaymentStatus
} = require('../controllers/paymentController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Tạo bản ghi thanh toán mới
router.post('/add', protect, createPayment);

router.post('/create_payment', payment)

router.get('/vnpay_return', paymentReturn)

// Lấy chi tiết thanh toán theo ID đơn hàng
router.get('/:orderId', protect, getPaymentByOrderId);

// Cập nhật trạng thái thanh toán
router.put('/:id', protect, updatePaymentStatus);

module.exports = router;

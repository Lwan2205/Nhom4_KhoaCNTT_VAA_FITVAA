const Payment = require('../../backend/model/payment');
const Order = require('../../backend/model/order');

// Tạo bản ghi thanh toán mới
const createPayment = async (req, res) => {
    const { orderId, paymentMethod } = req.body;

    if (!orderId || !paymentMethod) {
        return res.status(400).json({ message: 'Order ID and payment method are required' });
    }

    try {
        // Kiểm tra xem đơn hàng có tồn tại không
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Tạo bản ghi thanh toán mới
        const payment = new Payment({
            orderId,
            paymentMethod,
        });

        const createdPayment = await payment.save();
        res.status(201).json(createdPayment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy chi tiết thanh toán theo ID đơn hàng
const getPaymentByOrderId = async (req, res) => {
    try {
        const payment = await Payment.findOne({ orderId: req.params.orderId });
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật trạng thái thanh toán
const updatePaymentStatus = async (req, res) => {
    const { paymentStatus } = req.body;

    if (!paymentStatus) {
        return res.status(400).json({ message: 'Payment status is required' });
    }

    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Cập nhật trạng thái thanh toán
        payment.paymentStatus = paymentStatus;
        const updatedPayment = await payment.save();
        res.status(200).json(updatedPayment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPayment,
    getPaymentByOrderId,
    updatePaymentStatus,
};

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },  // Đơn hàng được thanh toán
    paymentMethod: { type: String, required: true },  // Phương thức thanh toán (Online, COD)
    paymentStatus: { type: String, default: 'Pending' },  // Trạng thái thanh toán (Pending, Completed, Failed)
    paymentDate: { type: Date, default: Date.now },      // Ngày thanh toán
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;

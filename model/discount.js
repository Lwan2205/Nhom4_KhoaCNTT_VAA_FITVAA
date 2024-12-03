const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    code: { type: String, required: true },
    discountPercent: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
}, { timestamps: true });

const Discount = mongoose.model('Discount', discountSchema);
module.exports = Discount;
    
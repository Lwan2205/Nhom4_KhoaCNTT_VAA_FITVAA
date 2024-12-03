const mongoose = require('mongoose');

const manufacturerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    country: { type: String },
    contactInfo: { type: String },
    // isFavorite: { type: Boolean, default: false },
    salesCount: { type: Number, default: 0 }, // Thêm trường salesCount
    images: { type: String }, // Thêm trường image để lưu URL hình ảnh
}, { timestamps: true });

const Manufacturer = mongoose.model('Manufacturer', manufacturerSchema);
module.exports = Manufacturer;

const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    size: { type: String, required: true, enum: ['S', 'M', 'L', 'XL'] },  // Dùng enum để giới hạn các size
    // color: { type: String, required: true, enum: ['black', 'white', 'red', 'yellow'] },  // Dùng enum để giới hạn các màu
    stock: { type: Number, required: true, default: 0 }  // Số lượng tồn kho cho từng biến thể
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    description: { type: String },
    price: { type: Number, required: true },
    discount: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
    images: { type: String },
    rating: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    totalSold: { type: Number, default: 0 },  // Tổng số lượng đã bán
    variants: [variantSchema],  // Thêm mảng variants để lưu trữ các biến thể của sản phẩm
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;

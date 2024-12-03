const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    description: { type: String },
    isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;

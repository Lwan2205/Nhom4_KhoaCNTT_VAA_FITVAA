const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    username: { type: String, },
    email: { type: String },
    address: { type: String },
    feedBack: { type: String }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
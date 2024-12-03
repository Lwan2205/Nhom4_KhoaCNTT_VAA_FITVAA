const Review = require('../../backend/model/review');
const Product = require('../../backend/model/product');

// Thêm đánh giá mới
const addReview = async (req, res) => {
    const { username, email, address, feedBack } = req.body;



    try {


        // Tạo đánh giá mới
        const review = new Review({
            username,
            email,
            address,
            feedBack // Người dùng đã đăng nhập  
        });

        const createdReview = await review.save();
        res.status(201).json(createdReview);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy tất cả đánh giá của một sản phẩm
const getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId })
            .populate('userId', 'name')  // Lấy thêm thông tin người đánh giá (nếu cần)
            .sort({ createdAt: -1 });   // Sắp xếp theo thời gian đánh giá mới nhất
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật đánh giá
const updateReview = async (req, res) => {
    const { rating, comment } = req.body;

    if (!rating) {
        return res.status(400).json({ message: 'Rating is required' });
    }

    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Kiểm tra xem người dùng có phải là người đã viết đánh giá này không
        if (review.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to update this review' });
        }

        // Cập nhật đánh giá
        review.rating = rating;
        review.comment = comment || review.comment;

        const updatedReview = await review.save();
        res.status(200).json(updatedReview);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa đánh giá
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Kiểm tra xem người dùng có phải là người đã viết đánh giá này không
        if (review.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to delete this review' });
        }

        await review.remove();
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addReview,
    getProductReviews,
    updateReview,
    deleteReview,
};

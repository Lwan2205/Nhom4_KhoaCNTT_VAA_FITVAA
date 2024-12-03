const Cart = require('../../backend/model/cart');
const Product = require('../../backend/model/product');

// Lấy giỏ hàng của người dùng
const getUserCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id })
            .populate({
                path: 'products.productId', // Lấy thông tin từ `productId` trong `products`
                select: 'name price images discount origin', // Lấy các trường cần thiết từ `Product`
                populate: {
                    path: 'discount', // Populate tiếp `discount` từ `Product`
                    select: 'discountPercent' // Chỉ lấy `discountPercent` từ `Discount`
                }
            });

        if (!cart) {
            return res.status(404).json({ message: 'Giỏ hàng không tìm thấy' });
        }

        res.status(200).json({ data: cart, success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
    const { productId, quantity, size } = req.body;

    if (!productId || !quantity || !size) {
        return res.status(400).json({ message: 'Product ID, quantity, and size are required' });
    }

    try {
        // Lấy thông tin sản phẩm từ ProductId
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }

        // Kiểm tra xem size có tồn tại trong variants không
        const variant = product.variants.find(v => v.size === size);
        if (!variant) {
            return res.status(400).json({ message: 'Size chọn không có sẵn cho sản phẩm này' });
        }

        // Kiểm tra tồn kho
        if (quantity > variant.stock) {
            return res.status(400).json({ message: 'Tồn kho không đủ cho size đã chọn' });
        }

        // Kiểm tra giỏ hàng của người dùng
        let cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            // Nếu giỏ hàng chưa tồn tại, tạo mới
            cart = new Cart({
                userId: req.user._id,
                products: [],
            });
        }

        // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
        const existingProductIndex = cart.products.findIndex(
            (item) => item.productId.toString() === productId && item.size === size
        );

        if (existingProductIndex > -1) {
            // Nếu sản phẩm đã có trong giỏ hàng, cập nhật số lượng
            const newQuantity = cart.products[existingProductIndex].quantity + quantity;
            if (newQuantity > variant.stock) {
                return res.status(400).json({ message: 'Tồn kho không đủ sau khi cập nhật' });
            }
            cart.products[existingProductIndex].quantity = newQuantity;
        } else {
            // Nếu sản phẩm chưa có, thêm mới
            cart.products.push({
                productId,
                quantity,
                size,
            });
        }

        // Lưu giỏ hàng
        await cart.save();
        res.status(200).json({ success: true, message: 'Sản phẩm đã được thêm vào giỏ hàng', data: cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Không thể thêm sản phẩm vào giỏ hàng', error: error.message });
    }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
const updateCart = async (req, res) => {
    const { productId, quantity, size } = req.body;

    if (!productId || !quantity || !size) {
        return res.status(400).json({ message: 'Product ID, quantity, and size are required' });
    }

    try {
        // Tìm sản phẩm trong cơ sở dữ liệu để kiểm tra tồn kho
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }

        // Kiểm tra variant tồn tại và kiểm tra số lượng
        const variant = product.variants.find(v => v.size === size);
        if (!variant) {
            return res.status(400).json({ message: 'Size chọn không có sẵn cho sản phẩm này' });
        }

        if (quantity > variant.stock) {
            return res.status(400).json({ message: 'Số lượng yêu cầu vượt quá tồn kho' });
        }

        // Tìm giỏ hàng của người dùng
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Giỏ hàng không tìm thấy' });
        }

        // Tìm sản phẩm trong giỏ hàng
        const productIndex = cart.products.findIndex(p => p.productId.toString() === productId && p.size === size);

        if (productIndex > -1) {
            // Nếu sản phẩm tồn tại, cập nhật số lượng
            cart.products[productIndex].quantity = quantity;
            await cart.save();
            res.status(200).json({ data: cart, success: true });
        } else {
            // Nếu sản phẩm không có trong giỏ hàng
            res.status(404).json({ message: 'Sản phẩm không có trong giỏ hàng' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa sản phẩm khỏi giỏ hàng
const removeFromCart = async (req, res) => {
    const { productId, size } = req.params;

    try {
        // Tìm giỏ hàng của người dùng
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Giỏ hàng không tìm thấy' });
        }

        // Loại bỏ sản phẩm khỏi giỏ hàng
        cart.products = cart.products.filter(p => p.productId.toString() !== productId || p.size !== size);

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa toàn bộ giỏ hàng của người dùng
const clearCart = async (req, res) => {
    try {
        // Tìm giỏ hàng của người dùng
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Giỏ hàng không tìm thấy' });
        }

        // Xóa toàn bộ sản phẩm trong giỏ hàng
        cart.products = [];

        await cart.save();
        res.status(200).json({ message: 'Giỏ hàng đã được xóa', success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Đếm số lượng sản phẩm trong giỏ hàng
const countAddToCartProduct = async (req, res) => {
    try {
        const userId = req.user._id;

        // Tìm giỏ hàng của user
        const cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            return res.json({
                data: {
                    count: 0
                },
                message: "Không có sản phẩm nào trong giỏ hàng",
                error: false,
                success: true
            });
        }

        // Đếm số lượng sản phẩm khác nhau
        const uniqueProductCount = cart.products.length;

        res.json({
            data: {
                count: uniqueProductCount
            },
            message: "OK",
            error: false,
            success: true
        });
    } catch (error) {
        res.json({
            message: error.message || error,
            error: true,
            success: false,
        });
    }
};

module.exports = {
    getUserCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart,
    countAddToCartProduct
};

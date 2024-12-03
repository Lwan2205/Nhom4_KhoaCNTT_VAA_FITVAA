const Product = require('../../backend/model/product');
const Category = require('../../backend/model/category');
const Discount = require('../../backend/model/discount');
const Manufacturer = require('../../backend/model/manufacturer');
const mongoose = require('mongoose');

// Lấy tất cả sản phẩm
// Lấy tất cả sản phẩm
const getAllProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Trang hiện tại (mặc định là 1)
    const limit = parseInt(req.query.limit) || 6; // Số sản phẩm mỗi trang (mặc định là 6)
    try {
        const skip = (page - 1) * limit;
        const products = await Product.find({})
            .skip(skip)
            .limit(limit)
            .populate('category', 'name')
            .populate('discount', 'name discountPercent')
            .populate('manufacturer', 'name');

        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        // Cập nhật trả về thông tin về variants (size và stock)
        const productsWithVariants = products.map(product => ({
            ...product.toObject(),
            variants: product.variants.map(variant => ({
                size: variant.size,
                stock: variant.stock
            }))
        }));

        res.status(200).json({
            products: productsWithVariants,
            success: true,
            currentPage: page,
            totalPages: totalPages
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




// Lấy chi tiết sản phẩm theo ID
// Lấy chi tiết sản phẩm theo ID
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
            .populate('discount', 'code discountPercent')
            .populate('manufacturer', 'name country');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Trả về thêm thông tin variants (size và stock)
        const productWithVariants = {
            ...product.toObject(),
            variants: product.variants.map(variant => ({
                size: variant.size,
                stock: variant.stock
            }))
        };

        res.status(200).json({ data: productWithVariants, success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getProductsByCategoryId = async (req, res) => {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1; // Trang hiện tại (mặc định là 1)
    const limit = parseInt(req.query.limit) || 1; // Số sản phẩm mỗi trang (mặc định là 6)

    try {
        const skip = (page - 1) * limit;

        // Truy vấn để lấy dữ liệu với phân trang
        const products = await Product.find({ category: categoryId })
            .skip(skip)
            .limit(limit)
            .select('description images price name category');

        const totalProducts = await Product.countDocuments({ category: categoryId });
        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
            success: true,
            data: products,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getProductsByBrandId = async (req, res) => {
    try {
        const brandId = req.params.brandId;
        const page = parseInt(req.query.page) || 1; // Trang hiện tại (mặc định là 1)
        const limit = parseInt(req.query.limit) || 6; // Số sản phẩm mỗi trang (mặc định là 6)
        const skip = (page - 1) * limit;

        // Lấy sản phẩm theo `brandId` với phân trang
        const products = await Product.find({ manufacturer: brandId })
            .skip(skip)
            .limit(limit)
            .select('description images price name category');

        // Tổng số sản phẩm để tính tổng số trang
        const totalProducts = await Product.countDocuments({ manufacturer: brandId });
        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
            success: true,
            data: products,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const addProduct = async (req, res) => {
    let {
        name, category, description, price, discount, stock, manufacturer, rating, isFeatured, variants
    } = req.body;

    // Kiểm tra và parse variants nếu nó là chuỗi JSON
    if (typeof variants === 'string') {
        try {
            variants = JSON.parse(variants);
        } catch (error) {
            return res.status(400).json({ message: 'Invalid variants data' });
        }
    }

    // Đảm bảo variants là mảng hợp lệ và stock là số
    const validVariants = variants.map(variant => ({
        ...variant,
        stock: Number(variant.stock)  // Chuyển stock thành số
    }));

    if (!name || !category || !price) {
        return res.status(400).json({ message: 'Name, category, and price are required' });
    }

    try {
        const foundCategory = await Category.findById(category);
        const foundManufacturer = await Manufacturer.findById(manufacturer);
        if (!foundCategory || !foundManufacturer) {
            return res.status(400).json({ message: 'Invalid category or manufacturer' });
        }

        if (discount) {
            const foundDiscount = await Discount.findById(discount);
            if (!foundDiscount) {
                return res.status(400).json({ message: 'Invalid discount' });
            }
        }

        const product = new Product({
            name,
            category,
            description,
            price,
            discount: discount || null,
            stock: stock || 0,
            manufacturer,
            rating: rating || 0,
            isFeatured: isFeatured || false,
            variants: validVariants, // Đảm bảo variants là mảng và stock là số
            images: req.file ? req.file.path : '',
        });

        const createdProduct = await product.save();
        res.status(201).json({ data: createdProduct, success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};







// Cập nhật sản phẩm theo ID
const updateProduct = async (req, res) => {
    const {
        name, category, description, price, discount,
        stock, manufacturer, rating, isFeatured, variants
    } = req.body;

    try {
        // Tìm sản phẩm theo ID
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Kiểm tra và parse variants nếu nó là chuỗi JSON
        let parsedVariants = variants;
        if (typeof variants === 'string') {
            try {
                parsedVariants = JSON.parse(variants);
            } catch (error) {
                return res.status(400).json({ message: 'Invalid variants data' });
            }
        }

        // Đảm bảo variants là mảng hợp lệ và stock là số
        const validVariants = parsedVariants.map(variant => ({
            ...variant,
            stock: Number(variant.stock)  // Chuyển stock thành số
        }));

        // Cập nhật các trường khác
        product.name = name || product.name;
        product.category = category || product.category;
        product.description = description || product.description;
        product.price = price || product.price;
        product.discount = discount || product.discount;
        product.stock = stock || product.stock;
        product.manufacturer = manufacturer || product.manufacturer;
        product.rating = rating || product.rating;
        product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;

        // Cập nhật variants mới
        product.variants = validVariants;

        // Cập nhật ảnh nếu có ảnh mới trong request
        if (req.file) {
            product.images = req.file.path; // Cập nhật URL ảnh nếu có
        }

        // Lưu sản phẩm đã cập nhật
        const updatedProduct = await product.save();
        res.status(200).json({ data: updatedProduct, success: true });
    } catch (error) {
        console.error(error);  // Ghi lỗi để debug
        res.status(500).json({ message: error.message });
    }
};





// Xóa sản phẩm theo ID
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Tìm sản phẩm theo tên category
// Tìm sản phẩm theo tên category
const getProductsByCategoryName = async (req, res) => {
    try {
        const searchTerm = req.query.name;


        // Kiểm tra nếu từ khóa tìm kiếm không hợp lệ
        if (!searchTerm || searchTerm.trim() === '') {
            return res.status(400).json({ success: false, message: 'Search term is required' });
        }

        // Tìm category theo tên
        const category = await Category.findOne({ name: { $regex: searchTerm, $options: 'i' } });

        let products = [];
        if (category) {
            // Nếu tìm thấy category, tìm các sản phẩm trong category đó
            products = await Product.find({ category: category._id })
                .select('description images price name')
                .populate('category', 'name');
        }

        // Tìm thêm sản phẩm theo tên sản phẩm
        const productsByName = await Product.find({ name: { $regex: searchTerm, $options: 'i' } })
            .select('description images price name')
            .populate('category', 'name');

        // Kết hợp kết quả (loại bỏ trùng lặp nếu cần)
        products = [...products, ...productsByName];

        // Loại bỏ các sản phẩm trùng lặp (nếu cần)
        products = products.filter((product, index, self) =>
            index === self.findIndex((p) => p._id.toString() === product._id.toString())
        );

        if (products.length === 0) {
            return res.status(200).json({ success: true, message: 'No products found for this search term', data: [] });
        }

        res.status(200).json({ success: true, data: products });
    } catch (error) {
        console.error('Error fetching products by category or product name:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
const getProductDiscount = async (req, res) => {
    try {
        // Tìm các sản phẩm có discount không null
        const products = await Product.find({ discount: { $exists: true, $ne: null } })
            .populate('discount', 'name discountPercent') // Populate để lấy thông tin từ collection Discount
            .sort({ totalSold: -1 }) // Sắp xếp theo số lượng bán giảm dần
            .limit(5); // Giới hạn số lượng sản phẩm trả về (ví dụ: 5)

        // Nếu không có sản phẩm nào, trả về thông báo
        if (!products || products.length === 0) {
            return res.status(404).json({ success: false, message: 'No products with discounts found.' });
        }

        // Trả về danh sách sản phẩm
        res.status(200).json({ success: true, products });

    } catch (error) {
        console.error('Error fetching products with discounts:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
const getRelatedProduct = async (req, res) => {
    const { productId } = req.params;

    try {
        // Find the product by its ID
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }

        // Lấy các sản phẩm liên quan dựa trên cùng category
        const relatedProducts = await Product.find({
            _id: { $ne: productId },  // Đảm bảo không lấy chính sản phẩm hiện tại
            category: product.category // Lọc sản phẩm cùng category
        }).limit(6); // Giới hạn số lượng sản phẩm liên quan

        res.json({ success: true, data: relatedProducts });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy sản phẩm liên quan' });
    }
};
const getAllProductDiscount = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Trang hiện tại (mặc định là 1)
    const limit = parseInt(req.query.limit) || 1; // Số sản phẩm mỗi trang (mặc định là 6)
    try {
        const skip = (page - 1) * limit;
        // Tìm các sản phẩm có discount không null
        const products = await Product.find({ discount: { $exists: true, $ne: null } })
            .skip(skip)
            .limit(limit)
            .populate('discount', 'name discountPercent') // Populate để lấy thông tin từ collection Discount

        const totalProducts = await Product.countDocuments()
        const totalPages = Math.ceil(totalProducts / limit)

        // Nếu không có sản phẩm nào, trả về thông báo
        if (!products || products.length === 0) {
            return res.status(404).json({ success: false, message: 'No products with discounts found.' });
        }

        // Trả về danh sách sản phẩm
        res.status(200).json({
            success: true, products, currentPage: page,
            totalPages: totalPages
        });

    } catch (error) {
        console.error('Error fetching products with discounts:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategoryId,
    getProductsByCategoryName,
    getProductsByBrandId,
    getProductDiscount,
    getRelatedProduct,
    getAllProductDiscount
};

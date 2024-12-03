const Order = require('../../backend/model/order');
const Product = require('../../backend/model/product');
const Payment = require('../../backend/model/payment');
const Cart = require('../../backend/model/cart');
const Manufacturer = require('../../backend/model/manufacturer')
const axios = require('axios');
const crypto = require('crypto');
const querystring = require('qs');
const express = require('express');
const moment = require('moment');
require('dotenv').config();
const sha256 = require('sha256');

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}
// Tạo đơn hàng không cần giỏ hàng
const createOrderWithoutCart = async (req, res) => {
    const { products, address, paymentMethod } = req.body;

    if (!products || products.length === 0) {
        return res.status(400).json({ message: 'No products in the order' });
    }

    if (!address) {
        return res.status(400).json({ message: 'Address is required' });
    }

    try {
        let totalAmount = 0;

        // Tính tổng giá trị đơn hàng dựa trên giá sản phẩm và số lượng
        const productDetails = await Promise.all(
            products.map(async item => {
                const product = await Product.findById(item.productId);
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }
                totalAmount += product.price * item.quantity;
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    price: product.price,
                };
            })
        );

        // Tạo đơn hàng mới
        const order = new Order({
            userId: req.user._id,
            products: productDetails,
            totalAmount,
            address,
            paymentMethod: paymentMethod || 'COD',  // Phương thức thanh toán mặc định là COD
            paymentStatus: paymentMethod === 'MoMo' ? 'Pending' : 'Completed', // Trạng thái thanh toán
        });

        const createdOrder = await order.save();

        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Tạo đơn hàng mới từ giỏ hàng


const createOrderFromCart = async (req, res, next) => {
    try {
        // Lấy giỏ hàng của người dùng
        const cart = await Cart.findOne({ userId: req.user._id }).populate({
            path: 'products.productId',
            select: 'price manufacturer discount variants',
            populate: { path: 'discount', select: 'discountPercent' },
        });

        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ message: 'Giỏ hàng của bạn đang trống' });
        }

        // Tính tổng giá trị đơn hàng
        let totalAmount = Math.round(
            cart.products.reduce((sum, item) => {
                const discount = item.productId.discount ? item.productId.discount.discountPercent : 0;
                const priceAfterDiscount = item.productId.price * (1 - discount / 100);
                return sum + priceAfterDiscount * item.quantity;
            }, 0)
        );

        if (totalAmount % 2 !== 0) {
            totalAmount -= 1; // Đảm bảo tổng tiền là một số chẵn
        }

        const productDetails = cart.products.map((item) => {
            const discount = item.productId.discount ? item.productId.discount.discountPercent : 0;
            const priceAfterDiscount = item.productId.price * (1 - discount / 100);
            const variantId = item.productId.variants.find(variant => variant.size === item.size)?._id;
            console.log(variantId)

            return {
                productId: item.productId._id,
                variantId: variantId,  // Thêm variantId vào thông tin sản phẩm
                quantity: item.quantity,
                size: item.size,
                price: item.productId.price,
                discount,
                priceAfterDiscount,
            };
        });

        // Tạo dữ liệu đơn hàng và lưu vào DB
        const orderData = {
            userId: req.user._id,
            products: productDetails,
            totalAmount,
            address: req.body.address,
            paymentMethod: req.body.paymentMethod || 'COD',
            paymentStatus: req.body.paymentMethod === 'VNPay' ? 'Pending' : 'Completed',
        };

        const order = new Order(orderData);
        const createdOrder = await order.save();

        // Cập nhật kho sản phẩm
        const updateStock = cart.products.map(async (item) => {
            const productId = item.productId._id;
            const variants = item.productId.variants;

            if (Array.isArray(variants) && variants.length > 0) {
                const productVariant = variants.find(variant => variant.size === item.size);

                if (productVariant) {
                    // Giảm số lượng tồn kho cho sản phẩm này
                    productVariant.stock -= item.quantity;
                    await Product.findByIdAndUpdate(productId, {
                        $set: { 'variants.$[elem].stock': productVariant.stock },
                    }, {
                        arrayFilters: [{ 'elem.size': item.size }],
                        new: true,
                    });
                }
            }
        });

        await Promise.all(updateStock);

        // Nếu thanh toán qua VNPay
        if (req.body.paymentMethod === 'VNPay') {
            let config = require('config');
            let tmnCode = config.get('vnp_TmnCode');
            let secretKey = config.get('vnp_HashSecret');
            let vnpUrl = config.get('vnp_Url');
            let returnUrl = config.get('vnp_ReturnUrl');

            const orderId = createdOrder._id.toString();
            let date = new Date();
            let ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;

            let vnp_Params = {};
            vnp_Params['vnp_Version'] = '2.1.0';
            vnp_Params['vnp_Command'] = 'pay';
            vnp_Params['vnp_TmnCode'] = tmnCode;
            vnp_Params['vnp_Amount'] = totalAmount * 100;
            vnp_Params['vnp_CurrCode'] = 'VND';
            vnp_Params['vnp_TxnRef'] = orderId;
            vnp_Params['vnp_OrderInfo'] = 'Thanh toán VNPay';
            vnp_Params['vnp_OrderType'] = 'billpayment';
            vnp_Params['vnp_Locale'] = 'vn';
            vnp_Params['vnp_ReturnUrl'] = returnUrl;
            vnp_Params['vnp_IpAddr'] = ipAddr;
            vnp_Params['vnp_CreateDate'] = moment(date).format('YYYYMMDDHHmmss');

            // Tạo chữ ký bảo mật
            vnp_Params = sortObject(vnp_Params);
            let signData = querystring.stringify(vnp_Params, { encode: false });
            let hmac = crypto.createHmac('sha512', secretKey);
            let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');
            vnp_Params['vnp_SecureHash'] = signed;
            vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

            // Trả URL thanh toán VNPay
            return res.status(200).json({ payUrl: vnpUrl, orderId: createdOrder._id });
        }

        // Cập nhật thông tin nhà sản xuất
        const updateManufacturers = cart.products.map(async (item) => {
            const manufacturerId = item.productId.manufacturer;
            if (manufacturerId) {
                return Manufacturer.findByIdAndUpdate(manufacturerId, {
                    $inc: { salesCount: item.quantity },
                });
            }
        });
        await Promise.all(updateManufacturers);

        // Xóa giỏ hàng sau khi tạo đơn hàng
        cart.products = [];
        await cart.save();

        res.status(201).json({ data: createdOrder, success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




const getUserOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 6; // Default to 6 items per page if not provided
        const skip = (page - 1) * limit; // Calculate the number of records to skip based on the page

        const orders = await Order.find()
            .skip(skip)
            .limit(limit)
            .populate('products.productId', 'name price');

        const totalOrders = await Order.countDocuments(); // Get the total number of orders

        const totalPages = Math.ceil(totalOrders / limit); // Calculate total pages

        res.status(200).json({
            data: orders,
            totalPages: totalPages,
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Lấy chi tiết đơn hàng the    o ID
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('products.productId', 'name price');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (req, res) => {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is required' });
    }

    try {
        const order = await Order.findById(req.params.id).populate('products.productId'); // Lấy thông tin sản phẩm qua populate
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Cập nhật trạng thái đơn hàng
        order.status = status;

        // Nếu trạng thái là Cancelled, khôi phục lại số lượng sản phẩm trong kho
        if (status === 'Canceled') {
            // Khôi phục lại số lượng stock cho từng sản phẩm trong đơn hàng
            for (const item of order.products) {
                const product = item.productId;
                if (product) {
                    const variant = product.variants.find(variant => variant._id.toString() === item.variantId.toString());
                    console.log(variant)
                    if (variant) {
                        variant.stock += item.quantity;  // Khôi phục số lượng
                        await product.updateOne({
                            $set: { 'variants.$[elem].stock': variant.stock }
                        }, {
                            arrayFilters: [{ 'elem._id': item.variantId }],
                            new: true
                        });
                    }
                }
            }
        }

        // Cập nhật đơn hàng với trạng thái mới
        const updatedOrder = await order.save();
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};





// Xóa đơn hàng theo ID
const deleteOrder = async (req, res) => {
    try {
        // Tìm và xóa đơn hàng theo ID
        const order = await Order.findByIdAndDelete(req.params.id);

        // Kiểm tra xem đơn hàng có tồn tại hay không
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Trả về phản hồi thành công
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getTopSellingProducts = async (req, res) => {
    try {
        // Chỉ lấy các đơn hàng đã được giao (hoặc trạng thái hoàn tất tùy theo logic của bạn)
        const orders = await Order.find({ status: 'Delivered' }); // Hoặc 'Completed' hoặc 'Shipped' nếu có

        const productSales = {};

        // Tính tổng số lượng bán cho mỗi sản phẩm
        orders.forEach(order => {
            order.products.forEach(product => {
                if (productSales[product.productId]) {
                    productSales[product.productId] += product.quantity;
                } else {
                    productSales[product.productId] = product.quantity;
                }
            });
        });

        // Cập nhật số lượng bán cho sản phẩm
        for (const productId in productSales) {
            await Product.findByIdAndUpdate(productId, { totalSold: productSales[productId] });
        }

        // Lấy danh sách sản phẩm bán chạy (sắp xếp theo totalSold giảm dần)
        const topSellingProducts = await Product.find().sort({ totalSold: -1 }).limit(5);

        res.status(200).json(topSellingProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
//lấy đơn hàng của ng dùng 
const getOrderByUserID = async (req, res) => {
    try {
        const oder = await Order.find({ userId: req.user._id })
        res.status(200).json(oder)
    } catch (error) {
        res.status(500).json({ message: error.message })

    }

}




module.exports = {
    createOrderFromCart,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
    createOrderWithoutCart,
    getTopSellingProducts,
    getOrderByUserID

};

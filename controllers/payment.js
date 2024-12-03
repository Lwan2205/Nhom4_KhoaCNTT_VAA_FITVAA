
const Order = require('../../backend/model/order');
const Cart = require('../../backend/model/cart');
var querystring = require('qs');
var crypto = require("crypto");
const payment = (req, res) => {
    var ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    const moment = require('moment');
    var tmnCode = "8QDN5FTO";
    var secretKey = "KJFTG00OTYVTL1R6RUX9XSCTJV0AICRH";
    var vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    var returnUrl = "http://localhost:8000/api/payments/vnpay_return";

    var date = new Date();
    var createDate = moment(date).format('YYYYMMDDHHmmss')
    var orderId = moment(date).format('DDHHmmss')
    var amount = 1000;
    var bankCode = '';

    var locale = req.body.language || 'vn';
    var currCode = 'VND';
    var vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmnCode,
        'vnp_Locale': locale,
        'vnp_CurrCode': currCode,
        'vnp_TxnRef': orderId,
        'vnp_OrderInfo': `Thanh toán đơn hàng qua VNPay ${orderId}`,
        'vnp_OrderType': 'billpayment',
        'vnp_Amount': amount * 100,
        'vnp_ReturnUrl': returnUrl,
        'vnp_IpAddr': ipAddr,
        'vnp_CreateDate': createDate,
    };

    if (bankCode) {
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = Object.fromEntries(Object.entries(vnp_Params).sort((a, b) => a[0].localeCompare(b[0])));


    var signData = querystring.stringify(vnp_Params, { encode: false });

    var hmac = crypto.createHmac("sha512", secretKey);
    var signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); // Chỉnh sửa từ Buffer thành Buffer.from
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    console.log('link', vnpUrl);
    res.redirect(vnpUrl);
};
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
const paymentReturn = async (req, res) => {
    try {
        let vnp_Params = req.query; // Dữ liệu từ VNPay
        let secureHash = vnp_Params['vnp_SecureHash']; // Lấy hash từ VNPay
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        // Tạo lại chữ ký từ dữ liệu callback
        vnp_Params = sortObject(vnp_Params);
        let config = require('config');
        let secretKey = config.get('vnp_HashSecret');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            const orderId = vnp_Params['vnp_TxnRef']; // Lấy ID đơn hàng
            const paymentStatus = vnp_Params['vnp_ResponseCode'] === '00' ? 'Completed' : 'Failed';

            if (paymentStatus === 'Completed') {
                // Xử lý thanh toán thành công
                const updatedOrder = await Order.findByIdAndUpdate(orderId, { paymentStatus }, { new: true });

                if (updatedOrder) {
                    // Tìm và xóa giỏ hàng của người dùng
                    const userId = updatedOrder.userId;
                    const cart = await Cart.findOne({ userId });

                    if (cart) {
                        // Cập nhật số lượng kho cho sản phẩm
                        const updateStock = cart.products.map(async (item) => {
                            const productId = item.productId._id;
                            const variants = item.productId.variants;

                            // Kiểm tra xem variants có phải là mảng và không rỗng không
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

                        // Chạy tất cả các cập nhật kho song song
                        await Promise.all(updateStock);

                        // Xóa các sản phẩm trong giỏ hàng sau khi thanh toán thành công
                        cart.products = [];
                        await cart.save();
                    }
                }

                res.status(200).json({ message: 'Thanh toán thành công, trạng thái đơn hàng đã cập nhật và giỏ hàng đã được xóa.' });
            } else {
                // Xử lý thanh toán thất bại
                await Order.findByIdAndDelete(orderId); // Xóa đơn hàng khỏi DB
                res.status(400).json({ message: 'Thanh toán thất bại, đơn hàng đã bị hủy.' });
            }
        } else {
            res.status(400).json({ message: 'Chữ ký không hợp lệ' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};







module.exports = { payment, paymentReturn };

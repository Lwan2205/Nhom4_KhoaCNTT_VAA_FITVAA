const User = require('../../backend/model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../../backend/utils/sendEmail');

// Hàm tạo JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Đăng ký người dùng mới
const registerUser = async (req, res) => {
    const { username, email, password, phoneNumber, address } = req.body;

    if (!username || !email || !password || !phoneNumber || !address) {
        return res.status(400).json({ message: 'Please fill in all fields' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // const hashedPassword = await bcrypt.hash(password, 10);

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

        const user = await User.create({
            username,
            email,
            password,
            phoneNumber,
            address,
            verificationToken: verificationTokenHash,
            verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        });

        const verificationUrl = `http://localhost:8000/api/auth/verify-email/${verificationToken}`;
        const message = `Please verify your email by clicking the link: \n\n${verificationUrl}`;

        await sendEmail({
            email: user.email,
            subject: 'Email Verification',
            message,
        }).then(() => {
            console.log('Email đã gửi thành công');
        }).catch(error => {
            console.error('Lỗi khi gửi email:', error);
        });;

        res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const verifyEmail = async (req, res) => {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');

    try {
        const user = await User.findOne({
            verificationToken: tokenHash,
            verificationTokenExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;

        await user.save();

        res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Đăng nhập người dùng
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide both email and password' });
    }

    try {
        console.log('test')
        const user = await User.findOne({ email });
        console.log('user', user);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Kiểm tra nếu người dùng đã xác thực email chưa
        if (!user.isVerified) {
            console.log('Email not verified');
            return res.status(400).json({ message: 'Please verify your email before logging in' });
        }

        // So sánh mật khẩu
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = generateToken(user._id);

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            res.status(200).json({
                success: true,
                _id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Đăng xuất người dùng
const logoutUser = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
    });

    res.status(200).json({
        message: 'Logged out successfully', success: true
    });
};

// Quên mật khẩu
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email not found' });
        }

        // Tạo token đặt lại mật khẩu
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 phút

        user.resetPasswordToken = resetPasswordToken;
        user.resetPasswordExpire = resetPasswordExpire;
        await user.save();

        // Gửi email chứa liên kết đặt lại mật khẩu
        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
        const message = `Bạn nhận được email này vì có yêu cầu đặt lại mật khẩu.\n\nVui lòng nhấn vào liên kết sau để đặt lại mật khẩu:\n\n${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password reset token',
                message,
            });

            res.status(200).json({ message: 'Reset password link sent to your email' });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Đặt lại mật khẩu
const resetPassword = async (req, res) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        user.password = req.body.newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
};

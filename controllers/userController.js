const User = require('../../backend/model/user');
const bcrypt = require('bcrypt');

// Lấy thông tin hồ sơ cá nhân
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ data: user, success: true, });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật hồ sơ cá nhân   
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.body.userId);
        if (user) {
            user.username = req.body.username || user.username;
            user.email = req.body.email || user.email;
            user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
            user.address = req.body.address || user.address;
            if (req.body.role) {
                if (req.body.role === "Admin") {
                    user.isAdmin = true;
                } else if (req.body.role === "User") {
                    user.isAdmin = false;
                }
            }

            const updatedUser = await user.save();


            res.status(200).json({
                // _id: updatedUser._id,
                // username: updatedUser.username,
                // email: updatedUser.email,
                // phoneNumber: updatedUser.phoneNumber,
                // address: updatedUser.address,
                // isAdmin: updatedUser.isAdmin,
                success: true
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Thay đổi mật khẩu
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user && (await bcrypt.compare(currentPassword, user.password))) {
            user.password = newPassword;
            await user.save();

            res.status(200).json({ message: 'Password updated successfully' });
        } else {
            res.status(401).json({ message: 'Current password is incorrect' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy danh sách tất cả người dùng (Admin)
const getAllUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Trang hiện tại (mặc định là 1)
    const limit = parseInt(req.query.limit) || 6; // Số sản phẩm mỗi trang (mặc định là 6)

    try {
        const skip = (page - 1) * limit;
        const users = await User.find({})
            .skip(skip)
            .limit(limit)
            .select('-password');
        const totalUsers = await User.countDocuments()
        const totalPages = Math.ceil(totalUsers / limit)
        res.status(200).json({
            data: users,
            success: true,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa người dùng (Admin)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Sử dụng findByIdAndDelete để xóa tài liệu
            await User.findByIdAndDelete(req.params.id);
            res.status(200).json({ success: true });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports = {
    getUserProfile,
    updateUserProfile,
    changePassword,
    getAllUsers,
    deleteUser,
};

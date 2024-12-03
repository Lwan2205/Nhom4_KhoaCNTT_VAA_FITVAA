const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    address: { type: String },
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    verificationToken: { String },
    verificationTokenExpire: { Date }
}, { timestamps: true });

userSchema.pre("save", function (next) {
    if (this.isModified("password")) {
        const salt = bcrypt.genSaltSync();
        const hashedPassword = bcrypt.hashSync(this.password, salt);
        this.password = hashedPassword;

    }
    next();

})

const User = mongoose.model('User', userSchema);
module.exports = User;

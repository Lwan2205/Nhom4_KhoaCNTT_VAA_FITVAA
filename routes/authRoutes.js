const express = require("express");

const router = express.Router()

const { registerUser, loginUser, logoutUser, verifyEmail, forgotPassword, resetPassword } = require("../controllers/authController")
const { protect, admin } = require("../middleware/authMiddleware")

router.get('/verify-email/:token', verifyEmail)
router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/logout", protect, logoutUser)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:resetToken', resetPassword)


module.exports = router


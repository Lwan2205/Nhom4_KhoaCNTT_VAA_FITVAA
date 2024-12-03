const express = require("express");
const connect = require("./config/db");
const cookieParser = require("cookie-parser");


const userRoutes = require('./routes/userRoutes');
const authRouter = require("./routes/authRoutes");
const productRouter = require("./routes/productRoutes")
const categoryRouter = require("./routes/categoryRoutes")
const manufacturerRouter = require("./routes/manufactureRouter")
const discountRouter = require("./routes/discountRoutes")
const cartRouter = require("./routes/cartRoutes")
const paymentRoutes = require("./routes/paymentRoutes")
const orderRoutes = require("./routes/orderRoutes")
const reviewRoutes = require("./routes/reviewRoutes")
const cors = require("cors")
const path = require('path');
require('dotenv').config()






const app = express();
app.use(express.json());
app.use(cookieParser())

app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT;

connect();

app.use(cors({

    origin: 'http://localhost:3000',
    credentials: true
}))
// Cấu hình thư mục tĩnh cho các file trong 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use("/api/auth", authRouter)
app.use("/api/user", userRoutes)
app.use("/api/products", productRouter)
app.use("/api/categories", categoryRouter)
app.use("/api/manufacturers", manufacturerRouter)
app.use("/api/discounts", discountRouter)
app.use("/api/cart", cartRouter)
app.use("/api/payments", paymentRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/review", reviewRoutes)



app.listen(PORT, () => {
    console.log(`sever is starting +${PORT}`);
});
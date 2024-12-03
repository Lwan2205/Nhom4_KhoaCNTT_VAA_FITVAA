const nodemailer = require('nodemailer');
require('dotenv').config()

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: '2254810091@vaa.edu.vn',
            pass: 'iaftvjnppglzyysv',
        },
    });

    const mailOptions = {
        from: '2254810091@vaa.edu.vn',
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

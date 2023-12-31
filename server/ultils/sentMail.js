const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');

const senMail = asyncHandler(async ({ email, html }) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // true for 456, false for other ports
    secure: false,
    auth: {
      user: process.env.EMAIL_NAME,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Shopoh " <foo@Shopoh.com>', // sender address
    to: email, // list of receivers
    subject: 'Forgot password', // Subject line
    html: html, // html body
  });

  return info;
});

module.exports = senMail;

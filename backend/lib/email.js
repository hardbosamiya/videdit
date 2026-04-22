const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'VidEdit <noreply@videdit.com>',
      to,
      subject,
      html,
      text,
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Email error:', err.message);
    // Don't throw - email failure shouldn't break the app
  }
};

module.exports = { sendEmail };

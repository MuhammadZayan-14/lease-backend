'use strict';

const nodemailer = require('nodemailer');
const path = require('path');

async function sendAgreementEmail(recipientEmail, tenantName, pdfPath) {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'devkhizerahmad@gmail.com',
      pass: process.env.EMAIL_PASS || 'aief unbt nkfa smrj',
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER || 'devkhizerahmad@gmail.com',
    to: recipientEmail,
    subject: `Signed Sublease Agreement - ${tenantName}`,
    text: `Hello ${tenantName},\n\nPlease find attached your signed Sublease Agreement.`,
    html: `<h2>📄 Signed Sublease Agreement</h2><p>Hello <b>${tenantName}</b>,</p><p>Please find attached your signed Sublease Agreement.</p>`,
    attachments: [
      {
        filename: path.basename(pdfPath),
        path: pdfPath,
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `Signed agreement email sent successfully to: ${recipientEmail}`,
    );
  } catch (error) {
    console.error('Email send failed:', error.message);
  }
}

module.exports = { sendAgreementEmail };

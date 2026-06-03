'use strict';

const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

async function sendAgreementEmail(recipientEmail, tenantName, pdfPath, includeLetterHead) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const subject = `Sublease Agreement - ${tenantName}`;
  const text = `
Hello ${tenantName},

Please find attached your Sublease Agreement.

This is an automated notification from ClawdBot.
  `;
  const html = `
      <h2>📄 Sublease Agreement</h2>
      <p>Hello <b>${tenantName}</b>,</p>
      <p>Please find attached your Sublease Agreement.</p>
      <br>
      <p><i>This is an automated notification from ClawdBot.</i></p>
  `;
  // If includeLetterHead is true and RESEND_API_KEY is provided, send via Resend API.
  if (includeLetterHead) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM;
    if (!resendApiKey || !resendFrom) {
      console.log('Resend config missing, skipping notification');
      return;
    }
    try {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: resendFrom,
        to: recipientEmail,
        subject,
        html,
        attachments: [
          {
            filename: path.basename(pdfPath),
            content: pdfBuffer,
          },
        ],
      });

      console.log(`Signed agreement email sent via Resend to: ${recipientEmail}`);
      return;
    } catch (error) {
      console.error('Resend send failed, falling back to nodemailer:', error.message);
      // fall through to nodemailer fallback
    }
  }

  // Fallback / default: send using nodemailer
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
    subject,
    text: `Hello ${tenantName},\n\nPlease find attached your signed Sublease Agreement.`,
    html,
    attachments: [
      {
        filename: path.basename(pdfPath),
        path: pdfPath,
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Signed agreement email sent successfully to: ${recipientEmail}`);
  } catch (error) {
    console.error('Email send failed:', error.message);
  }
}

module.exports = { sendAgreementEmail };

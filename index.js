require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// We will replicate the services from the sheets-api skill here
const { generateAgreementPdf } = require('./src/services/generateAgreement');
const { updateSheets } = require('./src/services/updateSheetService');
const { sendAgreementEmail } = require('./src/services/emailService');
const { getSheetsClient } = require('./src/auth');
const { markAgreementAsSigned } = require('./src/services/mongodbService');
const { log } = require('console');

const app = express();
const PORT = process.env.PORT || 8181;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'Agreement Signature Server Running',
    port: PORT,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// HEALTH CHECK ROUTE
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Webhook endpoint for signature
app.post('/api/sign-agreement', async (req, res) => {
  try {
    const data = req.body;
    console.log(JSON.stringify(data, null, 2));
    console.log(`Received signature for: ${data.tenantName}`);

    // 1. Recreate agreement with signature image
    console.log('Generating signed agreement PDF...');
    const pdfPath = await generateAgreementPdf(data, data.includeLetterHead);

    // 2. Initialize Google Sheets Client
    const sheets = getSheetsClient();

    // // 3. Update Google Sheets
    console.log('Updating Google Sheets...');
    const spreadsheetId =
      process.env.SPREADSHEET_ID ||
      '1RobrLNYSmMUyq53dUcdmj2ePaU2YkagqLqgIgx7M4OU';
    await updateSheets({
      sheets,
      spreadsheetId,
      data,
    });

    // 4. Mark the record in MongoDB as signed
    if (data.email) {
      console.log(`Marking MongoDB record for ${data.email} as signed...`);
      await markAgreementAsSigned(data.email);
    }

    // 5. Send updated agreement via email
    if (data.email) {
      console.log(`Sending signed agreement to ${data.email}...`);
      await sendAgreementEmail(data.email, data.tenantName, pdfPath, data.includeLetterHead);
    }

    res.status(200).json({
      success: true,
      message:
        'Agreement signed, sheets and MongoDB updated, and email sent successfully.',
      pdfPath,
    });
  } catch (error) {
    console.error('Error processing signature:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


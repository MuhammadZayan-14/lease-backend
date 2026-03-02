'use strict';

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const WRITE_SCOPE = process.env.GOOGLE_SHEETS_WRITE_SCOPE;

function getSheetsClient() {
  // Use service account if available, otherwise look for credentials.json
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  const serviceAccountPath = path.join(__dirname, 'service-account.json');
  let auth;

  if (fs.existsSync(serviceAccountPath)) {
    auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: [WRITE_SCOPE],
    });
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    // This is a simplified version, usually requires token management
    // For the server, a service account is highly recommended
    auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: [WRITE_SCOPE],
    });
  } else {
    throw new Error('Google Sheets credentials not found.');
  }

  return google.sheets({ version: 'v4', auth });
}

module.exports = { getSheetsClient };

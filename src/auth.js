'use strict';

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const WRITE_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

function getSheetsClient() {
  // Use service account if available, otherwise look for credentials.json
  const serviceAccountPath = path.join(__dirname, '../service-account.json');
  const credentialsPath = path.join(__dirname, '../credentials.json');

  let auth;

  if (fs.existsSync(serviceAccountPath)) {
    auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: [WRITE_SCOPE],
    });
  } else if (fs.existsSync(credentialsPath)) {
    // This is a simplified version, usually requires token management
    // For the server, a service account is highly recommended
    auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: [WRITE_SCOPE],
    });
  } else {
    throw new Error('Google Sheets credentials not found in server directory.');
  }

  return google.sheets({ version: 'v4', auth });
}

module.exports = { getSheetsClient };

'use strict';

async function updateSheets({ sheets, spreadsheetId, data }) {
  const {
    tenantName,
    propertyAddress: apartment,
    rent: amount,
    proRateRent: prorate,
    leaseStartDate: startDate,
    room,
    contact,
    email,
  } = data;

  const sheetName = 'Inventory';

  console.log(
    `Searching for apartment: ${apartment} in ${sheetName} with room ${room}...`,
  );

  const invResp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:C`,
  });

  const rows = invResp.data.values || [];
  let rowIndex = -1;

  const roomNumber = parseInt(room, 10);

  for (let i = 0; i < rows.length; i++) {
    const rowApt = rows[i][0];
    const rowRoom = rows[i][2];

    if (!rowApt || !rowRoom) continue;

    const aptMatch = rowApt.toLowerCase().includes(apartment.toLowerCase());

    const roomMatch =
      rowRoom.match(/\d+/) &&
      parseInt(rowRoom.match(/\d+/)[0], 10) === roomNumber;

    if (aptMatch && roomMatch) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    console.log(`Apartment "${apartment}" with room ${room} not found in ${sheetName} sheet. Adding a new row...`);
    const newRow = Array(21).fill('');
    newRow[0] = apartment;    // A
    newRow[2] = room;         // C
    newRow[3] = tenantName;   // D
    newRow[4] = startDate;    // E
    newRow[5] = `$${amount}`; // F
    newRow[6] = `$${prorate}`;// G
    newRow[20] = 'Occupied';  // U
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:A`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [newRow],
      },
    });
  } else {
    console.log(
      `Found apartment at row ${rowIndex}. Updating Inventory Sheet...`,
    );

    // ✅ MATCHES lease.js (W column)
    const updates = [
      { range: `${sheetName}!D${rowIndex}`, values: [[tenantName]] },
      { range: `${sheetName}!E${rowIndex}`, values: [[startDate]] },
      { range: `${sheetName}!F${rowIndex}`, values: [[`$${amount}`]] },
      { range: `${sheetName}!G${rowIndex}`, values: [[`$${prorate}`]] },
      { range: `${sheetName}!U${rowIndex}`, values: [['Occupied']] },
    ];

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updates,
      },
    });
  }

  /*
  // ===============================
  // Cleaning Sheet
  // ===============================
  try {
    const cleaningSheetName = 'Cleaning';

    const cleaningResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${cleaningSheetName}!C:C`,
    });

    const cleaningRows = cleaningResp.data.values || [];
    let cleaningRowIndex = -1;

    for (let i = 0; i < cleaningRows.length; i++) {
      if (
        cleaningRows[i][0] &&
        cleaningRows[i][0].toLowerCase().includes(apartment.toLowerCase())
      ) {
        cleaningRowIndex = i + 1;
        break;
      }
    }

    if (cleaningRowIndex !== -1 && room) {
      console.log(`Updating Cleaning sheet for Room ${room}...`);

      const roomNum = parseInt(room, 10);
      const contactVal = contact || email || '';

      const tenantColLetters = ['AD', 'AG', 'AJ'];
      const contactColLetters = ['AE', 'AH', 'AK'];

      if (roomNum >= 1 && roomNum <= 3) {
        const tCol = tenantColLetters[roomNum - 1];
        const cCol = contactColLetters[roomNum - 1];

        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: [
              {
                range: `${cleaningSheetName}!${tCol}${cleaningRowIndex}`,
                values: [[tenantName]],
              },
              {
                range: `${cleaningSheetName}!${cCol}${cleaningRowIndex}`,
                values: [[contactVal]],
              },
            ],
          },
        });
      }
    }
  } catch (err) {
    console.error('Failed to update Cleaning sheet:', err.message);
  }

  // ===============================
  // Rent Tracker Sheet
  // ===============================
  try {
    const rentSheetName = 'Rent Tracker';

    const rentResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${rentSheetName}!B:C`,
    });

    const rentRows = rentResp.data.values || [];
    let rentRowIndex = -1;
    let currentApt = '';

    for (let i = 0; i < rentRows.length; i++) {
      const rowApt = rentRows[i][0];
      const rowRoom = rentRows[i][1];

      if (rowApt && rowApt.trim() !== '') {
        currentApt = rowApt.trim();
      }

      if (
        currentApt.toLowerCase().includes(apartment.toLowerCase()) &&
        rowRoom == room
      ) {
        rentRowIndex = i + 1;
        break;
      }
    }

    if (rentRowIndex !== -1) {
      console.log(`Updating Rent Tracker sheet row ${rentRowIndex}...`);

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: `${rentSheetName}!D${rentRowIndex}`,
              values: [[tenantName]],
            },
            {
              range: `${rentSheetName}!E${rentRowIndex}`,
              values: [[`$${amount}`]],
            },
            {
              range: `${rentSheetName}!G${rentRowIndex}`,
              values: [[email || '']],
            },
            {
              range: `${rentSheetName}!H${rentRowIndex}`,
              values: [[contact || '']],
            },
          ],
        },
      });
    }
  } catch (err) {
    console.error('Failed to update Rent Tracker sheet:', err.message);
  }

  // ===============================
  // Inventory Data Sheet
  // ===============================
  try {
    const invDataSheetName = 'Inventory Data';

    const invDataResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${invDataSheetName}!B:C`,
    });

    const invDataRows = invDataResp.data.values || [];
    let invDataRowIndex = -1;
    let currentApt = '';

    for (let i = 0; i < invDataRows.length; i++) {
      const rowApt = invDataRows[i][0];
      const rowRoom = invDataRows[i][1];

      if (rowApt && rowApt.trim() !== '') {
        currentApt = rowApt.trim();
      }

      if (
        currentApt.toLowerCase().includes(apartment.toLowerCase()) &&
        rowRoom == room
      ) {
        invDataRowIndex = i + 1;
        break;
      }
    }

    if (invDataRowIndex !== -1) {
      console.log(`Updating Inventory Data sheet row ${invDataRowIndex}...`);

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: `${invDataSheetName}!D${invDataRowIndex}`,
              values: [[tenantName]],
            },
            {
              range: `${invDataSheetName}!E${invDataRowIndex}`,
              values: [[`$${amount}`]],
            },
          ],
        },
      });
    }
  } catch (err) {
    console.error('Failed to update Inventory Data sheet:', err.message);
  }
  */

  return { success: true };
}

module.exports = { updateSheets };

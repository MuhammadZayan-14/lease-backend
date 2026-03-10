const { MongoClient } = require('mongodb');

/**
 * Mark a record as signed in the lease-apartment-contract collection.
 *
 * @param {string} email - The tenant's email to search for.
 */
async function markAgreementAsSigned(email) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI missing in .env. Skipping MongoDB update.');
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    // Connect to the specified database and collection
    const database = client.db('rent_reconciliation_db');
    const collection = database.collection('lease-apartment-contract');

    console.log(`Searching for record with email: ${email} in MongoDB...`);

    // Search by email and update signed field to true
    const result = await collection.updateOne(
      { email: email },
      { $set: { signed: true } },
    );

    if (result.matchedCount > 0) {
      console.log(
        `Successfully marked record for ${email} as signed in MongoDB.`,
      );
    } else {
      console.warn(`No record found in MongoDB for email: ${email}`);
    }
  } catch (err) {
    console.error('Error updating MongoDB:', err.message);
  } finally {
    await client.close();
  }
}

module.exports = { markAgreementAsSigned };

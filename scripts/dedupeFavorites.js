/*
 Dedupe favorites script
 - Connects to the app DB using existing db.connect()
 - Finds duplicate Favorite documents with same (userId, frameId)
 - Keeps the earliest (by _id / createdAt) and removes others
 - Creates a unique compound index on { userId: 1, frameId: 1 }

 Usage: from repo root (PowerShell)
   node .\scripts\dedupeFavorites.js
 Make sure your .env is present or environment variables are set.
*/

const db = require('../src/config/db');
const Favorite = require('../src/models/favoriteModel');

async function dedupe() {
  try {
    console.log('Connecting to DB...');
    await db.connect();

    console.log('Searching for duplicate favorites...');
    const duplicates = await Favorite.aggregate([
      {
        $group: {
          _id: { userId: '$userId', frameId: '$frameId' },
          ids: { $push: '$_id' },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (!duplicates.length) {
      console.log('No duplicate favorites found.');
    } else {
      console.log(`Found ${duplicates.length} duplicated (userId,frameId) groups.`);
      for (const dup of duplicates) {
        const ids = dup.ids.map(id => id.toString());
        // Keep the oldest (smallest ObjectId) and remove the rest
        ids.sort();
        const keep = ids.shift();
        const removeIds = ids;
        console.log(`Keeping ${keep} and removing ${removeIds.length} duplicates for user ${dup._id.userId}, frame ${dup._id.frameId}`);
        const res = await Favorite.deleteMany({ _id: { $in: removeIds } });
        console.log(`Removed ${res.deletedCount} documents.`);
      }
    }

    console.log('Creating unique compound index { userId: 1, frameId: 1 }...');
    try {
      await Favorite.collection.createIndex({ userId: 1, frameId: 1 }, { unique: true });
      console.log('Index created successfully.');
    } catch (err) {
      console.error('Failed to create index:', err.message || err);
      console.error('If this fails, there may still be duplicates; re-run the script after cleaning duplicates.');
      process.exit(1);
    }

    console.log('Dedupe complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error during dedupe:', err);
    process.exit(2);
  }
}

if (require.main === module) {
  dedupe();
}

module.exports = dedupe;

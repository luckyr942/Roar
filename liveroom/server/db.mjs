// Connects to MongoDB once and shares the collections (fans, memories, votes, roasts, photos).
// Why: every route needs the same database, and the password must stay on the server.

import { GridFSBucket, MongoClient } from 'mongodb';

export const collections = { fans: null, memories: null, votes: null, roasts: null };
export let photoBucket = null;

export async function connectToDatabase() {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db(process.env.DB_NAME ?? 'roar');

    collections.fans = db.collection('fans');
    collections.memories = db.collection('memories');
    collections.votes = db.collection('votes');
    collections.roasts = db.collection('roasts');
    photoBucket = new GridFSBucket(db, { bucketName: 'photos' });

    // Indexes make the common lookups fast and stop double votes.
    await collections.memories.createIndex({ fanId: 1, createdAt: -1 });
    await collections.memories.createIndex({ posted: 1, createdAt: -1 });
    await collections.votes.createIndex({ memoryId: 1, fanId: 1 }, { unique: true });
    await collections.roasts.createIndex({ room: 1, at: -1 });

    console.log(`Connected to MongoDB database "${db.databaseName}"`);
}

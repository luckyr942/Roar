// The URLs the app calls to save and load fans, memories, photos, wall votes and roast history.
// Why: one small route per job keeps the database access simple and easy to follow.

import express from 'express';
import { ObjectId } from 'mongodb';
import { Readable } from 'node:stream';
import { collections, photoBucket } from './db.mjs';

export const router = express.Router();

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

// Keep only short strings, so nobody can store huge or odd values.
const text = (value, maxLength = 80) => String(value ?? '').slice(0, maxLength);
const team = (value) => (value === 'CSK' ? 'CSK' : 'MI');

// Wraps a route so any error becomes a 500 reply instead of crashing the server.
const safe = (handler) => (req, res) =>
    handler(req, res).catch((error) => {
        console.error(req.method, req.path, error.message);
        res.status(500).json({ error: 'Something went wrong on the server' });
    });

router.get('/health', (req, res) => res.json({ ok: true, timestamp: Date.now() }));

// ---- Fans --------------------------------------------------------------------------

router.put('/fans/:fanId', safe(async (req, res) => {
    const fan = {
        name: text(req.body.name, 24),
        team: team(req.body.team),
        rival: text(req.body.rival, 24),
        room: text(req.body.room, 12),
        autoRoast: Boolean(req.body.autoRoast),
        matchesLived: Number(req.body.matchesLived) || 0,
        updatedAt: new Date(),
    };
    await collections.fans.updateOne(
        { _id: text(req.params.fanId) },
        { $set: fan, $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
    );
    res.json({ saved: true });
}));

router.get('/fans/:fanId', safe(async (req, res) => {
    const fan = await collections.fans.findOne({ _id: text(req.params.fanId) });
    if (!fan) return res.status(404).json({ error: 'Fan not found' });
    res.json(fan);
}));

// ---- Memories ----------------------------------------------------------------------

router.put('/memories/:memoryId', safe(async (req, res) => {
    const memory = {
        fanId: text(req.body.fanId),
        moment: req.body.moment ?? null, // the moment card data (label, title, over, ...)
        hype: Number(req.body.hype) || 0,
        photoId: req.body.photoId ? text(req.body.photoId, 24) : null,
        shared: Boolean(req.body.shared),
        posted: Boolean(req.body.posted),
        createdAt: new Date(Number(req.body.createdAt) || Date.now()),
        updatedAt: new Date(),
    };
    await collections.memories.updateOne({ _id: text(req.params.memoryId) }, { $set: memory }, { upsert: true });
    res.json({ saved: true });
}));

router.get('/fans/:fanId/memories', safe(async (req, res) => {
    const list = await collections.memories.find({ fanId: text(req.params.fanId) }).sort({ createdAt: -1 }).toArray();
    res.json(list);
}));

// ---- Photos (GridFS) ---------------------------------------------------------------

router.post('/photos', express.raw({ type: 'image/*', limit: MAX_PHOTO_BYTES }), safe(async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'Send the photo bytes with an image/* Content-Type' });
    }
    const upload = photoBucket.openUploadStream('reaction', { metadata: { contentType: req.headers['content-type'] } });
    await new Promise((resolve, reject) => {
        Readable.from(req.body).pipe(upload).on('finish', resolve).on('error', reject);
    });
    res.json({ photoId: String(upload.id) });
}));

router.get('/photos/:photoId', safe(async (req, res) => {
    if (!ObjectId.isValid(req.params.photoId)) return res.status(404).end();
    const id = new ObjectId(req.params.photoId);
    const [file] = await photoBucket.find({ _id: id }).toArray();
    if (!file) return res.status(404).end();
    res.set('Content-Type', file.metadata?.contentType ?? 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    photoBucket.openDownloadStream(id).pipe(res);
}));

// ---- Reaction wall -----------------------------------------------------------------

router.get('/wall', safe(async (req, res) => {
    const myFanId = text(req.query.fanId);
    const posts = await collections.memories.find({ posted: true }).sort({ createdAt: -1 }).limit(30).toArray();

    const fanIds = [...new Set(posts.map((post) => post.fanId))];
    const fans = await collections.fans.find({ _id: { $in: fanIds } }).toArray();
    const fanName = Object.fromEntries(fans.map((fan) => [fan._id, fan.name]));

    const memoryIds = posts.map((post) => post._id);
    const voteCounts = await collections.votes
        .aggregate([{ $match: { memoryId: { $in: memoryIds } } }, { $group: { _id: '$memoryId', count: { $sum: 1 } } }])
        .toArray();
    const votesFor = Object.fromEntries(voteCounts.map((v) => [v._id, v.count]));
    const myVotes = await collections.votes.find({ memoryId: { $in: memoryIds }, fanId: myFanId }).toArray();
    const iVoted = new Set(myVotes.map((v) => v.memoryId));

    res.json(
        posts.map((post) => ({
            memoryId: post._id,
            fanId: post.fanId,
            name: fanName[post.fanId] ?? 'Fan',
            moment: post.moment,
            hype: post.hype,
            photoId: post.photoId,
            votes: votesFor[post._id] ?? 0,
            votedByMe: iVoted.has(post._id),
            isMine: post.fanId === myFanId,
        })),
    );
}));

router.post('/wall/:memoryId/vote', safe(async (req, res) => {
    const vote = { memoryId: text(req.params.memoryId), fanId: text(req.body.fanId) };
    if (!vote.fanId) return res.status(400).json({ error: 'fanId is required' });

    const removed = await collections.votes.deleteOne(vote);
    if (removed.deletedCount === 0) await collections.votes.insertOne({ ...vote, at: new Date() });

    const votes = await collections.votes.countDocuments({ memoryId: vote.memoryId });
    res.json({ votes, votedByMe: removed.deletedCount === 0 });
}));

// ---- Banter history ----------------------------------------------------------------

router.get('/rooms/:room/roasts', safe(async (req, res) => {
    const room = text(req.params.room, 12).toUpperCase();
    const list = await collections.roasts.find({ room }).sort({ at: -1 }).limit(50).toArray();
    res.json(list);
}));

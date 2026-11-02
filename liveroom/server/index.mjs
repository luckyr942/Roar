// Starts the ROAR server on port 8787: the save/load API plus live banter.
// Why: the app must never talk to MongoDB directly, so this server sits in between.

import http from 'node:http';
import express from 'express';
import { connectToDatabase } from './db.mjs';
import { router } from './routes.mjs';
import { startRoastRooms } from './roast-room.mjs';

try {
    process.loadEnvFile?.();
} catch (e) {
}

const PORT = Number(process.env.PORT ?? 8787);

const app = express();

app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
});

app.use(express.json({ limit: '200kb' }));
app.use(router);

if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI. Copy .env.example to .env and fill it in.');
    process.exit(1);
}
try {
    await connectToDatabase();
} catch (error) {
    console.error(`Could not connect to MongoDB: ${error.message}`);
    console.error('Check: internet is on, the password in .env is right, and Atlas → Network Access allows your IP.');
    process.exit(1);
}

const server = http.createServer(app);
startRoastRooms(server);

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\nPort ${PORT} is already in use: the ROAR server is probably already running in another terminal.`);
        console.error(`Use that one, or stop it first:  lsof -ti tcp:${PORT} | xargs kill\n`);
    } else {
        console.error('Server error:', error.message);
    }
    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`\n🎉 ROAR backend is live on http://localhost:${PORT}`);
    console.log(`   • REST API:  http://localhost:${PORT}/health`);
    console.log(`   • Wall Feed: http://localhost:${PORT}/wall`);
    console.log(`   • Banter WS: ws://localhost:${PORT}\n`);
});
